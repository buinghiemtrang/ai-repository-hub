"""Independent public RSS/Atom/JSON feed fetcher and HTML-free text sanitizer."""
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from html import unescape
import re
from urllib.parse import urlsplit
import xml.etree.ElementTree as ET

import httpx

from app.news.sections import (
    classify_section,
    extract_tags,
    make_external_id,
    normalize_vi,
    safe_public_url,
)

UTC_PLUS_7 = timezone(timedelta(hours=7))

# Independent public feeds (respecting public RSS/Atom/API terms; never touches local LAN feeds)
PUBLIC_FEEDS: list[dict[str, str]] = [
    {"name": "OpenAI News", "url": "https://openai.com/news/rss.xml", "kind": "rss", "default_section": "ChatGPT / OpenAI"},
    {"name": "Google AI Blog", "url": "https://blog.google/technology/ai/rss/", "kind": "rss", "default_section": "Gemini"},
    {"name": "GitHub Blog", "url": "https://github.blog/ai-and-ml/feed/", "kind": "rss", "default_section": "Repo"},
    {"name": "Hugging Face Blog", "url": "https://huggingface.co/blog/feed.xml", "kind": "rss", "default_section": "Repo"},
    {"name": "BleepingComputer", "url": "https://www.bleepingcomputer.com/feed/", "kind": "rss", "default_section": "Bảo mật & An ninh mạng"},
    {"name": "The Hacker News", "url": "https://feeds.feedburner.com/TheHackersNews", "kind": "rss", "default_section": "Bảo mật & An ninh mạng"},
    {"name": "Simon Willison", "url": "https://simonwillison.net/atom/everything/", "kind": "atom", "default_section": "Ứng dụng thực tế"},
    {
        "name": "Hacker News AI",
        "url": "https://hn.algolia.com/api/v1/search_by_date?tags=story&hitsPerPage=15&query=AI%20OR%20Claude%20OR%20Gemini%20OR%20OpenAI%20OR%20MCP",
        "kind": "hn_json",
        "default_section": "Ứng dụng thực tế",
    },
]

_TAG_RE = re.compile(r"<[^>]+>")
_WS_RE = re.compile(r"\s+")


@dataclass
class FetchedFeedItem:
    external_id: str
    day_date: datetime
    section: str
    batch: str
    is_picked: bool
    title: str
    summary: str
    excerpt: str | None
    full_text: str | None
    speech_text: str
    source: str
    source_label: str
    author: str | None
    url: str
    published_at: datetime
    time_label: str
    time_estimated: bool
    tags: list[str]
    images: list[str]
    sources: list[dict[str, str]]
    confidence: str


def strip_html(raw: str | None, limit: int = 1200) -> str:
    if not raw:
        return ""
    text = unescape(_TAG_RE.sub(" ", raw))
    text = _WS_RE.sub(" ", text).strip()
    if len(text) > limit:
        text = text[: limit - 1].rsplit(" ", 1)[0] + "…"
    return text


def parse_dt(raw: str | None, fallback: datetime) -> tuple[datetime, bool]:
    if not raw:
        return fallback, True
    cleaned = raw.strip()
    try:
        dt = datetime.fromisoformat(cleaned.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(UTC_PLUS_7), False
    except ValueError:
        pass
    try:
        dt = parsedate_to_datetime(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(UTC_PLUS_7), False
    except (TypeError, ValueError):
        return fallback, True


def format_time_label(dt: datetime) -> str:
    local = dt.astimezone(UTC_PLUS_7)
    return local.strftime("%H:%M %d/%m/%Y")


def _extract_images_from_html(raw_html: str | None) -> list[str]:
    if not raw_html:
        return []
    found = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', raw_html, flags=re.I)
    out: list[str] = []
    for u in found:
        safe = safe_public_url(u)
        if safe and safe.startswith("https://") and safe not in out:
            out.append(safe)
        if len(out) >= 2:
            break
    return out


def _is_ai_relevant(source_name: str, title: str, summary: str) -> bool:
    if source_name in ("OpenAI News", "Google AI Blog", "GitHub Blog", "Hugging Face Blog"):
        return True
    hay = normalize_vi(f"{title} {summary}")
    return bool(
        re.search(
            r"\b(ai|llm|gpt|claude|anthropic|gemini|grok|openai|deepmind|mcp|agent|model|rag|copilot|codex|cve-|ransomware|zero[- ]day|microsoft|google|meta|nvidia|github)\b",
            hay,
        )
    )


def _build_vi_summary(source_name: str, section: str, title: str, raw_desc: str) -> tuple[str, str | None]:
    clean = strip_html(raw_desc, limit=700)
    if not clean:
        summary = f"Cập nhật mới từ {source_name} thuộc chuyên mục {section}: {title}. Xem bài gốc để đọc chi tiết kỹ thuật."
        return summary, None
    # Keep summary concise & informative in Vietnamese frame while quoting upstream text faithfully
    first_chunk = clean[:320].rsplit(" ", 1)[0] + ("…" if len(clean) > 320 else "")
    summary = f"Nguồn {source_name} ({section}) đăng tải: {first_chunk}"
    full_text = clean if len(clean) > 320 else None
    return summary, full_text


def _make_item(
    source_name: str,
    default_section: str,
    title: str,
    raw_desc: str,
    url: str,
    published_raw: str | None,
    author: str | None,
    now_local: datetime,
    images: list[str] | None = None,
) -> FetchedFeedItem | None:
    safe_url = safe_public_url(url)
    clean_title = strip_html(title, limit=260)
    if not safe_url or not clean_title:
        return None
    if not _is_ai_relevant(source_name, clean_title, raw_desc):
        return None

    pub_dt, estimated = parse_dt(published_raw, now_local)
    # Only keep items from the last 14 days
    if (now_local - pub_dt).days > 14:
        return None

    section = classify_section(clean_title, raw_desc, source_name, safe_url)
    if section == "Ứng dụng thực tế" and default_section in ("Repo", "Bảo mật & An ninh mạng"):
        section = default_section

    summary, full_text = _build_vi_summary(source_name, section, clean_title, raw_desc)
    is_important = bool(
        re.search(
            r"\b(cve-\d{4}|zero[- ]day|critical|release|gpt-5|claude|gemini|open[- ]source)\b",
            normalize_vi(clean_title),
        )
    )
    tags = extract_tags(section, clean_title, summary, is_important=is_important)
    batch = "noon" if pub_dt.hour >= 11 and pub_dt.hour < 17 else "morning"
    host = urlsplit(safe_url).netloc.replace("www.", "")
    speech_text = f"{clean_title}. {summary}"

    return FetchedFeedItem(
        external_id=make_external_id(safe_url),
        day_date=pub_dt,
        section=section,
        batch=batch,
        is_picked=is_important,
        title=clean_title,
        summary=summary,
        excerpt=None,
        full_text=full_text,
        speech_text=speech_text,
        source=source_name,
        source_label=source_name,
        author=strip_html(author, limit=120) or None,
        url=safe_url,
        published_at=pub_dt,
        time_label=format_time_label(pub_dt),
        time_estimated=estimated,
        tags=tags,
        images=images or [],
        sources=[{"name": host or source_name, "url": safe_url}],
        confidence="cao" if "blog" in source_name.lower() or "news" in source_name.lower() else "trung bình",
    )


def parse_rss_or_atom(xml_text: str, source_name: str, default_section: str, now_local: datetime) -> list[FetchedFeedItem]:
    items: list[FetchedFeedItem] = []
    root = ET.fromstring(xml_text)
    ns = {"atom": "http://www.w3.org/2005/Atom"}

    # RSS 2.0 <channel><item>
    rss_items = root.findall("./channel/item")
    if rss_items:
        for node in rss_items[:20]:
            title = node.findtext("title") or ""
            link = node.findtext("link") or ""
            desc = node.findtext("description") or ""
            pub = node.findtext("pubDate") or node.findtext("{http://purl.org/dc/elements/1.1/}date")
            author = node.findtext("{http://purl.org/dc/elements/1.1/}creator") or node.findtext("author")
            imgs = _extract_images_from_html(desc)
            item = _make_item(source_name, default_section, title, desc, link, pub, author, now_local, imgs)
            if item:
                items.append(item)
        return items

    # Atom <entry>
    entries = root.findall("atom:entry", ns) or root.findall("entry")
    for entry in entries[:20]:
        title = entry.findtext("atom:title", default="", namespaces=ns) or entry.findtext("title") or ""
        link = ""
        for lnk in entry.findall("atom:link", ns) + entry.findall("link"):
            rel = lnk.attrib.get("rel", "alternate")
            href = lnk.attrib.get("href", "")
            if href and rel in ("alternate", ""):
                link = href
                break
        if not link:
            for lnk in entry.findall("atom:link", ns) + entry.findall("link"):
                if lnk.attrib.get("href"):
                    link = lnk.attrib["href"]
                    break
        desc = (
            entry.findtext("atom:summary", default="", namespaces=ns)
            or entry.findtext("atom:content", default="", namespaces=ns)
            or entry.findtext("summary")
            or entry.findtext("content")
            or ""
        )
        pub = (
            entry.findtext("atom:published", default="", namespaces=ns)
            or entry.findtext("atom:updated", default="", namespaces=ns)
            or entry.findtext("published")
            or entry.findtext("updated")
        )
        author = entry.findtext("atom:author/atom:name", default="", namespaces=ns) or entry.findtext("author/name")
        imgs = _extract_images_from_html(desc)
        item = _make_item(source_name, default_section, title, desc, link, pub, author, now_local, imgs)
        if item:
            items.append(item)
    return items


def parse_hn_json(payload: dict, source_name: str, default_section: str, now_local: datetime) -> list[FetchedFeedItem]:
    items: list[FetchedFeedItem] = []
    for hit in (payload.get("hits") or [])[:15]:
        title = hit.get("title") or ""
        url = hit.get("url") or (f"https://news.ycombinator.com/item?id={hit.get('objectID')}" if hit.get("objectID") else "")
        points = hit.get("points") or 0
        comments = hit.get("num_comments") or 0
        desc = f"Thảo luận trên Hacker News ({points} điểm, {comments} bình luận)."
        item = _make_item(
            source_name,
            default_section,
            title,
            desc,
            url,
            hit.get("created_at"),
            hit.get("author"),
            now_local,
        )
        if item:
            items.append(item)
    return items


def fetch_public_feeds(
    client_factory=None,
    feeds: list[dict[str, str]] | None = None,
) -> tuple[list[FetchedFeedItem], list[dict[str, str]]]:
    """Fetch public RSS/Atom/JSON feeds politely without failing the whole run if one source errors."""
    now_local = datetime.now(UTC_PLUS_7)
    feed_list = feeds if feeds is not None else PUBLIC_FEEDS
    factory = client_factory or (
        lambda: httpx.Client(
            headers={"User-Agent": "AI-Repository-Hub/1.0 (+https://github.com/buinghiemtrang/ai-repository-hub)"},
            timeout=10.0,
            follow_redirects=True,
        )
    )
    collected: list[FetchedFeedItem] = []
    errors: list[dict[str, str]] = []

    with factory() as client:
        for feed in feed_list:
            try:
                res = client.get(feed["url"])
                res.raise_for_status()
                if feed["kind"] == "hn_json":
                    parsed = parse_hn_json(res.json(), feed["name"], feed["default_section"], now_local)
                else:
                    parsed = parse_rss_or_atom(res.text, feed["name"], feed["default_section"], now_local)
                collected.extend(parsed)
            except (httpx.HTTPError, ET.ParseError, ValueError) as exc:
                errors.append({"source": feed["name"], "reason": type(exc).__name__})
    return collected, errors
