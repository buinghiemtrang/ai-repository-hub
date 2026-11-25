"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Calendar,
  Compass,
  FolderGit2,
  Headphones,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { NewsAudioPlayer, type PlayerState } from "@/components/news/NewsAudioPlayer";
import { NewsCard } from "@/components/news/NewsCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IMPORTANT_TAG,
  type NewsDay,
  type NewsFeedPayload,
  type NewsItem,
  REPO_TAG,
  SECURITY_TAG,
  detectSourceKind,
  formatNewsDate,
  formatNewsWeekday,
  normalizeVi,
} from "@/lib/news/types";
import { cn } from "@/lib/utils";

const MODEL_FILTERS: { key: string; label: string; section?: string; regex: RegExp }[] = [
  { key: "repo", label: "Repo", section: "Repo", regex: /\brepo\b|github\.com|ma nguon mo|open[- ]source/ },
  { key: "claude", label: "Claude", section: "Claude", regex: /\bclaude\b|anthropic/ },
  { key: "grok", label: "Grok", section: "Grok", regex: /\bgrok\b|\bxai\b|x\.ai/ },
  { key: "chatgpt", label: "ChatGPT", section: "ChatGPT / OpenAI", regex: /chatgpt|openai|\bgpt|codex|\bsora\b/ },
  { key: "gemini", label: "Gemini", section: "Gemini", regex: /gemini|deepmind|gemma|notebooklm|\bveo\b/ },
];

const SOURCE_KINDS = ["GitHub", "Web / blog", "X", "YouTube", "Reddit", "Facebook", "Mẹo"];

function oneLineSummary(text: string): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  if (clean.length <= 150) return clean;
  return clean.slice(0, 148).replace(/\s\S*$/, "") + "…";
}

function itemSearchHaystack(it: NewsItem): string {
  return normalizeVi(
    [
      it.title,
      it.summary,
      it.excerpt || "",
      it.full_text || "",
      it.source,
      it.author || "",
      it.section,
      ...(it.tags || []),
    ].join(" ")
  );
}

function itemMatchesModel(it: NewsItem, modelKey: string): boolean {
  const m = MODEL_FILTERS.find((x) => x.key === modelKey);
  if (!m) return false;
  if (m.section && it.section === m.section) return true;
  return m.regex.test(itemSearchHaystack(it));
}

export function NewsFeedWorkspace() {
  const searchParams = useSearchParams();
  const [feed, setFeed] = useState<NewsFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  // Filter & navigation state
  const [view, setView] = useState<string>("latest"); // "latest" (date string), "all", "weekly", "topic:..."
  const [section, setSection] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [srcKind, setSrcKind] = useState<string>("");
  const [query, setQuery] = useState<string>("");
  const [weeklyIdx, setWeeklyIdx] = useState<number>(0);
  const [visibleAllDays, setVisibleAllDays] = useState<number>(4);

  // UI extras
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [flashedId, setFlashedId] = useState<string | null>(null);
  const [showToTop, setShowToTop] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  // Audio player state
  const [voice, setVoice] = useState<"female" | "male">("female");
  const [rate, setRate] = useState<number>(1);
  const [player, setPlayer] = useState<PlayerState>({
    queue: [],
    index: -1,
    mode: "single",
    playing: false,
    label: "",
    phase: "item",
  });

  // Load saved voice/rate
  useEffect(() => {
    try {
      const sv = localStorage.getItem("aihub_news_voice");
      if (sv === "male" || sv === "female") setVoice(sv);
      const sr = parseFloat(localStorage.getItem("aihub_news_rate") || "1");
      if (!Number.isNaN(sr) && sr >= 0.75 && sr <= 2) setRate(sr);
    } catch {
      // ignore
    }
  }, []);

  // Sync URL params (?section=Repo, ?view=weekly, ?q=...)
  useEffect(() => {
    const pSec = searchParams.get("section") || "";
    const pView = searchParams.get("view") || "";
    const pQ = searchParams.get("q") || "";
    if (pSec) {
      setSection(pSec);
      setView("all");
    } else if (pView === "weekly") {
      setView("weekly");
      setSection("");
    } else if (!pSec && !pView && feed?.days.length) {
      setSection("");
      setView((prev) => (prev === "latest" || prev === "weekly" ? feed.days[0].date : prev));
    }
    if (pQ) setQuery(pQ);
  }, [searchParams, feed?.days]);

  // Fetch news feed from independent backend
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/news/feed", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: NewsFeedPayload) => {
        setFeed(data);
        setView((prev) => {
          if (searchParams.get("view") === "weekly") return "weekly";
          if (searchParams.get("section")) return "all";
          if (prev === "latest" && data.days.length > 0) return data.days[0].date;
          return prev;
        });
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Không tải được dữ liệu Tin tức từ backend.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryTick]);

  // Keyboard shortcuts (`/` focus search, `Esc` close lightbox) & scroll-to-top visibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxSrc) {
        setLightboxSrc(null);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
          e.preventDefault();
          searchRef.current?.focus();
        }
      }
    };
    const onScroll = () => setShowToTop(window.scrollY > 500);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onScroll);
    };
  }, [lightboxSrc]);

  const sectionsMap = useMemo(() => {
    const m: Record<string, { name: string; short: string; color: string }> = {};
    for (const s of feed?.sections || []) m[s.name] = s;
    return m;
  }, [feed?.sections]);

  const itemById = useMemo(() => {
    const map: Record<string, NewsItem> = {};
    for (const d of feed?.days || []) {
      for (const it of d.items) map[it.id] = it;
    }
    return map;
  }, [feed?.days]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const d of feed?.days || []) {
      for (const it of d.items) {
        for (const t of it.tags || []) set.add(t);
      }
    }
    return Array.from(set).sort();
  }, [feed?.days]);

  const isFiltered = Boolean(section || tag || model || srcKind || query.trim());

  const matchesFilter = useCallback(
    (it: NewsItem, ignoreSection = false) => {
      if (!ignoreSection && section && it.section !== section) return false;
      if (tag && !(it.tags || []).includes(tag)) return false;
      if (model && !itemMatchesModel(it, model)) return false;
      if (srcKind && detectSourceKind(it) !== srcKind) return false;
      const q = normalizeVi(query.trim());
      if (!q) return true;
      const hay = itemSearchHaystack(it);
      return q.split(/\s+/).every((term) => hay.includes(term));
    },
    [section, tag, model, srcKind, query]
  );

  const sectionCounts = useMemo(() => {
    const days = feed?.days || [];
    const selectedDay = days.find((d) => d.date === view);
    const pool = selectedDay ? [selectedDay] : days;
    const counts: Record<string, number> = {};
    for (const sec of feed?.sections || []) counts[sec.name] = 0;
    for (const d of pool) {
      for (const it of d.items) {
        if (matchesFilter(it, true)) {
          counts[it.section] = (counts[it.section] || 0) + 1;
        }
      }
    }
    return counts;
  }, [feed?.days, feed?.sections, view, matchesFilter]);

  const orderItemsForDay = useCallback(
    (d: NewsDay): NewsItem[] => {
      const its = d.items.filter((it) => matchesFilter(it));
      const imp = its.filter((it) => it.tags.includes(IMPORTANT_TAG));
      const noon = its.filter((it) => it.batch === "noon" && !it.tags.includes(IMPORTANT_TAG));
      const rest: NewsItem[] = [];
      for (const sec of feed?.sections || []) {
        rest.push(
          ...its.filter(
            (it) =>
              it.section === sec.name &&
              it.batch !== "noon" &&
              !it.tags.includes(IMPORTANT_TAG)
          )
        );
      }
      return [...imp, ...noon, ...rest];
    },
    [feed?.sections, matchesFilter]
  );

  // 7-day timeline topics
  const weekDays = useMemo(() => (feed?.days || []).slice(0, 7), [feed?.days]);

  const timelineTopics = useMemo(() => {
    const list: { key: string; label: string; count: number; match: (it: NewsItem) => boolean }[] = [];
    for (const m of MODEL_FILTERS) {
      const count = weekDays.reduce(
        (acc, d) => acc + d.items.filter((it) => !it.tip && itemMatchesModel(it, m.key)).length,
        0
      );
      if (count > 0) {
        list.push({
          key: `topic:${m.key}`,
          label: m.label,
          count,
          match: (it) => itemMatchesModel(it, m.key),
        });
      }
    }
    for (const t of [IMPORTANT_TAG, SECURITY_TAG, REPO_TAG]) {
      const count = weekDays.reduce(
        (acc, d) => acc + d.items.filter((it) => !it.tip && it.tags.includes(t)).length,
        0
      );
      if (count > 0) {
        list.push({
          key: `topic:tag:${t}`,
          label: t,
          count,
          match: (it) => it.tags.includes(t),
        });
      }
    }
    return list;
  }, [weekDays]);

  const jumpToItem = useCallback(
    (item: NewsItem) => {
      if (view !== "all" && view !== item.date) {
        setView(item.date);
      }
      setTimeout(() => {
        const el = document.getElementById(`item-${item.id}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
          setFlashedId(item.id);
          setTimeout(() => setFlashedId(null), 2200);
        }
      }, 80);
    },
    [view]
  );

  // Audio handlers
  const handlePlaySingle = useCallback(
    (item: NewsItem) => {
      const cur = player.index >= 0 ? player.queue[player.index] : null;
      if (cur && cur.id === item.id) {
        setPlayer((p) => ({ ...p, playing: !p.playing }));
        return;
      }
      setPlayer({
        queue: [item],
        index: 0,
        mode: "single",
        playing: true,
        label: item.section,
        phase: "item",
      });
    },
    [player.index, player.queue]
  );

  const startQueue = useCallback((items: NewsItem[], label: string) => {
    const valid = items.filter((it) => Boolean(it.speech_text || it.summary));
    if (!valid.length) return;
    setPlayer({
      queue: valid,
      index: 0,
      mode: "queue",
      playing: true,
      label,
      phase: "item",
    });
  }, []);

  const readCurrentView = useCallback(() => {
    if (!feed) return;
    if (view === "weekly") {
      const w = feed.weekly[weeklyIdx];
      if (!w) return;
      const list = w.items.map((x) => itemById[x.id]).filter(Boolean);
      startQueue(list, w.title);
      return;
    }
    if (view.startsWith("topic:")) {
      const tp = timelineTopics.find((x) => x.key === view);
      if (!tp) return;
      const list = weekDays.flatMap((d) => d.items.filter((it) => !it.tip && tp.match(it)));
      startQueue(list, tp.label);
      return;
    }
    const days = view === "all" ? feed.days : feed.days.filter((d) => d.date === view);
    const list = days.flatMap((d) => orderItemsForDay(d));
    startQueue(list, view === "all" ? "Cả trang" : `Podcast ${formatNewsDate(view).slice(0, 5)}`);
  }, [feed, view, weeklyIdx, itemById, timelineTopics, weekDays, orderItemsForDay, startQueue]);

  const clearAllFilters = () => {
    setSection("");
    setTag("");
    setModel("");
    setSrcKind("");
    setQuery("");
  };

  const renderHero = (d: NewsDay) => {
    const candidates = d.items.filter((it) => !it.tip && it.title);
    if (candidates.length < 2) return null;
    const scored = [...candidates].sort((a, b) => {
      const sa =
        (a.tags.includes(IMPORTANT_TAG) ? 100 : 0) +
        (a.picked ? 50 : 0) +
        (a.section === "Repo" ? 20 : 0) +
        (a.images.length ? 5 : 0);
      const sb =
        (b.tags.includes(IMPORTANT_TAG) ? 100 : 0) +
        (b.picked ? 50 : 0) +
        (b.section === "Repo" ? 20 : 0) +
        (b.images.length ? 5 : 0);
      return sb - sa;
    });
    const top = scored.slice(0, 4);
    const isLatest = feed?.days[0]?.date === d.date;

    return (
      <div className="rounded-2xl border border-teal-200/80 bg-gradient-to-br from-teal-50/70 via-white to-sky-50/50 p-4 dark:border-teal-500/25 dark:from-teal-950/25 dark:via-[#111827] dark:to-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
          <span>{isLatest ? "Hôm nay có gì" : `Ngày ${formatNewsDate(d.date).slice(0, 5)} có gì`}</span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {top.map((it) => (
            <button
              key={it.id}
              type="button"
              onClick={() => jumpToItem(it)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-teal-500/60"
            >
              <div>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                  {it.tags.includes(IMPORTANT_TAG) && <span className="text-rose-600">🔴 Quan trọng</span>}
                  {it.section === "Repo" && <span className="text-teal-700 dark:text-teal-400">📦 Repo</span>}
                  <span className="text-slate-500 dark:text-slate-400">
                    {sectionsMap[it.section]?.short || it.section}
                  </span>
                </div>
                <h4 className="mt-1.5 line-clamp-2 text-xs font-bold leading-snug text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-300">
                  {it.title}
                </h4>
              </div>
              <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {oneLineSummary(it.summary)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderDayBlock = (d: NewsDay, withPrevNext: boolean) => {
    const its = d.items.filter((it) => matchesFilter(it));
    const imp = its.filter((it) => it.tags.includes(IMPORTANT_TAG));
    const noon = its.filter((it) => it.batch === "noon" && !it.tags.includes(IMPORTANT_TAG));
    const activeReadingId = player.index >= 0 ? player.queue[player.index]?.id : null;
    const dayIdx = feed?.days.findIndex((x) => x.date === d.date) ?? -1;

    return (
      <section key={d.date} id={`day-${d.date}`} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl dark:text-slate-50">
                {formatNewsWeekday(d.date)}, {formatNewsDate(d.date)}
              </h2>
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {isFiltered ? `${its.filter((x) => !x.tip).length}/${d.count}` : d.count} tin
              </span>
            </div>
            {d.intro && !isFiltered && (
              <p className="mt-1 text-sm italic text-slate-600 dark:text-slate-400">{d.intro}</p>
            )}
          </div>

          {its.length > 0 && (
            <button
              type="button"
              onClick={() => startQueue(orderItemsForDay(d), `Podcast ${formatNewsDate(d.date).slice(0, 5)}`)}
              className="pressable inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300"
            >
              <Headphones className="size-3.5" />
              Podcast cả ngày
            </button>
          )}
        </div>

        {!isFiltered && (withPrevNext || feed?.days[0]?.date === d.date) && renderHero(d)}

        {its.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Không có tin khớp bộ lọc trong ngày này.
          </div>
        ) : (
          <div className="space-y-6">
            {imp.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-rose-700 dark:text-rose-400">
                  🔴 Tin quan trọng ({imp.length})
                </h3>
                <div className="space-y-3">
                  {imp.map((it) => (
                    <NewsCard
                      key={it.id}
                      item={it}
                      sectionMeta={sectionsMap[it.section]}
                      showSectionBadge
                      query={query}
                      isReading={activeReadingId === it.id}
                      isPlaying={player.playing}
                      isFlashed={flashedId === it.id}
                      onPlaySingle={handlePlaySingle}
                      onOpenLightbox={setLightboxSrc}
                    />
                  ))}
                </div>
              </div>
            )}

            {noon.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-sky-700 dark:text-sky-400">
                  🆕 Tin mới 12h trưa ({noon.length})
                </h3>
                <div className="space-y-3">
                  {noon.map((it) => (
                    <NewsCard
                      key={it.id}
                      item={it}
                      sectionMeta={sectionsMap[it.section]}
                      showSectionBadge
                      query={query}
                      isReading={activeReadingId === it.id}
                      isPlaying={player.playing}
                      isFlashed={flashedId === it.id}
                      onPlaySingle={handlePlaySingle}
                      onOpenLightbox={setLightboxSrc}
                    />
                  ))}
                </div>
              </div>
            )}

            {(feed?.sections || []).map((sec) => {
              const group = its.filter(
                (it) =>
                  it.section === sec.name &&
                  it.batch !== "noon" &&
                  !it.tags.includes(IMPORTANT_TAG)
              );
              if (!group.length) return null;
              return (
                <div key={sec.name} className="space-y-3">
                  <h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100">
                    <span
                      className="inline-block size-2.5 rounded-full"
                      style={{ backgroundColor: sec.color }}
                    />
                    {sec.name}
                    <span className="text-xs font-medium text-slate-400">({group.length})</span>
                  </h3>
                  <div className="space-y-3">
                    {group.map((it) => (
                      <NewsCard
                        key={it.id}
                        item={it}
                        sectionMeta={sec}
                        query={query}
                        isReading={activeReadingId === it.id}
                        isPlaying={player.playing}
                        isFlashed={flashedId === it.id}
                        onPlaySingle={handlePlaySingle}
                        onOpenLightbox={setLightboxSrc}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {withPrevNext && feed && dayIdx >= 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {dayIdx < feed.days.length - 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setView(feed.days[dayIdx + 1].date);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <ArrowLeft className="size-3.5" />
                {formatNewsDate(feed.days[dayIdx + 1].date)} (cũ hơn)
              </Button>
            ) : (
              <div />
            )}
            {dayIdx > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setView(feed.days[dayIdx - 1].date);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                {formatNewsDate(feed.days[dayIdx - 1].date)} (mới hơn)
                <ArrowRight className="size-3.5" />
              </Button>
            )}
          </div>
        )}
      </section>
    );
  };

  const filteredAllDays = useMemo(() => {
    if (!feed) return [];
    return feed.days.filter((d) => !isFiltered || d.items.some((it) => matchesFilter(it)));
  }, [feed, isFiltered, matchesFilter]);

  const activeReadingId = player.index >= 0 ? player.queue[player.index]?.id : null;

  return (
    <div className={cn("pb-12", player.queue.length > 0 && "pb-28")}>
      {/* Sticky News Search & Category Chips Subheader */}
      <div className="border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0f172a]/95">
        <div className="mx-auto max-w-7xl space-y-2.5 px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[210px] flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuery(val);
                  if (val.trim() && view !== "all") setView("all");
                }}
                placeholder="Tìm trong mọi bản tin (có dấu hoặc không dấu, nhấn /)…"
                className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pr-8 pl-9 text-sm text-slate-900 outline-none focus:border-teal-500 focus:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  aria-label="Xoá tìm kiếm"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            <select
              value={voice}
              onChange={(e) => {
                const v = e.target.value === "male" ? "male" : "female";
                setVoice(v);
                try {
                  localStorage.setItem("aihub_news_voice", v);
                } catch {
                  // ignore
                }
              }}
              aria-label="Giọng đọc"
              className="h-9 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="female">🎙 Nữ</option>
              <option value="male">🎙 Nam</option>
            </select>

            <button
              type="button"
              onClick={readCurrentView}
              className="pressable inline-flex h-9 items-center gap-1.5 rounded-xl bg-orange-500 px-3.5 text-xs font-bold text-white shadow-xs hover:bg-orange-600"
            >
              <Headphones className="size-4" />
              <span>Đọc cả trang</span>
            </button>
          </div>

          {/* Section Chips (including Repo + all AI categories) */}
          {feed && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => setSection("")}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                  !section
                    ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                )}
              >
                Tất cả mục
              </button>
              {feed.sections.map((sec) => {
                const active = section === sec.name;
                return (
                  <button
                    key={sec.name}
                    type="button"
                    onClick={() => {
                      setSection(active ? "" : sec.name);
                      if (view.startsWith("topic:") || view === "weekly") setView("all");
                    }}
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                      active
                        ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    )}
                  >
                    <span
                      className="size-2 rounded-full"
                      style={{ backgroundColor: sec.color }}
                    />
                    {sec.name === "Repo" && <FolderGit2 className="size-3" />}
                    <span>{sec.short}</span>
                    <span className="opacity-65">{sectionCounts[sec.name] || 0}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Secondary Filter Bar: Model chips + Source + Tag */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-medium text-slate-500 dark:text-slate-400">Chủ đề:</span>
            {MODEL_FILTERS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setModel((prev) => (prev === m.key ? "" : m.key));
                  if (view !== "all" && view.startsWith("topic:")) setView("all");
                }}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 font-medium transition-colors",
                  model === m.key
                    ? "border-teal-600 bg-teal-600 text-white dark:border-teal-500 dark:bg-teal-500 dark:text-slate-950"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300"
                )}
              >
                {m.label}
              </button>
            ))}

            <select
              value={srcKind}
              onChange={(e) => setSrcKind(e.target.value)}
              aria-label="Lọc theo nguồn"
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="">Mọi nguồn</option>
              {SOURCE_KINDS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {allTags.length > 0 && (
              <select
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                aria-label="Lọc theo thẻ"
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="">Mọi thẻ</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}

            {isFiltered && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
              >
                <RotateCcw className="size-3" />
                Bỏ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Two-Column Feed Layout */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {loading && (
          <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
            <Skeleton className="h-96 w-full rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-36 w-full rounded-2xl" />
              <Skeleton className="h-48 w-full rounded-2xl" />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
            <span>{error}</span>
            <Button type="button" size="sm" variant="outline" onClick={() => setRetryTick((x) => x + 1)}>
              Thử lại
            </Button>
          </div>
        )}

        {!loading && !error && feed && (
          <div className="grid gap-6 lg:grid-cols-[270px_1fr]">
            {/* Left Feed Sidebar */}
            <aside className="space-y-4 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:self-start lg:overflow-y-auto lg:pr-1">
              {/* Special Views */}
              <div className="space-y-1.5">
                {feed.weekly.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setView("weekly")}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs font-semibold transition-colors",
                      view === "weekly"
                        ? "border-teal-600 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-500/15 dark:text-teal-200"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                    )}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5 text-teal-600 dark:text-teal-400" />
                      Bản tin tuần
                    </span>
                    <span className="text-[11px] opacity-75">
                      {formatNewsDate(feed.weekly[0].week_end).slice(0, 5)}
                    </span>
                  </button>
                )}

                {timelineTopics.length > 0 && (
                  <div className="rounded-xl border border-slate-200/80 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
                    <div className="mb-1.5 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <Compass className="size-3.5" />
                      Dòng thời gian 7 ngày
                    </div>
                    <div className="space-y-1">
                      {timelineTopics.map((tp) => (
                        <button
                          key={tp.key}
                          type="button"
                          onClick={() => setView(tp.key)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-medium transition-colors",
                            view === tp.key
                              ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                              : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          )}
                        >
                          <span className="truncate">{tp.label} tuần này</span>
                          <span className="tabular-nums text-[11px] opacity-75">{tp.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Tag Filters */}
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { tag: IMPORTANT_TAG, icon: "🔴", cls: "hover:border-rose-300" },
                  { tag: SECURITY_TAG, icon: "🛡️", cls: "hover:border-amber-300" },
                  { tag: REPO_TAG, icon: "📦", cls: "hover:border-teal-300" },
                ].map((tf) => {
                  const count = feed.days.reduce(
                    (a, d) => a + d.items.filter((it) => it.tags.includes(tf.tag)).length,
                    0
                  );
                  const active = tag === tf.tag;
                  return (
                    <button
                      key={tf.tag}
                      type="button"
                      onClick={() => {
                        setTag(active ? "" : tf.tag);
                        if (!active) setView("all");
                      }}
                      className={cn(
                        "flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                        active
                          ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
                          : `border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 ${tf.cls}`
                      )}
                    >
                      <span>
                        {tf.icon} {tf.tag}
                      </span>
                      <span className="tabular-nums opacity-75">{active ? "✕ bỏ lọc" : count}</span>
                    </button>
                  );
                })}
              </div>

              {/* Days List */}
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible">
                <button
                  type="button"
                  onClick={() => setView("all")}
                  className={cn(
                    "shrink-0 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    view === "all"
                      ? "border-slate-900 bg-slate-900 text-white dark:border-teal-500 dark:bg-teal-600"
                      : "border-slate-200 bg-slate-800 text-white dark:border-slate-700 dark:bg-slate-900"
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold">Tất cả</span>
                    <span className="tabular-nums text-xs opacity-80">
                      {feed.days.reduce(
                        (a, d) =>
                          a +
                          (isFiltered
                            ? d.items.filter((it) => !it.tip && matchesFilter(it)).length
                            : d.count),
                        0
                      )}{" "}
                      tin
                    </span>
                  </div>
                </button>

                {feed.days.map((d) => {
                  const cnt = isFiltered
                    ? d.items.filter((it) => !it.tip && matchesFilter(it)).length
                    : d.count;
                  const active = view === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => setView(d.date)}
                      className={cn(
                        "shrink-0 rounded-xl border p-3 text-left transition-colors lg:w-full",
                        active
                          ? "border-teal-600 bg-teal-50/60 ring-2 ring-teal-500/20 dark:border-teal-500 dark:bg-teal-500/10"
                          : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <div>
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {formatNewsDate(d.date).slice(0, 5)}
                          </span>{" "}
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {formatNewsWeekday(d.date)}
                          </span>
                        </div>
                        <span className="tabular-nums text-xs font-semibold text-teal-700 dark:text-teal-400">
                          {cnt} tin
                        </span>
                      </div>
                      {d.noon_count > 0 && (
                        <div className="mt-0.5 text-[11px] font-medium text-sky-600 dark:text-sky-400">
                          +{d.noon_count} tin trưa
                        </div>
                      )}
                      {d.heads.length > 0 && (
                        <ul className="mt-1.5 hidden list-disc space-y-1 pl-4 text-[11.5px] text-slate-600 lg:block dark:text-slate-400">
                          {d.heads.map((h) => (
                            <li key={h} className="line-clamp-2">
                              {h}
                            </li>
                          ))}
                        </ul>
                      )}
                    </button>
                  );
                })}
              </div>
            </aside>

            {/* Main News Feed Area */}
            <div className="min-w-0 space-y-6">
              {view === "weekly" ? (
                (() => {
                  const w = feed.weekly[weeklyIdx];
                  if (!w) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                        Chưa có bản tin tuần.
                      </div>
                    );
                  }
                  const rankedItems = w.items
                    .map((x) => ({ meta: x, item: itemById[x.id] }))
                    .filter((x) => Boolean(x.item));
                  return (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                        <div className="space-y-1">
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            📅 {w.title}
                          </h2>
                          <p className="text-sm italic text-slate-600 dark:text-slate-400">{w.intro}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {feed.weekly.length > 1 && (
                            <select
                              value={weeklyIdx}
                              onChange={(e) => setWeeklyIdx(Number(e.target.value))}
                              className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                            >
                              {feed.weekly.map((wk, idx) => (
                                <option key={wk.week_start} value={idx}>
                                  {wk.title}
                                </option>
                              ))}
                            </select>
                          )}
                          <button
                            type="button"
                            onClick={readCurrentView}
                            className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300"
                          >
                            <Headphones className="size-3.5" />
                            Nghe bản tin tuần
                          </button>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {rankedItems.map(({ meta, item }, i) => (
                          <div key={item.id} className="space-y-1.5">
                            <div className="text-xs font-semibold text-teal-700 dark:text-teal-400">
                              #{i + 1} · {meta.why.join(" · ")}
                            </div>
                            <NewsCard
                              item={item}
                              sectionMeta={sectionsMap[item.section]}
                              showSectionBadge
                              query={query}
                              isReading={activeReadingId === item.id}
                              isPlaying={player.playing}
                              isFlashed={flashedId === item.id}
                              onPlaySingle={handlePlaySingle}
                              onOpenLightbox={setLightboxSrc}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : view.startsWith("topic:") ? (
                (() => {
                  const tp = timelineTopics.find((x) => x.key === view);
                  if (!tp) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                        Không có dữ liệu chủ đề này trong 7 ngày qua.
                      </div>
                    );
                  }
                  const grouped = weekDays
                    .map((d) => ({
                      day: d,
                      items: d.items.filter((it) => !it.tip && tp.match(it)),
                    }))
                    .filter((g) => g.items.length > 0);
                  return (
                    <div className="space-y-5">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
                        <div>
                          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                            🧭 {tp.label} tuần này
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {tp.count} tin trong {grouped.length} ngày gần nhất
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={readCurrentView}
                          className="inline-flex items-center gap-1.5 rounded-full border border-orange-300 bg-orange-50 px-3.5 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-100 dark:border-orange-500/40 dark:bg-orange-500/15 dark:text-orange-300"
                        >
                          <Headphones className="size-3.5" />
                          Nghe cả chủ đề
                        </button>
                      </div>
                      {grouped.map(({ day, items }) => (
                        <div key={day.date} className="space-y-3">
                          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                            {formatNewsWeekday(day.date)}, {formatNewsDate(day.date)} · {items.length} tin
                          </h3>
                          <div className="space-y-3">
                            {items.map((it) => (
                              <NewsCard
                                key={it.id}
                                item={it}
                                sectionMeta={sectionsMap[it.section]}
                                showSectionBadge
                                query={query}
                                isReading={activeReadingId === it.id}
                                isPlaying={player.playing}
                                isFlashed={flashedId === it.id}
                                onPlaySingle={handlePlaySingle}
                                onOpenLightbox={setLightboxSrc}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()
              ) : view !== "all" ? (
                (() => {
                  const selected = feed.days.find((d) => d.date === view) || feed.days[0];
                  if (!selected) {
                    return (
                      <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                        Chưa có bản tin nào.
                      </div>
                    );
                  }
                  return renderDayBlock(selected, true);
                })()
              ) : (
                <div className="space-y-8">
                  {isFiltered && (
                    <div className="rounded-xl border border-teal-200 bg-teal-50/70 px-4 py-2.5 text-xs font-medium text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200">
                      🔎 Tìm thấy{" "}
                      <b>
                        {filteredAllDays.reduce(
                          (a, d) => a + d.items.filter((it) => !it.tip && matchesFilter(it)).length,
                          0
                        )}
                      </b>{" "}
                      tin khớp trong <b>{filteredAllDays.length}</b> ngày
                      {query.trim() ? ` cho “${query.trim()}”` : ""}
                    </div>
                  )}

                  {filteredAllDays.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700">
                      Không có tin nào khớp bộ lọc hiện tại.
                    </div>
                  ) : (
                    <>
                      {filteredAllDays.slice(0, visibleAllDays).map((d) => renderDayBlock(d, false))}
                      {visibleAllDays < filteredAllDays.length && (
                        <div className="flex justify-center">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setVisibleAllDays((n) => n + 4)}
                          >
                            Xem thêm ngày cũ hơn ({filteredAllDays.length - visibleAllDays} ngày còn lại)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Lightbox */}
      {lightboxSrc && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxSrc}
            alt="Ảnh phóng to"
            className="max-h-[90vh] max-w-[92vw] rounded-xl shadow-2xl"
          />
        </div>
      )}

      {/* Scroll To Top */}
      {showToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={cn(
            "fixed right-5 z-30 flex size-10 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900",
            player.queue.length > 0 ? "bottom-24" : "bottom-6"
          )}
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="size-4" />
        </button>
      )}

      {/* Persistent Audio / Podcast Player */}
      <NewsAudioPlayer
        player={player}
        voice={voice}
        rate={rate}
        onVoiceChange={(v) => {
          setVoice(v);
          try {
            localStorage.setItem("aihub_news_voice", v);
          } catch {
            // ignore
          }
        }}
        onRateChange={(r) => {
          setRate(r);
          try {
            localStorage.setItem("aihub_news_rate", String(r));
          } catch {
            // ignore
          }
        }}
        onJumpToItem={jumpToItem}
        onStateChange={setPlayer}
      />
    </div>
  );
}
