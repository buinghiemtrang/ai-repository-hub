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
- `mcp`: Danh mục MCP server, transport (`stdio`/`http`), schema biến môi trường (không lưu giá trị secret).
- `models`: Danh mục model mở (Ollama/GGUF/HuggingFace), thông số context window, license, yêu cầu VRAM.
- `tools`: Danh mục CLI/SDK AI và ghi chú tích hợp.
- `workflows`: Mẫu pipeline tự động hóa và trigger contracts.
- `knowledge`: Kho ghi chú cá nhân, bookmark nâng cao và tài liệu đối chiếu.
