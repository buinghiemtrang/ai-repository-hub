import "./globals.css";
import type { ReactNode } from "react";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { BookOpen, Boxes, RefreshCw, Sparkles } from "lucide-react";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata = {
  title: "AI Repository Hub — Thư viện Repository AI",
  description:
    "Nền tảng cá nhân tổng hợp repository AI mã nguồn mở, mô tả tiếng Việt và hướng dẫn đối chiếu từ tài liệu gốc.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#fafaf9] text-slate-900 selection:bg-teal-100 selection:text-teal-900">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              href="/"
              className="group flex shrink-0 items-center gap-2 text-sm font-semibold tracking-tight text-slate-900 whitespace-nowrap"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-slate-900 text-teal-300 shadow-xs transition-transform duration-150 group-hover:scale-105">
                <Sparkles className="size-3.5" />
              </span>
              <span>AI Repo Hub</span>
            </Link>

            <nav aria-label="Điều hướng chính" className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm whitespace-nowrap">
              <Link
                href="/"
                className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <BookOpen className="size-3.5 text-teal-700" />
                <span>Thư viện</span>
              </Link>
              <Link
                href="/sync"
                className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <RefreshCw className="size-3.5 text-slate-500" />
                <span>Đồng bộ</span>
              </Link>
              <Link
                href="/modules"
                className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <Boxes className="size-3.5 text-slate-500" />
                <span className="hidden sm:inline">Modules</span>
              </Link>
            </nav>
          </div>
        </header>

        <main className="relative flex-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(20,184,166,0.10),transparent)]"
          />
          {children}
        </main>

        <footer className="mt-16 border-t border-slate-200/80 bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:px-6">
            <p>AI Repository Hub · Modular Monolith cá nhân · Dữ liệu đối chiếu trực tiếp từ GitHub API.</p>
            <p>Chỉ tổng hợp tài liệu tham khảo — không tự động thực thi mã nguồn tải về.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
