"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Film, Image as ImageIcon, Layers, Mic, PlugZap, Workflow } from "lucide-react";
import { BrandLogoBadge } from "@/components/prototypes/vellum/VellumIcons";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";

interface VellumStudioViewProps {
  theme: VellumTheme;
  dark: boolean;
  initialTool?: string;
}

const WORKSPACES = [
  {
    key: "video",
    name: "Video AI & Timeline",
    badge: "Lộ trình Studio",
    icon: Film,
    brandIcon: { src: "/icons/livekit.svg", label: "Video Pipeline" },
    headline: "Chuyển kịch bản & bản tin AI thành video ngắn có timeline chỉnh từng cảnh.",
    previewSteps: ["01. Nhập kịch bản / chọn tin", "02. Chia phân cảnh & tạo hình", "03. Ghép Voiceover tiếng Việt"],
    repoHref: "/?q=video",
    repoLabel: "Xem Repo Video AI trong thư viện",
  },
  {
    key: "image",
    name: "Ảnh AI & Design Hàng loạt",
    badge: "Lộ trình Studio",
    icon: ImageIcon,
    brandIcon: { src: "/icons/midjourney.svg", label: "Image Studio", inkInvertDark: true },
    headline: "Tạo bộ ảnh sản phẩm, tách nền PNG và đồng bộ Brand Kit cho từng kênh.",
    previewSteps: ["01. Chọn Brand Kit & kích thước", "02. Chạy batch theo danh sách", "03. Xuất PNG/WebP tối ưu"],
    repoHref: "/?q=image",
    repoLabel: "Xem Repo Ảnh AI trong thư viện",
  },
  {
    key: "flows",
    name: "Flows & Tự động hóa",
    badge: "M7 Contract",
    icon: Workflow,
    brandIcon: { src: "/icons/dify.svg", label: "Workflow Engine" },
    headline: "Kết nối Catalog GitHub, Bản tin AI và công cụ sáng tạo thành chuỗi chạy tự động.",
    previewSteps: ["Trigger: Lịch mỗi 6 giờ", "Step: Lọc Repo nổi bật", "Action: Tổng hợp Digest"],
    repoHref: "/?category=Workflow+%26+T%E1%BB%B1+%C4%91%E1%BB%99ng+h%C3%B3a",
    repoLabel: "Xem Repo Workflow trong thư viện",
  },
  {
    key: "mcp",
    name: "MCP Registry & AI Skills",
    badge: "M7 Contract",
    icon: PlugZap,
    brandIcon: { src: "/icons/mcp.svg", label: "MCP", inkInvertDark: true },
    headline: "Quản lý server Model Context Protocol và đặc tả SKILL.md dùng chung cho coding agent.",
    previewSteps: ["Transport: stdio / HTTP", "Env Schema (no secrets)", "Agents: Claude · Codex · Gemini"],
    repoHref: "/?category=Claude+Skills",
    repoLabel: "Xem Repo Skills & MCP",
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

export function VellumStudioView({ theme, dark, initialTool }: VellumStudioViewProps) {
  const [activeKey, setActiveKey] = useState(
    WORKSPACES.some((w) => w.key === initialTool) ? initialTool! : "video"
  );
  const current = WORKSPACES.find((w) => w.key === activeKey) || WORKSPACES[0];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:py-8">
      {/* Studio Heading */}
      <section style={{ borderColor: theme.rule }} className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <div
            style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
            className="text-[11px] font-medium uppercase tracking-widest"
          >
            Vellum Creative Workbench · Kiến trúc mở rộng M7
          </div>
          <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-3xl font-medium sm:text-4xl">
            Xưởng Công cụ AI Sáng tạo
          </h1>
        </div>
        <span style={{ color: theme.muted }} className="text-xs">
          Sẵn sàng cắm module mới vào từng workspace panel (chưa mở backend sinh media)
        </span>
      </section>

      {/* Interactive Studio Workspace Switcher + Canvas Preview */}
      <section
        style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
        className="grid overflow-hidden rounded-[6px] border lg:grid-cols-12"
      >
        {/* Left Tool Selector */}
        <div style={{ borderColor: theme.rule }} className="divide-y border-b lg:col-span-4 lg:border-r lg:border-b-0">
          {WORKSPACES.map((ws) => {
            const Icon = ws.icon;
            const active = ws.key === activeKey;
            return (
              <button
                key={ws.key}
                type="button"
                onClick={() => setActiveKey(ws.key)}
                style={{
                  borderColor: theme.rule,
                  backgroundColor: active ? theme.accentSoft : "transparent",
                }}
                className="relative flex w-full items-start gap-3 p-4 text-left transition-colors"
              >
                {active && (
                  <motion.span
                    layoutId="vellum-studio-bar"
                    transition={{ duration: 0.22, ease: VELLUM_EASE }}
                    style={{ backgroundColor: theme.accent }}
                    className="absolute top-0 bottom-0 left-0 w-[3px]"
                  />
                )}
                <Icon style={{ color: active ? theme.accent : theme.muted }} className="mt-0.5 size-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{ws.name}</span>
                    <span style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }} className="text-[10px]">
                      {ws.badge}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Interactive Canvas Preview */}
        <div className="p-6 lg:col-span-8 lg:p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: VELLUM_EASE }}
              className="flex h-full flex-col justify-between space-y-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <BrandLogoBadge icon={current.brandIcon} dark={dark} size={22} />
                  <span style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }} className="text-xs uppercase">
                    {current.name}
                  </span>
                </div>
                <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl leading-snug font-medium">
                  {current.headline}
                </h2>
              </div>

              {/* Interactive Pipeline Step Mock */}
              <div className="grid gap-3 sm:grid-cols-3">
                {current.previewSteps.map((step, idx) => (
                  <div
                    key={step}
                    style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
                    className="rounded-[5px] border p-3.5"
                  >
                    <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-[10px]">
                      STAGE 0{idx + 1}
                    </div>
                    <div className="mt-1 text-xs font-medium">{step}</div>
                  </div>
                ))}
              </div>

              <div style={{ borderColor: theme.rule }} className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                <span style={{ color: theme.muted }} className="inline-flex items-center gap-1.5 text-xs">
                  <Mic className="size-3.5" />
                  Backend slice dự kiến: <code className="font-mono">backend/app/{current.key}_studio/</code>
                </span>
                <Link
                  href={current.repoHref}
                  style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                  className="inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-xs font-medium"
                >
                  <span>{current.repoLabel}</span>
                  <ArrowRight className="size-3.5" />
                </Link>
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
            <Link
              key={t.name}
              href={`/?q=${encodeURIComponent(t.q)}`}
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="group flex items-center gap-3 rounded-[5px] border p-3.5 transition-all duration-150 hover:-translate-y-0.5"
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
              <ArrowRight style={{ color: theme.muted }} className="size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
