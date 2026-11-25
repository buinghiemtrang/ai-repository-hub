import "./globals.css";
import { Suspense, type ReactNode } from "react";
import { Hanken_Grotesk, JetBrains_Mono, Newsreader } from "next/font/google";
import { AppShell } from "@/components/AppShell";

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "vietnamese"],
  variable: "--font-hanken",
  display: "swap",
});

const newsreader = Newsreader({
  subsets: ["latin", "vietnamese"],
  variable: "--font-newsreader",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const metadata = {
  title: "AI Repository Hub — Thư viện Repo, Tin tức AI & Xưởng Công cụ",
  description:
    "Nền tảng cá nhân tổng hợp repository AI mã nguồn mở, bản tin AI & Repo độc lập và không gian công cụ AI sáng tạo.",
};

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d);document.documentElement.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="vi"
      suppressHydrationWarning
      className={`${hankenGrotesk.variable} ${newsreader.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[var(--v-bg)] text-[var(--v-ink)] selection:bg-[#C03A17]/15 selection:text-[#171614] dark:selection:bg-[#EC7650]/25 dark:selection:text-[#F4F0E8]">
        <Suspense fallback={<div className="min-h-screen" />}>
          <AppShell>{children}</AppShell>
        </Suspense>
      </body>
    </html>
  );
}
