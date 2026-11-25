"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  BookOpen,
  ChevronDown,
  Cpu,
  Film,
  Heart,
  Image as ImageIcon,
  Menu,
  Moon,
  Newspaper,
  PlugZap,
  Search,
  Sun,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";

export type VellumTab22 = "repos" | "news" | "studio";

interface VellumHeader22Props {
  theme: VellumTheme;
  dark: boolean;
  rc?: boolean;
  tab: VellumTab22;
  favoritesCount: number;
  onlyFavorites: boolean;
  onTabChange: (t: VellumTab22) => void;
  onToggleDark: () => void;
  onFocusSearch: () => void;
  onToggleFavorites: () => void;
  onOpenStudioTool: (toolKey: string) => void;
}

const STUDIO_PREVIEW_TOOLS = [
  { key: "video", label: "Video AI & Timeline", desc: "Kịch bản → Scene → Voiceover", icon: Film, status: "Demo UI" },
  { key: "image", label: "Ảnh AI & Brand Kit", desc: "Sinh ảnh sản phẩm & tách nền", icon: ImageIcon, status: "Demo UI" },
  { key: "flows", label: "Flows & Automation", desc: "Chuỗi tác vụ Repo → Tin → Media", icon: Workflow, status: "Sắp mở" },
  { key: "mcp", label: "MCP & AI Skills", desc: "Giao thức agent & SKILL.md", icon: PlugZap, status: "Sắp mở" },
  { key: "models", label: "Models Cục bộ", desc: "Ollama · GGUF · vLLM", icon: Cpu, status: "Sắp mở" },
];

export function VellumHeader22({
  theme,
  dark,
  rc = false,
  tab,
  favoritesCount,
  onlyFavorites,
  onTabChange,
  onToggleDark,
  onFocusSearch,
  onToggleFavorites,
  onOpenStudioTool,
}: VellumHeader22Props) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!toolsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setToolsOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [toolsOpen]);

  const navItems: { id: VellumTab22; label: string; icon: typeof BookOpen }[] = [
    { id: "repos", label: "Thư viện Repo", icon: BookOpen },
    { id: "news", label: "Tạp chí Tin", icon: Newspaper },
    { id: "studio", label: "Xưởng AI", icon: Wand2 },
  ];

  return (
    <header
      style={{
        backgroundColor: theme.bg,
        borderColor: theme.rule,
        color: theme.ink,
      }}
      className="sticky top-0 z-30 border-b transition-colors duration-200"
    >
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
        {/* Brand Identity + Press Mark */}
        <div className="flex min-w-0 items-center gap-2 xl:gap-3">
          <Link
            href="/prototypes"
            style={{ color: theme.muted, borderColor: theme.rule }}
            className="hidden shrink-0 rounded-[4px] border px-2 py-1 text-[11px] font-medium transition-colors hover:opacity-80 xl:inline-flex"
            title="Bảng so sánh P1 / P2 / P2.1 / P2.2 / P3"
          >
            ← So sánh
          </Link>

          <button
            type="button"
            onClick={() => onTabChange("repos")}
            className="group flex min-w-0 items-center gap-2 text-left sm:gap-2.5"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              aria-hidden="true"
              className="size-7 shrink-0 transition-transform duration-150 group-hover:scale-105"
            >
              <rect
                x="1"
                y="1"
                width="30"
                height="30"
                rx="4"
                fill={theme.surface}
                stroke={theme.ruleStrong}
                strokeWidth="1.2"
              />
              <path d="M8 23L14.5 9H17.5L24 23" stroke={theme.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M11 18H21" stroke={theme.accent} strokeWidth="2" strokeLinecap="round" />
              <circle cx="24.5" cy="7.5" r="2" fill={theme.accent} />
            </svg>
            <div className="min-w-0 leading-tight">
              <div
                style={{ fontFamily: "var(--font-newsreader)" }}
                className="truncate text-[17px] font-medium tracking-tight sm:text-xl"
              >
                AI Repo Hub
              </div>
              <div
                style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                className="hidden text-[9.5px] tracking-wider uppercase sm:block"
              >
                {rc ? "Vellum Digital · P2.2.1 RC" : "Vellum Digital · P2.2"}
              </div>
            </div>
          </button>
        </div>

        {/* Center Editorial Navigation with Animated Layout Underline */}
        <nav aria-label="Điều hướng chính" className="hidden items-center gap-0.5 whitespace-nowrap lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                style={{ color: active ? theme.ink : theme.muted }}
                className="relative flex items-center gap-1.5 px-2.5 py-2 text-sm font-medium transition-colors duration-150 hover:opacity-90 xl:px-3.5"
              >
                <Icon className="size-3.5" style={{ color: active ? theme.accent : undefined }} />
                <span>{item.label}</span>
                {active && (
                  <motion.span
                    layoutId="vellum22-nav-underline"
                    transition={{ duration: 0.24, ease: VELLUM_EASE }}
                    style={{ backgroundColor: theme.accent }}
                    className="absolute right-2.5 bottom-0 left-2.5 h-[2px]"
                  />
                )}
              </button>
            );
          })}

          {/* Extensible AI Tools Dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setToolsOpen(true)}
            onMouseLeave={() => setToolsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setToolsOpen((v) => !v)}
              aria-expanded={toolsOpen}
              style={{ color: toolsOpen ? theme.ink : theme.muted }}
              className="flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors duration-150 hover:opacity-90 xl:px-3"
            >
              <span>Công cụ AI</span>
              <ChevronDown className={`size-3.5 transition-transform duration-150 ${toolsOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {toolsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.16, ease: VELLUM_EASE }}
                  style={{
                    backgroundColor: theme.surface,
                    borderColor: theme.ruleStrong,
                    color: theme.ink,
                  }}
                  className="absolute top-full left-0 mt-1 w-72 rounded-[6px] border p-2 shadow-xl"
                >
                  <div
                    style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                    className="px-2.5 py-1 text-[10px] uppercase tracking-wider"
                  >
                    Hệ công cụ Workspace
                  </div>
                  <div className="space-y-0.5">
                    {STUDIO_PREVIEW_TOOLS.map((t) => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.key}
                          type="button"
                          onClick={() => {
                            setToolsOpen(false);
                            onOpenStudioTool(t.key);
                          }}
                          className="flex w-full items-start gap-2.5 rounded-[4px] px-2.5 py-2 text-left transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <Icon style={{ color: theme.accent }} className="mt-0.5 size-4 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 text-xs font-medium">
                              <span>{t.label}</span>
                              <span
                                style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                                className="text-[10px]"
                              >
                                {t.status}
                              </span>
                            </div>
                            <div style={{ color: theme.muted }} className="text-[11px]">
                              {t.desc}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>

        {/* Right Utility Actions */}
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={onFocusSearch}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface, color: theme.muted }}
            className="hidden h-8 items-center gap-2 rounded-[4px] border px-2.5 text-xs transition-all duration-150 hover:-translate-y-[1px] hover:opacity-90 active:scale-[0.985] lg:inline-flex"
            title="Tìm kiếm nhanh (/)"
          >
            <Search className="size-3.5" />
            <span className="hidden xl:inline">Tìm nhanh</span>
            <kbd
              style={{ borderColor: theme.rule, fontFamily: "var(--font-jetbrains)" }}
              className="rounded border px-1 text-[10px]"
            >
              /
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => {
              onTabChange("repos");
              onToggleFavorites();
            }}
            style={{
              borderColor: onlyFavorites ? theme.accent : theme.rule,
              backgroundColor: onlyFavorites ? theme.accentSoft : theme.surface,
              color: onlyFavorites ? theme.accent : theme.ink,
            }}
            className={`inline-flex items-center justify-center gap-1.5 rounded-[4px] border px-2.5 text-xs font-medium transition-all duration-150 hover:-translate-y-[1px] active:scale-[0.985] ${
              rc ? "h-11 min-w-11 sm:h-8 sm:min-w-8" : "h-8"
            }`}
            title="Lọc các repository đã lưu"
            aria-label="Lọc repository đã lưu"
          >
            <Heart className={`size-3.5 ${onlyFavorites ? "fill-current" : ""}`} />
            <span className="tabular-nums hidden sm:inline">{favoritesCount}</span>
          </button>

          {/* Version Switcher keeping P2.1 & P2.2 intact for side-by-side comparison */}
          <div
            style={{ borderColor: theme.rule }}
            className="hidden items-center gap-0.5 rounded-[4px] border p-0.5 sm:flex"
          >
            {(
              rc
                ? ([
                    { id: "2", label: "P2" },
                    { id: "2-1", label: "P2.1" },
                    { id: "2-2", label: "P2.2" },
                    { id: "2-2-1", label: "RC" },
                  ] as const)
                : ([
                    { id: "1", label: "P1" },
                    { id: "2", label: "P2" },
                    { id: "2-1", label: "P2.1" },
                    { id: "2-2", label: "P2.2" },
                    { id: "3", label: "P3" },
                  ] as const)
            ).map((p) => {
              const active = rc ? p.id === "2-2-1" : p.id === "2-2";
              return (
                <Link
                  key={p.id}
                  href={`/prototypes/${p.id}`}
                  style={{
                    backgroundColor: active ? theme.accent : "transparent",
                    color: active ? theme.accentInk : theme.muted,
                    fontFamily: "var(--font-jetbrains)",
                  }}
                  className="rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium transition-colors hover:opacity-85"
                >
                  {p.label}
                </Link>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleDark}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface, color: theme.ink }}
            className={`flex items-center justify-center rounded-[4px] border transition-transform duration-150 hover:-translate-y-[1px] active:scale-95 ${
              rc ? "size-11 sm:size-8" : "size-8"
            }`}
            aria-label={dark ? "Chuyển sang Light mode" : "Chuyển sang Dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
            className={`flex items-center justify-center rounded-[4px] border lg:hidden ${
              rc ? "size-11 sm:size-8" : "size-8"
            }`}
            aria-label="Mở menu điều hướng"
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: VELLUM_EASE }}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
            className="overflow-hidden border-t px-4 py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = tab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onTabChange(item.id);
                      setMobileOpen(false);
                    }}
                    style={{
                      backgroundColor: active ? theme.accentSoft : "transparent",
                      color: active ? theme.accent : theme.ink,
                    }}
                    className={`flex items-center gap-2 rounded-[4px] px-3 py-2 text-left text-sm font-medium ${
                      rc ? "min-h-11" : ""
                    }`}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              <div style={{ borderColor: theme.rule }} className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t pt-2 text-xs">
                <Link href="/prototypes" style={{ color: theme.muted }} className={rc ? "inline-flex min-h-11 items-center" : ""}>
                  ← Bảng so sánh tổng
                </Link>
                <div className="flex items-center gap-1 sm:hidden">
                  {(["2", "2-1", "2-2", "2-2-1"] as const).map((id) => {
                    const active = rc ? id === "2-2-1" : id === "2-2";
                    return (
                      <Link
                        key={id}
                        href={`/prototypes/${id}`}
                        style={{
                          backgroundColor: active ? theme.accent : theme.bg,
                          color: active ? theme.accentInk : theme.muted,
                          fontFamily: "var(--font-jetbrains)",
                        }}
                        className={`inline-flex items-center rounded px-2 py-1 text-[10px] font-medium ${
                          rc ? "min-h-11 min-w-10 justify-center" : ""
                        }`}
                      >
                        {id === "2-2-1" ? "RC" : `P${id.replace("-", ".")}`}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
