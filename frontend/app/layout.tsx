import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import { AppShell } from "@/components/AppShell";

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
  title: "AI Repository Hub — Thư viện Repo, Tin tức AI & Studio",
  description:
    "Nền tảng cá nhân tổng hợp repository AI mã nguồn mở, bản tin AI & Repo hằng ngày và không gian mở rộng công cụ AI.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${beVietnamPro.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#fafaf9] text-slate-900 selection:bg-teal-100 selection:text-teal-900 dark:bg-[#090d16] dark:text-slate-100 dark:selection:bg-teal-900/60 dark:selection:text-teal-100">
        <Suspense fallback={<div className="min-h-screen" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
