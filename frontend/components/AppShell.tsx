"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import {
  BookOpen,
  Boxes,
  ChevronDown,
  Cpu,
  Film,
  Heart,
  Image as ImageIcon,
  Menu,
  Mic,
  Newspaper,
  PlugZap,
  RefreshCw,
  Search,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { VELLUM_EASE } from "@/components/prototypes/vellum/tokens";
import { useFavorites } from "@/components/repositories/FavoriteButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const STUDIO_MENU_TOOLS = [
  { key: "video", label: "Video AI & Timeline", desc: "Kịch bản → Scene → Voiceover", icon: Film, status: "Demo UI" },
  { key: "image", label: "Ảnh AI & Brand Kit", desc: "Sinh ảnh sản phẩm & tách nền", icon: ImageIcon, status: "Demo UI" },
  { key: "voice", label: "Voiceover & Podcast", desc: "Giọng đọc tiếng Việt & nhịp đọc", icon: Mic, status: "Demo UI" },
  { key: "flows", label: "Flows & Automation", desc: "Chuỗi tác vụ Repo → Tin → Media", icon: Workflow, status: "M7" },
  { key: "mcp", label: "MCP & AI Skills", desc: "Giao thức agent & SKILL.md", icon: PlugZap, status: "M7" },
  { key: "models", label: "Models Cục bộ", desc: "Ollama · GGUF · vLLM", icon: Cpu, status: "M7" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchStr = searchParams.toString();
  const { favorites } = useFavorites();

  const [toolsOpen, setToolsOpen] = useState(false);
  const [sysOpen, setSysOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const sysRef = useRef<HTMLDivElement>(null);

  const isPrototype = pathname.startsWith("/prototypes");

  // Close menus on Escape or outside click
  useEffect(() => {
    if (isPrototype || (!toolsOpen && !sysOpen)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setToolsOpen(false);
        setSysOpen(false);
      }
    };
    const onMouseDown = (e: MouseEvent) => {
      if (toolsOpen && toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
      if (sysOpen && sysRef.current && !sysRef.current.contains(e.target as Node)) {
        setSysOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [isPrototype, toolsOpen, sysOpen]);

  // Global `/` shortcut outside inputs to jump/focus Library search
  useEffect(() => {
    if (isPrototype) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
          e.preventDefault();
          if (pathname === "/") {
            window.dispatchEvent(new Event("aihub_focus_search"));
          } else {
            router.push("/?focus=1");
          }
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isPrototype, pathname, router]);

  // Must always run AFTER every hook (Rules of Hooks invariant prevents React Error #310)
  if (isPrototype) {
    return <>{children}</>;
  }

  const navItems = [
    {
      id: "repos",
      label: "Thư viện Repo",
      href: "/",
      icon: BookOpen,
      active: pathname === "/" || pathname.startsWith("/repositories"),
    },
    {
      id: "news",
      label: "Tạp chí Tin",
      href: "/news",
      icon: Newspaper,
      active: pathname.startsWith("/news"),
    },
    {
      id: "studio",
      label: "Xưởng AI",
      href: "/studio",
      icon: Wand2,
      active: pathname.startsWith("/studio"),
    },
  ];

  const onlyFavActive = pathname === "/" && searchParams.get("favorites") === "1";

  const handleQuickSearch = () => {
    setMobileOpen(false);
    if (pathname === "/") {
      window.dispatchEvent(new Event("aihub_focus_search"));
    } else {
      router.push("/?focus=1");
    }
  };

  const handleFavoritesToggle = () => {
    setMobileOpen(false);
    if (pathname === "/") {
      const next = new URLSearchParams(searchStr);
      if (onlyFavActive) next.delete("favorites");
      else next.set("favorites", "1");
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    } else {
      router.push("/?favorites=1");
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex min-h-screen min-w-0 flex-col bg-[var(--v-bg)] text-[var(--v-ink)] transition-colors duration-200">
        {/* Official Vellum Digital Header (No Prototype Switchers) */}
        <header className="sticky top-0 z-30 border-b border-[var(--v-rule)] bg-[var(--v-bg)] transition-colors duration-200">
          <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-2 px-3 sm:gap-3 sm:px-6">
            {/* Brand Identity + Bespoke Architectural Press Mark */}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
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
                  fill="var(--v-surface)"
                  stroke="var(--v-rule-strong)"
                  strokeWidth="1.2"
                />
                <path
                  d="M8 23L14.5 9H17.5L24 23"
                  stroke="var(--v-ink)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M11 18H21" stroke="var(--v-accent)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="24.5" cy="7.5" r="2" fill="var(--v-accent)" />
              </svg>
              <div className="min-w-0 leading-tight">
                <div className="font-editorial truncate text-[17px] font-medium tracking-tight sm:text-xl">
                  AI Repo Hub
                </div>
                <div className="font-telemetry hidden text-[9.5px] tracking-wider text-[var(--v-muted)] uppercase sm:block">
                  Vellum Digital Workspace
                </div>
              </div>
            </Link>

            {/* Center Editorial Navigation */}
            <nav aria-label="Điều hướng chính" className="hidden items-center gap-0.5 whitespace-nowrap lg:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors duration-150 hover:text-[var(--v-ink)] xl:px-3.5 ${
                      item.active ? "text-[var(--v-ink)]" : "text-[var(--v-muted)]"
                    }`}
                  >
                    <Icon
                      className="size-3.5"
                      style={{ color: item.active ? "var(--v-accent)" : undefined }}
                    />
                    <span>{item.label}</span>
                    {item.active && (
                      <motion.span
                        layoutId="vellum-official-nav"
                        transition={{ duration: 0.24, ease: VELLUM_EASE }}
                        className="absolute right-2.5 bottom-0 left-2.5 h-[2px] bg-[var(--v-accent)]"
                      />
                    )}
                  </Link>
                );
              })}

              {/* AI Tools Dropdown */}
              <div
                ref={toolsRef}
                className="relative"
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setToolsOpen((v) => !v)}
                  aria-expanded={toolsOpen}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors duration-150 hover:text-[var(--v-ink)] xl:px-3.5 ${
                    toolsOpen ? "text-[var(--v-ink)]" : "text-[var(--v-muted)]"
                  }`}
                >
                  <span>Công cụ AI</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-150 ${toolsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {toolsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.16, ease: VELLUM_EASE }}
                      className="absolute top-full left-0 mt-1 w-72 rounded-[6px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] p-2 text-[var(--v-ink)] shadow-xl"
                    >
                      <div className="font-telemetry px-2.5 py-1 text-[10px] tracking-wider text-[var(--v-muted)] uppercase">
                        Hệ công cụ Workspace
                      </div>
                      <div className="space-y-0.5">
                        {STUDIO_MENU_TOOLS.map((t) => {
                          const Icon = t.icon;
                          return (
                            <Link
                              key={t.key}
                              href={`/studio?tool=${t.key}`}
                              onClick={() => setToolsOpen(false)}
                              className="flex items-start gap-2.5 rounded-[4px] px-2.5 py-2 transition-colors duration-150 hover:bg-black/5 dark:hover:bg-white/5"
                            >
                              <Icon className="mt-0.5 size-4 shrink-0 text-[var(--v-accent)]" />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-2 text-xs font-medium">
                                  <span>{t.label}</span>
                                  <span className="font-telemetry text-[10px] text-[var(--v-muted)]">
                                    {t.status}
                                  </span>
                                </div>
                                <div className="text-[11px] text-[var(--v-muted)]">{t.desc}</div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* System Administration Dropdown (/sync & /modules) */}
              <div
                ref={sysRef}
                className="relative"
                onMouseEnter={() => setSysOpen(true)}
                onMouseLeave={() => setSysOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setSysOpen((v) => !v)}
                  aria-expanded={sysOpen}
                  className={`flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors duration-150 hover:text-[var(--v-ink)] xl:px-3 ${
                    pathname.startsWith("/sync") || pathname.startsWith("/modules") || sysOpen
                      ? "text-[var(--v-ink)]"
                      : "text-[var(--v-muted)]"
                  }`}
                >
                  <span>Hệ thống</span>
                  <ChevronDown
                    className={`size-3.5 transition-transform duration-150 ${sysOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {sysOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.16, ease: VELLUM_EASE }}
                      className="absolute top-full right-0 mt-1 w-60 rounded-[6px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] p-2 text-[var(--v-ink)] shadow-xl"
                    >
                      <Link
                        href="/sync"
                        onClick={() => setSysOpen(false)}
                        className="flex items-start gap-2.5 rounded-[4px] px-2.5 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <RefreshCw className="mt-0.5 size-4 shrink-0 text-[var(--v-accent)]" />
                        <div>
                          <div className="text-xs font-medium">Đồng bộ dữ liệu</div>
                          <div className="text-[11px] text-[var(--v-muted)]">GitHub API &amp; RSS Scheduler</div>
                        </div>
                      </Link>
                      <Link
                        href="/modules"
                        onClick={() => setSysOpen(false)}
                        className="flex items-start gap-2.5 rounded-[4px] px-2.5 py-2 transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        <Boxes className="mt-0.5 size-4 shrink-0 text-[var(--v-accent)]" />
                        <div>
                          <div className="text-xs font-medium">Kiến trúc Modules</div>
                          <div className="text-[11px] text-[var(--v-muted)]">Modular Monolith &amp; M7</div>
                        </div>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </nav>

            {/* Right Utility Controls */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handleQuickSearch}
                className="pressable hidden h-8 items-center gap-2 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 text-xs text-[var(--v-muted)] transition-colors hover:border-[var(--v-rule-strong)] hover:text-[var(--v-ink)] lg:inline-flex"
                title="Tìm kiếm nhanh (/)"
              >
                <Search className="size-3.5" />
                <span className="hidden xl:inline">Tìm nhanh</span>
                <kbd className="font-telemetry rounded border border-[var(--v-rule)] px-1 text-[10px]">
                  /
                </kbd>
              </button>

              <button
                type="button"
                onClick={handleFavoritesToggle}
                aria-label="Lọc repository đã yêu thích"
                aria-pressed={onlyFavActive}
                style={{
                  borderColor: onlyFavActive ? "var(--v-accent)" : "var(--v-rule)",
                  backgroundColor: onlyFavActive ? "var(--v-accent-soft)" : "var(--v-surface)",
                  color: onlyFavActive ? "var(--v-accent)" : "var(--v-ink)",
                }}
                className="pressable inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-[4px] border px-2.5 text-xs font-medium transition-colors sm:h-8 sm:min-w-8"
                title="Lọc các repository đã yêu thích"
              >
                <Heart className={`size-3.5 ${onlyFavActive ? "fill-current" : ""}`} />
                <span className="tabular-nums hidden sm:inline">{favorites.length}</span>
              </button>

              <ThemeToggle />

              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="flex size-11 items-center justify-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] lg:hidden sm:size-8"
                aria-label={mobileOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
              >
                {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
              </button>
            </div>
          </div>

          {/* Responsive Mobile Drawer */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: VELLUM_EASE }}
                className="overflow-hidden border-t border-[var(--v-rule)] bg-[var(--v-surface)] px-3 py-3 lg:hidden"
              >
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.id}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        style={{
                          backgroundColor: item.active ? "var(--v-accent-soft)" : "transparent",
                          color: item.active ? "var(--v-accent)" : "var(--v-ink)",
                        }}
                        className="flex min-h-11 items-center gap-2.5 rounded-[4px] px-3 py-2 text-sm font-medium"
                      >
                        <Icon className="size-4 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                  <div className="mt-1 grid grid-cols-2 gap-1.5 border-t border-[var(--v-rule)] pt-2">
                    <Link
                      href="/sync"
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-3 text-xs font-medium"
                    >
                      <RefreshCw className="size-3.5 text-[var(--v-accent)]" />
                      <span>Đồng bộ</span>
                    </Link>
                    <Link
                      href="/modules"
                      onClick={() => setMobileOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-3 text-xs font-medium"
                    >
                      <Boxes className="size-3.5 text-[var(--v-accent)]" />
                      <span>Modules</span>
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="min-w-0 flex-1">{children}</main>

        {/* Official Vellum Footer */}
        <footer className="border-t border-[var(--v-rule)] py-5 text-xs text-[var(--v-muted)]">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 sm:px-6">
            <span>AI Repo Hub · Vellum Design System 1.0 · Dữ liệu đồng bộ độc lập</span>
            <div className="flex flex-wrap items-center gap-4">
              <Link href="/sync" className="hover:text-[var(--v-ink)] hover:underline">
                Đồng bộ
              </Link>
              <Link href="/modules" className="hover:text-[var(--v-ink)] hover:underline">
                Modules
              </Link>
              <span>Không tự động thực thi mã nguồn tải về</span>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
