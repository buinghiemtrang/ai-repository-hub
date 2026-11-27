# M7: Hợp đồng mở rộng Modular Monolith cho các module AI tương lai

Tài liệu này chốt ranh giới kiến trúc để mở rộng AI Repository Hub thành nền tảng nhiều module AI mà không cần tách microservice sớm.

## 1. Quy ước cấu trúc thư mục

Mỗi module là một feature slice độc lập:

- **Backend**: `backend/app/<module_name>/`
  - `models.py` — SQLAlchemy models thuộc quyền sở hữu của module
  - `router.py` — FastAPI `APIRouter(prefix="/<module_name>", tags=["<module_name>"])`
  - `service.py` / `sync.py` — business logic, external client, background jobs
  - `tests/test_<module_name>.py` — unit & integration tests riêng
- **Database**:
  - Dùng chung PostgreSQL database nhưng bảng phải có tiền tố hoặc tên rõ ràng theo module (`repositories`, `sync_runs`, tương lai: `ai_skills`, `mcp_servers`, `ai_models`, `workflows`, `knowledge_notes`).
  - Mọi thay đổi schema phải đi qua Alembic migration nối tiếp trên cùng chuỗi revision.
  - Không query trực tiếp vào bảng nội bộ của module khác nếu có thể giao tiếp qua Python service interface của module đó.
- **Frontend**:
  - Routes dưới `frontend/app/<module_name>/`
  - API proxy riêng hoặc explicit allowlist dưới `frontend/app/api/<module_name>/`
  - Components feature-owned dưới `frontend/components/<module_name>/`
  - Dùng chung UI primitives tại `frontend/components/ui/` và `frontend/lib/utils.ts`.

## 2. Quy tắc bảo mật & dữ liệu dùng chung

1. **Secrets & Admin endpoints**: Mọi API key/token chỉ đọc ở backend qua env vars; mọi endpoint ghi/admin (`POST`/`PUT`/`DELETE`) bắt buộc có xác thực (như `X-Admin-Key` với constant-time comparison).
2. **Liên kết an toàn**: Không tự động chạy code/lệnh từ repo bên ngoài; kiểm tra `https://` cho mọi nguồn bên ngoài.
3. **Liên kết giữa các module**: Các module tương lai (ví dụ `ai_skills`, `mcp_servers`, `ai_models`) tham chiếu tới `repositories.id` qua khóa ngoại tùy chọn (`repository_id`) để tái sử dụng catalog repo gốc.

## 3. Lộ trình module chờ phê duyệt phạm vi

- `ai_skills`: Quản lý cấu trúc skill (`SKILL.md`), compatibility tags (Claude Code, Codex, Gemini CLI, OpenCode).
- `mcp`: **Đã triển khai (2026-11-27)**, xem mục 4.
- `models`: Danh mục model mở (Ollama/GGUF/HuggingFace), thông số context window, license, yêu cầu VRAM.
- `tools`: Danh mục CLI/SDK AI và ghi chú tích hợp.
- `workflows`: Mẫu pipeline tự động hóa và trigger contracts.
- `knowledge`: Kho ghi chú cá nhân, bookmark nâng cao và tài liệu đối chiếu.

## 4. Module `mcp` (MCP Registry) — phạm vi đã duyệt

- **Nguồn**: chỉ các repo thuộc danh mục `MCP` (cấu hình `MCP_CATEGORIES`) trong catalog; liên kết `mcp_servers.repository_id` → `repositories.id` (unique, `ON DELETE CASCADE`). Không thêm nguồn ngoài.
- **Bảng**: `mcp_servers` (hồ sơ trích xuất), `mcp_sync_runs` (nhật ký) — migration `0007`.
- **Trích xuất** (`app/mcp/extractor.py`): `server.json` ưu tiên, sau đó khối `mcpServers`/`servers` và lệnh `claude mcp add` trong README. Chỉ parse văn bản; chỉ lưu tên biến env/header; loại lệnh có toán tử shell, tham số dạng mẫu `${...}`; giá trị `-e NAME=value` trong lệnh docker bị cắt còn `-e NAME`.
- **API** (`/mcp`): `GET /servers` (lọc `q`, `transport`, `secret`, `status`, `language`, `sort`, `page`), `GET /servers/{repository_id}` (kèm `client_configs`), `GET /stats`, `GET /sync/status`, `POST /sync/trigger` (bảo vệ bằng `ADMIN_API_KEY` qua `app/admin_auth.py`).
- **Frontend**: `/mcp`, `/mcp/[id]`; proxy allowlist chỉ đọc tại `frontend/app/api/mcp/`.
- **Ngoài phạm vi MVP**: nhập từ Official MCP Registry, tự cài/chạy server, kiểm tra server có hoạt động hay không.
