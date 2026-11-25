from sqlalchemy.dialects.postgresql import insert
from app.repositories.models import Repository

SEED = [
    ("openclaw/openclaw","AI Agent","Trợ lý AI cá nhân và tích hợp các kênh giao tiếp."),
    ("obra/superpowers","Claude Skills","Quy trình phát triển phần mềm dành cho coding agent."),
    ("anomalyco/opencode","Lập trình","Coding agent trong terminal."),
    ("n8n-io/n8n","Workflow & Tự động hóa","Xây dựng quy trình tự động hóa."),
    ("firecrawl/firecrawl","Dữ liệu cho AI","Chuyển nội dung web thành dữ liệu cho ứng dụng AI."),
    ("tensorflow/tensorflow","Học AI","Thư viện phát triển mô hình học máy."),
    ("ollama/ollama","Chạy AI cục bộ","Chạy mô hình ngôn ngữ trên máy cá nhân."),
    ("langgenius/dify","Workflow & Tự động hóa","Nền tảng xây dựng ứng dụng LLM và RAG."),
]
def seed(db):
    for name, category, description in SEED:
        db.execute(insert(Repository).values(full_name=name,category=category,description_vi=description)
                   .on_conflict_do_nothing(index_elements=["full_name"]))
    db.commit()
