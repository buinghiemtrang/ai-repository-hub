"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  Cpu,
  Film,
  Image as ImageIcon,
  Layers,
  PlugZap,
  Sparkles,
  Workflow,
} from "lucide-react";
import { BrandLogoBadge } from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";

interface VellumStudioView22Props {
  theme: VellumTheme;
  dark: boolean;
  initialTool?: string;
  onExploreRepos?: (opts: { q?: string; category?: string }) => void;
}

const WORKSPACES = [
  {
    key: "video",
    name: "Video AI & Timeline",
    badge: "Prototype UI · Sắp mở",
    icon: Film,
    brandIcon: { src: "/icons/livekit.svg", label: "Video Pipeline" },
    headline: "Chuyển kịch bản & bản tin AI thành video ngắn có timeline chỉnh từng cảnh.",
    diagramLanes: ["Phân cảnh 16:9", "Voiceover VI", "Phụ đề đồng bộ"],
    stages: [
      {
        title: "01. Nhập kịch bản / chọn tin",
        sample: "Đầu vào: Bài viết từ Tạp chí Tin hoặc tóm tắt README repo nổi bật.",
      },
      {
        title: "02. Chia phân cảnh & tạo hình",
        sample: "Xử lý: Tự động tách 4–6 khung hình theo nhịp câu, xem trước tỷ lệ 16:9 / 9:16.",
      },
      {
        title: "03. Ghép Voiceover tiếng Việt",
        sample: "Đầu ra dự kiến: Script + Timeline storyboard sẵn sàng xuất file.",
      },
    ],
    explore: { q: "video" },
    exploreLabel: "Xem Repo Video AI trong thư viện",
  },
  {
    key: "image",
    name: "Ảnh AI & Brand Kit",
    badge: "Prototype UI · Sắp mở",
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
    explore: { q: "image" },
    exploreLabel: "Xem Repo Ảnh AI trong thư viện",
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
    explore: { category: "Workflow & Tự động hoá" },
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
    explore: { category: "Claude Skills" },
    exploreLabel: "Xem Repo Skills & MCP",
  },
  {
    key: "models",
    name: "Models Cục bộ (Local LLM)",
    badge: "Lộ trình M7",
    icon: Cpu,
    brandIcon: { src: "/icons/ollama.svg", label: "Ollama", inkInvertDark: true },
    headline: "Theo dõi mô hình chạy offline (Ollama, GGUF, vLLM) và đối chiếu mức VRAM phù hợp.",
    diagramLanes: ["Ollama Runtime", "vLLM Server", "GGUF Quant"],
    stages: [
      {
        title: "01. Kiểm tra phần cứng cục bộ",
        sample: "Đầu vào: Tham chiếu thông số GPU/RAM & chuẩn lượng tử hoá GGUF.",
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
    explore: { category: "Chạy AI cục bộ" },
    exploreLabel: "Xem Repo Chạy AI cục bộ",
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

export function VellumStudioView22({
  theme,
  dark,
  initialTool,
  onExploreRepos,
}: VellumStudioView22Props) {
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
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:py-8">
      {/* Studio Masthead */}
      <section style={{ borderColor: theme.rule }} className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <div
            style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
            className="text-[11px] font-medium uppercase tracking-widest"
          >
            Vellum Creative Workbench · Bản xem trước thiết kế (Chưa kết nối xử lý thật)
          </div>
          <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-3xl font-medium sm:text-4xl">
            Xưởng Công cụ AI Sáng tạo
          </h1>
        </div>
        <span
          style={{
            borderColor: theme.ruleStrong,
            backgroundColor: theme.surface,
            color: theme.muted,
            fontFamily: "var(--font-jetbrains)",
          }}
          className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-[11px]"
        >
          <Sparkles style={{ color: theme.accent }} className="size-3.5" />
          Chế độ minh hoạ quy trình — cần mở khoá API khi triển khai thực tế
        </span>
      </section>

      {/* Workspace Selector + Interactive Canvas & Diagram Preview */}
      <section
        style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
        className="grid overflow-hidden rounded-[6px] border lg:grid-cols-12"
      >
        {/* Left Tool Navigation */}
        <div style={{ borderColor: theme.rule }} className="divide-y border-b lg:col-span-4 lg:border-r lg:border-b-0">
          {WORKSPACES.map((ws) => {
            const Icon = ws.icon;
            const active = ws.key === activeKey;
            return (
              <button
                key={ws.key}
                type="button"
                onClick={() => handleSelectWorkspace(ws.key)}
                style={{
                  borderColor: theme.rule,
                  backgroundColor: active ? theme.accentSoft : "transparent",
                }}
                className="relative flex w-full items-start gap-3 p-4 text-left transition-colors duration-150 hover:opacity-90"
              >
                {active && (
                  <motion.span
                    layoutId="vellum22-studio-bar"
                    transition={{ duration: 0.22, ease: VELLUM_EASE }}
                    style={{ backgroundColor: theme.accent }}
                    className="absolute top-0 bottom-0 left-0 w-[3px]"
                  />
                )}
                <Icon style={{ color: active ? theme.accent : theme.muted }} className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{ws.name}</span>
                    <span
                      style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                      className="shrink-0 text-[10px]"
                    >
                      {ws.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Canvas Preview */}
        <div className="p-6 lg:col-span-8 lg:p-7">
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
                    <BrandLogoBadge icon={current.brandIcon} dark={dark} size={22} />
                    <span style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }} className="text-xs uppercase">
                      {current.name}
                    </span>
                  </div>
                  <span
                    style={{ borderColor: theme.rule, color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                    className="rounded-[3px] border px-2 py-0.5 text-[10px]"
                  >
                    {current.badge}
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl leading-snug font-medium">
                  {current.headline}
                </h2>
              </div>

              {/* Crisp Inline Architecture Workflow Diagram (Input -> Core -> 3 Output Lanes) */}
              <div
                style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
                className="rounded-[5px] border p-4"
              >
                <div className="grid items-center gap-3 sm:grid-cols-12">
                  <div
                    style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                    className="rounded-[4px] border px-3 py-2 text-center text-[11px] font-medium sm:col-span-3"
                  >
                    Dữ liệu Repo / Tin
                  </div>

                  <div className="hidden justify-center sm:col-span-1 sm:flex">
                    <ArrowRight style={{ color: theme.accent }} className="size-4" />
                  </div>

                  <div
                    style={{
                      backgroundColor: theme.accentSoft,
                      borderColor: theme.accent,
                      color: theme.ink,
                    }}
                    className="rounded-[4px] border px-3 py-2 text-center sm:col-span-4"
                  >
                    <div
                      style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                      className="text-[10px] font-medium uppercase"
                    >
                      Bộ điều phối
                    </div>
                    <div className="text-xs font-medium">{current.name.split("&")[0].trim()}</div>
                  </div>

                  <div className="hidden justify-center sm:col-span-1 sm:flex">
                    <ArrowRight style={{ color: theme.accent }} className="size-4" />
                  </div>

                  <div className="space-y-1.5 sm:col-span-3">
                    {current.diagramLanes.map((lane) => (
                      <div
                        key={lane}
                        style={{ backgroundColor: theme.surface, borderColor: theme.rule, color: theme.muted }}
                        className="truncate rounded-[3px] border px-2.5 py-1 text-[11px] font-medium"
                      >
                        {lane}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Stage Step Indicator */}
              <div className="space-y-2.5">
                <div className="grid gap-2.5 sm:grid-cols-3">
                  {current.stages.map((st, idx) => {
                    const selected = idx === stageIdx;
                    return (
                      <button
                        key={st.title}
                        type="button"
                        onClick={() => setStageIdx(idx)}
                        style={{
                          backgroundColor: selected ? theme.surfaceAlt : theme.bg,
                          borderColor: selected ? theme.accent : theme.rule,
                        }}
                        className="rounded-[5px] border p-3 text-left transition-all duration-150 hover:opacity-95"
                      >
                        <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-[10px]">
                          BƯỚC 0{idx + 1}
                        </div>
                        <div className="mt-1 text-xs font-medium">{st.title.replace(/^\d+\.\s*/, "")}</div>
                      </button>
                    );
                  })}
                </div>
                <div
                  style={{ backgroundColor: theme.bg, borderColor: theme.rule, color: theme.muted }}
                  className="rounded-[4px] border px-3.5 py-2.5 text-xs"
                >
                  {activeStage.sample}
                </div>
              </div>

              {/* Footer Action */}
              <div style={{ borderColor: theme.rule }} className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span style={{ color: theme.muted }} className="text-xs">
                  Chỉ khám phá repo mã nguồn mở chuẩn xác; chưa kích hoạt API chạy tác vụ tự động.
                </span>
                {onExploreRepos && (
                  <button
                    type="button"
                    onClick={() => onExploreRepos(current.explore)}
                    style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                    className="inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-xs font-medium transition-transform duration-150 hover:-translate-y-[1px] active:scale-[0.985]"
                  >
                    <span>{current.exploreLabel}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* Real Brand Icon Ecosystem Directory */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers style={{ color: theme.accent }} className="size-4" />
          <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-xl font-medium">
            Hệ sinh thái công cụ liên kết thư viện
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ECOSYSTEM_TOOLS.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => onExploreRepos?.({ q: t.q })}
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="group flex items-center gap-3 rounded-[5px] border p-3.5 text-left transition-all duration-150 hover:-translate-y-[2px]"
            >
              <div
                style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.rule }}
                className="flex size-10 shrink-0 items-center justify-center rounded-[5px] border"
              >
                <BrandLogoBadge icon={t.icon} dark={dark} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium group-hover:underline">{t.name}</div>
                <div style={{ color: theme.muted }} className="truncate text-xs">
                  {t.role}
                </div>
              </div>
              <ArrowRight
                style={{ color: theme.muted }}
                className="size-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-0.5"
              />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
