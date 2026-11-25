# Status

- M0: hoàn tất kiểm chứng runtime Docker Compose (Linux), khóa dependencies (`frontend/package-lock.json`, `backend/requirements.lock`), Alembic migrations, backend unittest (5/5 pass), frontend build/typecheck, CI workflow và `.gitattributes` cho tương thích Linux/Windows.
- M1: đã kiểm tra `robots.txt` (`Allow: /`, `Content-Signal: search=yes,ai-train=no,use=reference`), đánh giá REA CLI `6.8.0`, và phân tích cấu trúc công khai của `mochistudio.io.vn/skills` tại [docs/M1_MOCHI_ANALYSIS.md](M1_MOCHI_ANALYSIS.md). Chưa chạy thu thập đầy đủ catalog (M2).
- M2: discovery/import CLI đang dùng HTML `<a>` parser cũ nên bỏ sót link GitHub nằm trong Next.js RSC payload; cần nâng cấp ở bước M2.
- M3/M4: giao diện cơ bản và trang chi tiết đang ở mức MVP; chưa tích hợp shadcn/ui và chưa biên soạn hướng dẫn cài đặt từ tài liệu gốc.
- M5: đồng bộ metadata thủ công qua CLI; chưa có lịch đồng bộ tự động và nhật ký sync.
- M6: CI đã cấu hình; chưa có sao lưu/khôi phục DB, test E2E và kiểm chứng CI sau lockfiles.
- M7: cấu trúc modular monolith và roadmap đã có; chưa chốt hợp đồng module tương lai.
