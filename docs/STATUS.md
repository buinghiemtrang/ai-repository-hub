# Status

- **M0 (Hoàn tất)**: Docker Compose Linux/Windows, lockfiles (`frontend/package-lock.json`, `backend/requirements.lock`), `.gitattributes`, Alembic migrations (`0001`–`0007`), CI workflow.
- **M1 (Hoàn tất)**: Đã kiểm tra `robots.txt`, đánh giá REA CLI `6.8.0` và phân tích hành vi công khai Mochi Studio tại [docs/M1_MOCHI_ANALYSIS.md](M1_MOCHI_ANALYSIS.md).
- **M2 (Hoàn tất)**: Đã nâng cấp `discover.py` (hỗ trợ RSC payload, `/repo` & `/skills`, kiểm chứng độ phủ động), thu thập **487/487** repository (`coverage_verified=True`), xác minh qua GitHub API (487 `github_id` duy nhất, xử lý 301 redirect), biên soạn mô tả tiếng Việt & hướng dẫn từ README gốc và import vào PostgreSQL. Xem [docs/M2_CATALOG_REPORT.md](M2_CATALOG_REPORT.md).
- **M3 (Hoàn tất)**: Giao diện Repository Library dùng Next.js 16 + Tailwind CSS v4 + shadcn/ui components (`lucide-react`, `cva`, `clsx`, `tailwind-merge`), tìm kiếm tiếng Việt không dấu (hỗ trợ `đ`/`d`), bộ lọc danh mục kèm bộ đếm, lọc ngôn ngữ, lọc yêu thích, sắp xếp 6 kiểu, đồng bộ URL query và phân trang 12 mục. Bổ sung sau: thiết kế lại typography, thanh lệnh và thẻ repository; dark mode có nút chuyển và khởi tạo SSR không nháy (FOUC-free); banner GitHub (`openGraphImageUrl`) và avatar chủ sở hữu qua `RepoImage.tsx`, có ảnh dự phòng khi thiếu.
- **M4 (Hoàn tất)**: Trang chi tiết `/repositories/[id]` hiển thị metadata thực tế từ GitHub, topics, license, liên kết GitHub/README/homepage, provenance `source_urls` và hướng dẫn tham khảo có nút sao chép khối lệnh an toàn; bố cục 2 cột kèm banner và avatar.
- **M5 (Hoàn tất)**: Dịch vụ đồng bộ metadata dùng chung (`sync.py`, `github_client.py`), lịch nền định kỳ trong FastAPI lifespan (`scheduler.py`), nhật ký `sync_runs`, trang `/sync` và endpoint `POST /repositories/sync/trigger` được bảo vệ bằng `ADMIN_API_KEY`. Bổ sung `sync_images.py`: lấy theo lô `image_url`, `owner_avatar_url`, `has_custom_image` qua GitHub GraphQL (cần `GITHUB_TOKEN`, chỉ nhận URL `https://`), migration `0006_repo_images`.
- **M6 (Hoàn tất)**: 11 backend unit/integration tests pass, `next build` & `tsc --noEmit` pass, GitHub Actions CI (`frontend`, `backend`, `compose`) pass, kiểm chứng Chrome headless DOM và script sao lưu/khôi phục PostgreSQL (`scripts/backup.sh`, `restore.sh`, `backup.ps1`, `restore.ps1`) trên dữ liệu thật 487 repository.
- **M7 (Đang triển khai)**: Đã chốt hợp đồng mở rộng Modular Monolith tại [docs/MODULE_CONTRACTS.md](MODULE_CONTRACTS.md) và trang `/modules`; các module mới chờ phê duyệt phạm vi cụ thể trước khi triển khai.
  - **Module MCP Registry (Hoàn tất MVP, 2026-11-27)**: lấy repo danh mục `MCP` trong catalog, trích xuất transport/cách chạy/biến môi trường (chỉ tên) từ `server.json` và README, mẫu cấu hình Claude Desktop/Claude Code/Cursor, trang `/mcp` và `/mcp/[id]`, đồng bộ định kỳ với nhật ký `mcp_sync_runs`, migration `0007`. Xem [MODULE_CONTRACTS.md](MODULE_CONTRACTS.md) mục 4.

## Kiểm tra gần nhất (2026-11-27, sau module MCP)

- Backend: `python -m unittest discover -s tests` → 19/19 pass trên PostgreSQL 16 cục bộ (gồm 8 test mới trong `tests/test_mcp.py`).
- Frontend: `npx tsc --noEmit` và `npm run build` pass; kiểm tra Chromium headless các trang `/mcp`, `/mcp/[id]`, `/sync`, `/repositories/[id]` (desktop, mobile 390px, dark mode) không có lỗi console và không tràn ngang.
- Đã thử bộ trích xuất trên README/`server.json` thật của 7 repo MCP công khai (GitHub, Playwright, Context7, Notion, Firecrawl, AWS Labs, modelcontextprotocol/servers).
- Chưa kiểm chứng trên dữ liệu catalog 487 repo thật (không có trong môi trường này): cần chạy `python -m app.mcp.sync` sau khi deploy.

## Việc tiếp theo

- Chạy trích xuất MCP trên dữ liệu thật và rà soát các repo `no_config_found`.
- Chọn và phê duyệt phạm vi module M7 tiếp theo (AI Skills, Models, Tools, Workflows hoặc Knowledge).
