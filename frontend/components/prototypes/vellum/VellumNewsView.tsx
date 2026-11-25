"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Calendar,
  FolderGit2,
  Headphones,
  Pause,
  Play,
  Search,
  Square,
  X,
} from "lucide-react";
import { BrandLogoBadge, resolveBrandIcon } from "@/components/prototypes/vellum/VellumIcons";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";
import {
  IMPORTANT_TAG,
  type NewsFeedPayload,
  type NewsItem,
  formatNewsDate,
  formatNewsWeekday,
  normalizeVi,
  urlHost,
} from "@/lib/news/types";

interface VellumNewsViewProps {
  theme: VellumTheme;
  dark: boolean;
}

export function VellumNewsView({ theme, dark }: VellumNewsViewProps) {
  const [feed, setFeed] = useState<NewsFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("latest");
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/news/feed")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: NewsFeedPayload | null) => {
        if (d) {
          setFeed(d);
          if (d.days.length > 0) setSelectedDate(d.days[0].date);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const speakItem = (item: NewsItem) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (playingId === item.id) {
      window.speechSynthesis.cancel();
      setPlayingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(item.speech_text || `${item.title}. ${item.summary}`);
    utter.lang = "vi-VN";
    utter.onend = () => setPlayingId(null);
    utter.onerror = () => setPlayingId(null);
    setPlayingId(item.id);
    window.speechSynthesis.speak(utter);
  };

  const stopSpeech = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingId(null);
  };

  const activeDay = useMemo(() => {
    if (!feed?.days.length) return null;
    if (selectedDate === "all") return null;
    return feed.days.find((d) => d.date === selectedDate) || feed.days[0];
  }, [feed, selectedDate]);

  const filteredItems = useMemo(() => {
    const pool = selectedDate === "all" ? (feed?.days || []).flatMap((d) => d.items) : activeDay?.items || [];
    const nq = normalizeVi(query.trim());
    return pool.filter((it) => {
      if (section && it.section !== section) return false;
      if (!nq) return true;
      const hay = normalizeVi(`${it.title} ${it.summary} ${it.source} ${it.section} ${(it.tags || []).join(" ")}`);
      return nq.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [feed, activeDay, selectedDate, section, query]);

  const coverStory = useMemo(() => {
    const withImg = filteredItems.find((it) => it.images && it.images.length > 0 && !it.tip);
    return withImg || filteredItems.find((it) => !it.tip) || filteredItems[0];
  }, [filteredItems]);

  const dispatchItems = useMemo(
    () => filteredItems.filter((it) => it.id !== coverStory?.id && (it.batch === "noon" || it.tags.includes(IMPORTANT_TAG))).slice(0, 4),
    [filteredItems, coverStory]
  );

  const storyGrid = useMemo(() => {
    const used = new Set([coverStory?.id, ...dispatchItems.map((d) => d.id)].filter(Boolean));
    return filteredItems.filter((it) => !used.has(it.id));
  }, [filteredItems, coverStory, dispatchItems]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div style={{ color: theme.muted }} className="text-sm italic">
          Đang dàn trang Tạp chí Tin tức AI...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      {/* Magazine Masthead & Filter Strip */}
      <section style={{ borderColor: theme.rule }} className="space-y-4 border-b pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
              className="text-[11px] font-medium uppercase tracking-widest"
            >
              Vellum Digital Dispatch · {feed?.stats.total_items || 0} bản tin · {feed?.stats.repo_items || 0} mục Repo
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-3xl font-medium sm:text-4xl">
              Tạp chí Tin tức AI &amp; Repo
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="flex h-9 items-center gap-2 rounded-[4px] border px-3"
            >
              <Search style={{ color: theme.muted }} className="size-3.5" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.trim()) setSelectedDate("all");
                }}
                placeholder="Tìm tin không dấu..."
                className="w-44 bg-transparent text-xs outline-none sm:w-56"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label="Xoá tìm kiếm">
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {playingId ? (
              <button
                type="button"
                onClick={stopSpeech}
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                className="inline-flex h-9 items-center gap-1.5 rounded-[4px] px-3.5 text-xs font-medium"
              >
                <Square className="size-3 fill-current" />
                Dừng đọc
              </button>
            ) : (
              coverStory && (
                <button
                  type="button"
                  onClick={() => speakItem(coverStory)}
                  style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[4px] px-3.5 text-xs font-medium"
                >
                  <Headphones className="size-3.5" />
                  Nghe tiêu điểm
                </button>
              )
            )}
          </div>
        </div>

        {/* Editorial Section Filter Bar (Includes Repo + AI sections) */}
        {feed && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setSection("")}
              style={{
                backgroundColor: section === "" ? theme.ink : theme.surface,
                color: section === "" ? theme.bg : theme.ink,
                borderColor: theme.rule,
              }}
              className="shrink-0 rounded-[4px] border px-3 py-1 text-xs font-medium"
            >
              Tất cả chuyên mục
            </button>
            {feed.sections.map((s) => {
              const active = section === s.name;
              const brand = resolveBrandIcon(s.name);
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => setSection(active ? "" : s.name)}
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface,
                    color: active ? theme.accentInk : theme.ink,
                    borderColor: active ? theme.accent : theme.rule,
                  }}
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors"
                >
                  <BrandLogoBadge icon={brand} dark={active ? true : dark} size={13} />
                  <span>{s.short}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Magazine Grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Main Editorial Column (9 cols) */}
        <div className="space-y-8 lg:col-span-9">
          {/* Cover Feature + Dispatch Rail */}
          {coverStory && (
            <section style={{ borderColor: theme.rule }} className="grid gap-6 border-b pb-8 md:grid-cols-12">
              <article className="space-y-3 md:col-span-7">
                <div className="flex items-center gap-2 text-[11px]" style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }}>
                  <BrandLogoBadge icon={resolveBrandIcon(coverStory.section, coverStory.title)} dark={dark} size={14} />
                  <span>{coverStory.section}</span>
                  <span style={{ color: theme.muted }}>· {coverStory.source_label}</span>
                </div>

                {coverStory.images?.[0] && (
                  <div style={{ borderColor: theme.rule, backgroundColor: theme.surfaceAlt }} className="overflow-hidden rounded-[5px] border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={coverStory.images[0]}
                      alt={coverStory.title}
                      className="aspect-[16/9] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                    />
                  </div>
                )}

                <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl leading-snug font-medium sm:text-3xl">
                  {coverStory.title}
                </h2>
                <p style={{ color: theme.muted }} className="text-sm leading-relaxed">
                  {coverStory.summary}
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => speakItem(coverStory)}
                    style={{ borderColor: theme.ruleStrong }}
                    className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 font-medium"
                  >
                    {playingId === coverStory.id ? <Pause className="size-3" /> : <Play className="size-3" />}
                    Nghe bài này
                  </button>
                  {coverStory.repository_id && (
                    <Link
                      href={`/repositories/${coverStory.repository_id}`}
                      style={{ color: theme.accent }}
                      className="inline-flex items-center gap-1 font-medium hover:underline"
                    >
                      <FolderGit2 className="size-3.5" />
                      Chi tiết Repo
                    </Link>
                  )}
                  {coverStory.url && (
                    <a
                      href={coverStory.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: theme.muted }}
                      className="inline-flex items-center gap-1 hover:underline"
                    >
                      {urlHost(coverStory.url)} <ArrowUpRight className="size-3" />
                    </a>
                  )}
                </div>
              </article>

              {/* Dispatch Rail (Tin quan trọng / Tin trưa) */}
              <div
                style={{ borderColor: theme.rule }}
                className="divide-y border-t pt-4 md:col-span-5 md:border-t-0 md:border-l md:pt-0 md:pl-6"
              >
                <div style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="pb-2.5 text-[11px] uppercase tracking-wider">
                  Điểm tin nhanh
                </div>
                {dispatchItems.map((it) => (
                  <div key={it.id} style={{ borderColor: theme.rule }} className="space-y-1.5 py-3">
                    <div className="flex items-center justify-between gap-2 text-[10px]" style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }}>
                      <span>{it.section}</span>
                      <span style={{ color: theme.muted }}>{it.time || formatNewsDate(it.date)}</span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-newsreader)" }} className="text-base leading-snug font-medium">
                      {it.title}
                    </h3>
                    <p style={{ color: theme.muted }} className="line-clamp-2 text-xs leading-relaxed">
                      {it.summary}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 2-Column Editorial Stories */}
          <AnimatePresence mode="wait">
            <motion.section
              key={`${selectedDate}-${section}-${query}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, ease: VELLUM_EASE }}
              className="grid gap-6 md:grid-cols-2"
            >
              {storyGrid.slice(0, 12).map((it) => (
                <article
                  key={it.id}
                  style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                  className="group flex flex-col justify-between overflow-hidden rounded-[6px] border p-4 transition-transform duration-150 hover:-translate-y-0.5"
                >
                  <div className="space-y-2.5">
                    {it.images?.[0] && (
                      <div style={{ borderColor: theme.rule }} className="overflow-hidden rounded-[4px] border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={it.images[0]}
                          alt={it.title}
                          loading="lazy"
                          className="aspect-[16/9] w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: theme.muted }}>
                      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: theme.accent }}>
                        <BrandLogoBadge icon={resolveBrandIcon(it.section, it.title)} dark={dark} size={13} />
                        {it.section}
                      </span>
                      <span style={{ fontFamily: "var(--font-jetbrains)" }} className="text-[10px]">
                        {it.source_label}
                      </span>
                    </div>
                    <h3 style={{ fontFamily: "var(--font-newsreader)" }} className="text-lg leading-snug font-medium">
                      {it.title}
                    </h3>
                    <p style={{ color: theme.muted }} className="line-clamp-3 text-xs leading-relaxed">
                      {it.summary}
                    </p>
                  </div>

                  <div style={{ borderColor: theme.rule }} className="mt-4 flex items-center justify-between border-t pt-2.5 text-xs">
                    <button
                      type="button"
                      onClick={() => speakItem(it)}
                      style={{ color: playingId === it.id ? theme.accent : theme.ink }}
                      className="inline-flex items-center gap-1 font-medium"
                    >
                      {playingId === it.id ? <Pause className="size-3" /> : <Play className="size-3" />}
                      Nghe
                    </button>
                    <div className="flex items-center gap-3">
                      {it.repository_id && (
                        <Link href={`/repositories/${it.repository_id}`} style={{ color: theme.accent }} className="font-medium hover:underline">
                          Xem Repo
                        </Link>
                      )}
                      {it.url && (
                        <a href={it.url} target="_blank" rel="noreferrer" style={{ color: theme.muted }} className="inline-flex items-center gap-0.5 hover:underline">
                          Nguồn <ArrowUpRight className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </motion.section>
          </AnimatePresence>
        </div>

        {/* Right Archive Rail (3 cols) */}
        <aside style={{ borderColor: theme.rule }} className="space-y-5 lg:col-span-3 lg:border-l lg:pl-6">
          <div>
            <div style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
              <Calendar className="size-3.5" />
              Số theo ngày
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSelectedDate("all")}
                style={{
                  backgroundColor: selectedDate === "all" ? theme.ink : theme.surface,
                  color: selectedDate === "all" ? theme.bg : theme.ink,
                  borderColor: theme.rule,
                }}
                className="flex w-full items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium"
              >
                <span>Tất cả ngày</span>
                <span className="tabular-nums opacity-75">{feed?.stats.total_items || 0}</span>
              </button>
              {feed?.days.slice(0, 7).map((d) => {
                const active = selectedDate === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => setSelectedDate(d.date)}
                    style={{
                      backgroundColor: active ? theme.accentSoft : theme.surface,
                      borderColor: active ? theme.accent : theme.rule,
                    }}
                    className="w-full rounded-[4px] border px-3 py-2 text-left text-xs transition-colors"
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">
                        {formatNewsDate(d.date).slice(0, 5)} · {formatNewsWeekday(d.date)}
                      </span>
                      <span style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }} className="tabular-nums text-[11px]">
                        {d.count}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {feed?.weekly && feed.weekly.length > 0 && (
            <div style={{ borderColor: theme.rule }} className="space-y-2 border-t pt-4">
              <div style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="text-[11px] uppercase tracking-wider">
                Tổng kết tuần
              </div>
              {feed.weekly.slice(0, 2).map((w) => (
                <div
                  key={w.week_start}
                  style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                  className="rounded-[5px] border p-3 text-xs"
                >
                  <div className="font-medium">{w.title}</div>
                  <p style={{ color: theme.muted }} className="mt-1 leading-relaxed">
                    {w.intro}
                  </p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
