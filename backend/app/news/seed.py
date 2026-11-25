"""Starter news & repository highlights seeder (100% independent, no external LAN calls)."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.news.models import NewsDay, NewsItem
from app.news.sections import IMPORTANT_TAG, REPO_TAG, SECURITY_TAG, make_external_id
from app.repositories.models import Repository

UTC_PLUS_7 = timezone(timedelta(hours=7))


def _ensure_day(db: Session, day_date: date, intro: str, heads: list[str], now: datetime) -> None:
    db.execute(
        insert(NewsDay)
        .values(
            date=day_date,
            intro=intro,
            heads=heads,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_nothing(index_elements=["date"])
    )


def _insert_item(db: Session, payload: dict) -> bool:
    res = db.execute(
        insert(NewsItem)
        .values(**payload)
        .on_conflict_do_nothing(index_elements=["external_id"])
    )
    return bool(res.rowcount)


def build_repo_highlights(db: Session, target_date: date, now: datetime, limit: int = 8) -> int:
    """Create Repo-section news items directly from the local repositories catalog."""
    repos = db.scalars(
        select(Repository)
        .order_by(Repository.stars.desc().nulls_last(), Repository.updated_at.desc().nulls_last(), Repository.id.asc())
        .limit(limit)
    ).all()
    inserted = 0
    for idx, repo in enumerate(repos):
        ext_id = make_external_id(f"repo:{repo.full_name}:{target_date.isoformat()}")
        stars_txt = f"{repo.stars:,} stars" if repo.stars else "mã nguồn mở"
        lang_txt = f" · Ngôn ngữ: {repo.language}" if repo.language else ""
        lic_txt = f" · Giấy phép: {repo.license}" if repo.license else ""
        summary = (
            f"{repo.description_vi} Thuộc nhóm {repo.category} ({stars_txt}{lang_txt}{lic_txt}). "
            f"Bấm xem chi tiết để đọc hướng dẫn cài đặt đối chiếu từ README."
        )
        images = [repo.image_url] if repo.image_url and repo.image_url.startswith("https://") else []
        tags = [REPO_TAG, repo.category]
        if idx < 2:
            tags.insert(0, IMPORTANT_TAG)
        if repo.language:
            tags.append(repo.language)

        ok = _insert_item(
            db,
            {
                "external_id": ext_id,
                "day_date": target_date,
                "section": "Repo",
                "batch": "noon" if idx % 4 == 3 else "morning",
                "is_tip": False,
                "is_picked": idx < 3,
                "title": f"[Repo AI] {repo.full_name} — {repo.category}",
                "summary": summary,
                "excerpt": repo.description_upstream,
                "full_text": repo.guide_vi[:1400] if repo.guide_vi else None,
                "speech_text": f"Mục Repo AI: {repo.full_name}, nhóm {repo.category}. {repo.description_vi}",
                "source": "AI Repo Hub Catalog",
                "source_label": "Thư viện Repo",
                "author": repo.full_name.split("/")[0],
                "url": f"https://github.com/{repo.full_name}",
                "published_at": repo.updated_at or now,
                "time_label": (repo.updated_at or now).astimezone(UTC_PLUS_7).strftime("%H:%M %d/%m/%Y"),
                "time_estimated": repo.updated_at is None,
                "tags": tags[:5],
                "images": images,
                "video": None,
                "sources": [{"name": "GitHub Repository", "url": f"https://github.com/{repo.full_name}"}],
                "confidence": "cao",
                "repository_id": repo.id,
                "created_at": now,
            },
        )
        if ok:
            inserted += 1
    return inserted


def seed_news(db: Session) -> None:
    """Seed initial multi-day AI & Repo feed entries if the news table is empty."""
    existing_count = db.scalar(select(func.count()).select_from(NewsItem)) or 0
    if existing_count > 0:
        return

    now = datetime.now(UTC_PLUS_7)
    today = now.date()

    # Build 3 initial days of curated reference & catalog entries so all UI views work immediately
    days_meta = [
        (
            today,
            "Tổng hợp các tài liệu kỹ thuật chính thức từ hệ sinh thái AI, an ninh mạng và mục Repo nổi bật từ thư viện AI Repository Hub.",
            [
                "Mục Repo AI: tổng hợp các dự án mã nguồn mở nổi bật từ thư viện AI Repository Hub",
                "An toàn tích hợp MCP & Coding Agent: nguyên tắc kiểm tra quyền và xác thực nguồn trước khi chạy lệnh",
            ],
        ),
        (
            today - timedelta(days=1),
            "Tiêu điểm kỹ thuật ngày trước: mô hình đa phương thức, công cụ phát triển và tự động hóa workflow cục bộ.",
            [
                "Chuẩn hóa giao thức Model Context Protocol (MCP) cho công cụ AI cục bộ và từ xa",
                "So sánh hướng triển khai LLM cục bộ với Ollama, vLLM và các thư viện agent mã nguồn mở",
            ],
        ),
        (
            today - timedelta(days=2),
            "Góc nhìn cộng đồng phát triển AI & mẹo tối ưu quy trình làm việc hằng ngày với coding assistant.",
            [
                "Mẹo cấu trúc ngữ cảnh và kiểm chứng đầu ra khi dùng AI hỗ trợ lập trình",
                "Danh sách kiểm tra bảo mật OWASP cho ứng dụng LLM và hệ thống RAG",
            ],
        ),
    ]
    for d, intro, heads in days_meta:
        _ensure_day(db, d, intro, heads, now)

    # Seed Repo items across day 0 and day -1 from actual catalog repositories
    build_repo_highlights(db, today, now, limit=6)

    starter_items = [
        {
            "day_offset": 0,
            "section": "Claude",
            "batch": "morning",
            "is_tip": False,
            "is_picked": True,
            "title": "Anthropic Docs: Hướng dẫn xây dựng Agent & Tool Use với Claude và MCP",
            "summary": "Tài liệu chính thức của Anthropic trình bày cách thiết kế vòng lặp agent, định nghĩa tool schema rõ ràng và kết nối Model Context Protocol (MCP) an toàn theo nguyên tắc tối thiểu quyền.",
            "excerpt": "Thiết kế tool đơn giản, kiểm soát ranh giới thực thi và ưu tiên xác minh kết quả trước khi mở rộng quy mô agent.",
            "full_text": "Hệ sinh thái Claude hỗ trợ Claude Code, MCP servers và structured tool calling. Khi tích hợp vào workspace cá nhân, nên tách biệt môi trường thực thi, không nạp trực tiếp biến môi trường nhạy cảm vào prompt và ghi log đầy đủ thao tác đồng bộ.",
            "source": "Anthropic Documentation",
            "author": "Anthropic",
            "url": "https://docs.anthropic.com/en/docs/agents-and-tools/mcp",
            "tags": [IMPORTANT_TAG, "MCP", "Agent"],
            "confidence": "cao",
        },
        {
            "day_offset": 0,
            "section": "ChatGPT / OpenAI",
            "batch": "morning",
            "is_tip": False,
            "is_picked": True,
            "title": "OpenAI Platform: Tổng quan Responses API, Structured Outputs và Agents SDK",
            "summary": "Tài liệu nền tảng OpenAI mô tả cách dùng Responses API cho tác vụ đa bước, ép kiểu JSON theo schema (Structured Outputs) và điều phối công cụ tích hợp.",
            "excerpt": None,
            "full_text": None,
            "source": "OpenAI Platform Docs",
            "author": "OpenAI",
            "url": "https://platform.openai.com/docs/guides/responses-vs-chat-completions",
            "tags": ["DevTools", "Agent"],
            "confidence": "cao",
        },
        {
            "day_offset": 0,
            "section": "Gemini",
            "batch": "noon",
            "is_tip": False,
            "is_picked": False,
            "title": "Google AI for Developers: Khả năng ngữ cảnh dài và đa phương thức trên Gemini API",
            "summary": "Hướng dẫn kỹ thuật từ Google AI về xử lý văn bản dài, âm thanh, hình ảnh và video thông qua Gemini API cùng cơ chế context caching để giảm độ trễ.",
            "excerpt": None,
            "full_text": None,
            "source": "Google AI for Developers",
            "author": "Google DeepMind",
            "url": "https://ai.google.dev/gemini-api/docs",
            "tags": ["Video AI", "DevTools"],
            "confidence": "cao",
        },
        {
            "day_offset": 0,
            "section": "Grok",
            "batch": "morning",
            "is_tip": False,
            "is_picked": False,
            "title": "xAI Docs: Tham chiếu API tương thích OpenAI/Anthropic và Function Calling trên Grok",
            "summary": "xAI cung cấp tài liệu tích hợp Grok API với chuẩn SDK phổ biến, hỗ trợ reasoning, function calling và phân tích dữ liệu thời gian thực.",
            "excerpt": None,
            "full_text": None,
            "source": "xAI Documentation",
            "author": "xAI",
            "url": "https://docs.x.ai/docs/overview",
            "tags": ["DevTools"],
            "confidence": "cao",
        },
        {
            "day_offset": 0,
            "section": "Bảo mật & An ninh mạng",
            "batch": "morning",
            "is_tip": False,
            "is_picked": True,
            "title": "OWASP Top 10 cho LLM & Ứng dụng GenAI: Prompt Injection và rò rỉ dữ liệu",
            "summary": "Danh mục rủi ro bảo mật trọng tâm khi triển khai AI: Prompt Injection, thực thi mã không kiểm duyệt, rò rỉ bí mật trong log/env và phụ thuộc gói nguồn mở chưa kiểm tra.",
            "excerpt": "Không bao giờ tự động chạy lệnh sao chép từ README hoặc nội dung web thu thập được khi chưa kiểm duyệt thủ công.",
            "full_text": "Áp dụng nguyên tắc zero-trust cho dữ liệu crawl từ bên ngoài: làm sạch HTML, kiểm tra scheme https://, xác thực admin endpoint bằng API key và cô lập container khi chạy thử nghiệm.",
            "source": "OWASP GenAI Security",
            "author": "OWASP Foundation",
            "url": "https://genai.owasp.org/llm-top-10/",
            "tags": [IMPORTANT_TAG, SECURITY_TAG],
            "confidence": "cao",
        },
        {
            "day_offset": 0,
            "section": "Ứng dụng thực tế",
            "batch": "noon",
            "is_tip": True,
            "is_picked": False,
            "title": "Mẹo: Tách file cấu hình môi trường (.env) khi nối nhiều công cụ AI Studio",
            "summary": "Khi mở rộng hub thêm Video AI, Ảnh AI hay TTS, luôn đặt API key ở backend `.env` (không đưa vào frontend) và tách route theo từng module độc lập để dễ bảo trì và kiểm thử.",
            "excerpt": None,
            "full_text": None,
            "source": "Kinh nghiệm kỹ thuật",
            "author": None,
            "url": None,
            "tags": ["DevTools"],
            "confidence": "cao",
        },
        {
            "day_offset": 1,
            "section": "Cộng đồng AI Việt Nam",
            "batch": "morning",
            "is_tip": False,
            "is_picked": False,
            "title": "Tổng hợp thực hành tìm kiếm tiếng Việt không dấu với PostgreSQL unaccent",
            "summary": "Kết hợp extension `unaccent` của PostgreSQL ở backend và chuẩn hóa Unicode NFD (`đ` -> `d`) ở frontend giúp tìm kiếm tin tức và repository tiếng Việt chính xác dù người dùng gõ có dấu hay không dấu.",
            "excerpt": None,
            "full_text": None,
            "source": "PostgreSQL Docs",
            "author": "AI Repo Hub",
            "url": "https://www.postgresql.org/docs/current/unaccent.html",
            "tags": ["DevTools", "Open Source"],
            "confidence": "cao",
        },
        {
            "day_offset": 1,
            "section": "Bài hay trong nhóm",
            "batch": "noon",
            "is_tip": True,
            "is_picked": False,
            "title": "Mẹo: Dùng phím `/` để tìm nhanh và `Space` điều khiển trình đọc Podcast",
            "summary": "Trên trang Tin tức, bạn có thể nhấn phím `/` để nhảy nhanh vào ô tìm kiếm mọi bản tin, bấm `Đọc cả trang` hoặc `Podcast cả ngày` để nghe tóm tắt bằng giọng tiếng Việt của trình duyệt.",
            "excerpt": None,
            "full_text": None,
            "source": "Hướng dẫn sử dụng",
            "author": None,
            "url": None,
            "tags": ["DevTools"],
            "confidence": "cao",
        },
        {
            "day_offset": 2,
            "section": "Ứng dụng thực tế",
            "batch": "morning",
            "is_tip": False,
            "is_picked": True,
            "title": "Kiến trúc Modular Monolith cho nền tảng công cụ AI cá nhân",
            "summary": "Tổ chức từng tính năng (Repository Catalog, News Feed, MCP Registry, Video/Image Studio) thành các slice độc lập dùng chung PostgreSQL và hệ thống thiết kế giao diện giúp mở rộng nhanh mà không cần microservice phức tạp.",
            "excerpt": None,
            "full_text": None,
            "source": "AI Repo Hub Architecture",
            "author": "System Design",
            "url": "https://github.com/buinghiemtrang/ai-repository-hub",
            "tags": ["Open Source", "Agent"],
            "confidence": "cao",
        },
    ]

    for idx, item in enumerate(starter_items):
        d = today - timedelta(days=item["day_offset"])
        pub = now - timedelta(days=item["day_offset"], hours=idx)
        key = item["url"] or f"tip:{item['title']}:{d.isoformat()}"
        _insert_item(
            db,
            {
                "external_id": make_external_id(key),
                "day_date": d,
                "section": item["section"],
                "batch": item["batch"],
                "is_tip": item["is_tip"],
                "is_picked": item["is_picked"],
                "title": item["title"],
                "summary": item["summary"],
                "excerpt": item["excerpt"],
                "full_text": item["full_text"],
                "speech_text": f"{item['title']}. {item['summary']}",
                "source": item["source"],
                "source_label": item["source"],
                "author": item["author"],
                "url": item["url"],
                "published_at": pub,
                "time_label": pub.astimezone(UTC_PLUS_7).strftime("%H:%M %d/%m/%Y"),
                "time_estimated": False,
                "tags": item["tags"],
                "images": [],
                "video": None,
                "sources": ([{"name": item["source"], "url": item["url"]}] if item["url"] else None),
                "confidence": item["confidence"],
                "repository_id": None,
                "created_at": now,
            },
        )

    db.commit()
