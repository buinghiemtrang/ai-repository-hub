import Link from "next/link";
import { ArrowRight, Boxes, CheckCircle2, Clock } from "lucide-react";

const PLANNED_MODULES = [
  {
    name: "Repository Library",
    status: "Đang hoạt động (Module 1)",
    active: true,
    href: "/",
    cta: "Mở Thư viện",
    scope:
      "Danh mục repo AI mã nguồn mở, tìm kiếm tiếng Việt không dấu, lọc danh mục/ngôn ngữ/yêu thích, đồng bộ GitHub API và hướng dẫn đối chiếu README.",
  },
  {
    name: "News & Repo Feed",
    status: "Đang hoạt động (Module 2)",
    active: true,
    href: "/news",
    cta: "Mở Tin tức",
    scope:
      "Bản tin AI & mục Repo độc lập theo ngày/tuần, thu thập RSS công khai, lọc đa chiều và trình phát Podcast/TTS tiếng Việt.",
  },
  {
    name: "Video & Voiceover Studio",
    status: "Chờ phê duyệt phạm vi (Studio)",
    active: false,
    href: "/studio?tool=video",
    cta: "Xem Demo UI",
    scope:
      "Tạo video giải thích, hoạt hình cắt giấy, voiceover ngắn và chỉnh timeline theo hướng sangtao.ai.",
  },
  {
    name: "Image & POD Design Studio",
    status: "Chờ phê duyệt phạm vi (Studio)",
    active: false,
    href: "/studio?tool=image",
    cta: "Xem Demo UI",
    scope: "Tạo ảnh sản phẩm hàng loạt, tách nền PNG và quản lý Brand Kit.",
  },
  {
    name: "AI Skills & MCP Registry",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    href: "/studio?tool=mcp",
    cta: "Xem lộ trình",
    scope:
      "Quản lý đặc tả skill (SKILL.md), MCP servers (stdio/HTTP), biến môi trường yêu cầu (không lưu secret).",
  },
  {
    name: "Models & Workflows",
    status: "Chờ phê duyệt phạm vi (M7)",
    active: false,
    href: "/studio?tool=models",
    cta: "Xem lộ trình",
    scope:
      "Theo dõi mô hình mở/local (GGUF/Ollama/vLLM), kết hợp pipeline tự động hóa Flows & lịch xuất bản.",
  },
];

export default function ModulesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 lg:py-8">
      <div className="space-y-2 border-b border-[var(--v-rule)] pb-5">
        <div className="font-telemetry inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--v-accent)]">
          <Boxes className="size-3.5" />
          Modular Monolith · Kiến trúc mở rộng
        </div>
        <h1 className="font-editorial text-3xl font-medium tracking-tight text-[var(--v-ink)] sm:text-4xl">
          Kiến trúc mở rộng theo Module AI
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-[var(--v-muted)]">
          Hệ thống áp dụng kiến trúc Modular Monolith: mỗi module sở hữu riêng API router, service, model dữ liệu, migration và UI route. Các công cụ AI Studio tương lai chỉ triển khai khi có phê duyệt phạm vi rõ ràng.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PLANNED_MODULES.map((mod) => (
          <div
            key={mod.name}
            className="flex flex-col justify-between rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5 transition-colors hover:border-[var(--v-rule-strong)]"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-editorial text-lg font-medium text-[var(--v-ink)]">
                  {mod.name}
                </h2>
                {mod.active ? (
                  <CheckCircle2 className="size-4 shrink-0 text-[var(--v-accent)]" />
                ) : (
                  <Clock className="size-4 shrink-0 text-[var(--v-muted)]" />
                )}
              </div>
              <span
                className={`font-telemetry mt-2 inline-block rounded-[3px] border px-2 py-0.5 text-[10px] font-medium ${
                  mod.active
                    ? "border-[var(--v-accent)]/35 bg-[var(--v-accent-soft)] text-[var(--v-accent)]"
                    : "border-[var(--v-rule)] bg-[var(--v-surface-alt)] text-[var(--v-muted)]"
                }`}
              >
                {mod.status}
              </span>
              <p className="mt-3 text-sm leading-relaxed text-[var(--v-muted)]">{mod.scope}</p>
            </div>

            <div className="mt-5 border-t border-[var(--v-rule)] pt-3">
              <Link
                href={mod.href}
                className="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium text-[var(--v-accent)] hover:underline sm:min-h-0"
              >
                <span>{mod.cta}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
