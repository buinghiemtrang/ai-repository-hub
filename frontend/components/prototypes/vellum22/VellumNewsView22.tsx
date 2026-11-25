"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  FolderGit2,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Search,
  Square,
  X,
} from "lucide-react";
import { NewsDetailDrawer22 } from "@/components/prototypes/vellum22/NewsDetailDrawer22";
import { NewsCategoryIcon } from "@/components/prototypes/vellum22/VellumIcons22";
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

interface VellumNewsView22Props {
  theme: VellumTheme;
  dark: boolean;
  rc?: boolean;
  onOpenRepoById?: (repoId: number) => void;
}

const STORIES_PER_PAGE = 10;

function SafeNewsThumb({
  src,
  alt,
  bg,
  borderColor,
  aspect = "aspect-[16/9]",
  priority = false,
}: {
  src?: string;
  alt: string;
  bg: string;
  borderColor: string;
  aspect?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  return (
    <div style={{ borderColor, backgroundColor: bg }} className="overflow-hidden rounded-[4px] border">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailed(true)}
        className={`${aspect} w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]`}
      />
    </div>
  );
}

/** Deduplicate items by ID and return exact count (never double-counting multi-tag/section items). */
function getItemSections(it: NewsItem): string[] {
  const extended = (it as NewsItem & { sections?: string[] }).sections;
  if (Array.isArray(extended) && extended.length > 0) {
    return Array.from(new Set(extended.filter(Boolean)));
  }
  return [it.section || "Ứng dụng thực tế"];
}

export function VellumNewsView22({ theme, dark, rc = false, onOpenRepoById }: VellumNewsView22Props) {
  const [feed, setFeed] = useState<NewsFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("");
  const [query, setQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("latest");
  const [page, setPage] = useState(1);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);

  useEffect(() => {
    fetch("/api/news/feed?days_limit=90")
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
    if (!feed?.days.length || selectedDate === "all") return null;
    return feed.days.find((d) => d.date === selectedDate) || feed.days[0];
  }, [feed, selectedDate]);

  // 0. Total unique items within the active date scope (before search query & category)
  const scopedTotalCount = useMemo(() => {
    const rawPool =
      selectedDate === "all" ? (feed?.days || []).flatMap((d) => d.items) : activeDay?.items || [];
    const seen = new Set<string>();
    for (const it of rawPool) seen.add(it.id);
    return seen.size;
  }, [feed, activeDay, selectedDate]);

  // 1. Base pool filtered ONLY by active date scope and search query `q` (ignores active `section` & pagination).
  const baseScopedItems = useMemo(() => {
    const rawPool =
      selectedDate === "all" ? (feed?.days || []).flatMap((d) => d.items) : activeDay?.items || [];
    const nq = normalizeVi(query.trim());
    const seen = new Set<string>();
    const result: NewsItem[] = [];
    for (const it of rawPool) {
      if (seen.has(it.id)) continue;
      if (nq) {
        const hay = normalizeVi(
          `${it.title} ${it.summary} ${it.excerpt || ""} ${it.source} ${it.section} ${(it.tags || []).join(" ")}`
        );
        if (!nq.split(/\s+/).every((t) => hay.includes(t))) continue;
      }
      seen.add(it.id);
      result.push(it);
    }
    return result;
  }, [feed, activeDay, selectedDate, query]);

  // 2. Accurate unique counts per category across entire date + search scope (updates live on date or `q` change).
  const categoryStats = useMemo(() => {
    const countsBySection: Record<string, number> = {};
    for (const s of feed?.sections || []) countsBySection[s.name] = 0;

    const perSectionSets: Record<string, Set<string>> = {};
    const allIds = new Set<string>();

    for (const it of baseScopedItems) {
      allIds.add(it.id);
      for (const sec of getItemSections(it)) {
        if (!perSectionSets[sec]) perSectionSets[sec] = new Set<string>();
        perSectionSets[sec].add(it.id);
      }
    }
    for (const [sec, idSet] of Object.entries(perSectionSets)) {
      countsBySection[sec] = idSet.size;
    }

    const extraSections = Object.keys(countsBySection).filter(
      (name) => !(feed?.sections || []).some((s) => s.name === name)
    );

    return {
      allCount: allIds.size,
      counts: countsBySection,
      extraSections,
    };
  }, [feed?.sections, baseScopedItems]);

  // 3. Apply active category section filter
  const filteredItems = useMemo(() => {
    if (!section) return baseScopedItems;
    return baseScopedItems.filter((it) => getItemSections(it).includes(section));
  }, [baseScopedItems, section]);

  // 4. Smart Featured Story selection: when viewing "Tất cả chuyên mục", prioritize important AI news over Repo mirrors
  const coverStory = useMemo(() => {
    if (filteredItems.length === 0) return undefined;
    const pool = section ? filteredItems : filteredItems.filter((it) => !it.tip);
    const candidates = pool.length > 0 ? pool : filteredItems;

    const scored = [...candidates].sort((a, b) => {
      const score = (it: NewsItem) => {
        const isRepo = it.section === "Repo";
        const newsBoost = !section && !isRepo ? 60 : 0;
        const impBoost = it.tags?.includes(IMPORTANT_TAG) ? 50 : 0;
        const pickedBoost = it.picked ? 30 : 0;
        const imgBoost = it.images && it.images.length > 0 ? 15 : 0;
        return newsBoost + impBoost + pickedBoost + imgBoost;
      };
      return score(b) - score(a);
    });
    return scored[0];
  }, [filteredItems, section]);

  const dispatchItems = useMemo(
    () =>
      filteredItems
        .filter((it) => it.id !== coverStory?.id && (it.batch === "noon" || it.tags?.includes(IMPORTANT_TAG)))
        .slice(0, 4),
    [filteredItems, coverStory]
  );

  const storyGridAll = useMemo(() => {
    const used = new Set([coverStory?.id, ...dispatchItems.map((d) => d.id)].filter(Boolean));
    return filteredItems.filter((it) => !used.has(it.id));
  }, [filteredItems, coverStory, dispatchItems]);

  const totalPages = Math.max(1, Math.ceil(storyGridAll.length / STORIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pagedStories = storyGridAll.slice((safePage - 1) * STORIES_PER_PAGE, safePage * STORIES_PER_PAGE);

  const sectionList = useMemo(() => {
    const base = feed?.sections || [];
    const extras = categoryStats.extraSections.map((name) => ({ name, short: name, color: theme.accent }));
    return [...base, ...extras];
  }, [feed?.sections, categoryStats.extraSections, theme.accent]);

  const activeSectionShort = useMemo(() => {
    if (!section) return "";
    return sectionList.find((s) => s.name === section)?.short || section;
  }, [section, sectionList]);

  const rcResultSummary = useMemo(() => {
    const dateScopeText =
      selectedDate === "all"
        ? `trong lưu trữ (${feed?.days.length || 0} ngày)`
        : `trong ngày ${formatNewsDate(activeDay?.date || "")}`;
    const hasQuery = Boolean(query.trim());
    if (!section && !hasQuery) {
      return `${scopedTotalCount} tin ${dateScopeText}`;
    }
    if (section && !hasQuery) {
      return `${filteredItems.length} kết quả (${activeSectionShort}) · ${scopedTotalCount} tin ${dateScopeText}`;
    }
    if (!section && hasQuery) {
      return `${categoryStats.allCount} kết quả tìm kiếm · ${scopedTotalCount} tin ${dateScopeText}`;
    }
    return `${filteredItems.length} kết quả (${activeSectionShort}) · ${categoryStats.allCount} khớp từ khóa · ${scopedTotalCount} tin ${dateScopeText}`;
  }, [
    selectedDate,
    feed?.days.length,
    activeDay?.date,
    query,
    section,
    activeSectionShort,
    scopedTotalCount,
    filteredItems.length,
    categoryStats.allCount,
  ]);

  const articleIndex = activeArticle ? filteredItems.findIndex((x) => x.id === activeArticle.id) : -1;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <div style={{ backgroundColor: theme.surfaceAlt }} className="h-24 animate-pulse rounded-[6px]" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div style={{ backgroundColor: theme.surfaceAlt }} className="h-80 animate-pulse rounded-[6px] lg:col-span-9" />
          <div style={{ backgroundColor: theme.surfaceAlt }} className="h-80 animate-pulse rounded-[6px] lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      {/* Magazine Masthead & Search */}
      <section style={{ borderColor: theme.rule }} className="space-y-4 border-b pb-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div
              style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
              className="tabular-nums text-[11px] font-medium uppercase tracking-widest"
            >
              {rc
                ? `Vellum Digital Dispatch · ${rcResultSummary}`
                : `Vellum Digital Dispatch · ${
                    selectedDate === "all" ? "Toàn bộ lưu trữ" : formatNewsDate(activeDay?.date || "")
                  } · ${categoryStats.allCount} bài viết khớp bộ lọc`}
            </div>
            <h1 style={{ fontFamily: "var(--font-newsreader)" }} className="mt-1 text-3xl font-medium sm:text-4xl">
              Tạp chí Tin tức AI &amp; Repo
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className={`flex items-center gap-2 rounded-[4px] border px-3 transition-all duration-150 focus-within:ring-2 focus-within:ring-[#c84b24]/30 ${
                rc ? "h-11 sm:h-9" : "h-9"
              }`}
            >
              <Search style={{ color: theme.muted }} className="size-3.5" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Tìm tin không dấu..."
                className={`w-44 bg-transparent text-xs outline-none sm:w-56 ${
                  rc
                    ? dark
                      ? "placeholder:text-[#B8B0A4]"
                      : "placeholder:text-[#57534B]"
                    : ""
                }`}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setPage(1);
                  }}
                  className={
                    rc
                      ? "flex size-11 -mr-2.5 items-center justify-center sm:size-6 sm:mr-0"
                      : ""
                  }
                  aria-label="Xoá tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {playingId ? (
              <button
                type="button"
                onClick={stopSpeech}
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                className={`inline-flex items-center gap-1.5 rounded-[4px] px-3.5 text-xs font-medium transition-transform active:scale-[0.985] ${
                  rc ? "h-11 sm:h-9" : "h-9"
                }`}
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
                  className={`inline-flex items-center gap-1.5 rounded-[4px] px-3.5 text-xs font-medium transition-transform hover:-translate-y-[1px] active:scale-[0.985] ${
                    rc ? "h-11 sm:h-9" : "h-9"
                  }`}
                >
                  <Headphones className="size-3.5" />
                  Nghe tiêu điểm
                </button>
              )
            )}
          </div>
        </div>

        {/* Category Strip with Real Live Counts & Accurate Icons */}
        {feed && (
          <div className="flex flex-wrap items-center gap-2 sm:gap-1.5">
            <button
              type="button"
              onClick={() => {
                setSection("");
                setPage(1);
              }}
              style={{
                backgroundColor: section === "" ? theme.ink : theme.surface,
                color: section === "" ? theme.bg : theme.ink,
                borderColor: section === "" ? theme.ink : theme.rule,
              }}
              className={`inline-flex items-center gap-2 rounded-[4px] border px-3 text-xs font-medium transition-colors duration-150 ${
                rc ? "min-h-11 py-2 sm:min-h-0 sm:py-1.5" : "py-1.5"
              }`}
            >
              <span>Tất cả chuyên mục</span>
              <span
                style={{ fontFamily: "var(--font-jetbrains)" }}
                className="tabular-nums text-[11px] opacity-80"
              >
                {categoryStats.allCount}
              </span>
            </button>

            {sectionList.map((s) => {
              const active = section === s.name;
              const cnt = categoryStats.counts[s.name] ?? 0;
              const empty = cnt === 0;
              return (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => {
                    setSection(active ? "" : s.name);
                    setPage(1);
                  }}
                  style={{
                    backgroundColor: active ? theme.accent : theme.surface,
                    color: active ? theme.accentInk : empty && rc ? theme.muted : theme.ink,
                    borderColor: active ? theme.accent : theme.rule,
                    borderStyle: empty && !active && rc ? "dashed" : "solid",
                    opacity: empty && !active && !rc ? 0.58 : 1,
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 text-xs font-medium transition-all duration-150 hover:opacity-100 ${
                    rc ? "min-h-11 py-2 sm:min-h-0 sm:py-1.5" : "py-1.5"
                  }`}
                >
                  <NewsCategoryIcon
                    section={s.name}
                    dark={dark}
                    invertOnAccent={active ? !dark : false}
                    size={13}
                  />
                  <span>{s.short || s.name}</span>
                  <span
                    style={{ fontFamily: "var(--font-jetbrains)" }}
                    className={`tabular-nums text-[11px] ${rc ? "opacity-85" : "opacity-70"}`}
                  >
                    {cnt}
                  </span>
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
          {filteredItems.length === 0 ? (
            <div
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="rounded-[6px] border p-10 text-center"
            >
              <p style={{ fontFamily: "var(--font-newsreader)" }} className="text-xl font-medium">
                Không có bài viết nào trong phạm vi lọc hiện tại
              </p>
              <p style={{ color: theme.muted }} className="mt-1 text-sm">
                Thử chuyển sang “Tất cả ngày” hoặc đặt lại chuyên mục / từ khóa tìm kiếm.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {selectedDate !== "all" && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate("all");
                      setPage(1);
                    }}
                    style={{ borderColor: theme.ruleStrong, color: theme.ink }}
                    className="rounded-[4px] border px-3.5 py-1.5 text-xs font-medium"
                  >
                    Tìm trên tất cả các ngày
                  </button>
                )}
                {(section || query) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSection("");
                      setQuery("");
                      setPage(1);
                    }}
                    style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                    className="inline-flex items-center gap-1 rounded-[4px] px-3.5 py-1.5 text-xs font-medium"
                  >
                    <RotateCcw className="size-3" />
                    Xoá bộ lọc
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Cover Feature + Dispatch Rail */}
              {coverStory && (
                <section style={{ borderColor: theme.rule }} className="grid gap-6 border-b pb-8 md:grid-cols-12">
                  <article className="group space-y-3 md:col-span-7">
                    <div
                      className="flex flex-wrap items-center gap-2 text-[11px]"
                      style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }}
                    >
                      <NewsCategoryIcon section={coverStory.section} dark={dark} size={14} />
                      <span>{coverStory.section}</span>
                      <span style={{ color: theme.muted }}>· {coverStory.source_label}</span>
                      <span style={{ color: theme.muted }}>· {formatNewsDate(coverStory.date)}</span>
                    </div>

                    {coverStory.images?.[0] && (
                      <button
                        type="button"
                        onClick={() => setActiveArticle(coverStory)}
                        className="block w-full text-left"
                      >
                        <SafeNewsThumb
                          src={coverStory.images[0]}
                          alt={coverStory.title}
                          bg={theme.surfaceAlt}
                          borderColor={theme.rule}
                          aspect="aspect-[16/9]"
                          priority
                        />
                      </button>
                    )}

                    <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-2xl leading-snug font-medium sm:text-3xl">
                      <button
                        type="button"
                        onClick={() => setActiveArticle(coverStory)}
                        className="text-left hover:underline"
                      >
                        {coverStory.title}
                      </button>
                    </h2>
                    <p style={{ color: theme.muted }} className="text-sm leading-relaxed">
                      {coverStory.summary}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveArticle(coverStory)}
                        style={{ backgroundColor: theme.surfaceAlt, color: theme.ink, borderColor: theme.ruleStrong }}
                        className={`rounded-[4px] border px-3 py-1.5 font-medium transition-colors hover:opacity-85 ${
                          rc ? "min-h-11 sm:min-h-0 sm:px-2.5 sm:py-1" : ""
                        }`}
                      >
                        Đọc chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => speakItem(coverStory)}
                        style={{ borderColor: theme.rule }}
                        className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-1.5 font-medium ${
                          rc ? "min-h-11 sm:min-h-0 sm:px-2.5 sm:py-1" : ""
                        }`}
                      >
                        {playingId === coverStory.id ? <Pause className="size-3" /> : <Play className="size-3" />}
                        Nghe
                      </button>
                      {coverStory.repository_id && onOpenRepoById && (
                        <button
                          type="button"
                          onClick={() => onOpenRepoById(coverStory.repository_id!)}
                          style={{ color: theme.accent }}
                          className={`inline-flex items-center gap-1 font-medium hover:underline ${
                            rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                          }`}
                        >
                          <FolderGit2 className="size-3.5" />
                          Mở Repo Folio
                        </button>
                      )}
                      {coverStory.url && (
                        <a
                          href={coverStory.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: theme.muted }}
                          className={`inline-flex items-center gap-1 hover:underline ${
                            rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                          }`}
                        >
                          {urlHost(coverStory.url)} <ArrowUpRight className="size-3" />
                        </a>
                      )}
                    </div>
                  </article>

                  {/* Dispatch Rail */}
                  <div
                    style={{ borderColor: theme.rule }}
                    className="divide-y border-t pt-4 md:col-span-5 md:border-t-0 md:border-l md:pt-0 md:pl-6"
                  >
                    <div
                      style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }}
                      className="pb-2.5 text-[11px] uppercase tracking-wider"
                    >
                      Điểm tin nhanh
                    </div>
                    {dispatchItems.length === 0 ? (
                      <p style={{ color: theme.muted }} className="pt-3 text-xs">
                        Chọn “Tất cả chuyên mục” hoặc “Tất cả ngày” để xem thêm điểm tin nhanh.
                      </p>
                    ) : (
                      dispatchItems.map((it) => (
                        <button
                          key={it.id}
                          type="button"
                          onClick={() => setActiveArticle(it)}
                          style={{ borderColor: theme.rule }}
                          className="group block w-full space-y-1.5 py-3 text-left transition-colors hover:opacity-90"
                        >
                          <div
                            className="flex items-center justify-between gap-2 text-[10px]"
                            style={{ fontFamily: "var(--font-jetbrains)", color: theme.accent }}
                          >
                            <span className="inline-flex items-center gap-1">
                              <NewsCategoryIcon section={it.section} dark={dark} size={11} />
                              {it.section}
                            </span>
                            <span style={{ color: theme.muted }}>{it.time || formatNewsDate(it.date)}</span>
                          </div>
                          <h3
                            style={{ fontFamily: "var(--font-newsreader)" }}
                            className="text-base leading-snug font-medium group-hover:underline"
                          >
                            {it.title}
                          </h3>
                          <p style={{ color: theme.muted }} className="line-clamp-2 text-xs leading-relaxed">
                            {it.summary}
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )}

              {/* 2-Column Editorial Stories with Full Pagination */}
              {pagedStories.length > 0 && (
                <AnimatePresence mode="wait">
                  <motion.section
                    key={`${selectedDate}-${section}-${query}-${safePage}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.16, ease: VELLUM_EASE }}
                    className="grid gap-5 md:grid-cols-2"
                  >
                    {pagedStories.map((it) => (
                      <article
                        key={it.id}
                        style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                        className="group flex flex-col justify-between overflow-hidden rounded-[6px] border p-4 transition-all duration-150 hover:-translate-y-[2px] hover:shadow-md"
                      >
                        <div className="space-y-2.5">
                          {it.images?.[0] && (
                            <button
                              type="button"
                              onClick={() => setActiveArticle(it)}
                              className="block w-full text-left"
                            >
                              <SafeNewsThumb
                                src={it.images[0]}
                                alt={it.title}
                                bg={theme.surfaceAlt}
                                borderColor={theme.rule}
                              />
                            </button>
                          )}
                          <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: theme.muted }}>
                            <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: theme.accent }}>
                              <NewsCategoryIcon section={it.section} dark={dark} size={13} />
                              {it.section}
                            </span>
                            <span style={{ fontFamily: "var(--font-jetbrains)" }} className="truncate text-[10px]">
                              {it.source_label} · {formatNewsDate(it.date).slice(0, 5)}
                            </span>
                          </div>
                          <h3 style={{ fontFamily: "var(--font-newsreader)" }} className="text-lg leading-snug font-medium">
                            <button
                              type="button"
                              onClick={() => setActiveArticle(it)}
                              className="text-left group-hover:underline"
                            >
                              {it.title}
                            </button>
                          </h3>
                          <p style={{ color: theme.muted }} className="line-clamp-3 text-xs leading-relaxed">
                            {it.summary}
                          </p>
                        </div>

                        <div style={{ borderColor: theme.rule }} className="mt-4 flex items-center justify-between border-t pt-2.5 text-xs">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <button
                              type="button"
                              onClick={() => speakItem(it)}
                              style={{ color: playingId === it.id ? theme.accent : theme.ink }}
                              className={`inline-flex items-center gap-1 font-medium ${
                                rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                              }`}
                            >
                              {playingId === it.id ? <Pause className="size-3" /> : <Play className="size-3" />}
                              Nghe
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveArticle(it)}
                              style={{ color: theme.muted }}
                              className={`font-medium hover:underline ${
                                rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                              }`}
                            >
                              Đọc tin
                            </button>
                          </div>
                          <div className="flex items-center gap-2 sm:gap-3">
                            {it.repository_id && onOpenRepoById && (
                              <button
                                type="button"
                                onClick={() => onOpenRepoById(it.repository_id!)}
                                style={{ color: theme.accent }}
                                className={`font-medium hover:underline ${
                                  rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                                }`}
                              >
                                Repo Folio
                              </button>
                            )}
                            {it.url && (
                              <a
                                href={it.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ color: theme.muted }}
                                className={`inline-flex items-center gap-0.5 hover:underline ${
                                  rc ? "min-h-11 px-1.5 sm:min-h-0 sm:px-0" : ""
                                }`}
                              >
                                Nguồn <ArrowUpRight className="size-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </motion.section>
                </AnimatePresence>
              )}

              {/* News Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
                    className={`inline-flex items-center gap-1 rounded-[4px] border px-3 text-xs font-medium disabled:opacity-40 ${
                      rc ? "min-h-11 px-4 sm:min-h-0 sm:h-8 sm:px-3" : "h-8"
                    }`}
                  >
                    <ChevronLeft className="size-3.5" />
                    Trước
                  </button>
                  <span style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="tabular-nums px-2 text-xs">
                    {safePage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
                    className={`inline-flex items-center gap-1 rounded-[4px] border px-3 text-xs font-medium disabled:opacity-40 ${
                      rc ? "min-h-11 px-4 sm:min-h-0 sm:h-8 sm:px-3" : "h-8"
                    }`}
                  >
                    Sau
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Archive Rail (3 cols) */}
        <aside style={{ borderColor: theme.rule }} className="space-y-5 lg:col-span-3 lg:border-l lg:pl-6">
          <div>
            <div
              style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }}
              className="mb-2.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider"
            >
              <Calendar className="size-3.5" />
              Số theo ngày
            </div>
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDate("all");
                  setPage(1);
                }}
                style={{
                  backgroundColor: selectedDate === "all" ? theme.ink : theme.surface,
                  color: selectedDate === "all" ? theme.bg : theme.ink,
                  borderColor: theme.rule,
                }}
                className={`flex w-full items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium transition-colors ${
                  rc ? "min-h-11 sm:min-h-0" : ""
                }`}
              >
                <span>Tất cả ngày ({feed?.days.length || 0})</span>
                <span className="tabular-nums font-mono text-[11px] opacity-80">
                  {feed?.stats.all_items ?? feed?.stats.total_items ?? 0}
                </span>
              </button>
              {feed?.days.slice(0, 7).map((d) => {
                const active = selectedDate === d.date;
                return (
                  <button
                    key={d.date}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.date);
                      setPage(1);
                    }}
                    style={{
                      backgroundColor: active ? theme.accentSoft : theme.surface,
                      borderColor: active ? theme.accent : theme.rule,
                    }}
                    className={`w-full rounded-[4px] border px-3 py-2 text-left text-xs transition-colors ${
                      rc ? "min-h-11 sm:min-h-0" : ""
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium">
                        {formatNewsDate(d.date).slice(0, 5)} · {formatNewsWeekday(d.date)}
                      </span>
                      <span
                        style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                        className="tabular-nums text-[11px]"
                      >
                        {d.items.length}
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
                <button
                  key={w.week_start}
                  type="button"
                  onClick={() => {
                    setSelectedDate("all");
                    setSection("");
                    setPage(1);
                  }}
                  style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                  className="w-full rounded-[5px] border p-3 text-left text-xs transition-colors hover:opacity-85"
                >
                  <div className="font-medium">{w.title}</div>
                  <p style={{ color: theme.muted }} className="mt-1 leading-relaxed">
                    {w.intro}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>
      </div>

      {/* Article Detail Reader Drawer */}
      <NewsDetailDrawer22
        item={activeArticle}
        theme={theme}
        dark={dark}
        rc={rc}
        isPlaying={activeArticle ? playingId === activeArticle.id : false}
        hasPrev={articleIndex > 0}
        hasNext={articleIndex >= 0 && articleIndex < filteredItems.length - 1}
        positionLabel={articleIndex >= 0 ? `${articleIndex + 1}/${filteredItems.length}` : ""}
        onClose={() => setActiveArticle(null)}
        onPrev={() => articleIndex > 0 && setActiveArticle(filteredItems[articleIndex - 1])}
        onNext={() =>
          articleIndex >= 0 && articleIndex < filteredItems.length - 1 && setActiveArticle(filteredItems[articleIndex + 1])
        }
        onSpeak={speakItem}
        onOpenRepoById={onOpenRepoById}
      />
    </div>
  );
}
