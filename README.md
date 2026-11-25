# AI Repository Hub

Nền tảng cá nhân, mở rộng theo kiến trúc Modular Monolith cho các module AI. Module đầu tiên: **Repository Library** — tham khảo hành vi công khai của Mochi Studio Skills, biên soạn mô tả tiếng Việt và hướng dẫn đối chiếu trực tiếp từ tài liệu gốc (GitHub API & README), không sao chép mã nguồn hoặc thương hiệu.

## Công nghệ

- **Frontend**: Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui components (`lucide-react`, `cva`, `clsx`, `tailwind-merge`)
- **Backend**: FastAPI + SQLAlchemy 2.0 + Alembic + PostgreSQL 16 + `unaccent`
- **Hạ tầng**: Docker Compose v2 (hỗ trợ Linux và Windows Docker Desktop)

## Chạy nhanh trên Linux / Windows

Yêu cầu: Git và Docker Compose v2 (Windows dùng Docker Desktop với Linux containers).

```sh
git clone https://github.com/buinghiemtrang/ai-repository-hub.git
cd ai-repository-hub
cp .env.example .env   # Tùy chọn: thêm GITHUB_TOKEN / ADMIN_API_KEY
docker compose up --build
```

- Giao diện web: http://localhost:3000
- Trang trạng thái đồng bộ: http://localhost:3000/sync
- Lộ trình modules: http://localhost:3000/modules
- API Docs (Swagger): http://localhost:8000/docs

Docker Compose chỉ publish cổng trên loopback (`127.0.0.1`). Dữ liệu PostgreSQL lưu trong named volume `db_data`. Backend tự động chạy `alembic upgrade head` khi khởi động.

## Đồng bộ dữ liệu GitHub & Lịch tự động

- **Lịch tự động**: Chạy nền trong backend theo chu kỳ `SYNC_INTERVAL_HOURS` (mặc định `24` giờ), bỏ qua repo đã đồng bộ trong vòng `SYNC_MIN_AGE_HOURS` (mặc định `12` giờ), giới hạn batch `SYNC_BATCH_LIMIT`, tự động dừng an toàn khi gặp rate limit (`403`/`429`) và ghi nhật ký vào bảng `sync_runs`.
- **Đồng bộ thủ công qua CLI**:
  ```sh
  docker compose exec backend python -m app.repositories.sync
  ```
- **Endpoint thủ công (`POST /repositories/sync/trigger`)**: Mặc định bị vô hiệu hóa (`503`) cho tới khi cấu hình `ADMIN_API_KEY` trong `.env`; khi bật cần truyền header `X-Admin-Key`. Không bao giờ đưa token/key lên frontend hoặc git.

## Discovery & Import catalog

Xem hướng dẫn chi tiết tại [crawler/README.md](crawler/README.md). Không tự động thực thi lệnh trong README của repo bên ngoài.

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

## Kiểm thử

- **Backend unit & integration tests**:
  ```sh
  docker compose run --rm --no-deps -e SYNC_SCHEDULER_ENABLED=false -v "$(pwd)/backend/tests:/app/tests:ro" backend python -m unittest discover -s tests -v
  ```
- **Frontend build & typecheck**:
  ```sh
  cd frontend && npm ci && npm run build && npm run typecheck
  ```

## Kiến trúc Modular Monolith & Tài liệu

- [docs/ROADMAP.md](docs/ROADMAP.md)
- [docs/STATUS.md](docs/STATUS.md)
- [docs/M1_MOCHI_ANALYSIS.md](docs/M1_MOCHI_ANALYSIS.md)
- [docs/MODULE_CONTRACTS.md](docs/MODULE_CONTRACTS.md)
- [modules/README.md](modules/README.md)
