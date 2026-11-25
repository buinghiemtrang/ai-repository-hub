"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Headphones, Moon, Search, Star, Sun } from "lucide-react";
import { usePrototypeData } from "@/components/prototypes/usePrototypeData";
import { formatCompactNumber, formatViDate } from "@/lib/repositories/types";

export default function PrototypeTwoPage() {
  const { repos, totalRepos, stats, news, loading, q, setQ, category, setCategory } = usePrototypeData();
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<"repos" | "news" | "studio">("repos");

  const theme = dark
    ? {
        bg: "#141210",
        surface: "#1d1a17",
        ink: "#efeae1",
        muted: "#9b9387",
        rule: "rgba(239,234,225,0.14)",
        accent: "#e07a5f",
      }
    : {
        bg: "#f4f1ea",
        surface: "#ece7dc",
        ink: "#181715",
        muted: "#63625c",
        rule: "rgba(24,23,21,0.14)",
        accent: "#b93815",
      };

  const leadRepo = repos[0];
  const rankedRepos = repos.slice(1, 6);
  const archiveRepos = repos.slice(6, 12);
  const newsItems = news?.days?.[0]?.items || [];

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.ink,
        fontFamily: "var(--font-hanken), system-ui, sans-serif",
      }}
      className="min-h-screen transition-colors duration-150"
    >
      {/* Editorial Top Masthead (No left sidebar) */}
      <header style={{ borderColor: theme.rule, backgroundColor: theme.bg }} className="sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
          <div className="flex items-baseline gap-4">
            <Link href="/prototypes" style={{ color: theme.muted }} className="text-xs hover:underline">
              ← So sánh
            </Link>
            <span
              style={{ fontFamily: "var(--font-newsreader)" }}
              className="text-2xl font-medium tracking-tight"
            >
              AI Repo Hub
            </span>
            <span style={{ color: theme.muted }} className="hidden text-xs italic sm:inline">
              Ấn bản Vellum Editorial
            </span>
          </div>

          <nav className="flex items-center gap-6 text-sm">
            {[
              { id: "repos" as const, label: "Thư viện" },
              { id: "news" as const, label: "Tạp chí Tin" },
              { id: "studio" as const, label: "Xưởng AI" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                style={{
                  borderColor: tab === item.id ? theme.accent : "transparent",
                  color: tab === item.id ? theme.ink : theme.muted,
                }}
                className="border-b-2 py-1 font-medium transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {(["1", "2", "3"] as const).map((id) => (
              <Link
                key={id}
                href={`/prototypes/${id}`}
                style={{
                  borderColor: id === "2" ? theme.accent : theme.rule,
                  color: id === "2" ? theme.accent : theme.muted,
                }}
                className="rounded-xs border px-2 py-1 font-mono text-[11px]"
              >
                P{id}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              style={{ borderColor: theme.rule, color: theme.ink }}
              className="ml-1 flex size-8 items-center justify-center rounded-xs border"
              title="Chuyển sáng/tối"
            >
              {dark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-8">
        {tab === "repos" && (
          <div className="space-y-10">
            {/* Editorial Title + Inline Search & Filter Strip */}
            <section style={{ borderColor: theme.rule }} className="grid gap-6 border-b pb-6 md:grid-cols-[1.4fr_1fr] md:items-end">
              <div>
                <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-[11px] uppercase tracking-widest">
                  Số đặc biệt · {totalRepos} Dự án mã nguồn mở
                </div>
                <h1
                  style={{ fontFamily: "var(--font-newsreader)" }}
                  className="mt-2 text-4xl leading-[1.1] font-normal tracking-tight sm:text-5xl"
                >
                  Tuyển tập công cụ &amp; thư viện AI đáng chú ý nhất.
                </h1>
              </div>

              <div className="space-y-2.5">
                <div style={{ borderColor: theme.rule, backgroundColor: theme.surface }} className="flex items-center gap-2 border px-3 py-2">
                  <Search style={{ color: theme.muted }} className="size-4 shrink-0" />
                  <input
                    type="search"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Tìm trong lưu trữ (có hoặc không dấu)..."
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setCategory("")}
                    style={{ color: !category ? theme.accent : theme.muted }}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    Tất cả
                  </button>
                  {stats?.categories.slice(0, 6).map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(c.name === category ? "" : c.name)}
                      style={{ color: category === c.name ? theme.accent : theme.muted }}
                      className="font-medium underline-offset-4 hover:underline"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {loading && <div className="py-8 text-sm italic">Đang dàn trang dữ liệu thật...</div>}

            {/* Asymmetric 7/5 Magazine Feature + Ranked Column */}
            {!loading && leadRepo && (
              <section style={{ borderColor: theme.rule }} className="grid gap-8 border-b pb-10 lg:grid-cols-12">
                {/* 7-col Lead Spotlight */}
                <article className="space-y-4 lg:col-span-7">
                  <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-xs uppercase tracking-wider">
                    Tiêu điểm · {leadRepo.category}
                  </div>
                  {leadRepo.has_custom_image && leadRepo.image_url ? (
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={leadRepo.image_url}
                        alt={leadRepo.full_name}
                        className="aspect-[16/9] w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div
                      style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                      className="flex items-center justify-between border px-6 py-8"
                    >
                      <div>
                        <div style={{ color: theme.muted }} className="font-mono text-xs">
                          GitHub Open Source
                        </div>
                        <div style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-3xl">
                          {leadRepo.full_name}
                        </div>
                      </div>
                      <div style={{ fontFamily: "var(--font-jetbrains)" }} className="text-right">
                        <div className="text-2xl font-medium">{formatCompactNumber(leadRepo.stars)}</div>
                        <div style={{ color: theme.muted }} className="text-[11px]">
                          STARS
                        </div>
                      </div>
                    </div>
                  )}

                  <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-3xl leading-tight font-normal">
                    {leadRepo.full_name}
                  </h2>
                  <p className="text-base leading-relaxed">{leadRepo.description_vi}</p>
                  <div style={{ color: theme.muted }} className="flex flex-wrap items-center gap-4 text-xs">
                    <span>{leadRepo.language || "Multi-language"}</span>
                    <span>·</span>
                    <span>{formatCompactNumber(leadRepo.stars)} stars</span>
                    <span>·</span>
                    <span>Cập nhật {formatViDate(leadRepo.updated_at)}</span>
                    <a
                      href={leadRepo.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: theme.accent }}
                      className="inline-flex items-center gap-1 font-medium underline underline-offset-4"
                    >
                      Đọc tài liệu GitHub
                      <ArrowUpRight className="size-3.5" />
                    </a>
                  </div>
                </article>

                {/* 5-col Ranked Index */}
                <div style={{ borderColor: theme.rule }} className="divide-y border-t lg:col-span-5 lg:border-t-0 lg:border-l lg:pl-8">
                  <div className="pb-3 text-xs font-medium uppercase tracking-widest">
                    Xếp hạng nổi bật
                  </div>
                  {rankedRepos.map((repo, idx) => (
                    <div
                      key={repo.id}
                      style={{ borderColor: theme.rule }}
                      className="flex items-start gap-4 py-4"
                    >
                      <span
                        style={{ color: theme.accent, fontFamily: "var(--font-newsreader)" }}
                        className="text-2xl leading-none italic"
                      >
                        0{idx + 2}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <Link href={`/repositories/${repo.id}`} className="truncate text-base font-medium hover:underline">
                            {repo.full_name}
                          </Link>
                          <span style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="tabular-nums shrink-0 text-xs">
                            ★ {formatCompactNumber(repo.stars)}
                          </span>
                        </div>
                        <p style={{ color: theme.muted }} className="line-clamp-2 text-sm leading-relaxed">
                          {repo.description_vi}
                        </p>
                        <div style={{ color: theme.muted }} className="text-[11px]">
                          {repo.category} {repo.language ? `· ${repo.language}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2-Column Editorial Archive Grid (No rounded boxes, hairline separated) */}
            {!loading && archiveRepos.length > 0 && (
              <section className="space-y-4">
                <h3 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl font-normal">
                  Danh mục lưu trữ gần đây
                </h3>
                <div style={{ borderColor: theme.rule }} className="grid gap-x-10 gap-y-6 border-t pt-6 md:grid-cols-2">
                  {archiveRepos.map((repo) => (
                    <article
                      key={repo.id}
                      style={{ borderColor: theme.rule }}
                      className="flex items-start justify-between gap-4 border-b pb-5"
                    >
                      <div className="space-y-1.5">
                        <div style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }} className="text-[11px] uppercase">
                          {repo.category} · {repo.language || "AI"}
                        </div>
                        <h4 style={{ fontFamily: "var(--font-newsreader)" }} className="text-xl font-normal">
                          <Link href={`/repositories/${repo.id}`} className="hover:underline">
                            {repo.full_name}
                          </Link>
                        </h4>
                        <p style={{ color: theme.muted }} className="line-clamp-2 text-sm leading-relaxed">
                          {repo.description_vi}
                        </p>
                      </div>
                      <div style={{ fontFamily: "var(--font-jetbrains)" }} className="shrink-0 text-right text-xs">
                        <div className="inline-flex items-center gap-1 font-medium">
                          <Star className="size-3" />
                          {formatCompactNumber(repo.stars)}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {tab === "news" && (
          <div className="space-y-8">
            <div style={{ borderColor: theme.rule }} className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
              <div>
                <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-xs uppercase tracking-widest">
                  Bản tin công nghệ &amp; Repo
                </div>
                <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-4xl font-normal">
                  Tạp chí AI Hằng Ngày
                </h1>
              </div>
              <button
                type="button"
                style={{ backgroundColor: theme.accent, color: "#ffffff" }}
                className="inline-flex items-center gap-2 rounded-xs px-4 py-2 text-xs font-medium"
              >
                <Headphones className="size-3.5" />
                Nghe Podcast số hôm nay
              </button>
            </div>

            <div className="grid gap-10 lg:grid-cols-12">
              <div className="space-y-6 lg:col-span-8">
                {newsItems.slice(0, 6).map((it, idx) => (
                  <article key={it.id} style={{ borderColor: theme.rule }} className="space-y-2 border-b pb-6">
                    <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-[11px] uppercase">
                      {it.section} · {it.source_label}
                    </div>
                    <h2
                      style={{ fontFamily: "var(--font-newsreader)" }}
                      className={idx === 0 ? "text-3xl leading-tight font-normal" : "text-2xl leading-snug font-normal"}
                    >
                      {it.title}
                    </h2>
                    <p className="text-sm leading-relaxed">{it.summary}</p>
                    {it.url && (
                      <a
                        href={it.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: theme.accent }}
                        className="inline-flex items-center gap-1 text-xs font-medium underline underline-offset-4"
                      >
                        Đọc bài gốc <ArrowUpRight className="size-3" />
                      </a>
                    )}
                  </article>
                ))}
              </div>
              <aside style={{ borderColor: theme.rule }} className="space-y-4 lg:col-span-4 lg:border-l lg:pl-8">
                <div className="text-xs font-medium uppercase tracking-widest">Chuyên mục</div>
                <ul style={{ borderColor: theme.rule }} className="divide-y text-sm">
                  {news?.sections.map((s) => (
                    <li key={s.name} style={{ borderColor: theme.rule }} className="flex items-center justify-between py-2.5">
                      <span>{s.name}</span>
                      <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
                    </li>
                  ))}
                </ul>
              </aside>
            </div>
          </div>
        )}

        {tab === "studio" && (
          <div className="space-y-8">
            <div style={{ borderColor: theme.rule }} className="border-b pb-5">
              <div style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="text-xs uppercase tracking-widest">
                Creative Desk
              </div>
              <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-4xl font-normal">
                Xưởng Sáng Tạo Công Cụ AI
              </h1>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {[
                ["01", "Video Giải thích & Timeline", "Soạn kịch bản từ tin tức hoặc repo, cắt cảnh tự động và ghép giọng đọc."],
                ["02", "Thiết kế Ảnh AI & Brand Kit", "Sinh ảnh sản phẩm hàng loạt và chuẩn hóa nhận diện thương hiệu."],
                ["03", "Flows & Tự động hóa", "Lắp ghép quy trình từ dữ liệu PostgreSQL đến xuất bản đa kênh."],
                ["04", "MCP & AI Skills", "Chuẩn hóa công cụ cho agent lập trình và trợ lý cá nhân."],
              ].map(([num, title, desc]) => (
                <div key={num} style={{ borderColor: theme.rule }} className="space-y-2 border-t pt-4">
                  <span style={{ color: theme.accent, fontFamily: "var(--font-newsreader)" }} className="text-2xl italic">
                    {num}
                  </span>
                  <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl font-normal">
                    {title}
                  </h2>
                  <p style={{ color: theme.muted }} className="text-sm leading-relaxed">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
