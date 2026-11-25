"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
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
import { BrandLogoBadge } from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_EASE } from "@/components/prototypes/vellum/tokens";

interface VellumStudioWorkspaceProps {
  initialTool?: string;
}

interface WorkbenchTool {
  key: string;
  name: string;
  badge: string;
  icon: typeof Film;
  brandIcon: { src: string; label: string; inkInvertDark?: boolean };
  headline: string;
  diagramLanes: string[];
  stages: { title: string; sample: string }[];
  exploreHref: string;
  exploreLabel: string;
}

const WORKSPACES: WorkbenchTool[] = [
  {
    key: "video",
    name: "Video AI & Timeline",
    badge: "Demo UI · Sắp mở",
    icon: Film,
    brandIcon: { src: "/icons/livekit.svg", label: "Video Pipeline" },
    headline: "Chuyển kịch bản & bản tin AI thành video ngắn có timeline chỉnh từng cảnh.",
    diagramLanes: ["Phân cảnh 16:9", "Voiceover VI", "Phụ đề đồng bộ"],
    stages: [
      {
        title: "01. Nhập kịch bản / chọn tin",
        sample: "Đầu vào: Bài viết từ Tạp chí Tin tức hoặc tóm tắt README repo nổi bật.",
      },
      {
        title: "02. Chia phân cảnh & tạo hình",
        sample: "Xử lý: Tách 4–6 khung hình theo nhịp câu, xem trước tỷ lệ 16:9 / 9:16.",
      },
      {
        title: "03. Ghép Voiceover tiếng Việt",
        sample: "Đầu ra dự kiến: Script + Timeline storyboard sẵn sàng xuất file.",
      },
    ],
    exploreHref: "/?q=video",
    exploreLabel: "Xem Repo Video AI trong thư viện",
  },
  {
    key: "image",
    name: "Ảnh AI & Brand Kit",
    badge: "Demo UI · Sắp mở",
    icon: ImageIcon,
    brandIcon: { src: "/icons/midjourney.svg", label: "Image Studio", inkInvertDark: true },
    headline: "Tạo bộ ảnh sản phẩm, tách nền PNG và đồng bộ Brand Kit cho từng kênh.",
    diagramLanes: ["Tách nền PNG", "Mockup sản phẩm", "Chuẩn WebP"],
    stages: [
      {
        title: "01. Chọn Brand Kit & kích thước",
        sample: "Đầu vào: Bảng màu Vellum (#F7F4ED / #C84B24) & tỷ lệ 1:1 / 16:9.",
      },
      {
        title: "02. Chạy batch theo danh sách",
        sample: "Xử lý: Hàng đợi nhiều biến thể, kiểm soát nhất quán phong cách.",
      },
      {
        title: "03. Xuất PNG/WebP tối ưu",
        sample: "Đầu ra dự kiến: Bộ asset nén gọn gắn thẻ nguồn & metadata.",
      },
    ],
    exploreHref: "/?q=image",
    exploreLabel: "Xem Repo Ảnh AI trong thư viện",
  },
  {
    key: "voice",
    name: "Voiceover & Podcast Studio",
    badge: "Lộ trình M7",
    icon: Mic,
    brandIcon: { src: "/icons/elevenlabs.svg", label: "ElevenLabs", inkInvertDark: true },
    headline: "Chuyển văn bản thành giọng đọc tiếng Việt đa vùng và đồng bộ phụ đề cho video.",
    diagramLanes: ["Giọng đọc Nam/Nữ", "Xuất Audio MP3", "File phụ đề SRT"],
    stages: [
      {
        title: "01. Chọn bài tin hoặc kịch bản",
        sample: "Đầu vào: Văn bản chuẩn tiếng Việt từ Tạp chí Tin tức hoặc bản nháp.",
      },
      {
        title: "02. Hiệu chỉnh nhịp & tốc độ",
        sample: "Xử lý: Kiểm soát tốc độ 0.75×–2×, ngắt câu tự nhiên theo dấu câu.",
      },
      {
        title: "03. Xuất track audio & phụ đề",
        sample: "Đầu ra dự kiến: Bản thu giọng đọc & timeline khớp từng câu.",
      },
    ],
    exploreHref: "/news",
    exploreLabel: "Thử Podcast TTS trên Tin tức",
  },
  {
    key: "flows",
    name: "Flows & Tự động hóa",
    badge: "Lộ trình M7",
    icon: Workflow,
    brandIcon: { src: "/icons/dify.svg", label: "Workflow Engine" },
    headline: "Kết nối Catalog GitHub, Bản tin AI và công cụ sáng tạo thành chuỗi chạy tự động.",
    diagramLanes: ["Lọc GitHub Stars", "Tóm tắt tiếng Việt", "Xuất Digest"],
    stages: [
      {
        title: "01. Trigger: Lịch định kỳ",
        sample: "Đầu vào: Đồng bộ RSS công khai & metadata GitHub theo chu kỳ.",
      },
      {
        title: "02. Step: Phân loại & chấm điểm",
        sample: "Xử lý: Gắn nhãn chuyên mục, loại bỏ trùng lặp và tạo tóm tắt.",
      },
      {
        title: "03. Action: Xuất báo cáo",
        sample: "Đầu ra dự kiến: Bản tin ngày & danh sách repo cần chú ý.",
      },
    ],
    exploreHref: "/?category=Workflow+%26+T%E1%BB%B1+%C4%91%E1%BB%99ng+h%C3%B3a",
    exploreLabel: "Xem Repo Workflow trong thư viện",
  },
  {
    key: "mcp",
    name: "MCP Registry & AI Skills",
    badge: "Lộ trình M7",
    icon: PlugZap,
    brandIcon: { src: "/icons/mcp.svg", label: "MCP", inkInvertDark: true },
    headline: "Quản lý server Model Context Protocol và đặc tả SKILL.md dùng chung cho coding agent.",
    diagramLanes: ["Claude Code", "OpenAI Codex", "Gemini CLI"],
    stages: [
      {
        title: "01. Transport: stdio / HTTP",
        sample: "Đầu vào: Khai báo MCP server chuẩn không lưu khóa bí mật.",
      },
      {
        title: "02. Skill Spec: SKILL.md",
        sample: "Xử lý: Kiểm tra quyền tối thiểu & hướng dẫn ngữ cảnh cho agent.",
      },
      {
        title: "03. Đồng bộ đa agent",
        sample: "Đầu ra dự kiến: Một bộ kỹ năng dùng thống nhất trên Linux & Windows.",
      },
    ],
    exploreHref: "/?category=Claude+Skills",
    exploreLabel: "Xem Repo Skills & MCP",
  },
  {
    key: "models",
    name: "Models Cục bộ & API Router",
    badge: "Lộ trình M7",
    icon: Cpu,
    brandIcon: { src: "/icons/ollama.svg", label: "Ollama", inkInvertDark: true },
    headline: "Theo dõi mô hình chạy offline (Ollama, GGUF, vLLM) và đối chiếu mức VRAM phù hợp.",
    diagramLanes: ["Ollama Runtime", "vLLM Server", "GGUF Quant"],
    stages: [
      {
        title: "01. Kiểm tra phần cứng cục bộ",
        sample: "Đầu vào: Tham chiếu thông số GPU/RAM & chuẩn lượng tử hóa GGUF.",
      },
      {
        title: "02. Chọn model theo tác vụ",
        sample: "Xử lý: Coding, tóm tắt tài liệu tiếng Việt hoặc trích xuất cấu trúc.",
      },
      {
        title: "03. Kết nối endpoint nội bộ",
        sample: "Đầu ra dự kiến: Endpoint chuẩn OpenAI-compatible dùng trong nội bộ.",
      },
    ],
    exploreHref: "/?category=Ch%E1%BA%A1y+AI+c%E1%BB%A5c+b%E1%BB%99",
    exploreLabel: "Xem Repo Chạy AI cục bộ",
  },
];

const DIRECTORY_CARDS = [
  {
    key: "repos",
    name: "Thư viện Repository AI",
    tagline: "Module 1 · Đang hoạt động",
    description:
      "Danh mục repo AI mã nguồn mở kèm hướng dẫn cài đặt tiếng Việt đối chiếu trực tiếp từ GitHub.",
    active: true,
    badge: "Đang chạy",
    icon: BookOpen,
    href: "/",
    cta: "Mở Thư viện",
    capabilities: ["Tìm kiếm không dấu", "Lọc danh mục & ngôn ngữ", "Đồng bộ GitHub API"],
  },
  {
    key: "news",
    name: "Tạp chí Tin tức AI & Repo",
    tagline: "Module 2 · Đang hoạt động",
    description:
      "Bản tin AI tổng hợp theo ngày/tuần, mục Repo nổi bật từ thư viện, lọc đa chiều và trình phát Podcast TTS.",
    active: true,
    badge: "Đang chạy",
    icon: Newspaper,
    href: "/news",
    cta: "Đọc Tin tức",
    capabilities: ["Mục Repo & chuyên mục AI", "Bản tin tuần & 7 ngày", "Podcast TTS trình duyệt"],
  },
  {
    key: "video",
    name: "Tạo Video AI & Timeline",
    tagline: "Demo UI · Giai đoạn tiếp theo",
    description:
      "Không gian dựng video từ ý tưởng/kịch bản: video giải thích, voiceover ngắn và timeline chỉnh từng cảnh.",
    active: false,
    badge: "Sắp mở",
    icon: Film,
    href: "/?q=video",
    cta: "Xem Repo Video AI",
    capabilities: ["Kịch bản -> Scene", "Timeline & Keyframe", "Render hàng loạt"],
  },
  {
    key: "image",
    name: "Tạo Ảnh AI & Brand Kit",
    tagline: "Demo UI · Giai đoạn tiếp theo",
    description:
      "Sinh ảnh sản phẩm, tách nền PNG, làm lại mẫu và tạo bộ ảnh đồng bộ theo Brand Kit dùng chung.",
    active: false,
    badge: "Sắp mở",
    icon: ImageIcon,
    href: "/?q=image",
    cta: "Xem Repo Ảnh AI",
    capabilities: ["Tạo ảnh hàng loạt", "Brand Kit dùng chung", "Chuẩn PNG / WebP"],
  },
  {
    key: "voice",
    name: "Voiceover & Podcast Studio",
    tagline: "Lộ trình mở rộng M7",
    description:
      "Chuyển văn bản thành giọng đọc tiếng Việt/đa ngôn ngữ với nhiều hồ sơ giọng và xuất audio cho video.",
    active: false,
    badge: "M7",
    icon: Mic,
    href: "/news",
    cta: "Thử TTS trên Tin tức",
    capabilities: ["Giọng đọc đa vùng", "Tạo audio theo batch", "Đồng bộ phụ đề"],
  },
  {
    key: "flows",
    name: "Flows & Tự động hóa",
    tagline: "Lộ trình mở rộng M7",
    description:
      "Kết nối các bước tạo nội dung thành pipeline tự động: lấy tin/repo -> tóm tắt -> xuất báo cáo.",
    active: false,
    badge: "M7",
    icon: Workflow,
    href: "/?category=Workflow+%26+T%E1%BB%B1+%C4%91%E1%BB%99ng+h%C3%B3a",
    cta: "Xem Repo Workflow",
    capabilities: ["Pipeline nhiều bước", "Chạy theo lịch", "Tích hợp an toàn"],
  },
  {
    key: "mcp",
    name: "MCP Registry & AI Skills",
    tagline: "Lộ trình mở rộng M7",
    description:
      "Quản lý máy chủ Model Context Protocol (stdio/HTTP) và thư viện SKILL.md cho Claude Code, Codex, Gemini.",
    active: false,
    badge: "M7",
    icon: PlugZap,
    href: "/?category=Claude+Skills",
    cta: "Xem Repo Skills",
    capabilities: ["Schema biến môi trường", "Gắn repo nguồn", "Chuẩn tương thích agent"],
  },
  {
    key: "models",
    name: "Models Cục bộ & API Router",
    tagline: "Lộ trình mở rộng M7",
    description:
      "Theo dõi mô hình mở (Ollama, GGUF, vLLM) và cấu hình định tuyến model an toàn qua biến môi trường.",
    active: false,
    badge: "M7",
    icon: Cpu,
    href: "/?category=Ch%E1%BA%A1y+AI+c%E1%BB%A5c+b%E1%BB%99",
    cta: "Xem Repo Local AI",
    capabilities: ["Ước lượng VRAM", "Context window", "Endpoint cục bộ"],
  },
];

const ECOSYSTEM_TOOLS = [
  { name: "Claude Code", role: "Coding Agent", icon: { src: "/icons/claude-code.svg", label: "Claude Code" }, q: "claude" },
  { name: "OpenAI Codex", role: "Agent & API", icon: { src: "/icons/codex.svg", label: "Codex", inkInvertDark: true }, q: "openai" },
  { name: "Cursor", role: "AI Code Editor", icon: { src: "/icons/cursor.svg", label: "Cursor", inkInvertDark: true }, q: "cursor" },
  { name: "Ollama", role: "Local LLM Runtime", icon: { src: "/icons/ollama.svg", label: "Ollama", inkInvertDark: true }, q: "ollama" },
  { name: "Dify", role: "LLM Workflow", icon: { src: "/icons/dify.svg", label: "Dify" }, q: "dify" },
  { name: "ElevenLabs", role: "Voice & Audio", icon: { src: "/icons/elevenlabs.svg", label: "ElevenLabs", inkInvertDark: true }, q: "voice" },
  { name: "LangChain", role: "Agent Framework", icon: { src: "/icons/langchain.svg", label: "LangChain", inkInvertDark: true }, q: "langchain" },
  { name: "Hugging Face", role: "Open Models", icon: { src: "/icons/hugging-face.svg", label: "Hugging Face" }, q: "huggingface" },
];

export function VellumStudioWorkspace({ initialTool }: VellumStudioWorkspaceProps) {
  const [activeKey, setActiveKey] = useState(
    WORKSPACES.some((w) => w.key === initialTool) ? initialTool! : "video"
  );
  const [stageIdx, setStageIdx] = useState(0);

  const current = WORKSPACES.find((w) => w.key === activeKey) || WORKSPACES[0];
  const activeStage = current.stages[stageIdx] || current.stages[0];

  const handleSelectWorkspace = (key: string) => {
    setActiveKey(key);
    setStageIdx(0);
  };

  return (
    <div className="mx-auto max-w-7xl min-w-0 space-y-8 px-3 py-6 sm:px-6 lg:py-8">
      {/* Studio Masthead */}
      <section className="flex min-w-0 flex-wrap items-end justify-between gap-4 border-b border-[var(--v-rule)] pb-5">
        <div className="min-w-0 max-w-3xl space-y-2">
          <div className="font-telemetry text-[11px] font-medium uppercase tracking-widest text-[var(--v-accent)]">
            AI Workspace Hub · Kiến trúc mở rộng
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight text-[var(--v-ink)] sm:text-4xl">
            Xưởng Công cụ AI &amp; Quy trình Sáng tạo
          </h1>
          <p className="text-sm leading-relaxed text-[var(--v-muted)]">
            Không gian hợp nhất Thư viện Repo, Tạp chí Tin tức AI và các phân hệ sáng tạo tương lai (Video AI, Ảnh AI, Voiceover, Flows, MCP) trên cùng nền tảng Modular Monolith.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-1">
            <Link
              href="/news"
              className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-[var(--v-accent)] px-4 py-2 text-xs font-medium text-[var(--v-accent-ink)] transition-opacity hover:opacity-90 sm:min-h-0"
            >
              <Newspaper className="size-3.5" />
              Mở Tin tức AI &amp; Repo
            </Link>
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] px-4 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0"
            >
              <BookOpen className="size-3.5" />
              Duyệt Thư viện Repo
            </Link>
          </div>
        </div>

        <span className="font-telemetry inline-flex max-w-full items-center gap-1.5 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] px-3 py-1.5 text-[11px] text-[var(--v-muted)]">
          <Sparkles className="size-3.5 shrink-0 text-[var(--v-accent)]" />
          <span className="truncate sm:whitespace-normal">
            Chế độ Demo UI quy trình — công cụ mở rộng cần phê duyệt &amp; cấu hình API
          </span>
        </span>
      </section>

      {/* Architecture Principles Strip */}
      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
          <div className="font-telemetry flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[var(--v-accent)]">
            <Layers className="size-3.5" />
            1. Feature Slice Độc Lập
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--v-muted)]">
            Mỗi công cụ AI mới có API, service, schema cơ sở dữ liệu và giao diện riêng tách biệt, dễ bảo trì và nâng cấp.
          </p>
        </div>
        <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
          <div className="font-telemetry flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[var(--v-accent)]">
            <Wand2 className="size-3.5" />
            2. Liên kết Tài nguyên Sẵn có
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--v-muted)]">
            Tin tức, Video Studio hay Workflows có thể tham chiếu thẳng tới mục Repository đã kiểm duyệt trong thư viện.
          </p>
        </div>
        <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
          <div className="font-telemetry flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-[var(--v-accent)]">
            <Workflow className="size-3.5" />
            3. Mở rộng Từng Bước An Toàn
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--v-muted)]">
            API key của mô hình AI chỉ lưu an toàn ở phía server; mọi thao tác ghi hoặc đồng bộ đều có kiểm soát quyền.
          </p>
        </div>
      </section>

      {/* Interactive Workbench */}
      <section
        id="workbench"
        className="grid min-w-0 overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] lg:grid-cols-12"
      >
        {/* Left Navigation */}
        <div className="min-w-0 divide-y divide-[var(--v-rule)] border-b border-[var(--v-rule)] lg:col-span-4 lg:border-r lg:border-b-0">
          {WORKSPACES.map((ws) => {
            const Icon = ws.icon;
            const active = ws.key === activeKey;
            return (
              <button
                key={ws.key}
                type="button"
                onClick={() => handleSelectWorkspace(ws.key)}
                className={`relative flex min-h-11 w-full items-start gap-3 p-4 text-left transition-colors duration-150 ${
                  active ? "bg-[var(--v-accent-soft)]" : "hover:bg-[var(--v-bg)]/60"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="studio-workbench-bar"
                    transition={{ duration: 0.22, ease: VELLUM_EASE }}
                    className="absolute top-0 bottom-0 left-0 w-[3px] bg-[var(--v-accent)]"
                  />
                )}
                <Icon
                  className={`mt-0.5 size-4 shrink-0 ${
                    active ? "text-[var(--v-accent)]" : "text-[var(--v-muted)]"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--v-ink)]">{ws.name}</span>
                    <span className="font-telemetry shrink-0 text-[10px] text-[var(--v-muted)]">
                      {ws.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Canvas Preview */}
        <div className="min-w-0 p-4 sm:p-6 lg:col-span-8 lg:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: VELLUM_EASE }}
              className="flex h-full flex-col justify-between space-y-5"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <BrandLogoBadge icon={current.brandIcon} size={22} />
                    <span className="font-telemetry text-xs uppercase text-[var(--v-accent)]">
                      {current.name}
                    </span>
                  </div>
                  <span className="font-telemetry rounded-[3px] border border-[var(--v-rule)] px-2 py-0.5 text-[10px] text-[var(--v-muted)]">
                    {current.badge}
                  </span>
                </div>
                <h2 className="font-editorial text-2xl leading-snug font-medium text-[var(--v-ink)]">
                  {current.headline}
                </h2>
              </div>

              {/* Clean Workflow Diagram */}
              <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-4">
                <div className="grid items-center gap-3 sm:grid-cols-12">
                  <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-3 py-2 text-center text-[11px] font-medium text-[var(--v-ink)] sm:col-span-3">
                    Dữ liệu Repo / Tin
                  </div>

                  <div className="hidden justify-center sm:col-span-1 sm:flex">
                    <ArrowRight className="size-4 text-[var(--v-accent)]" />
                  </div>

                  <div className="rounded-[4px] border border-[var(--v-accent)] bg-[var(--v-accent-soft)] px-3 py-2 text-center text-[var(--v-ink)] sm:col-span-4">
                    <div className="font-telemetry text-[10px] font-medium uppercase text-[var(--v-accent)]">
                      Bộ điều phối
                    </div>
                    <div className="text-xs font-medium">{current.name.split("&")[0].trim()}</div>
                  </div>

                  <div className="hidden justify-center sm:col-span-1 sm:flex">
                    <ArrowRight className="size-4 text-[var(--v-accent)]" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    {current.diagramLanes.map((lane) => (
                      <div
                        key={lane}
                        className="truncate rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--v-muted)]"
                      >
                        {lane}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Stages */}
              <div className="space-y-2.5">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {current.stages.map((st, idx) => {
                    const selected = idx === stageIdx;
                    return (
                      <button
                        key={st.title}
                        type="button"
                        onClick={() => setStageIdx(idx)}
                        className={`min-h-11 rounded-[5px] border p-3 text-left transition-colors ${
                          selected
                            ? "border-[var(--v-accent)] bg-[var(--v-surface-alt)]"
                            : "border-[var(--v-rule)] bg-[var(--v-bg)] hover:border-[var(--v-rule-strong)]"
                        }`}
                      >
                        <div className="font-telemetry text-[10px] text-[var(--v-accent)]">
                          BƯỚC 0{idx + 1}
                        </div>
                        <div className="mt-1 text-xs font-medium text-[var(--v-ink)]">
                          {st.title.replace(/^\d+\.\s*/, "")}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-3.5 py-2.5 text-xs text-[var(--v-muted)]">
                  {activeStage.sample}
                </div>
              </div>

              {/* Footer Action */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--v-rule)] pt-4">
                <span className="text-xs text-[var(--v-muted)]">
                  Khám phá ngay các repository mã nguồn mở liên quan trong thư viện.
                </span>
                <Link
                  href={current.exploreHref}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] bg-[var(--v-accent)] px-3.5 py-2 text-xs font-medium text-[var(--v-accent-ink)] transition-transform duration-150 hover:-translate-y-[1px] sm:min-h-0"
                >
                  <span>{current.exploreLabel}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Complete 8-Module Studio Directory */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-editorial text-2xl font-medium tracking-tight text-[var(--v-ink)]">
              Danh mục Công cụ &amp; Phân hệ AI
            </h2>
            <p className="text-sm text-[var(--v-muted)]">
              Các module đang hoạt động sẵn sàng dùng ngay; các phân hệ sáng tạo đã sẵn sàng vị trí tích hợp.
            </p>
          </div>
          <Link
            href="/modules"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--v-accent)] hover:underline"
          >
            Xem kiến trúc Module AI
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {DIRECTORY_CARDS.map((item) => {
            const Icon = item.icon;
            const highlighted = initialTool === item.key;
            return (
              <div
                key={item.key}
                className={`flex flex-col justify-between rounded-[6px] border bg-[var(--v-surface)] p-5 transition-colors ${
                  highlighted
                    ? "border-[var(--v-accent)] ring-2 ring-[var(--v-accent)]/25"
                    : "border-[var(--v-rule)] hover:border-[var(--v-rule-strong)]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className={`flex size-10 items-center justify-center rounded-[5px] border ${
                        item.active
                          ? "border-[var(--v-accent)]/30 bg-[var(--v-accent-soft)] text-[var(--v-accent)]"
                          : "border-[var(--v-rule)] bg-[var(--v-surface-alt)] text-[var(--v-muted)]"
                      }`}
                    >
                      <Icon className="size-5" />
                    </div>
                    <span
                      className={`font-telemetry rounded-[3px] border px-2 py-0.5 text-[10px] font-medium ${
                        item.active
                          ? "border-[var(--v-accent)]/35 bg-[var(--v-accent-soft)] text-[var(--v-accent)]"
                          : "border-[var(--v-rule)] bg-[var(--v-surface-alt)] text-[var(--v-muted)]"
                      }`}
                    >
                      {item.badge}
                    </span>
                  </div>
                  <h3 className="font-editorial mt-3 text-lg font-medium text-[var(--v-ink)]">
                    {item.name}
                  </h3>
                  <div className="font-telemetry text-[11px] text-[var(--v-muted)]">
                    {item.tagline}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[var(--v-muted)]">
                    {item.description}
                  </p>
                  <ul className="mt-3 space-y-1 text-[11px] text-[var(--v-muted)]">
                    {item.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-1.5">
                        <span className="size-1 rounded-full bg-[var(--v-accent)]" />
                        {cap}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 border-t border-[var(--v-rule)] pt-3">
                  <Link
                    href={item.href}
                    className={`flex min-h-11 w-full items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-90 sm:min-h-0 ${
                      item.active
                        ? "border-[var(--v-accent)] bg-[var(--v-accent)] text-[var(--v-accent-ink)]"
                        : "border-[var(--v-rule-strong)] bg-[var(--v-bg)] text-[var(--v-ink)]"
                    }`}
                  >
                    <span>{item.cta}</span>
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Brand Icon Ecosystem Directory */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-[var(--v-accent)]" />
          <h2 className="font-editorial text-xl font-medium text-[var(--v-ink)]">
            Hệ sinh thái công cụ liên kết thư viện
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM_TOOLS.map((t) => (
            <Link
              key={t.name}
              href={`/?q=${encodeURIComponent(t.q)}`}
              className="group flex min-h-11 items-center gap-3 rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-3.5 text-left transition-all duration-150 hover:-translate-y-[2px] hover:border-[var(--v-rule-strong)]"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)]">
                <BrandLogoBadge icon={t.icon} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-[var(--v-ink)] group-hover:underline">
                  {t.name}
                </div>
                <div className="truncate text-xs text-[var(--v-muted)]">{t.role}</div>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-[var(--v-muted)] transition-transform duration-150 group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
