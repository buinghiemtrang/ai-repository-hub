"""Synthesize original Vietnamese guides and summaries from upstream GitHub metadata and README."""
import re

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+?)\s*$")
FENCE_RE = re.compile(r"^```([A-Za-z0-9_+-]*)\s*$")
BADGE_IMG_RE = re.compile(r"!\[[^\]]*\]\([^)]*\)")
HTML_TAG_RE = re.compile(r"<[^>]+>")
MD_LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")

INSTALL_HEADINGS = (
    "install", "installation", "getting started", "quick start", "quickstart",
    "setup", "cài đặt", "deployment", "docker", "run locally",
)
USAGE_HEADINGS = (
    "usage", "how to use", "examples", "example", "cli", "commands", "cách dùng", "sử dụng",
)
REQ_HEADINGS = (
    "requirements", "prerequisites", "dependencies", "system requirements", "yêu cầu",
)
FEATURE_HEADINGS = (
    "features", "highlights", "capabilities", "why", "overview", "about", "tính năng",
)


def _strip_inline_md(text: str) -> str:
    text = BADGE_IMG_RE.sub("", text)
    text = HTML_TAG_RE.sub(" ", text)
    text = MD_LINK_RE.sub(r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"__([^_]+)__", r"\1", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _split_sections(readme: str) -> list[tuple[str, str]]:
    """Split markdown README into (heading_lower, body) sections while respecting code fences."""
    sections: list[tuple[str, list[str]]] = [("intro", [])]
    in_fence = False
    for line in readme.splitlines()[:1200]:
        if FENCE_RE.match(line.strip()):
            in_fence = not in_fence
            sections[-1][1].append(line)
            continue
        if not in_fence:
            m = HEADING_RE.match(line)
            if m:
                title = _strip_inline_md(m.group(2)).lower()
                sections.append((title, []))
                continue
        sections[-1][1].append(line)
    return [(title, "\n".join(lines).strip()) for title, lines in sections]


def _extract_code_blocks(body: str, limit: int = 3) -> list[tuple[str, str]]:
    blocks: list[tuple[str, str]] = []
    in_fence = False
    lang = "sh"
    buf: list[str] = []
    for line in body.splitlines():
        m = FENCE_RE.match(line.strip())
        if m:
            if not in_fence:
                in_fence = True
                lang = m.group(1) or "sh"
                buf = []
            else:
                in_fence = False
                code = "\n".join(buf).strip()
                if code and len(code) <= 1200:
                    blocks.append((lang, code))
                    if len(blocks) >= limit:
                        break
        elif in_fence:
            buf.append(line)
    return blocks


def _extract_bullets(body: str, limit: int = 5) -> list[str]:
    bullets: list[str] = []
    in_fence = False
    for line in body.splitlines():
        if FENCE_RE.match(line.strip()):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        stripped = line.strip()
        if stripped.startswith(("- ", "* ", "• ")):
            cleaned = _strip_inline_md(stripped[2:])
            if len(cleaned) >= 12 and not cleaned.startswith("http"):
                bullets.append(cleaned[:220])
                if len(bullets) >= limit:
                    break
    return bullets


def _extract_lead_paragraph(body: str) -> str:
    in_fence = False
    para: list[str] = []
    for line in body.splitlines():
        if FENCE_RE.match(line.strip()):
            in_fence = not in_fence
            continue
        if in_fence:
            continue
        s = line.strip()
        if not s:
            if para:
                break
            continue
        if s.startswith(("#", ">", "|", "-", "*", "<!--", "<div", "<p", "<img", "[![", "![")):
            if para:
                break
            continue
        cleaned = _strip_inline_md(s)
        if cleaned and len(cleaned) > 20:
            para.append(cleaned)
            if sum(len(x) for x in para) > 350:
                break
    return " ".join(para)[:420].strip()


def _find_section(sections: list[tuple[str, str]], keywords: tuple[str, ...]) -> str:
    for title, body in sections:
        if any(k in title for k in keywords) and body:
            return body
    return ""


def build_guide_vi(
    full_name: str,
    category: str,
    description_vi: str,
    description_upstream: str | None = None,
    language: str | None = None,
    license_id: str | None = None,
    topics: list[str] | None = None,
    homepage: str | None = None,
    default_branch: str | None = None,
    readme_text: str | None = None,
) -> str:
    """Compile a structured Vietnamese usage and installation guide from upstream README and metadata."""
    repo_url = f"https://github.com/{full_name}"
    branch = default_branch or "main"
    readme_url = f"{repo_url}/blob/{branch}/README.md"

    sections = _split_sections(readme_text or "")
    intro_body = sections[0][1] if sections else ""
    lead = _extract_lead_paragraph(intro_body)
    req_body = _find_section(sections, REQ_HEADINGS)
    install_body = _find_section(sections, INSTALL_HEADINGS)
    usage_body = _find_section(sections, USAGE_HEADINGS)
    feature_body = _find_section(sections, FEATURE_HEADINGS)

    req_bullets = _extract_bullets(req_body, limit=4)
    feature_bullets = _extract_bullets(feature_body or intro_body, limit=5)
    install_blocks = _extract_code_blocks(install_body, limit=3)
    usage_blocks = _extract_code_blocks(usage_body, limit=2)

    lines: list[str] = [
        "## Tổng quan từ tài liệu gốc",
        description_vi,
    ]
    if description_upstream:
        lines.append(f"- Mô tả gốc trên GitHub: {description_upstream}")
    if lead and lead.lower() != (description_upstream or "").lower():
        lines.append(f"- Trích dẫn README gốc: {lead}")

    meta_parts = [f"Danh mục: {category}"]
    if language:
        meta_parts.append(f"Ngôn ngữ chính: {language}")
    if license_id:
        meta_parts.append(f"Giấy phép: {license_id}")
    if homepage:
        meta_parts.append(f"Trang chủ: {homepage}")
    lines.append("- " + " · ".join(meta_parts))

    if topics:
        lines.append(f"- Chủ đề GitHub: {', '.join(topics[:10])}")

    if feature_bullets:
        lines.append("")
        lines.append("## Điểm nổi bật theo README")
        for item in feature_bullets:
            lines.append(f"- {item}")

    lines.append("")
    lines.append("## Yêu cầu & chuẩn bị")
    if req_bullets:
        for item in req_bullets:
            lines.append(f"- {item}")
    else:
        lang_hint = f"Môi trường phù hợp cho dự án {language}" if language else "Kiểm tra runtime/dependencies nêu trong README gốc"
        lines.append(f"- {lang_hint}.")
        lines.append(f"- Kiểm tra phiên bản hệ điều hành (Linux/macOS/Windows) và biến môi trường trước khi chạy.")

    lines.append("")
    lines.append("## Lệnh cài đặt tham khảo từ README gốc")
    lines.append(
        "> Lưu ý an toàn: AI Repository Hub không tự động thực thi mã nguồn bên ngoài. "
        "Hãy đọc kỹ README gốc và rà soát lệnh trước khi chạy trên máy của bạn."
    )
    if install_blocks:
        for lang, code in install_blocks:
            lines.append(f"```{lang}")
            lines.append(code)
            lines.append("```")
    else:
        lines.append("```sh")
        lines.append(f"git clone {repo_url}.git")
        lines.append(f"cd {full_name.split('/')[-1]}")
        lines.append("```")
        lines.append(f"Xem hướng dẫn chi tiết từng bước tại: {readme_url}")

    if usage_blocks:
        lines.append("")
        lines.append("## Ví dụ sử dụng từ tài liệu gốc")
        for lang, code in usage_blocks:
            lines.append(f"```{lang}")
            lines.append(code)
            lines.append("```")
    else:
        lines.append("")
        lines.append("## Tài liệu & liên kết đối chiếu")
        lines.append(f"- Repository gốc: {repo_url}")
        lines.append(f"- Tài liệu README ({branch}): {readme_url}")
        if homepage:
            lines.append(f"- Website / Docs: {homepage}")

    return "\n".join(lines).strip()
