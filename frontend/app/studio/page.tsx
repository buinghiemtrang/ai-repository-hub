import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Cpu,
  Film,
  Image as ImageIcon,
  Layers,
  Mic,
  Newspaper,
  PlugZap,
  Sparkles,
  Wand2,
  Workflow,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface StudioToolCard {
  key: string;
  name: string;
  tagline: string;
  description: string;
  status: "active" | "planned";
  badge: string;
  icon: typeof Film;
  href: string;
  cta: string;
  capabilities: string[];
  backendSlice: string;
}

const STUDIO_TOOLS: StudioToolCard[] = [
  {
    key: "repos",
    name: "Thư viện Repository AI",
    tagline: "Đã hoạt động · Module 1",
    description:
      "Danh mục 487+ repository AI mã nguồn mở kèm hướng dẫn cài đặt tiếng Việt đối chiếu trực tiếp từ GitHub.",
    status: "active",
    badge: "Đang chạy",
    icon: BookOpen,
    href: "/",
    cta: "Mở Thư viện",
    capabilities: ["Tìm kiếm không dấu", "Lọc danh mục & ngôn ngữ", "Đồng bộ GitHub API"],
    backendSlice: "backend/app/repositories/",
  },
  {
    key: "news",
    name: "Tin tức AI & Mục Repo",
    tagline: "Đã hoạt động · Module 2",
    description:
      "Bản tin AI tổng hợp theo ngày/tuần, mục Repo nổi bật từ thư viện, lọc đa chiều và trình đọc Podcast/TTS tiếng Việt.",
    status: "active",
    badge: "Đang chạy",
    icon: Newspaper,
    href: "/news",
    cta: "Đọc Tin tức",
    capabilities: ["Mục Repo & 8 chuyên mục AI", "Bản tin tuần & 7 ngày", "Podcast TTS trình duyệt"],
    backendSlice: "backend/app/news/",
  },
  {
    key: "video",
    name: "Tạo Video AI & Timeline",
    tagline: "Lộ trình mở rộng · kiểu sangtao.ai",
    description:
      "Không gian dựng video từ ý tưởng/kịch bản: video giải thích, hoạt hình cắt giấy, voiceover ngắn và timeline chỉnh từng cảnh.",
    status: "planned",
    badge: "Sắp mở",
    icon: Film,
    href: "/?q=video",
    cta: "Xem Repo Video AI",
    capabilities: ["Kịch bản → Scene", "Timeline & Keyframe", "Render hàng loạt"],
    backendSlice: "backend/app/video_studio/",
  },
  {
    key: "image",
    name: "Tạo Ảnh AI & Thiết kế hàng loạt",
    tagline: "Lộ trình mở rộng · kiểu sangtao.ai",
    description:
      "Sinh ảnh sản phẩm, tách nền PNG, làm lại mẫu POD và tạo bộ ảnh đồng bộ theo Brand Kit hoặc bảng dữ liệu.",
    status: "planned",
    badge: "Sắp mở",
    icon: ImageIcon,
    href: "/?q=image",
    cta: "Xem Repo Ảnh AI",
    capabilities: ["Tạo ảnh hàng loạt", "Brand Kit dùng chung", "So sánh chi phí model"],
    backendSlice: "backend/app/image_studio/",
  },
  {
    key: "voice",
    name: "Voiceover & Podcast Studio",
    tagline: "Lộ trình mở rộng",
    description:
      "Chuyển văn bản thành giọng đọc tiếng Việt/đa ngôn ngữ với nhiều hồ sơ giọng, kiểm soát nhịp đọc và xuất audio cho video.",
    status: "planned",
    badge: "M7",
    icon: Mic,
    href: "/news",
    cta: "Thử TTS trên Tin tức",
    capabilities: ["Giọng đọc đa vùng", "Tạo audio theo batch", "Đồng bộ phụ đề"],
    backendSlice: "backend/app/voice_studio/",
  },
  {
    key: "flows",
    name: "Flows & Tự động hóa lịch đăng",
    tagline: "Lộ trình mở rộng · M7",
    description:
      "Kết nối các bước tạo nội dung thành pipeline tự động: lấy tin/repo -> tóm tắt -> tạo ảnh/video -> lên lịch xuất bản.",
    status: "planned",
    badge: "M7",
    icon: Workflow,
    href: "/?category=Workflow+%26+T%E1%BB%B1+%C4%91%E1%BB%99ng+h%C3%B3a",
    cta: "Xem Repo Workflow",
    capabilities: ["Pipeline nhiều bước", "Chạy theo lịch", "Webhook & API"],
    backendSlice: "backend/app/workflows/",
  },
  {
    key: "mcp",
    name: "MCP Registry & AI Skills",
    tagline: "Lộ trình mở rộng · M7",
    description:
      "Quản lý máy chủ Model Context Protocol (stdio/HTTP) và thư viện SKILL.md cho Claude Code, Codex, Gemini CLI.",
    status: "planned",
    badge: "M7",
    icon: PlugZap,
    href: "/?category=Claude+Skills",
    cta: "Xem Repo Skills",
    capabilities: ["Schema biến môi trường", "Gắn repo nguồn", "Chuẩn tương thích agent"],
    backendSlice: "backend/app/mcp/",
  },
  {
    key: "models",
    name: "Models Cục bộ & API Router",
    tagline: "Lộ trình mở rộng · M7",
    description:
      "Theo dõi mô hình mở (Ollama, GGUF, vLLM) và cấu hình định tuyến nhà cung cấp API an toàn qua biến môi trường backend.",
    status: "planned",
    badge: "M7",
    icon: Cpu,
    href: "/?category=Ch%E1%BA%A1y+AI+c%E1%BB%A5c+b%E1%BB%99",
    cta: "Xem Repo Local AI",
    capabilities: ["Ước lượng VRAM", "Context window", "Cấu hình provider an toàn"],
    backendSlice: "backend/app/models/",
  },
];

export default async function StudioPage({
  searchParams,
}: {
  searchParams: Promise<{ tool?: string }>;
}) {
  const { tool } = await searchParams;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      {/* Studio Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-6 text-white shadow-lg sm:p-8">
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-500/15 px-3 py-1 text-xs font-semibold text-teal-200">
            <Sparkles className="size-3.5" />
            AI Workspace Hub · Kiến trúc mở rộng
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
            Một không gian thống nhất cho Repo, Tin tức AI và các công cụ Sáng tạo tương lai
          </h1>
          <p className="text-sm leading-relaxed text-slate-300 sm:text-base">
            Giao diện mới tổ chức theo dạng Studio + Sidebar để bạn gắn thêm các công cụ tạo Video AI, Ảnh AI, Voiceover, Flows tự động và MCP mà không phá vỡ cấu trúc hiện tại.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Button asChild className="bg-teal-500 text-slate-950 hover:bg-teal-400">
              <Link href="/news">
                <Newspaper className="size-4" />
                Mở Tin tức AI & Repo
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-slate-700 bg-slate-800/60 text-white hover:bg-slate-800"
            >
              <Link href="/">
                <BookOpen className="size-4" />
                Duyệt Thư viện Repo
              </Link>
            </Button>
          </div>
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 size-80 rounded-full bg-teal-500/20 blur-3xl"
        />
      </section>

      {/* Architecture Principle Strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
            <Layers className="size-4" />
            1. Feature Slice Độc Lập
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Mỗi công cụ AI mới có router FastAPI, service, Alembic migration và route Next.js riêng dưới <code className="font-mono">/studio/&lt;tool&gt;</code>.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
            <Wand2 className="size-4" />
            2. Liên kết Tài nguyên Sẵn có
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            Tin tức, Video Studio hay Workflows có thể tham chiếu thẳng tới <code className="font-mono">repositories.id</code> và dùng chung PostgreSQL.
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
            <Workflow className="size-4" />
            3. Mở rộng Từng Bước An Toàn
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
            API key của mô hình AI chỉ lưu ở backend <code className="font-mono">.env</code>; mọi thao tác ghi/chạy job đều yêu cầu xác thực.
          </p>
        </Card>
      </section>

      {/* Studio Tool Grid */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Danh mục Công cụ & Phân hệ AI
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Các module đang hoạt động sẵn sàng dùng ngay; các thẻ công cụ sáng tạo đã đặt sẵn vị trí tích hợp.
            </p>
          </div>
          <Link
            href="/modules"
            className="inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
          >
            Xem hợp đồng kỹ thuật M7
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STUDIO_TOOLS.map((item) => {
            const Icon = item.icon;
            const highlighted = tool === item.key;
            return (
              <Card
                key={item.key}
                className={`card-lift flex flex-col justify-between p-5 ${
                  highlighted
                    ? "ring-2 ring-teal-500 dark:ring-teal-400"
                    : ""
                }`}
              >
                <div>
                  <CardHeader className="p-0 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`flex size-10 items-center justify-center rounded-xl ${
                          item.status === "active"
                            ? "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        <Icon className="size-5" />
                      </div>
                      <Badge variant={item.status === "active" ? "accent" : "secondary"}>
                        {item.badge}
                      </Badge>
                    </div>
                    <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">
                      {item.name}
                    </h3>
                    <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {item.tagline}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 p-0">
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                    <ul className="space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {item.capabilities.map((cap) => (
                        <li key={cap} className="flex items-center gap-1.5">
                          <span className="size-1 rounded-full bg-teal-500" />
                          {cap}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="truncate font-mono text-[10px] text-slate-400 dark:text-slate-500">
                    {item.backendSlice}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant={item.status === "active" ? "default" : "outline"}
                    className="w-full justify-between"
                  >
                    <Link href={item.href}>
                      <span>{item.cta}</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
