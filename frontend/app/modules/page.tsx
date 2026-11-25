import { Boxes, CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PLANNED_MODULES = [
  {
    name: "Repository Library",
    status: "Đang hoạt động (Module 1)",
    active: true,
    scope:
      "Danh mục repo AI mã nguồn mở, tìm kiếm tiếng Việt không dấu, lọc danh mục/ngôn ngữ/yêu thích, đồng bộ GitHub API và hướng dẫn đối chiếu README.",
  },
  {
    name: "AI Skills",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    scope: "Quản lý đặc tả skill (SKILL.md), phân loại theo agent runtime và liên kết repo nguồn.",
  },
  {
    name: "MCP Registry",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    scope: "Danh mục Model Context Protocol servers, transport (stdio/HTTP), biến môi trường yêu cầu (không lưu secret).",
  },
  {
    name: "Models",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    scope: "Theo dõi mô hình mở/local (GGUF/Ollama/vLLM), thông số ngữ cảnh, giấy phép và yêu cầu phần cứng.",
  },
  {
    name: "Tools & Workflows",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    scope: "Liên kết công cụ CLI, workflow tự động hóa và mẫu tích hợp có kiểm chứng.",
  },
  {
    name: "Knowledge Base",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    scope: "Ghi chú kỹ thuật cá nhân và tài liệu đối chiếu gắn với từng repository/module.",
  },
];

export default function ModulesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10 space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700">
          <Boxes className="size-3.5" />
          Modular Monolith · M7 Contracts
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Kiến trúc mở rộng theo Module AI
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-slate-600">
          Hệ thống áp dụng kiến trúc Modular Monolith: mỗi module sở hữu riêng API router, service, model SQLAlchemy, Alembic migration và UI route. Các module tương lai chỉ triển khai khi có phê duyệt phạm vi rõ ràng.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANNED_MODULES.map((mod) => (
          <Card key={mod.name} className="card-lift flex flex-col justify-between p-5">
            <CardHeader className="p-0 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-semibold text-slate-900">{mod.name}</h2>
                {mod.active ? (
                  <CheckCircle2 className="size-4 text-teal-700" />
                ) : (
                  <Clock className="size-4 text-slate-400" />
                )}
              </div>
              <Badge variant={mod.active ? "accent" : "secondary"} className="mt-1 w-fit">
                {mod.status}
              </Badge>
            </CardHeader>
            <CardContent className="p-0 text-sm leading-relaxed text-slate-600">{mod.scope}</CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
