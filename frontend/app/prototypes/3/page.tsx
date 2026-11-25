"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Film,
  GitFork,
  Image as ImageIcon,
  Layers,
  Moon,
  Newspaper,
  Search,
  Star,
  Sun,
  Wand2,
  Workflow,
} from "lucide-react";
import { usePrototypeData } from "@/components/prototypes/usePrototypeData";
import { formatCompactNumber } from "@/lib/repositories/types";

export default function PrototypeThreePage() {
  const { repos, totalRepos, stats, news, loading, q, setQ, category, setCategory, language, setLanguage } =
    usePrototypeData();
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<"repos" | "news" | "studio">("repos");

  const theme = dark
    ? {
        bg: "#18191b",
        surface: "#222427",
        panel: "#1d1e21",
        ink: "#eff0f1",
        muted: "#9c9ea3",
        line: "rgba(239,240,241,0.12)",
        accent: "#ff5a2f",
        accentInk: "#18191b",
      }
    : {
        bg: "#eeeff1",
        surface: "#ffffff",
        panel: "#f7f8f9",
        ink: "#111317",
        muted: "#5d6470",
        line: "rgba(17,19,23,0.12)",
        accent: "#e8481c",
        accentInk: "#ffffff",
      };

  const featured = repos[0];
  const gridRepos = repos.slice(1, 9);
  const newsItems = news?.days?.[0]?.items || [];

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.ink,
        fontFamily: "var(--font-ibm-sans), system-ui, sans-serif",
      }}
      className="flex min-h-screen flex-col transition-colors duration-150"
    >
      {/* 44px Top Utility Ribbon */}
      <header
        style={{ backgroundColor: theme.surface, borderColor: theme.line }}
        className="sticky top-0 z-30 flex h-11 items-center justify-between border-b px-4"
      >
        <div className="flex items-center gap-3">
          <Link href="/prototypes" style={{ color: theme.muted }} className="text-xs hover:underline">
            ← So sánh
          </Link>
          <span
            style={{ backgroundColor: theme.accent }}
            className="inline-block h-3.5 w-1"
          />
          <span
            style={{ fontFamily: "var(--font-bricolage)" }}
            className="text-sm font-semibold tracking-tight"
          >
            ATELIER · AI HUB
          </span>
        </div>

        {/* Tactile Workspace Tabs */}
        <div className="flex h-full items-center gap-1 text-xs">
          {[
            { id: "repos" as const, label: "01. REPOS" },
            { id: "news" as const, label: "02. TIN TỨC" },
            { id: "studio" as const, label: "03. STUDIO" },
          ].map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                style={{
                  fontFamily: "var(--font-ibm-mono)",
                  borderColor: active ? theme.accent : "transparent",
                  color: active ? theme.ink : theme.muted,
                }}
                className="flex h-full items-center border-b-2 px-3 text-[11px] font-medium transition-colors"
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          {(["1", "2", "3"] as const).map((id) => (
            <Link
              key={id}
              href={`/prototypes/${id}`}
              style={{
                borderColor: id === "3" ? theme.accent : theme.line,
                color: id === "3" ? theme.accent : theme.muted,
                fontFamily: "var(--font-ibm-mono)",
              }}
              className="rounded-[3px] border px-2 py-0.5 text-[11px]"
            >
              P{id}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            style={{ borderColor: theme.line }}
            className="ml-1 flex size-7 items-center justify-center rounded-[3px] border"
            title="Chuyển sáng/tối"
          >
            {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </header>

      {/* Dual-Rail Tactile Layout */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-1">
        {/* Left Contextual Filter Rail (220px, hairline separated) */}
        <aside
          style={{ borderColor: theme.line, backgroundColor: theme.panel }}
          className="hidden w-[228px] shrink-0 flex-col justify-between border-r p-4 md:flex"
        >
          <div className="space-y-5">
            <div>
              <div
                style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }}
                className="mb-2 text-[10px] uppercase tracking-widest"
              >
                Tìm kiếm nhanh
              </div>
              <div
                style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                className="flex items-center gap-2 rounded-[4px] border px-2.5 py-1.5"
              >
                <Search style={{ color: theme.muted }} className="size-3.5 shrink-0" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Từ khóa..."
                  className="w-full bg-transparent text-xs outline-none"
                />
              </div>
            </div>

            <div>
              <div
                style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }}
                className="mb-2 text-[10px] uppercase tracking-widest"
              >
                Danh mục ({stats?.categories.length || 0})
              </div>
              <div className="space-y-0.5 text-xs">
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  style={{
                    backgroundColor: !category ? theme.surface : "transparent",
                    borderColor: !category ? theme.accent : "transparent",
                  }}
                  className="flex w-full items-center justify-between rounded-[3px] border-l-2 px-2 py-1.5 text-left font-medium"
                >
                  <span>Tất cả</span>
                  <span style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }}>
                    {stats?.total || totalRepos}
                  </span>
                </button>
                {stats?.categories.slice(0, 10).map((c) => {
                  const active = category === c.name;
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(active ? "" : c.name)}
                      style={{
                        backgroundColor: active ? theme.surface : "transparent",
                        borderColor: active ? theme.accent : "transparent",
                      }}
                      className="flex w-full items-center justify-between rounded-[3px] border-l-2 px-2 py-1.5 text-left"
                    >
                      <span className="truncate">{c.name}</span>
                      <span style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div
                style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }}
                className="mb-2 text-[10px] uppercase tracking-widest"
              >
                Ngôn ngữ
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                className="h-8 w-full rounded-[4px] border px-2 text-xs outline-none"
              >
                <option value="">Mọi ngôn ngữ</option>
                {stats?.languages.map((l) => (
                  <option key={l.name} value={l.name}>
                    {l.name} ({l.count})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div
            style={{ borderColor: theme.line, fontFamily: "var(--font-ibm-mono)", color: theme.muted }}
            className="border-t pt-3 text-[10px]"
          >
            SYSTEM: MODULAR MONOLITH
            <br />
            THEME: ATELIER CANVAS
          </div>
        </aside>

        {/* Main Canvas */}
        <main className="min-w-0 flex-1 p-5 sm:p-6">
          {tab === "repos" && (
            <div className="space-y-6">
              {/* Architectural Bento Top Row */}
              {!loading && featured && (
                <section
                  style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                  className="grid gap-px overflow-hidden rounded-[6px] border lg:grid-cols-12"
                >
                  <div className="flex flex-col justify-between p-6 lg:col-span-8">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          style={{ backgroundColor: theme.accent, color: theme.accentInk, fontFamily: "var(--font-ibm-mono)" }}
                          className="rounded-[2px] px-2 py-0.5 text-[10px] font-medium uppercase"
                        >
                          FEATURED REPO
                        </span>
                        <span style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }} className="text-xs">
                          {featured.category}
                        </span>
                      </div>
                      <h1
                        style={{ fontFamily: "var(--font-bricolage)" }}
                        className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl"
                      >
                        {featured.full_name}
                      </h1>
                      <p style={{ color: theme.muted }} className="mt-2 max-w-2xl text-sm leading-relaxed">
                        {featured.description_vi}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3">
                      <Link
                        href={`/repositories/${featured.id}`}
                        style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                        className="inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-2 text-xs font-medium active:scale-[0.985]"
                      >
                        Mở hướng dẫn chi tiết
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                      <a
                        href={featured.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ borderColor: theme.line }}
                        className="inline-flex items-center gap-1.5 rounded-[4px] border px-3.5 py-2 text-xs font-medium"
                      >
                        GitHub Upstream
                      </a>
                    </div>
                  </div>

                  {/* Spec Matrix Cell */}
                  <div
                    style={{ borderColor: theme.line, backgroundColor: theme.panel }}
                    className="grid grid-cols-2 gap-px border-t lg:col-span-4 lg:border-t-0 lg:border-l"
                  >
                    {[
                      ["STARS", formatCompactNumber(featured.stars)],
                      ["FORKS", formatCompactNumber(featured.forks)],
                      ["LANG", featured.language || "—"],
                      ["CATALOG", `${totalRepos} REPOS`],
                    ].map(([k, v]) => (
                      <div key={k} style={{ backgroundColor: theme.surface }} className="flex flex-col justify-center p-4">
                        <span style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }} className="text-[10px]">
                          {k}
                        </span>
                        <span
                          style={{ fontFamily: "var(--font-ibm-mono)" }}
                          className="tabular-nums mt-1 text-lg font-medium"
                        >
                          {v}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Architectural 1px Grid of Repositories */}
              {!loading && (
                <section
                  style={{ borderColor: theme.line, backgroundColor: theme.line }}
                  className="grid gap-px overflow-hidden rounded-[6px] border sm:grid-cols-2"
                >
                  {gridRepos.map((repo, idx) => (
                    <div
                      key={repo.id}
                      style={{ backgroundColor: theme.surface }}
                      className="flex flex-col justify-between p-5 transition-colors hover:opacity-95"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span style={{ color: theme.muted, fontFamily: "var(--font-ibm-mono)" }} className="text-[10px]">
                            #{String(idx + 2).padStart(2, "0")} · {repo.category}
                          </span>
                          <span
                            style={{ fontFamily: "var(--font-ibm-mono)" }}
                            className="tabular-nums inline-flex items-center gap-1 text-xs font-medium"
                          >
                            <Star style={{ color: theme.accent }} className="size-3" />
                            {formatCompactNumber(repo.stars)}
                          </span>
                        </div>
                        <h2 style={{ fontFamily: "var(--font-bricolage)" }} className="text-base font-medium">
                          <Link href={`/repositories/${repo.id}`} className="hover:underline">
                            {repo.full_name}
                          </Link>
                        </h2>
                        <p style={{ color: theme.muted }} className="line-clamp-2 text-xs leading-relaxed">
                          {repo.description_vi}
                        </p>
                      </div>

                      <div
                        style={{ borderColor: theme.line, fontFamily: "var(--font-ibm-mono)", color: theme.muted }}
                        className="mt-4 flex items-center justify-between border-t pt-2.5 text-[11px]"
                      >
                        <div className="flex items-center gap-3">
                          <span>{repo.language || "AI"}</span>
                          <span className="inline-flex items-center gap-1">
                            <GitFork className="size-3" />
                            {formatCompactNumber(repo.forks)}
                          </span>
                        </div>
                        <Link href={`/repositories/${repo.id}`} style={{ color: theme.ink }} className="hover:underline">
                          SPEC →
                        </Link>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          )}

          {tab === "news" && (
            <div className="space-y-4">
              <div
                style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                className="flex items-center justify-between rounded-[6px] border px-4 py-3"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Newspaper style={{ color: theme.accent }} className="size-4" />
                  <span>Tin tức AI &amp; Mục Repo</span>
                </div>
                <span style={{ fontFamily: "var(--font-ibm-mono)", color: theme.muted }} className="text-xs">
                  {news?.stats.total_items || 0} ITEMS
                </span>
              </div>
              <div
                style={{ borderColor: theme.line, backgroundColor: theme.line }}
                className="grid gap-px overflow-hidden rounded-[6px] border md:grid-cols-2"
              >
                {newsItems.slice(0, 6).map((it) => (
                  <article key={it.id} style={{ backgroundColor: theme.surface }} className="space-y-2 p-4">
                    <div className="flex items-center justify-between text-[10px]" style={{ fontFamily: "var(--font-ibm-mono)" }}>
                      <span style={{ color: theme.accent }}>{it.section.toUpperCase()}</span>
                      <span style={{ color: theme.muted }}>{it.source_label}</span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-bricolage)" }} className="text-sm font-medium leading-snug">
                      {it.title}
                    </h3>
                    <p style={{ color: theme.muted }} className="line-clamp-3 text-xs leading-relaxed">
                      {it.summary}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          )}

          {tab === "studio" && (
            <div className="space-y-5">
              <div
                style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                className="rounded-[6px] border p-5"
              >
                <div style={{ color: theme.accent, fontFamily: "var(--font-ibm-mono)" }} className="text-[11px] uppercase">
                  Tactile Studio Workbench
                </div>
                <h1 style={{ fontFamily: "var(--font-bricolage)" }} className="mt-1 text-2xl font-medium">
                  Mở rộng Công cụ AI (Video · Ảnh · Flows · MCP)
                </h1>
              </div>

              <div
                style={{ borderColor: theme.line, backgroundColor: theme.line }}
                className="grid gap-px overflow-hidden rounded-[6px] border sm:grid-cols-2"
              >
                {[
                  { id: "01", title: "Video AI Studio", desc: "Tạo video giải thích, voiceover & timeline theo kịch bản.", icon: Film },
                  { id: "02", title: "Image & POD Studio", desc: "Sinh ảnh sản phẩm hàng loạt & Brand Kit đồng nhất.", icon: ImageIcon },
                  { id: "03", title: "Automation Flows", desc: "Pipeline tự động hóa kết nối Repo -> Tin tức -> Media.", icon: Workflow },
                  { id: "04", title: "MCP & AI Skills", desc: "Quản lý công cụ kết nối agent & đặc tả SKILL.md.", icon: Layers },
                ].map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <div key={tool.id} style={{ backgroundColor: theme.surface }} className="space-y-2 p-5">
                      <div className="flex items-center justify-between">
                        <span style={{ fontFamily: "var(--font-ibm-mono)", color: theme.accent }} className="text-xs">
                          UNIT {tool.id}
                        </span>
                        <Icon style={{ color: theme.muted }} className="size-4" />
                      </div>
                      <h2 style={{ fontFamily: "var(--font-bricolage)" }} className="text-lg font-medium">
                        {tool.title}
                      </h2>
                      <p style={{ color: theme.muted }} className="text-xs leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div
                style={{ backgroundColor: theme.surface, borderColor: theme.line }}
                className="flex items-center justify-between rounded-[6px] border p-4 text-xs"
              >
                <span className="inline-flex items-center gap-2">
                  <Wand2 style={{ color: theme.accent }} className="size-4" />
                  Sẵn sàng gắn trực tiếp module công cụ AI mới vào slot trên lưới này.
                </span>
                <span style={{ fontFamily: "var(--font-ibm-mono)", color: theme.muted }}>MODULAR SLICE READY</span>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
