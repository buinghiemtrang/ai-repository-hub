import "./globals.css";
import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Boxes, RefreshCw } from "lucide-react";

export const metadata = {
  title: "AI Repository Hub — Thư viện Repository AI",
  description: "Nền tảng cá nhân tổng hợp repository AI mã nguồn mở, mô tả tiếng Việt và hướng dẫn từ tài liệu gốc.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
        <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5 font-semibold text-slate-900">
              <span className="flex size-8 items-center justify-center rounded-lg bg-teal-700 text-xs font-bold text-white">
                AI
              </span>
              <span className="tracking-tight">AI Repository Hub</span>
            </Link>
            <nav aria-label="Điều hướng chính" className="flex items-center gap-1 sm:gap-2 text-sm">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <BookOpen className="size-4 text-teal-700" />
                <span>Thư viện</span>
              </Link>
              <Link
                href="/sync"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <RefreshCw className="size-4 text-slate-500" />
                <span>Đồng bộ</span>
              </Link>
              <Link
                href="/modules"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              >
                <Boxes className="size-4 text-slate-500" />
                <span className="hidden sm:inline">Modules</span>
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-xs text-slate-500 sm:px-6">
            <p>AI Repository Hub · Modular Monolith cá nhân · Dữ liệu đối chiếu từ GitHub API &amp; nguồn công khai.</p>
            <p>Không tự động thực thi mã nguồn tải về. Luôn kiểm tra README và giấy phép gốc.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
