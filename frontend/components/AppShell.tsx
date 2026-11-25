"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BookOpen,
  Boxes,
  Film,
  Image as ImageIcon,
  LayoutGrid,
  Menu,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  PlugZap,
  RefreshCw,
  Sparkles,
  Wand2,
  Workflow,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof BookOpen;
  badge?: string;
  match?: (pathname: string, search: string) => boolean;
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Khám phá & Tin tức",
    items: [
      {
        label: "Thư viện Repo",
        href: "/",
        icon: BookOpen,
        match: (p) => p === "/" || p.startsWith("/repositories"),
      },
      {
        label: "Tin tức",
        href: "/news",
        icon: Newspaper,
        match: (p) => p.startsWith("/news"),
      },
    ],
  },
  {
    title: "AI Studio & Công cụ",
    items: [
      {
        label: "Không gian Studio",
        href: "/studio",
        icon: Wand2,
        badge: "Mới",
        match: (p, s) => p === "/studio" && !s.includes("tool="),
      },
      {
        label: "Tạo Video AI",
        href: "/studio?tool=video",
        icon: Film,
        badge: "Sắp mở",
        match: (p, s) => p === "/studio" && s.includes("tool=video"),
      },
      {
        label: "Tạo Ảnh & Design",
        href: "/studio?tool=image",
        icon: ImageIcon,
        badge: "Sắp mở",
        match: (p, s) => p === "/studio" && s.includes("tool=image"),
      },
      {
        label: "Flows & Automation",
        href: "/studio?tool=flows",
        icon: Workflow,
        badge: "M7",
        match: (p, s) => p === "/studio" && s.includes("tool=flows"),
      },
      {
        label: "MCP & AI Skills",
        href: "/studio?tool=mcp",
        icon: PlugZap,
        badge: "M7",
        match: (p, s) => p === "/studio" && s.includes("tool=mcp"),
      },
    ],
  },
  {
    title: "Hệ thống",
    items: [
      {
        label: "Đồng bộ dữ liệu",
        href: "/sync",
        icon: RefreshCw,
        match: (p) => p.startsWith("/sync"),
      },
      {
        label: "Kiến trúc Modules",
        href: "/modules",
        icon: Boxes,
        match: (p) => p.startsWith("/modules"),
      },
    ],
  },
];

function pageHeading(pathname: string, search: string): { title: string; subtitle: string } {
  if (pathname.startsWith("/news")) {
    if (search.includes("section=Repo")) {
      return { title: "Tin tức · Mục Repo AI", subtitle: "Cập nhật dự án mã nguồn mở từ thư viện" };
    }
    if (search.includes("view=weekly")) {
      return { title: "Tin tức · Bản tin tuần", subtitle: "Tổng hợp tiêu điểm AI & Repo theo tuần" };
    }
    return { title: "Tin tức AI & Repo", subtitle: "Bản tin tổng hợp độc lập · Giọng đọc tiếng Việt" };
  }
  if (pathname.startsWith("/studio")) {
    return { title: "AI Studio Workspace", subtitle: "Kiến trúc mở rộng cho Video AI, Ảnh AI, Flows & MCP" };
  }
  if (pathname.startsWith("/sync")) {
    return { title: "Đồng bộ dữ liệu", subtitle: "Lịch nền GitHub API & trình thu thập RSS độc lập" };
  }
  if (pathname.startsWith("/modules")) {
    return { title: "Kiến trúc Modules", subtitle: "Modular Monolith sẵn sàng mở rộng" };
  }
  if (pathname.startsWith("/repositories/")) {
    return { title: "Chi tiết Repository", subtitle: "Thông tin GitHub & hướng dẫn đối chiếu README" };
  }
  return { title: "Thư viện Repository AI", subtitle: "Tổng hợp repo mã nguồn mở & hướng dẫn tiếng Việt" };
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const searchStr = searchParams.toString();

  if (pathname.startsWith("/prototypes")) {
    return <>{children}</>;
  }

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("aihub_sidebar_collapsed") === "1");
    } catch {
      // ignore storage errors
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, searchStr]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aihub_sidebar_collapsed", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const heading = pageHeading(pathname, searchStr);

  const renderSidebarContent = (isMobile: boolean) => {
    const compact = collapsed && !isMobile;
    return (
      <div className="flex h-full flex-col">
        <div
          className={cn(
            "flex h-14 items-center border-b border-slate-200/80 px-3 dark:border-slate-800/80",
            compact ? "justify-center" : "justify-between"
          )}
        >
          <Link
            href="/"
            className="group flex items-center gap-2.5 font-semibold tracking-tight text-slate-900 dark:text-slate-100"
            title="AI Repository & Studio Hub"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-sm transition-transform duration-150 group-hover:scale-105 dark:from-teal-500 dark:to-cyan-600">
              <Sparkles className="size-4" />
            </span>
            {!compact && (
              <div className="min-w-0 leading-tight">
                <div className="truncate text-sm font-bold">AI Repo Hub</div>
                <div className="truncate text-[11px] font-normal text-slate-500 dark:text-slate-400">
                  Workspace & Feed
                </div>
              </div>
            )}
          </Link>

          {isMobile ? (
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
              aria-label="Đóng menu"
            >
              <X className="size-4" />
            </button>
          ) : (
            !compact && (
              <button
                type="button"
                onClick={toggleCollapsed}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                title="Thu gọn thanh bên"
                aria-label="Thu gọn thanh bên"
              >
                <PanelLeftClose className="size-4" />
              </button>
            )
          )}
        </div>

        {compact && !isMobile && (
          <div className="flex justify-center border-b border-slate-200/70 py-2 dark:border-slate-800/70">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Mở rộng thanh bên"
              aria-label="Mở rộng thanh bên"
            >
              <PanelLeftOpen className="size-4" />
            </button>
          </div>
        )}

        <nav aria-label="Điều hướng workspace" className="flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="space-y-1">
              {!compact && (
                <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {group.title}
                </div>
              )}
              {group.items.map((item) => {
                const active = item.match ? item.match(pathname, searchStr) : pathname === item.href;
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={compact ? item.label : undefined}
                    className={cn(
                      "pressable flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                      compact && "justify-center px-2",
                      active
                        ? "bg-teal-50 text-teal-800 ring-1 ring-teal-200/80 dark:bg-teal-500/15 dark:text-teal-200 dark:ring-teal-500/30"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-teal-700 dark:text-teal-300" : "text-slate-500 dark:text-slate-400"
                      )}
                    />
                    {!compact && <span className="flex-1 truncate">{item.label}</span>}
                    {!compact && item.badge && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                          item.badge === "Mới"
                            ? "bg-teal-600 text-white dark:bg-teal-500 dark:text-slate-950"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {!compact && (
          <div className="border-t border-slate-200/80 p-3 dark:border-slate-800/80">
            <Link
              href="/studio"
              className="block rounded-xl border border-teal-200/70 bg-gradient-to-br from-teal-50/90 to-emerald-50/70 p-3 transition-colors hover:border-teal-300 dark:border-teal-500/25 dark:from-teal-500/10 dark:to-cyan-500/5"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-teal-900 dark:text-teal-200">
                <LayoutGrid className="size-3.5 text-teal-600 dark:text-teal-400" />
                Nền tảng AI mở rộng
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                Sẵn sàng gắn thêm Video AI, Tạo ảnh, Flows & MCP theo cấu trúc Modular Monolith.
              </p>
            </Link>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#fafaf9] text-slate-900 dark:bg-[#090d16] dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-slate-200/80 bg-white/90 backdrop-blur-md transition-[width] duration-200 lg:block dark:border-slate-800/80 dark:bg-[#0b101b]/95",
          collapsed ? "w-[72px]" : "w-64"
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 h-full w-72 max-w-[85vw] border-r border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0b101b]">
            {renderSidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#090d16]/85">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="inline-flex size-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
                aria-label="Mở menu điều hướng"
              >
                <Menu className="size-4" />
              </button>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {heading.title}
                </div>
                <div className="hidden truncate text-[11px] text-slate-500 sm:block dark:text-slate-400">
                  {heading.subtitle}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <nav aria-label="Truy cập nhanh" className="hidden items-center gap-1 md:flex">
                <Link
                  href="/"
                  className={cn(
                    "pressable rounded-lg px-2.5 py-1.5 text-xs font-medium",
                    pathname === "/" || pathname.startsWith("/repositories")
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  Thư viện
                </Link>
                <Link
                  href="/news"
                  className={cn(
                    "pressable rounded-lg px-2.5 py-1.5 text-xs font-medium",
                    pathname.startsWith("/news")
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  Tin tức
                </Link>
                <Link
                  href="/studio"
                  className={cn(
                    "pressable rounded-lg px-2.5 py-1.5 text-xs font-medium",
                    pathname.startsWith("/studio")
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  )}
                >
                  AI Studio
                </Link>
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="relative flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.10),transparent)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.15),transparent)]"
          />
          {children}
        </main>

        <footer className="mt-16 border-t border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-[#0b101b]/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:px-6 dark:text-slate-400">
            <p>
              AI Repository Hub · Modular Monolith cá nhân · Thư viện GitHub, Tin tức AI & AI Studio.
            </p>
            <p>Chỉ tổng hợp tài liệu tham khảo công khai — không tự động thực thi mã nguồn tải về.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
