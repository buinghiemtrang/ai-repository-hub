"""Discover canonical public GitHub repository links; do not copy editorial text."""
import argparse
import html
import json
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote_plus, urljoin, urlsplit
from urllib.robotparser import RobotFileParser

import httpx

ORIGIN = "https://mochistudio.io.vn"
AGENT = "AIRepositoryHub"
RESERVED = {
    "about", "apps", "collections", "contact", "customer-stories", "enterprise", "events",
    "explore", "features", "issues", "login", "marketplace", "new", "notifications",
    "orgs", "pricing", "pulls", "search", "settings", "signup", "sponsors", "topics", "users",
}
PART = re.compile(r"^[A-Za-z0-9_.-]+$")
LISTING_PATH = "/repo"
GITHUB_URL_RE = re.compile(r"https://github\.com/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/[^\s\"'<>\\)]*)?")
CATEGORY_HREF_RE = re.compile(r'href="/(?:repo|skills)\?category=([^"&]+)"[^>]*>([^<]+)<')
TOTAL_COUNT_RE = re.compile(r"(\d+)\s*(?:skill|repo)\s*·\s*trang\s*\d+\s*/\s*(\d+)")


class Links(HTMLParser):
    """Collect anchor href attributes from static HTML."""

    def __init__(self):
        super().__init__()
        self.links: list[str] = []

    def handle_starttag(self, tag, attrs):
        if tag == "a":
            href = dict(attrs).get("href")
            if href:
                self.links.append(href)


def repo_name(url: str) -> str | None:
    """Normalize a GitHub HTTPS repository URL into canonical owner/name."""
    p = urlsplit(url)
    if p.scheme != "https" or p.netloc.lower() != "github.com":
        return None
    parts = [x for x in p.path.strip("/").split("/") if x]
    if len(parts) < 2 or not all(PART.fullmatch(x) and x not in (".", "..") for x in parts[:2]):
        return None
    owner, name = parts[:2]
    if owner.lower() in RESERVED or name.lower() == "sponsors":
        return None
    return owner + "/" + name.removesuffix(".git")


def allowed_detail(url: str) -> bool:
    """Return True only for canonical Mochi Studio listing detail URLs."""
    p = urlsplit(url)
    return (
        p.scheme == "https"
        and p.netloc == "mochistudio.io.vn"
        and bool(re.fullmatch(r"/(?:repo|skills)/[A-Za-z0-9_-]+/?", p.path))
        and not p.query
    )


def extract_github_urls(raw_html: str) -> list[str]:
    """Extract GitHub URLs from both anchor tags and serialized Next.js RSC payloads."""
    parser = Links()
    parser.feed(raw_html)
    urls = list(parser.links)
    unescaped = raw_html.replace("\\/", "/").replace("\\u002f", "/").replace("\\u002F", "/")
    urls.extend(GITHUB_URL_RE.findall(unescaped))
    seen: set[str] = set()
    ordered: list[str] = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            ordered.append(u)
    return ordered


def extract_category(raw_html: str) -> str | None:
    """Extract the public category name from a detail page if present."""
    for encoded, label in CATEGORY_HREF_RE.findall(raw_html):
        cleaned = html.unescape(label).strip()
        if cleaned:
            return cleaned
        decoded = unquote_plus(encoded).strip()
        if decoded:
            return decoded
    return None


def extract_listing_totals(raw_html: str) -> tuple[int | None, int | None]:
    """Parse expected total items and total pages from listing page HTML."""
    plain = re.sub(r"<!--.*?-->", "", raw_html, flags=re.S)
    plain = re.sub(r"<[^>]+>", " ", plain)
    m = TOTAL_COUNT_RE.search(plain)
    if not m:
        return None, None
    return int(m.group(1)), int(m.group(2))


def scan(client: httpx.Client, max_pages: int | None, delay: float, checkpoint_path: Path | None = None):
    """Politely crawl public listing and detail pages, verifying coverage and deduping candidates."""
    robots = RobotFileParser()
    response = client.get(ORIGIN + "/robots.txt")
    if response.status_code == 404:
        robots.parse([])
    else:
        response.raise_for_status()
        robots.parse(response.text.splitlines())
    robots_delay = robots.crawl_delay(AGENT) or robots.crawl_delay("*") or 0
    delay = max(delay, robots_delay)

    seen_details: set[str] = set()
    found: dict[str, dict] = {}
    detail_to_repo: dict[str, str] = {}
    missing_repo_details: list[str] = []
    errors: list[dict] = []
    pages: list[int] = []
    expected_total: int | None = None
    expected_pages: int | None = None

    if checkpoint_path and checkpoint_path.exists():
        try:
            prev = json.loads(checkpoint_path.read_text(encoding="utf-8"))
            for item in prev.get("candidates", []):
                key = item["full_name"].lower()
                found[key] = item
            for d_url, r_name in prev.get("detail_to_repo", {}).items():
                seen_details.add(d_url)
                detail_to_repo[d_url] = r_name
            for d_url in prev.get("missing_repo_details", []):
                seen_details.add(d_url)
                missing_repo_details.append(d_url)
        except (ValueError, KeyError):
            pass

    def fetch_html(url: str) -> tuple[str, list[str]]:
        if not robots.can_fetch(AGENT, url):
            raise PermissionError("robots.txt disallows " + url)
        time.sleep(delay)
        r = client.get(url)
        if r.status_code in (401, 403, 429):
            raise PermissionError("Access denied or rate limited: " + url)
        r.raise_for_status()
        parser = Links()
        parser.feed(r.text)
        return r.text, [urljoin(url, x) for x in parser.links]

    def collect(raw_html: str, anchor_links: list[str], source: str, category: str | None = None) -> list[str]:
        matched_names: list[str] = []
        candidates = [urljoin(source, x) for x in anchor_links] + extract_github_urls(raw_html)
        for link in candidates:
            name = repo_name(link)
            if name:
                key = name.lower()
                entry = found.setdefault(
                    key,
                    {"full_name": name, "categories": [], "source_urls": []},
                )
                if category and category not in entry["categories"]:
                    entry["categories"].append(category)
                if source not in entry["source_urls"]:
                    entry["source_urls"].append(source)
                if name not in matched_names:
                    matched_names.append(name)
        return matched_names

    def save_report(report: dict):
        if checkpoint_path:
            checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
            checkpoint_path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    def build_report() -> dict:
        coverage_verified = (
            expected_total is not None
            and len(seen_details) >= expected_total
            and not errors
            and not missing_repo_details
        )
        return {
            "source": ORIGIN + LISTING_PATH,
            "expected_total": expected_total,
            "expected_pages": expected_pages,
            "pages_read": pages,
            "details_attempted": len(seen_details),
            "unique_candidates": len(found),
            "missing_repo_details": missing_repo_details,
            "detail_to_repo": detail_to_repo,
            "candidates": sorted(found.values(), key=lambda x: x["full_name"].lower()),
            "errors": errors,
            "coverage_verified": coverage_verified,
            "note": "Candidate URLs extracted from public links and RSC metadata. Verify each against GitHub API.",
        }

    page_limit = max_pages if max_pages is not None else 200
    page = 1
    while page <= page_limit:
        url = ORIGIN + LISTING_PATH + (f"?page={page}" if page > 1 else "")
        try:
            raw_html, links = fetch_html(url)
            pages.append(page)
            if page == 1:
                expected_total, expected_pages = extract_listing_totals(raw_html)
                if max_pages is None and expected_pages is not None:
                    page_limit = min(expected_pages, 200)
            collect(raw_html, links, url)
            details = sorted({x for x in links if allowed_detail(x)})
            if not details:
                errors.append({"url": url, "error": "No detail links found on page"})
                break
            for detail in details:
                if detail in seen_details:
                    # Still record listing page provenance for already-seen repo if mapped
                    if detail in detail_to_repo:
                        key = detail_to_repo[detail].lower()
                        if key in found and url not in found[key]["source_urls"]:
                            found[key]["source_urls"].append(url)
                    continue
                seen_details.add(detail)
                try:
                    detail_html, detail_links = fetch_html(detail)
                    category = extract_category(detail_html)
                    matched = collect(detail_html, detail_links, detail, category=category)
                    if matched:
                        detail_to_repo[detail] = matched[0]
                        key = matched[0].lower()
                        if url not in found[key]["source_urls"]:
                            found[key]["source_urls"].append(url)
                    else:
                        missing_repo_details.append(detail)
                except PermissionError as exc:
                    errors.append({"url": detail, "error": str(exc)})
                    save_report(build_report())
                    return build_report()
                except httpx.HTTPError as exc:
                    errors.append({"url": detail, "error": str(exc)})
            save_report(build_report())
            print(f"Page {page}/{page_limit}: details={len(seen_details)}/{expected_total} candidates={len(found)}", flush=True)
            if expected_pages is not None and page >= expected_pages and max_pages is None:
                break
        except (httpx.HTTPError, PermissionError) as exc:
            errors.append({"url": url, "error": str(exc)})
            break
        page += 1
    report = build_report()
    save_report(report)
    return report


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--pages", type=int, default=None, help="Max listing pages (1-200); auto-detected if omitted")
    p.add_argument("--delay", type=float, default=2.0)
    p.add_argument("--output", default="/tmp/discovery.json")
    p.add_argument("--terms-reviewed", action="store_true")
    args = p.parse_args()
    if not args.terms_reviewed:
        p.error("Review source terms and confirm permitted crawling with --terms-reviewed.")
    if args.pages is not None and not 1 <= args.pages <= 200:
        p.error("Use 1–200 pages.")
    if args.delay < 2:
        p.error("Use delay >= 2 seconds.")
    out_path = Path(args.output)
    with httpx.Client(headers={"User-Agent": AGENT}, timeout=20, follow_redirects=False) as client:
        report = scan(client, args.pages, args.delay, checkpoint_path=out_path)
    print(
        f"Candidate count: {len(report['candidates'])}; "
        f"details={report['details_attempted']}/{report['expected_total']}; "
        f"coverage_verified={report['coverage_verified']}; see {out_path}"
    )


if __name__ == "__main__":
    main()
