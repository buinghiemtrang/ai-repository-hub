# AI Repository Hub

Nền tảng cá nhân, mở rộng theo module AI. Module đầu tiên: Repository Library. Tham khảo hành vi công khai của Mochi Studio, không sao chép mã nguồn hoặc thương hiệu.

## Chạy trên Linux / Windows

Cần Git và Docker Compose v2 (Windows: Docker Desktop, Linux containers).

```sh
git clone https://github.com/buinghiemtrang/ai-repository-hub.git
cd ai-repository-hub
docker compose up --build
```

Mở http://localhost:3000; API docs http://localhost:8000/docs. Compose chỉ publish trên loopback. Dữ liệu PostgreSQL giữ trong named volume. Mật khẩu mặc định chỉ dùng cho localhost development. Tùy chọn sao chép .env.example thành .env và sửa cấu hình trước khi chạy. Backend tự áp dụng Alembic migrations khi khởi động.

Đồng bộ metadata GitHub của các repo đã nhập:
```sh
docker compose exec backend python -m app.repositories.sync
```
Token GitHub tùy chọn trong .env, không commit. Không chạy lệnh cài đặt từ README tự động.

Discovery và import catalog: xem [crawler/README.md](crawler/README.md). Chỉ crawl nếu điều khoản cho phép. Dữ liệu discovery là ứng viên, cần xác minh từng repo. 

## Git workflow

git pull trước khi làm việc; commit và push sau khi hoàn thành. Mỗi máy có volume database riêng; Git không đồng bộ database hoặc localStorage. Không commit .env, token hoặc database dumps. Backup database trước khi nâng cấp.

## Trạng thái

MVP đang phát triển: 8 seed thủ công, tìm kiếm tiếng Việt không dấu, lọc danh mục/yêu thích, sort, phân trang 12 mục, chi tiết và nguồn, CLI đồng bộ metadata, discovery và reviewed import, migrations, test source và CI. Chưa xác nhận CI/build/runtime, chưa thu thập đầy đủ catalog Mochi Studio, chưa chạy REA, chưa có lịch đồng bộ, chưa thiết lập shadcn/ui hoặc dependency lockfiles. Không có số stars/forks giả. Xem [docs/STATUS.md](docs/STATUS.md) và [docs/ROADMAP.md](docs/ROADMAP.md).
