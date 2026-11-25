"""Canonical section definitions, colors, and classification helpers for the News module."""
from __future__ import annotations

import hashlib
import re
import unicodedata
from urllib.parse import urlsplit

SECTIONS: list[dict[str, str]] = [
    {"name": "Repo", "short": "Repo", "color": "#0f766e"},
    {"name": "Claude", "short": "Claude", "color": "#d97757"},
    {"name": "Grok", "short": "Grok", "color": "#334155"},
    {"name": "ChatGPT / OpenAI", "short": "ChatGPT", "color": "#10a37f"},
    {"name": "Gemini", "short": "Gemini", "color": "#4285f4"},
    {"name": "Bảo mật & An ninh mạng", "short": "Bảo mật", "color": "#dc2626"},
    {"name": "Cộng đồng AI Việt Nam", "short": "Cộng đồng AI VN", "color": "#1877f2"},
    {"name": "Bài hay trong nhóm", "short": "Bài hay trong nhóm", "color": "#0ea5e9"},
    {"name": "Ứng dụng thực tế", "short": "Ứng dụng thực tế", "color": "#7c3aed"},
]

SECTION_NAMES = {s["name"] for s in SECTIONS}
IMPORTANT_TAG = "Tin quan trọng"
SECURITY_TAG = "Bảo mật"
REPO_TAG = "Repo nổi bật"


def normalize_vi(value: str) -> str:
    return (
        "".join(
            c
            for c in unicodedata.normalize("NFD", (value or "").lower())
            if not unicodedata.combining(c)
        )
        .replace("đ", "d")
    )


def safe_public_url(raw: str | None) -> str | None:
    if not raw or not isinstance(raw, str):
        return None
    cleaned = raw.strip()
    if not cleaned:
        return None
    parsed = urlsplit(cleaned)
    if parsed.scheme in ("http", "https") and parsed.netloc:
        return cleaned[:1000]
    return None


def make_external_id(key: str) -> str:
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def classify_section(title: str, summary: str, source: str = "", url: str = "") -> str:
    hay = normalize_vi(f"{title} {summary} {source} {url}")
    if re.search(r"\b(cve-\d{4}|zero[- ]day|ransomware|malware|exploit|phishing|vulnerability|lo hong|bao mat|an ninh mang|backdoor|supply[- ]chain)\b", hay):
        return "Bảo mật & An ninh mạng"
    if re.search(r"\b(claude|anthropic|sonnet|opus|haiku|claude code)\b", hay):
        return "Claude"
    if re.search(r"\b(grok|xai|x\.ai)\b", hay):
        return "Grok"
    if re.search(r"\b(chatgpt|openai|gpt-4|gpt-5|codex|sora|responses api)\b", hay):
        return "ChatGPT / OpenAI"
    if re.search(r"\b(gemini|deepmind|gemma|notebooklm|google ai|vertex ai|veo)\b", hay):
        return "Gemini"
    if "github.com/" in hay or "github.blog" in hay or re.search(r"\b(open[- ]source|repository|repo ai|mcp server)\b", hay):
        return "Repo"
    if re.search(r"\b(viet nam|vietnam|cong dong ai)\b", hay):
        return "Cộng đồng AI Việt Nam"
    return "Ứng dụng thực tế"


def extract_tags(section: str, title: str, summary: str, is_important: bool = False) -> list[str]:
    tags: list[str] = []
    if is_important:
        tags.append(IMPORTANT_TAG)
    if section == "Bảo mật & An ninh mạng":
        tags.append(SECURITY_TAG)
    elif section == "Repo":
        tags.append(REPO_TAG)

    hay = normalize_vi(f"{title} {summary}")
    keyword_tags = [
        ("MCP", r"\bmcp\b|model context protocol"),
        ("Agent", r"\bagent|multi-agent|coding agent"),
        ("Open Source", r"open[- ]source|ma nguon mo|mit|apache-2"),
        ("Video AI", r"\bvideo|sora|veo|kling|runway"),
        ("Local AI", r"\bollama|gguf|vllm|local llm|cuc bo"),
        ("DevTools", r"\bcli|sdk|ide|cursor|copilot|claude code|codex"),
    ]
    for label, pattern in keyword_tags:
        if re.search(pattern, hay) and label not in tags:
            tags.append(label)
        if len(tags) >= 5:
            break
    return tags
