# AI Repository Hub

Nền tảng cá nhân, mở rộng theo module AI. Module đầu tiên: Repository Library. Tham khảo hành vi công khai của Mochi Studio, không sao chép mã nguồn hoặc thương hiệu.

## Chạy trên Linux / Windows

Cần Git và Docker Compose v2 (Windows: Docker Desktop, Linux containers).

```sh
git clone https://github.com/buinghiemtrang/ai-repository-hub.git
cd ai-repository-hub
docker compose up --build
```

Mở http://localhost:3000; API docs http://localhost:8000/docs. Compose chỉ publish trên loopback. Dữ liệu PostgreSQL giữ trong named volume. Mật khẩu mặc định chỉ dùng cho localhost development. Tùy chọn sao chép .env.example thành .env và sửa cấu hình trước khi chạy.

Đồng bộ metadata GitHub của các repo đã nhập:
```sh
docker compose exec backend python -m app.repositories.sync
```
Token GitHub tùy chọn trong .env, không commit. Không chạy lệnh cài đặt từ README tự động.

## Git workflow

git pull trước khi làm việc; commit và push sau khi hoàn thành. Mỗi máy có volume database riêng; Git không đồng bộ database. Không commit .env, token hoặc database dumps.

## Trạng thái

M0/MVP khởi tạo: danh sách seed thủ công, tìm kiếm, bộ lọc, sort, phân trang 12 mục, trang chi tiết, yêu thích trên trình duyệt, CLI đồng bộ metadata. Chưa chạy build/test thực tế. Chưa thu thập đầy đủ catalog Mochi Studio, chưa chạy REA, chưa có lịch đồng bộ, chưa thiết lập shadcn/ui, chưa có Alembic migrations. Không có số stars/forks giả; dữ liệu ban đầu null tới khi sync. Xem docs/ROADMAP.md.
