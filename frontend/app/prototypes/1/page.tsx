"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  Command,
  Film,
  GitFork,
  Image as ImageIcon,
  Layers,
  Moon,
  Newspaper,
  Search,
  Star,
  Sun,
  Terminal,
  Wand2,
  Workflow,
} from "lucide-react";
import { usePrototypeData } from "@/components/prototypes/usePrototypeData";
import { formatCompactNumber, formatViDate, type RepoItem } from "@/lib/repositories/types";

export default function PrototypeOnePage() {
  const { repos, totalRepos, stats, news, loading, q, setQ, category, setCategory, language, setLanguage } =
    usePrototypeData();
  const [dark, setDark] = useState(true);
  const [tab, setTab] = useState<"repos" | "news" | "studio">("repos");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<RepoItem | null>(null);

  useEffect(() => {
    if (!selectedId && repos.length > 0) {
      setSelectedId(repos[0].id);
    }
  }, [repos, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    fetch(`/api/repositories/${selectedId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setSelectedDetail(d))
      .catch(() => {});
  }, [selectedId]);

  // Keyboard navigation in ledger
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (tab !== "repos" || !repos.length) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "select") return;
      const idx = repos.findIndex((r) => r.id === selectedId);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedId(repos[Math.min(repos.length - 1, Math.max(0, idx + 1))].id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedId(repos[Math.max(0, idx - 1)].id);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tab, repos, selectedId]);

  const activeRepo = selectedDetail || repos.find((r) => r.id === selectedId) || repos[0];
  const newsItems = news?.days?.[0]?.items?.slice(0, 8) || [];

  const themeVars = dark
    ? {
        bg: "#0c0c0d",
        surface: "#141416",
        surface2: "#1b1b1e",
        ink: "#ededec",
        muted: "#8b8b8e",
        border: "rgba(255,255,255,0.09)",
        accent: "#3b82f6",
        accentText: "#ffffff",
      }
    : {
        bg: "#fafafa",
        surface: "#ffffff",
        surface2: "#f3f4f6",
        ink: "#111113",
        muted: "#6b7280",
        border: "rgba(17,17,19,0.1)",
        accent: "#1a4be0",
        accentText: "#ffffff",
      };

  return (
    <div
      style={{
        backgroundColor: themeVars.bg,
        color: themeVars.ink,
        fontFamily: "var(--font-geist), system-ui, sans-serif",
      }}
      className="flex min-h-screen flex-col transition-colors duration-150"
    >
      {/* Top 48px Command Bar */}
      <header
        style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
        className="sticky top-0 z-30 flex h-12 items-center justify-between border-b px-3"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/prototypes"
            style={{ color: themeVars.muted }}
            className="text-xs hover:underline"
          >
            ← So sánh
          </Link>
          <span style={{ color: themeVars.border }}>|</span>
          <div className="flex items-center gap-2 text-xs font-medium tracking-tight">
            <span
              style={{ backgroundColor: themeVars.accent, color: themeVars.accentText }}
              className="flex size-5 items-center justify-center rounded-[4px] font-mono text-[10px]"
            >
              AR
            </span>
            <span>AI Repo Hub</span>
            <span style={{ color: themeVars.muted }} className="hidden sm:inline">
              / Obsidian Ledger
            </span>
          </div>
        </div>

        {/* Center Command Search */}
        <div className="mx-3 hidden max-w-md flex-1 md:block">
          <div
            style={{ backgroundColor: themeVars.bg, borderColor: themeVars.border }}
            className="flex h-8 items-center gap-2 rounded-[6px] border px-2.5"
          >
            <Search style={{ color: themeVars.muted }} className="size-3.5 shrink-0" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm repo theo tên, công nghệ, mô tả..."
              className="w-full bg-transparent text-xs outline-none"
            />
            <span
              style={{ color: themeVars.muted, borderColor: themeVars.border }}
              className="inline-flex items-center gap-0.5 rounded border px-1 py-0.5 font-mono text-[10px]"
            >
              <Command className="size-2.5" />K
            </span>
          </div>
        </div>

        {/* Switcher + Theme */}
        <div className="flex items-center gap-1.5 text-xs">
          {(["1", "2", "3"] as const).map((id) => (
            <Link
              key={id}
              href={`/prototypes/${id}`}
              style={{
                borderColor: id === "1" ? themeVars.accent : themeVars.border,
                color: id === "1" ? themeVars.accent : themeVars.muted,
              }}
              className="rounded-[5px] border px-2 py-1 font-mono text-[11px]"
            >
              P{id}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            style={{ borderColor: themeVars.border, color: themeVars.muted }}
            className="ml-1 flex size-7 items-center justify-center rounded-[5px] border"
            title="Đổi Light / Dark"
          >
            {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          </button>
        </div>
      </header>

      {/* Body: Slim 52px Icon Rail + Split-Pane Workspace */}
      <div className="flex flex-1">
        {/* Slim Icon Rail */}
        <aside
          style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
          className="flex w-[52px] shrink-0 flex-col items-center gap-2 border-r py-3"
        >
          {[
            { id: "repos" as const, icon: BookOpen, label: "Thư viện Repo" },
            { id: "news" as const, icon: Newspaper, label: "Tin tức AI" },
            { id: "studio" as const, icon: Wand2, label: "AI Studio" },
          ].map((nav) => {
            const Icon = nav.icon;
            const active = tab === nav.id;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => setTab(nav.id)}
                title={nav.label}
                style={{
                  backgroundColor: active ? themeVars.surface2 : "transparent",
                  color: active ? themeVars.ink : themeVars.muted,
                  borderColor: active ? themeVars.accent : "transparent",
                }}
                className="flex size-9 items-center justify-center rounded-[6px] border-l-2 transition-colors"
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </aside>

        {/* Main Workspace Content */}
        {tab === "repos" && (
          <div className="grid flex-1 lg:grid-cols-[1fr_440px]">
            {/* Left Ledger List */}
            <div style={{ borderColor: themeVars.border }} className="flex min-w-0 flex-col border-r">
              {/* Filter Bar */}
              <div
                style={{ borderColor: themeVars.border, backgroundColor: themeVars.bg }}
                className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5 text-xs"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Catalog</span>
                  <span
                    style={{ color: themeVars.muted, fontFamily: "var(--font-geist-mono)" }}
                    className="tabular-nums text-[11px]"
                  >
                    {totalRepos} repos
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
                    className="h-7 rounded-[5px] border px-2 text-xs outline-none"
                  >
                    <option value="">Tất cả danh mục</option>
                    {stats?.categories.map((c) => (
                      <option key={c.name} value={c.name}>
                        {c.name} ({c.count})
                      </option>
                    ))}
                  </select>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
                    className="h-7 rounded-[5px] border px-2 text-xs outline-none"
                  >
                    <option value="">Mọi ngôn ngữ</option>
                    {stats?.languages.map((l) => (
                      <option key={l.name} value={l.name}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
                <span style={{ color: themeVars.muted }} className="hidden font-mono text-[11px] sm:inline">
                  ↑ / ↓ chọn · Enter mở
                </span>
              </div>

              {/* Ledger Rows */}
              <div className="divide-y" style={{ borderColor: themeVars.border }}>
                {loading && (
                  <div style={{ color: themeVars.muted }} className="p-6 text-xs">
                    Đang tải dữ liệu thật từ catalog...
                  </div>
                )}
                {!loading &&
                  repos.map((repo) => {
                    const isSelected = activeRepo?.id === repo.id;
                    return (
                      <button
                        key={repo.id}
                        type="button"
                        onClick={() => setSelectedId(repo.id)}
                        style={{
                          backgroundColor: isSelected ? themeVars.surface2 : "transparent",
                          borderColor: themeVars.border,
                        }}
                        className="flex w-full items-center justify-between gap-4 border-b px-4 py-3 text-left transition-colors hover:opacity-95"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              style={{
                                backgroundColor: isSelected ? themeVars.accent : themeVars.muted,
                              }}
                              className="size-1.5 shrink-0 rounded-full"
                            />
                            <span className="truncate text-[13px] font-medium">{repo.full_name}</span>
                            <span
                              style={{ color: themeVars.muted }}
                              className="hidden shrink-0 text-[11px] sm:inline"
                            >
                              · {repo.category}
                            </span>
                          </div>
                          <p
                            style={{ color: themeVars.muted }}
                            className="mt-0.5 truncate pl-3.5 text-xs"
                          >
                            {repo.description_vi}
                          </p>
                        </div>

                        <div
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                          className="flex shrink-0 items-center gap-4 text-[11px]"
                        >
                          {repo.language && (
                            <span style={{ color: themeVars.muted }} className="hidden sm:inline">
                              {repo.language}
                            </span>
                          )}
                          <span className="tabular-nums inline-flex items-center gap-1 font-medium">
                            <Star className="size-3" />
                            {formatCompactNumber(repo.stars)}
                          </span>
                          <span
                            style={{ color: themeVars.muted }}
                            className="tabular-nums hidden items-center gap-1 md:inline-flex"
                          >
                            <GitFork className="size-3" />
                            {formatCompactNumber(repo.forks)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>

            {/* Right Split-Pane Live Inspector */}
            <aside
              style={{ backgroundColor: themeVars.surface }}
              className="hidden flex-col justify-between p-5 lg:flex"
            >
              {activeRepo ? (
                <div className="space-y-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div
                        style={{ color: themeVars.accent, fontFamily: "var(--font-geist-mono)" }}
                        className="text-[11px] uppercase tracking-wider"
                      >
                        {activeRepo.category}
                      </div>
                      <h2 className="mt-1 text-lg font-medium tracking-tight">
                        {activeRepo.full_name}
                      </h2>
                    </div>
                    <a
                      href={activeRepo.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        backgroundColor: themeVars.accent,
                        color: themeVars.accentText,
                      }}
                      className="inline-flex items-center gap-1 rounded-[5px] px-2.5 py-1.5 text-xs font-medium"
                    >
                      GitHub
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>

                  {activeRepo.has_custom_image && activeRepo.image_url && (
                    <div
                      style={{ borderColor: themeVars.border }}
                      className="overflow-hidden rounded-[6px] border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeRepo.image_url}
                        alt={activeRepo.full_name}
                        className="aspect-[2/1] w-full object-cover"
                      />
                    </div>
                  )}

                  <p className="text-[13px] leading-relaxed">{activeRepo.description_vi}</p>

                  {/* Spec Matrix */}
                  <div
                    style={{ borderColor: themeVars.border, backgroundColor: themeVars.bg }}
                    className="grid grid-cols-2 gap-px overflow-hidden rounded-[6px] border text-xs"
                  >
                    {[
                      ["Stars", formatCompactNumber(activeRepo.stars)],
                      ["Forks", formatCompactNumber(activeRepo.forks)],
                      ["Ngôn ngữ", activeRepo.language || "—"],
                      ["Giấy phép", activeRepo.license || "—"],
                      ["Cập nhật", formatViDate(activeRepo.updated_at)],
                      ["Nhánh", activeRepo.default_branch || "main"],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{ backgroundColor: themeVars.surface }}
                        className="px-3 py-2"
                      >
                        <div style={{ color: themeVars.muted }} className="text-[11px]">
                          {k}
                        </div>
                        <div
                          style={{ fontFamily: "var(--font-geist-mono)" }}
                          className="tabular-nums mt-0.5 font-medium"
                        >
                          {v}
                        </div>
                      </div>
                    ))}
                  </div>

                  {activeRepo.guide_vi && (
                    <div className="space-y-2">
                      <div
                        style={{ color: themeVars.muted }}
                        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider"
                      >
                        <Terminal className="size-3.5" />
                        Trích hướng dẫn cài đặt
                      </div>
                      <pre
                        style={{
                          backgroundColor: themeVars.bg,
                          borderColor: themeVars.border,
                          fontFamily: "var(--font-geist-mono)",
                        }}
                        className="max-h-56 overflow-auto rounded-[6px] border p-3 text-[11px] leading-relaxed whitespace-pre-wrap"
                      >
                        {activeRepo.guide_vi.slice(0, 700)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: themeVars.muted }} className="text-xs">
                  Chọn một repository bên trái để xem chi tiết.
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === "news" && (
          <div className="mx-auto w-full max-w-5xl space-y-4 p-6">
            <div style={{ borderColor: themeVars.border }} className="flex items-center justify-between border-b pb-3">
              <div>
                <h1 className="text-lg font-medium">Bản tin AI & Repo · Stream</h1>
                <p style={{ color: themeVars.muted }} className="text-xs">
                  Đọc nhanh theo dòng thời gian kỹ thuật, kết nối mục Repo & TTS
                </p>
              </div>
              <span style={{ fontFamily: "var(--font-geist-mono)", color: themeVars.accent }} className="text-xs">
                {news?.stats.total_items || 0} bản tin
              </span>
            </div>
            <div style={{ borderColor: themeVars.border }} className="divide-y rounded-[6px] border">
              {newsItems.map((it) => (
                <div
                  key={it.id}
                  style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
                  className="flex items-start justify-between gap-4 px-4 py-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-[11px]">
                      <span style={{ color: themeVars.accent, fontFamily: "var(--font-geist-mono)" }}>
                        [{it.section}]
                      </span>
                      <span style={{ color: themeVars.muted }}>{it.source_label}</span>
                      <span style={{ color: themeVars.muted }}>{it.time}</span>
                    </div>
                    <h3 className="text-sm font-medium">{it.title}</h3>
                    <p style={{ color: themeVars.muted }} className="text-xs leading-relaxed">
                      {it.summary}
                    </p>
                  </div>
                  {it.url && (
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: themeVars.muted }}
                      className="shrink-0 p-1 hover:underline"
                    >
                      <ArrowUpRight className="size-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "studio" && (
          <div className="mx-auto w-full max-w-5xl space-y-5 p-6">
            <div style={{ borderColor: themeVars.border }} className="border-b pb-3">
              <h1 className="text-lg font-medium">AI Studio · Workbench Modules</h1>
              <p style={{ color: themeVars.muted }} className="text-xs">
                Mỗi công cụ AI gắn trực tiếp thành panel riêng trong kiến trúc split-pane.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: "Video AI Timeline", desc: "Kịch bản, voiceover & render tự động", icon: Film, state: "Module slot" },
                { name: "Image & POD Batch", desc: "Sinh ảnh sản phẩm & tách nền hàng loạt", icon: ImageIcon, state: "Module slot" },
                { name: "Flows & Pipelines", desc: "Tự động hóa chuỗi Repo -> Tin -> Video", icon: Workflow, state: "Module slot" },
                { name: "MCP & AI Skills", desc: "Quản lý server giao thức & SKILL.md", icon: Layers, state: "Module slot" },
              ].map((tool) => {
                const Icon = tool.icon;
                return (
                  <div
                    key={tool.name}
                    style={{ backgroundColor: themeVars.surface, borderColor: themeVars.border }}
                    className="flex items-start justify-between rounded-[6px] border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <Icon style={{ color: themeVars.accent }} className="mt-0.5 size-4 shrink-0" />
                      <div>
                        <div className="text-sm font-medium">{tool.name}</div>
                        <div style={{ color: themeVars.muted }} className="mt-0.5 text-xs">
                          {tool.desc}
                        </div>
                      </div>
                    </div>
                    <span
                      style={{ color: themeVars.muted, fontFamily: "var(--font-geist-mono)" }}
                      className="text-[10px]"
                    >
                      {tool.state}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
