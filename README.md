# AI Repository Hub

Nền tảng cá nhân phát triển theo kiến trúc **Modular Monolith** cho hệ sinh thái công cụ AI:
- **Repository Library** (`/`): 487+ repository AI mã nguồn mở kèm mô tả tiếng Việt, ảnh xem trước và hướng dẫn đối chiếu từ README gốc.
- **Tin tức AI & mục Repo** (`/news`): Bản tin tổng hợp độc lập theo ngày/tuần từ nguồn RSS/Atom/JSON công khai kết hợp mục **Repo** từ thư viện, tìm kiếm không dấu và trình đọc Podcast/TTS tiếng Việt.
- **AI Studio Workspace** (`/studio`): Khung giao diện sẵn sàng mở rộng cho các công cụ sáng tạo tương lai (Video AI, Ảnh AI, Voiceover, Flows, MCP & AI Skills).

## Công nghệ

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + **Vellum Design System 1.0** (`motion`, `lucide-react`, `sharp` AVIF/WebP optimization)
- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16 (`unaccent`)
- **Hạ tầng**: Docker Compose v2 (tương thích Linux và Windows Docker Desktop)

## Thiết lập & Chạy trên Linux / Windows

### Yêu cầu
- Git
- Docker Engine / Docker Compose v2 (trên **Windows**: Docker Desktop bật backend WSL2 + Linux containers; khi dùng Git trên Windows nên giữ LF line endings nhờ `.gitattributes`).
- (Tùy chọn chạy local ngoài Docker): Node.js 22+ và Python 3.12+.

### Khởi chạy nhanh

```sh
git clone https://github.com/buinghiemtrang/ai-repository-hub.git
cd ai-repository-hub
cp .env.example .env   # Trên Windows PowerShell: Copy-Item .env.example .env
docker compose up -d --build
```

Mặc định các cổng chỉ mở trên loopback (`127.0.0.1`):
- Giao diện web: `http://localhost:3000`
- Tin tức AI & mục Repo: `http://localhost:3000/news`
- AI Studio: `http://localhost:3000/studio`
- Trạng thái đồng bộ: `http://localhost:3000/sync`
- Kiến trúc Modules: `http://localhost:3000/modules`
- Backend API Docs (Swagger): `http://localhost:8000/docs`
- Kho lưu trữ prototype nội bộ: `http://localhost:3000/prototypes`

Backend tự động chạy `alembic upgrade head` và seed dữ liệu khởi tạo khi container khởi động. Dữ liệu PostgreSQL nằm trong named volume `db_data`.

## Biến môi trường (`.env`)

Tham khảo `.env.example` (không bao giờ commit `.env`):
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`: Thông tin DB cục bộ.
- `GITHUB_TOKEN`: Token GitHub (tùy chọn, nâng rate limit sync repo lên 5000 req/h).
- `ADMIN_API_KEY`: Khóa bảo vệ endpoint đồng bộ thủ công (`POST /repositories/sync/trigger`, `POST /news/sync/trigger`).
- `SYNC_SCHEDULER_ENABLED`, `SYNC_INTERVAL_HOURS`, `SYNC_MIN_AGE_HOURS`: Lịch đồng bộ metadata repo.
- `NEWS_SYNC_ENABLED`, `NEWS_SYNC_INTERVAL_HOURS`: Lịch thu thập tin tức RSS công khai & cập nhật mục Repo.

## Đồng bộ dữ liệu & CLI

- **Đồng bộ GitHub Repo thủ công**:
  ```sh
  docker compose exec backend python -m app.repositories.sync
  ```
- **Đồng bộ Tin tức RSS & mục Repo thủ công**:
  ```sh
  docker compose exec backend python -m app.news.sync
  ```
- **Discovery & Import catalog**: Xem [crawler/README.md](crawler/README.md). Không tự ý chạy lệnh trong README của repo bên ngoài.

## Sao lưu & Khôi phục PostgreSQL

- **Linux / macOS**:
  ```sh
  ./scripts/backup.sh
  ./scripts/restore.sh backups/aihub_YYYYMMDD_HHMMSS.sql --yes
  ```
- **Windows (PowerShell)**:
  ```powershell
  ./scripts/backup.ps1
  ./scripts/restore.ps1 -BackupFile backups\aihub_YYYYMMDD_HHMMSS.sql -Yes
  ```

## Kiểm thử & Build

- **Backend unit & integration tests**:
  ```sh
  docker compose run --rm --no-deps -e SYNC_SCHEDULER_ENABLED=false -v "$(pwd)/backend/tests:/app/tests:ro" backend python -m unittest discover -s tests -v
  ```
  *(Trên Windows PowerShell, thay `"$(pwd)/backend/tests"` bằng `"${PWD}/backend/tests"`)*
- **Frontend typecheck & production build**:
  ```sh
  cd frontend && npm ci && npm run typecheck && npm run build
  ```

## Quy trình làm việc đa máy (Linux công ty ↔ Windows cá nhân)

1. Luôn kiểm tra nhánh đang làm việc (`git status` và `git branch`) trước khi kéo/đẩy code.
2. Khi chuyển máy: `git fetch origin && git checkout <branch> && git pull`.
3. Tạo `.env` riêng trên từng máy từ `.env.example` (không đồng bộ `.env` qua Git).
4. Đọc `AGENTS.md`, `PROJECT_STATUS.md`, `NEXT_TASK.md` và `DESIGN.md` khi bắt đầu phiên làm việc mới với AI coding agent.

## Tài liệu dự án (Project Memory)

- [AGENTS.md](AGENTS.md) — Quy tắc làm việc & khôi phục ngữ cảnh cho AI agents
- [ARCHITECTURE.md](ARCHITECTURE.md) — Kiến trúc hệ thống, module & API
- [DESIGN.md](DESIGN.md) — Quy chuẩn Taste Skill & **Vellum Design System 1.0**
- [PROJECT_STATUS.md](PROJECT_STATUS.md) — Tiến độ đã hoàn thành & còn lại
- [NEXT_TASK.md](NEXT_TASK.md) — Việc tiếp theo cần làm & tiêu chí xong
- [DECISIONS.md](DECISIONS.md) — Các quyết định kỹ thuật & thiết kế đã chốt
- [CHANGELOG.md](CHANGELOG.md) — Lịch sử thay đổi
- [docs/MODULE_CONTRACTS.md](docs/MODULE_CONTRACTS.md) — Hợp đồng mở rộng Modular Monolith
