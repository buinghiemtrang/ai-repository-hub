# M1: Phân tích chức năng công khai Mochi Studio Skills & đánh giá REA

Ngày kiểm tra: 2026-11-25  
URL tham khảo: `https://mochistudio.io.vn/skills`

## 1. Đánh giá robots.txt và phạm vi thu thập hợp lệ

- `GET https://mochistudio.io.vn/robots.txt` trả về HTTP `200`.
- Chính sách cho `User-agent: *`:
  - `Allow: /`
  - `Content-Signal: search=yes,ai-train=no,use=reference`
- Các bot AI training (`GPTBot`, `ClaudeBot`, `CCBot`, `Google-Extended`, v.v.) bị `Disallow: /`.
- **Nguyên tắc tuân thủ**:
  - Chỉ thu thập liên kết repository công khai (`https://github.com/owner/repo`), tên danh mục công khai và URL nguồn (`source_urls`) để phục vụ mục đích tra cứu/chỉ mục (`search=yes`, `use=reference`).
  - **Không** sao chép nội dung biên tập tiếng Việt hoặc HTML hướng dẫn từ Mochi Studio.
  - **Không** dùng cho huấn luyện mô hình AI; mô tả tiếng Việt và hướng dẫn trong AI Repository Hub được biên soạn mới dựa trên metadata và tài liệu gốc (README/license) từ GitHub.
  - Tôn trọng độ trễ crawl (`delay >= 2s`), `follow_redirects=False`, dừng ngay khi gặp `401/403/429`.

## 2. Đánh giá công cụ REA (`morluto/rea`)

- Hệ thống đã cài đặt sẵn `rea` CLI phiên bản `6.8.0` (`/home/trangbn/.nvm/versions/node/v24.22.1/bin/rea`).
- Qua kiểm tra `rea doctor --client antigravity --json`, CLI hoạt động trực tiếp mà không cần sửa cấu hình MCP toàn cục ngoài phạm vi repo.
- Trang `https://mochistudio.io.vn/skills` và `/skills/<slug>` render SSR (Next.js App Router + RSC payload) đầy đủ danh sách thẻ, bộ lọc danh mục, phân trang và liên kết GitHub trong HTML trả về, do đó crawler tĩnh `httpx` + HTML/RSC parser là đủ, nhẹ và minh bạch hơn chạy headless browser.

## 3. Phân tích cấu trúc công khai của Mochi Studio Skills

### 3.1 Trang danh sách (`/skills`)
- **Phân trang**: 12 mục/trang, hiển thị tổng số mục và `trang X/Y` (tại thời điểm khảo sát: 487 mục trên 41 trang; trang 41 có 7 mục: `40 * 12 + 7 = 487`). Không hardcode 487 làm tổng cố định vì catalog upstream có thể thay đổi.
- **Tìm kiếm (`q`)**: Ô tìm kiếm theo tên, mô tả, danh mục.
- **Sắp xếp (`sort`)**: `stars` (Nhiều sao nhất), `stars-asc` (Ít sao nhất), `newest` (Mới nhất), `oldest` (Cũ nhất).
- **Lọc danh mục (`category`)**: 18 danh mục công khai kèm bộ đếm số lượng từng danh mục (`Mọi danh mục`, `AI Agent`, `Chạy AI cục bộ`, `Claude Skills`, `Dữ liệu cho AI`, `Giáo dục`, `Học AI`, `Kinh doanh & Bán hàng`, `Lập trình`, `Marketing & Nội dung`, `MCP`, `Nghiên cứu & Tìm kiếm`, `Nhân sự & Tuyển dụng`, `Phân tích dữ liệu`, `Tài chính & Kế toán`, `Thiết kế & Sáng tạo`, `Văn phòng & Năng suất`, `Video & Âm thanh`, `Workflow & Tự động hoá`).
- **Thẻ repository**: Danh mục, Stars/Forks/Watchers, tiêu đề + tóm tắt ngắn tiếng Việt, nhãn nguồn GitHub, liên kết chi tiết.

### 3.2 Trang chi tiết (`/skills/<slug>`)
- Hiển thị breadcrumb quay lại danh sách, danh mục, tiêu đề, mô tả, số liệu GitHub (`Star`, `Fork`, `Watch`), liên kết mở repository gốc trên GitHub, và khu vực hướng dẫn cài đặt/sử dụng.
- **Phát hiện kỹ thuật quan trọng cho pipeline discovery (M2)**:
  - Trên trang chi tiết `/skills/<slug>`, nút `Xem trên GitHub ↗` được render qua client component nên không xuất hiện dạng `<a href="https://github.com/...">` trong HTML tĩnh.
  - Thay vào đó, URL GitHub chuẩn nằm trong Next.js RSC payload (`"url":"https://github.com/owner/repo"`), đồng thời danh mục nằm trong thẻ `<a href="/skills?category=...">Category</a>`.
  - Vì vậy `backend/app/repositories/discover.py` cần phân tích cả thẻ `<a>` lẫn RSC payload (cả dạng thường và escaped JSON `\/`) để trích xuất chính xác `full_name`, `category` và `source_urls`, sau đó xác minh lại qua GitHub API và loại trùng theo `github_id` / `full_name`.
