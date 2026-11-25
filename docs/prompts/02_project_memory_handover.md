# Project Memory & Cross-platform Session Handover

Phát triển luân phiên trên Linux (máy công ty) và Windows (máy cá nhân), đồng bộ qua GitHub, sử dụng nhiều AI coding agents (Gemini/Antigravity CLI, Claude Code, Codex).

## Yêu cầu lưu trữ ngữ cảnh
Tạo/cập nhật đầy đủ bộ tài liệu Project Memory ở gốc repository và `docs/`:
- `AGENTS.md` (kèm quy trình bắt buộc khôi phục ngữ cảnh đầu phiên & bàn giao cuối phiên)
- `README.md`
- `ARCHITECTURE.md`
- `DESIGN.md`
- `PROJECT_STATUS.md`
- `NEXT_TASK.md`
- `DECISIONS.md`
- `CHANGELOG.md`
- `docs/prompts/` & `docs/design/`

## Trạng thái thiết kế ghi nhớ
- Đã nghiên cứu và áp dụng `Leonxlnx/taste-skill`.
- Đã tạo 3 prototype: P1, P2 và P3.
- Người dùng chọn **P2 — Vellum Editorial** làm nền tảng thiết kế.
- P2 còn các vấn đề: quá nhiều chữ, thiếu hình ảnh, logo, icon, thumbnail và chưa xác minh chất lượng animation.
- Bước tiếp theo: nâng cấp P2 thành **P2.1 — Vellum Digital Editorial** (giữ nguyên P2 để so sánh; chưa thay thế giao diện chính thức cho đến khi người dùng duyệt P2.1; người dùng sẽ cung cấp prompt feedback chi tiết cho P2.1 ở phiên sau).
