# M2: Báo cáo thu thập, xác minh độ phủ và biên soạn catalog

Ngày hoàn tất: 2026-11-25  
Nguồn discovery công khai: `https://mochistudio.io.vn/repo` (đã đối chiếu `robots.txt`: `Allow: /`, `Content-Signal: search=yes,ai-train=no,use=reference`)

## 1. Kết quả discovery và xác minh độ phủ

- Tổng số mục công bố trên listing trang 1: **487** (41 trang, 12 mục/trang, trang 41 có 7 mục).
- Số trang danh sách đã đọc: **41/41** (`delay = 2s`, `follow_redirects = False`).
- Số trang chi tiết đã kiểm tra: **487/487** (`coverage_verified = True`).
- Lỗi crawl / trang thiếu liên kết GitHub: **0**.
- Chỉ trích xuất liên kết GitHub chuẩn (`full_name`), tên danh mục công khai và `source_urls`; không sao chép văn bản biên tập hoặc HTML hướng dẫn từ trang tham khảo.

## 2. Xác minh qua GitHub API & loại trùng lặp

- Toàn bộ **487/487** repository đã được xác minh qua GitHub REST API (`/repos/{full_name}` và `/repos/{full_name}/readme`).
- Xử lý chuyển hướng tên repository: `OpenBB-finance/OpenBB` (HTTP `301`) được tự động phân giải về tên chuẩn hiện tại `openbq-org/OpenBB`.
- Kiểm tra trùng lặp theo `github_id` ổn định: **487 `github_id` duy nhất**, **0** bản ghi trùng lặp, **0** repository private, **0** lỗi import.
- Tổng số bản ghi trong PostgreSQL sau import: **487** (`inserted=479`, cập nhật hợp nhất `8` seed khởi tạo).
- Phân bố: **18** danh mục, **21** ngôn ngữ lập trình chính.

## 3. Biên soạn mô tả & hướng dẫn tiếng Việt

- **487/487** repository đều có mô tả tiếng Việt gốc (`description_vi`) biên soạn dựa trên `description` và `README.md` từ GitHub upstream, không bịa đặt metadata.
- **487/487** repository được tổng hợp hướng dẫn tham khảo tiếng Việt (`guide_vi`) từ cấu trúc `README.md` upstream (Tổng quan, Điểm nổi bật, Yêu cầu, Lệnh cài đặt tham khảo, Ví dụ sử dụng, Liên kết gốc), đi kèm cảnh báo không tự động thực thi mã nguồn bên ngoài.
