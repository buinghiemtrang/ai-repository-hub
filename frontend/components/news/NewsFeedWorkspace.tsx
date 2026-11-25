"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUp,
  ArrowUpRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Compass,
  FolderGit2,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { NewsAudioPlayer, type PlayerState } from "@/components/news/NewsAudioPlayer";
import { NewsDetailDrawer22 } from "@/components/prototypes/vellum22/NewsDetailDrawer22";
import { RepoQuickPeek22 } from "@/components/prototypes/vellum22/RepoQuickPeek22";
import { NewsCategoryIcon } from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_CSS, VELLUM_EASE } from "@/components/prototypes/vellum/tokens";
import { useFavorites } from "@/components/repositories/FavoriteButton";
import {
  IMPORTANT_TAG,
  type NewsFeedPayload,
  type NewsItem,
  REPO_TAG,
  SECURITY_TAG,
  detectSourceKind,
  formatNewsDate,
  formatNewsWeekday,
  normalizeVi,
  urlHost,
} from "@/lib/news/types";
import type { RepoItem } from "@/lib/repositories/types";

const STORIES_PER_PAGE = 10;

const MODEL_FILTERS: { key: string; label: string; section?: string; regex: RegExp }[] = [
  { key: "repo", label: "Repo", section: "Repo", regex: /\brepo\b|github\.com|ma nguon mo|open[- ]source/ },
  { key: "claude", label: "Claude", section: "Claude", regex: /\bclaude\b|anthropic/ },
  { key: "grok", label: "Grok", section: "Grok", regex: /\bgrok\b|\bxai\b|x\.ai/ },
  { key: "chatgpt", label: "ChatGPT", section: "ChatGPT / OpenAI", regex: /chatgpt|openai|\bgpt|codex|\bsora\b/ },
  { key: "gemini", label: "Gemini", section: "Gemini", regex: /gemini|deepmind|gemma|notebooklm|\bveo\b/ },
];

const SOURCE_KINDS = ["GitHub", "Web / blog", "X", "YouTube", "Reddit", "Facebook", "Mẹo"];

const QUICK_TAG_FILTERS = [
  { tag: IMPORTANT_TAG, short: "Tin quan trọng" },
  { tag: SECURITY_TAG, short: "Bảo mật" },
  { tag: REPO_TAG, short: "Repo nổi bật" },
];

function getItemSections(it: NewsItem): string[] {
  const extended = (it as NewsItem & { sections?: string[] }).sections;
  if (Array.isArray(extended) && extended.length > 0) {
    return Array.from(new Set(extended.filter(Boolean)));
  }
  return [it.section || "Ứng dụng thực tế"];
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
  if (m.section && getItemSections(it).includes(m.section)) return true;
  return m.regex.test(itemSearchHaystack(it));
}

function subscribeStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  const onUpdate = () => onStoreChange();
  window.addEventListener("storage", onUpdate);
  window.addEventListener("aihub_news_prefs_updated", onUpdate);
  return () => {
    window.removeEventListener("storage", onUpdate);
    window.removeEventListener("aihub_news_prefs_updated", onUpdate);
  };
}

function readVoicePref(): "female" | "male" {
  if (typeof window === "undefined") return "female";
  try {
    return window.localStorage.getItem("aihub_news_voice") === "male" ? "male" : "female";
  } catch {
    return "female";
  }
}

function readRatePref(): number {
  if (typeof window === "undefined") return 1;
  try {
    const n = parseFloat(window.localStorage.getItem("aihub_news_rate") || "1");
    return !Number.isNaN(n) && n >= 0.75 && n <= 2 ? n : 1;
  } catch {
    return 1;
  }
}

function SafeNewsThumb({
  src,
  alt,
  aspect = "aspect-[16/9]",
  priority = false,
}: {
  src?: string;
  alt: string;
  aspect?: string;
  priority?: boolean;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return null;
  return (
    <div className="overflow-hidden rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setFailedSrc(src)}
        className={`${aspect} w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]`}
      />
    </div>
  );
}

interface NewsFeedWorkspaceProps {
  initialFeed?: NewsFeedPayload | null;
}

export function NewsFeedWorkspace({ initialFeed = null }: NewsFeedWorkspaceProps) {
  const searchParams = useSearchParams();
  const initialSecParam = searchParams.get("section") || "";
  const initialViewParam = searchParams.get("view") || "";
  const initialQParam = searchParams.get("q") || "";

  const [feed, setFeed] = useState<NewsFeedPayload | null>(initialFeed);
  const [loading, setLoading] = useState(!initialFeed);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  const [section, setSection] = useState<string>(initialSecParam);
  const [tag, setTag] = useState<string>("");
  const [model, setModel] = useState<string>("");
  const [srcKind, setSrcKind] = useState<string>("");
  const [query, setQuery] = useState<string>(initialQParam);
  const [selectedView, setSelectedView] = useState<string>(() => {
    if (initialViewParam === "weekly") return "weekly";
    if (initialSecParam) return "all";
    return initialFeed?.days?.[0]?.date || "all";
  });
  const [weeklyIdx, setWeeklyIdx] = useState<number>(0);
  const [page, setPage] = useState(1);

  const [lastSearchKey, setLastSearchKey] = useState(searchParams.toString());
  const currentSearchKey = searchParams.toString();
  if (currentSearchKey !== lastSearchKey) {
    setLastSearchKey(currentSearchKey);
    const pSec = searchParams.get("section") || "";
    const pView = searchParams.get("view") || "";
    const pQ = searchParams.get("q") || "";
    if (pSec) {
      setSection(pSec);
      setSelectedView("all");
    } else if (pView === "weekly") {
      setSection("");
      setSelectedView("weekly");
    } else {
      setSection("");
      if (feed?.days?.length) setSelectedView(feed.days[0].date);
    }
    if (pQ) setQuery(pQ);
    setPage(1);
  }

  const [activeArticle, setActiveArticle] = useState<NewsItem | null>(null);
  const [peekRepo, setPeekRepo] = useState<RepoItem | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [flashedId, setFlashedId] = useState<string | null>(null);
  const [showToTop, setShowToTop] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const voice = useSyncExternalStore<"female" | "male">(
    subscribeStorage,
    readVoicePref,
    () => "female"
  );
  const rate = useSyncExternalStore(subscribeStorage, readRatePref, () => 1);
  const { favorites, toggleFavorite } = useFavorites();

  const [player, setPlayer] = useState<PlayerState>({
    queue: [],
    index: -1,
    mode: "single",
    playing: false,
    label: "",
    phase: "item",
  });

  // Fetch client-side only if SSR initialFeed missed or user clicked retry
  useEffect(() => {
    if (initialFeed && retryTick === 0) return;
    const controller = new AbortController();
    fetch("/api/news/feed?days_limit=90", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: NewsFeedPayload) => {
        setFeed(data);
        setError("");
        setSelectedView((prev) =>
          prev === "all" && !section && data.days.length > 0 ? data.days[0].date : prev
        );
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
  }, [initialFeed, retryTick, section]);

  // Keyboard shortcuts (`/` search, `Esc` lightbox) & scroll-to-top
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && lightboxSrc) {
        setLightboxSrc(null);
        return;
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const elTag = (document.activeElement?.tagName || "").toLowerCase();
        if (elTag !== "input" && elTag !== "textarea" && elTag !== "select") {
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

  const activeDay = useMemo(() => {
    if (!feed?.days.length) return null;
    if (selectedView === "all" || selectedView === "weekly" || selectedView.startsWith("topic:")) {
      return null;
    }
    return feed.days.find((d) => d.date === selectedView) || feed.days[0];
  }, [feed, selectedView]);

  const isDateScopedAll =
    selectedView === "all" || selectedView === "weekly" || selectedView.startsWith("topic:");

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

  const hasSecondaryFilters = Boolean(tag || model || srcKind || query.trim());
  const isFiltered = Boolean(section || hasSecondaryFilters);

  const matchesSecondary = useCallback(
    (it: NewsItem) => {
      if (tag && !(it.tags || []).includes(tag)) return false;
      if (model && !itemMatchesModel(it, model)) return false;
      if (srcKind && detectSourceKind(it) !== srcKind) return false;
      const nq = normalizeVi(query.trim());
      if (!nq) return true;
      const hay = itemSearchHaystack(it);
      return nq.split(/\s+/).every((term) => hay.includes(term));
    },
    [tag, model, srcKind, query]
  );

  // Scoped base pool before section filter (for exact deduplicated section counts)
  const scopedTotalCount = useMemo(() => {
    const rawPool = isDateScopedAll
      ? (feed?.days || []).flatMap((d) => d.items)
      : activeDay?.items || [];
    const seen = new Set<string>();
    for (const it of rawPool) seen.add(it.id);
    return seen.size;
  }, [feed?.days, activeDay, isDateScopedAll]);

  const baseScopedItems = useMemo(() => {
    const rawPool = isDateScopedAll
      ? (feed?.days || []).flatMap((d) => d.items)
      : activeDay?.items || [];
    const seen = new Set<string>();
    const out: NewsItem[] = [];
    for (const it of rawPool) {
      if (seen.has(it.id)) continue;
      if (!matchesSecondary(it)) continue;
      seen.add(it.id);
      out.push(it);
    }
    return out;
  }, [feed?.days, activeDay, isDateScopedAll, matchesSecondary]);

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

  const sectionList = useMemo(() => {
    const base = feed?.sections || [];
    const extras = categoryStats.extraSections.map((name) => ({
      name,
      short: name,
      color: "var(--v-accent)",
    }));
    return [...base, ...extras];
  }, [feed?.sections, categoryStats.extraSections]);

  const filteredItems = useMemo(() => {
    if (!section) return baseScopedItems;
    return baseScopedItems.filter((it) => getItemSections(it).includes(section));
  }, [baseScopedItems, section]);

  const activeSectionShort = useMemo(() => {
    if (!section) return "";
    return sectionList.find((s) => s.name === section)?.short || section;
  }, [section, sectionList]);

  const resultSummary = useMemo(() => {
    const dateScopeText = isDateScopedAll
      ? `trong lưu trữ (${feed?.days.length || 0} ngày)`
      : `trong ngày ${formatNewsDate(activeDay?.date || "")}`;
    if (!section && !hasSecondaryFilters) {
      return `${scopedTotalCount} tin ${dateScopeText}`;
    }
    if (section && !hasSecondaryFilters) {
      return `${filteredItems.length} kết quả (${activeSectionShort}) · ${scopedTotalCount} tin ${dateScopeText}`;
    }
    if (!section && hasSecondaryFilters) {
      return `${categoryStats.allCount} kết quả lọc · ${scopedTotalCount} tin ${dateScopeText}`;
    }
    return `${filteredItems.length} kết quả (${activeSectionShort}) · ${categoryStats.allCount} khớp bộ lọc · ${scopedTotalCount} tin ${dateScopeText}`;
  }, [
    isDateScopedAll,
    feed?.days.length,
    activeDay?.date,
    section,
    hasSecondaryFilters,
    filteredItems.length,
    activeSectionShort,
    scopedTotalCount,
    categoryStats.allCount,
  ]);

  // Featured cover + dispatch rail (used in day/all views)
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

  // Audio handlers
  const activeReadingId = player.index >= 0 ? player.queue[player.index]?.id : null;

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
    if (selectedView === "weekly") {
      const w = feed.weekly[weeklyIdx];
      if (!w) return;
      const list = w.items.map((x) => itemById[x.id]).filter(Boolean);
      startQueue(list, w.title);
      return;
    }
    if (selectedView.startsWith("topic:")) {
      const tp = timelineTopics.find((x) => x.key === selectedView);
      if (!tp) return;
      const list = weekDays.flatMap((d) => d.items.filter((it) => !it.tip && tp.match(it)));
      startQueue(list, tp.label);
      return;
    }
    startQueue(
      filteredItems,
      activeDay ? `Podcast ${formatNewsDate(activeDay.date).slice(0, 5)}` : "Tạp chí Tin AI"
    );
  }, [feed, selectedView, weeklyIdx, itemById, timelineTopics, weekDays, filteredItems, activeDay, startQueue]);

  const jumpToItem = useCallback(
    (item: NewsItem) => {
      if (selectedView !== "all" && selectedView !== item.date) {
        setSelectedView(item.date);
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
    [selectedView]
  );

  const handleOpenRepoById = useCallback(async (repoId: number) => {
    try {
      const res = await fetch(`/api/repositories/${repoId}`);
      if (!res.ok) return;
      const repoData = (await res.json()) as RepoItem;
      setPeekRepo(repoData);
    } catch {
      // ignore
    }
  }, []);

  const clearAllFilters = () => {
    setSection("");
    setTag("");
    setModel("");
    setSrcKind("");
    setQuery("");
    setPage(1);
  };

  const articleIndex = activeArticle
    ? filteredItems.findIndex((x) => x.id === activeArticle.id)
    : -1;

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 lg:py-8">
        <div className="h-28 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)]" />
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="h-80 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)] lg:col-span-9" />
          <div className="h-80 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)] lg:col-span-3" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl min-w-0 space-y-6 px-3 py-6 sm:px-6 lg:py-8">
      {/* Magazine Masthead */}
      <section className="space-y-4 border-b border-[var(--v-rule)] pb-5">
        <div className="flex min-w-0 flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="font-telemetry text-[11px] font-medium uppercase tracking-widest text-[var(--v-accent)]">
              Bản tin &amp; Mục Repo · Độc lập
            </div>
            <h1 className="font-editorial mt-1 text-3xl font-medium tracking-tight text-[var(--v-ink)] sm:text-4xl">
              Tạp chí Tin tức AI &amp; Repo
            </h1>
            <p className="mt-1.5 text-sm text-[var(--v-muted)]" role="status" aria-live="polite">
              {resultSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={voice}
              onChange={(e) => {
                const v = e.target.value === "male" ? "male" : "female";
                try {
                  window.localStorage.setItem("aihub_news_voice", v);
                  window.dispatchEvent(new Event("aihub_news_prefs_updated"));
                } catch {
                  // ignore
                }
              }}
              aria-label="Giọng đọc Podcast"
              className="h-11 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 text-xs font-medium text-[var(--v-ink)] sm:h-9"
            >
              <option value="female">Giọng Nữ</option>
              <option value="male">Giọng Nam</option>
            </select>

            <button
              type="button"
              onClick={readCurrentView}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] bg-[var(--v-accent)] px-3.5 py-2 text-xs font-medium text-[var(--v-accent-ink)] transition-transform duration-150 hover:opacity-90 active:scale-[0.98] sm:min-h-0 sm:h-9"
            >
              <Headphones className="size-3.5" />
              <span>Đọc cả trang</span>
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--v-muted)]" />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              setPage(1);
              if (val.trim() && (selectedView === "weekly" || selectedView.startsWith("topic:"))) {
                setSelectedView("all");
              }
            }}
            placeholder="Tìm trong mọi bản tin (nhấn / để gõ nhanh)..."
            aria-label="Tìm trong tin tức AI"
            className="vellum-placeholder min-h-11 w-full min-w-0 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] pr-10 pl-9 text-sm text-[var(--v-ink)] outline-none transition-colors focus:border-[var(--v-rule-strong)] sm:h-10 sm:min-h-0"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPage(1);
              }}
              aria-label="Xoá từ khóa tìm kiếm"
              className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-[4px] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Category Filter Ribbon with Unique Deduplicated Counts */}
        {feed && (
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Bộ lọc chuyên mục tin tức">
            <button
              type="button"
              onClick={() => {
                setSection("");
                setPage(1);
                if (selectedView === "weekly" || selectedView.startsWith("topic:")) {
                  setSelectedView(feed.days[0]?.date || "all");
                }
              }}
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-colors sm:min-h-0 ${
                !section
                  ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)] text-[var(--v-ink)]"
                  : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
              }`}
            >
              <span>Tất cả chuyên mục</span>
              <span className="font-telemetry tabular-nums rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)] px-1.5 py-0.5 text-[10px]">
                {categoryStats.allCount}
              </span>
            </button>

            {sectionList.map((sec) => {
              const active = section === sec.name;
              const cnt = categoryStats.counts[sec.name] ?? 0;
              return (
                <button
                  key={sec.name}
                  type="button"
                  onClick={() => {
                    const next = active ? "" : sec.name;
                    setSection(next);
                    setPage(1);
                    if (selectedView === "weekly" || selectedView.startsWith("topic:")) {
                      setSelectedView("all");
                    }
                  }}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs transition-colors sm:min-h-0 ${
                    active
                      ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)] font-medium text-[var(--v-ink)]"
                      : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                  }`}
                >
                  <NewsCategoryIcon section={sec.name} size={13} />
                  <span>{sec.short}</span>
                  <span
                    className={`font-telemetry tabular-nums rounded-[3px] px-1.5 py-0.5 text-[10px] ${
                      active
                        ? "bg-[var(--v-accent)] font-medium text-[var(--v-accent-ink)]"
                        : "bg-[var(--v-surface-alt)] text-[var(--v-muted)]"
                    }`}
                  >
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Secondary Filter Strip: Topic Models, Source, Tag, Quick Flags */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
            Chủ đề:
          </span>
          {MODEL_FILTERS.map((m) => {
            const active = model === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => {
                  setModel((prev) => (prev === m.key ? "" : m.key));
                  setPage(1);
                  if (selectedView === "weekly" || selectedView.startsWith("topic:")) {
                    setSelectedView("all");
                  }
                }}
                className={`min-h-9 rounded-[4px] border px-2.5 py-1 font-medium transition-colors sm:min-h-0 ${
                  active
                    ? "border-[var(--v-accent)] bg-[var(--v-accent)] text-[var(--v-accent-ink)]"
                    : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                }`}
              >
                {m.label}
              </button>
            );
          })}

          <select
            value={srcKind}
            onChange={(e) => {
              setSrcKind(e.target.value);
              setPage(1);
            }}
            aria-label="Lọc theo nguồn"
            className="h-9 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 text-xs text-[var(--v-ink)] sm:h-7"
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
              onChange={(e) => {
                setTag(e.target.value);
                setPage(1);
              }}
              aria-label="Lọc theo thẻ"
              className="h-9 max-w-[180px] rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 text-xs text-[var(--v-ink)] sm:h-7"
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
              className="inline-flex min-h-9 items-center gap-1 rounded-[4px] border border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)] px-2.5 py-1 font-medium text-[var(--v-accent)] hover:opacity-85 sm:min-h-0"
            >
              <RotateCcw className="size-3" />
              Bỏ lọc
            </button>
          )}
        </div>
      </section>

      {error && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[6px] border border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)] p-4 text-sm text-[var(--v-ink)]">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRetryTick((x) => x + 1);
            }}
            className="min-h-10 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] px-3 py-1.5 text-xs font-medium"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Editorial 12-Col Grid */}
      {!error && feed && (
        <div className="grid min-w-0 gap-6 lg:grid-cols-12">
          {/* Left 9 Cols: Cover Story / Weekly Digest / Topic Timeline / Stories */}
          <div className="min-w-0 space-y-6 lg:col-span-9">
            {selectedView === "weekly" ? (
              (() => {
                const w = feed.weekly[weeklyIdx];
                if (!w) {
                  return (
                    <div className="rounded-[6px] border border-dashed border-[var(--v-rule)] bg-[var(--v-surface)] p-10 text-center text-sm text-[var(--v-muted)]">
                      Chưa có bản tin tuần.
                    </div>
                  );
                }
                const rankedItems = w.items
                  .map((x) => ({ meta: x, item: itemById[x.id] }))
                  .filter((x) => Boolean(x.item));
                return (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--v-rule)] pb-4">
                      <div className="space-y-1">
                        <div className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-accent)]">
                          Tổng kết tuần AI &amp; Repo
                        </div>
                        <h2 className="font-editorial text-2xl font-medium text-[var(--v-ink)] sm:text-3xl">
                          {w.title}
                        </h2>
                        <p className="text-sm italic text-[var(--v-muted)]">{w.intro}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {feed.weekly.length > 1 && (
                          <select
                            value={weeklyIdx}
                            onChange={(e) => setWeeklyIdx(Number(e.target.value))}
                            aria-label="Chọn tuần"
                            className="h-9 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-2.5 text-xs text-[var(--v-ink)]"
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
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)] px-3.5 py-2 text-xs font-medium text-[var(--v-accent)] sm:min-h-0"
                        >
                          <Headphones className="size-3.5" />
                          Nghe bản tin tuần
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {rankedItems.map(({ meta, item }, i) => {
                        const isItemPlaying = activeReadingId === item.id && player.playing;
                        return (
                          <article
                            key={item.id}
                            id={`item-${item.id}`}
                            className="group rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4 transition-colors hover:border-[var(--v-rule-strong)]"
                          >
                            <div className="font-telemetry mb-2 flex flex-wrap items-center gap-2 text-[11px] text-[var(--v-accent)]">
                              <span>#{i + 1}</span>
                              <span className="text-[var(--v-muted)]">· {meta.why.join(" · ")}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveArticle(item)}
                              className="font-editorial block w-full text-left text-xl font-medium text-[var(--v-ink)] group-hover:text-[var(--v-accent)]"
                            >
                              {item.title}
                            </button>
                            <p className="mt-1.5 text-sm leading-relaxed text-[var(--v-muted)]">
                              {item.summary}
                            </p>
                            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--v-rule)] pt-2.5 text-xs">
                              <button
                                type="button"
                                onClick={() => handlePlaySingle(item)}
                                className="inline-flex min-h-10 items-center gap-1.5 text-[var(--v-ink)] sm:min-h-0"
                              >
                                {isItemPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                {isItemPlaying ? "Đang đọc" : "Nghe"}
                              </button>
                              <div className="flex items-center gap-3">
                                {item.repository_id && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRepoById(item.repository_id!)}
                                    className="font-medium text-[var(--v-accent)] hover:underline"
                                  >
                                    Repo Folio
                                  </button>
                                )}
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[var(--v-muted)] hover:underline"
                                  >
                                    Nguồn <ArrowUpRight className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </div>
                );
              })()
            ) : selectedView.startsWith("topic:") ? (
              (() => {
                const tp = timelineTopics.find((x) => x.key === selectedView);
                if (!tp) {
                  return (
                    <div className="rounded-[6px] border border-dashed border-[var(--v-rule)] bg-[var(--v-surface)] p-10 text-center text-sm text-[var(--v-muted)]">
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
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--v-rule)] pb-4">
                      <div>
                        <div className="font-telemetry flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--v-accent)]">
                          <Compass className="size-3.5" />
                          Dòng thời gian 7 ngày
                        </div>
                        <h2 className="font-editorial mt-1 text-2xl font-medium text-[var(--v-ink)] sm:text-3xl">
                          {tp.label} tuần này
                        </h2>
                        <p className="text-xs text-[var(--v-muted)]">
                          {tp.count} tin trong {grouped.length} ngày gần nhất
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={readCurrentView}
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)] px-3.5 py-2 text-xs font-medium text-[var(--v-accent)] sm:min-h-0"
                      >
                        <Headphones className="size-3.5" />
                        Nghe cả chủ đề
                      </button>
                    </div>
                    {grouped.map(({ day, items }) => (
                      <div key={day.date} className="space-y-3">
                        <h3 className="font-telemetry text-xs uppercase tracking-wider text-[var(--v-muted)]">
                          {formatNewsWeekday(day.date)}, {formatNewsDate(day.date)} · {items.length} tin
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                          {items.map((it) => (
                            <article
                              key={it.id}
                              id={`item-${it.id}`}
                              className="group flex flex-col justify-between rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4"
                            >
                              <div>
                                <div className="font-telemetry mb-2 flex items-center justify-between text-[11px] text-[var(--v-muted)]">
                                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--v-accent)]">
                                    <NewsCategoryIcon section={it.section} size={13} />
                                    {it.section}
                                  </span>
                                  <span>{urlHost(it.url) || it.source_label}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setActiveArticle(it)}
                                  className="font-editorial block w-full text-left text-lg font-medium text-[var(--v-ink)] group-hover:text-[var(--v-accent)]"
                                >
                                  {it.title}
                                </button>
                                <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-[var(--v-muted)]">
                                  {it.summary}
                                </p>
                              </div>
                              <div className="mt-3 flex items-center justify-between border-t border-[var(--v-rule)] pt-2.5 text-xs">
                                <button
                                  type="button"
                                  onClick={() => handlePlaySingle(it)}
                                  className="inline-flex items-center gap-1 text-[var(--v-ink)]"
                                >
                                  <Play className="size-3.5" /> Nghe
                                </button>
                                {it.url && (
                                  <a
                                    href={it.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-0.5 text-[var(--v-muted)] hover:underline"
                                  >
                                    Nguồn <ArrowUpRight className="size-3" />
                                  </a>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            ) : filteredItems.length === 0 ? (
              <div className="rounded-[6px] border border-dashed border-[var(--v-rule)] bg-[var(--v-surface)] p-12 text-center">
                <p className="font-editorial text-xl text-[var(--v-ink)]">
                  Không có bài viết khớp điều kiện lọc.
                </p>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[4px] border border-[var(--v-rule-strong)] px-3.5 py-1.5 text-xs font-medium text-[var(--v-ink)]"
                >
                  <RotateCcw className="size-3.5" />
                  Đặt lại bộ lọc
                </button>
              </div>
            ) : (
              <>
                {/* Cover Story + Dispatch Rail */}
                {safePage === 1 && coverStory && (
                  <section className="grid min-w-0 gap-5 rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4 sm:p-6 md:grid-cols-12">
                    <div className={`min-w-0 space-y-3 ${dispatchItems.length > 0 ? "md:col-span-8" : "md:col-span-12"}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-telemetry inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--v-accent)]">
                          <NewsCategoryIcon section={coverStory.section} size={13} />
                          Tâm điểm · {coverStory.section}
                        </span>
                        <span className="font-telemetry text-[11px] text-[var(--v-muted)]">
                          {formatNewsWeekday(coverStory.date)}, {formatNewsDate(coverStory.date)}
                        </span>
                      </div>

                      {coverStory.images?.[0] && (
                        <button
                          type="button"
                          onClick={() => setActiveArticle(coverStory)}
                          className="group block w-full"
                        >
                          <SafeNewsThumb
                            src={coverStory.images[0]}
                            alt={coverStory.title}
                            aspect="aspect-[16/9] sm:aspect-[16/10]"
                            priority
                          />
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveArticle(coverStory)}
                        className="font-editorial block min-h-11 w-full text-left text-2xl leading-tight font-medium text-[var(--v-ink)] hover:text-[var(--v-accent)] sm:min-h-0 sm:text-3xl"
                      >
                        {coverStory.title}
                      </button>

                      <p className="text-sm leading-relaxed text-[var(--v-muted)]">
                        {coverStory.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setActiveArticle(coverStory)}
                          className="min-h-11 rounded-[4px] bg-[var(--v-accent)] px-4 py-2 text-xs font-medium text-[var(--v-accent-ink)] transition-transform duration-150 hover:opacity-90 active:scale-[0.98] sm:min-h-0"
                        >
                          Đọc toàn văn
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePlaySingle(coverStory)}
                          className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--v-rule-strong)] px-3 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:bg-[var(--v-bg)] sm:min-h-0"
                        >
                          {activeReadingId === coverStory.id && player.playing ? (
                            <Pause className="size-3.5" />
                          ) : (
                            <Play className="size-3.5" />
                          )}
                          Nghe bài
                        </button>
                        {coverStory.repository_id && (
                          <button
                            type="button"
                            onClick={() => handleOpenRepoById(coverStory.repository_id!)}
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--v-rule)] px-3 py-2 text-xs font-medium text-[var(--v-ink)] hover:border-[var(--v-rule-strong)] sm:min-h-0"
                          >
                            <FolderGit2 className="size-3.5 text-[var(--v-accent)]" />
                            Repo Folio
                          </button>
                        )}
                        {coverStory.url && (
                          <a
                            href={coverStory.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule)] px-3 py-2 text-xs font-medium text-[var(--v-muted)] hover:text-[var(--v-ink)] sm:min-h-0"
                          >
                            Bài gốc <ArrowUpRight className="size-3" />
                          </a>
                        )}
                      </div>
                    </div>

                    {dispatchItems.length > 0 && (
                      <div className="min-w-0 space-y-3 border-t border-[var(--v-rule)] pt-4 md:col-span-4 md:border-t-0 md:border-l md:pt-0 md:pl-5">
                        <div className="font-telemetry flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--v-accent)]">
                          <Sparkles className="size-3.5" />
                          Tin nhanh &amp; Nổi bật
                        </div>
                        <div className="divide-y divide-[var(--v-rule)]">
                          {dispatchItems.map((it) => (
                            <button
                              key={it.id}
                              type="button"
                              onClick={() => setActiveArticle(it)}
                              className="group flex min-h-11 w-full items-start gap-2.5 py-2.5 text-left transition-colors hover:opacity-85 sm:min-h-0"
                            >
                              {it.images?.[0] && (
                                <div className="w-12 shrink-0">
                                  <SafeNewsThumb src={it.images[0]} alt="" aspect="aspect-square" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <div className="font-telemetry flex items-center gap-1.5 text-[10px] text-[var(--v-muted)]">
                                  <NewsCategoryIcon section={it.section} size={11} />
                                  <span>{it.section}</span>
                                </div>
                                <div className="font-editorial mt-0.5 line-clamp-2 text-[14px] leading-snug font-medium text-[var(--v-ink)] group-hover:underline">
                                  {it.title}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </section>
                )}

                {/* Story Cards Grid */}
                {pagedStories.length > 0 && (
                  <AnimatePresence mode="wait">
                    <motion.section
                      key={`${section}-${selectedView}-${safePage}`}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: VELLUM_EASE }}
                      className="grid min-w-0 gap-4 md:grid-cols-2"
                    >
                      {pagedStories.map((it) => {
                        const isItemPlaying = activeReadingId === it.id && player.playing;
                        const isFlashed = flashedId === it.id;
                        return (
                          <article
                            key={it.id}
                            id={`item-${it.id}`}
                            className={`group flex min-w-0 flex-col justify-between rounded-[5px] border bg-[var(--v-surface)] p-4 transition-colors duration-150 hover:-translate-y-[2px] ${
                              isFlashed
                                ? "border-[var(--v-accent)] ring-2 ring-[var(--v-accent)]/30"
                                : "border-[var(--v-rule)] hover:border-[var(--v-rule-strong)]"
                            }`}
                          >
                            <div className="min-w-0 space-y-2.5">
                              <div className="font-telemetry flex items-center justify-between gap-2 text-[11px] text-[var(--v-muted)]">
                                <span className="inline-flex min-w-0 items-center gap-1.5 truncate font-medium text-[var(--v-accent)]">
                                  <NewsCategoryIcon section={it.section} size={13} />
                                  {it.section}
                                </span>
                                <span className="shrink-0 truncate">
                                  {urlHost(it.url) || it.source_label}
                                </span>
                              </div>

                              {it.images?.[0] && (
                                <button
                                  type="button"
                                  onClick={() => setActiveArticle(it)}
                                  className="block w-full"
                                >
                                  <SafeNewsThumb src={it.images[0]} alt={it.title} />
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setActiveArticle(it)}
                                className="font-editorial block min-h-11 w-full text-left text-[18px] leading-snug font-medium text-[var(--v-ink)] group-hover:text-[var(--v-accent)] sm:min-h-0"
                              >
                                {it.title}
                              </button>

                              <p className="line-clamp-3 text-xs leading-relaxed text-[var(--v-muted)]">
                                {it.summary}
                              </p>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--v-rule)] pt-2.5 text-xs">
                              <button
                                type="button"
                                onClick={() => handlePlaySingle(it)}
                                aria-label={isItemPlaying ? "Dừng nghe" : `Nghe: ${it.title}`}
                                className={`inline-flex min-h-11 items-center gap-1.5 px-1 sm:min-h-0 sm:px-0 ${
                                  isItemPlaying ? "text-[var(--v-accent)]" : "text-[var(--v-ink)]"
                                }`}
                              >
                                {isItemPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                                <span>{isItemPlaying ? "Đang đọc" : "Nghe"}</span>
                              </button>

                              <div className="flex items-center gap-3">
                                {it.repository_id && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenRepoById(it.repository_id!)}
                                    className="inline-flex min-h-11 items-center px-1.5 font-medium text-[var(--v-accent)] hover:underline sm:min-h-0 sm:px-0"
                                  >
                                    Repo Folio
                                  </button>
                                )}
                                {it.url && (
                                  <a
                                    href={it.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex min-h-11 items-center gap-0.5 px-1.5 text-[var(--v-muted)] hover:underline sm:min-h-0 sm:px-0"
                                  >
                                    Nguồn <ArrowUpRight className="size-3" />
                                  </a>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </motion.section>
                  </AnimatePresence>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <button
                      type="button"
                      disabled={safePage <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-4 text-xs font-medium text-[var(--v-ink)] disabled:opacity-40 sm:h-8 sm:min-h-0 sm:px-3"
                    >
                      <ChevronLeft className="size-3.5" />
                      Trước
                    </button>
                    <span className="font-telemetry tabular-nums px-2 text-xs text-[var(--v-muted)]">
                      {safePage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={safePage >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-4 text-xs font-medium text-[var(--v-ink)] disabled:opacity-40 sm:h-8 sm:min-h-0 sm:px-3"
                    >
                      Sau
                      <ChevronRight className="size-3.5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Archive Rail (3 Cols) */}
          <aside className="min-w-0 space-y-5 lg:col-span-3 lg:border-l lg:border-[var(--v-rule)] lg:pl-6">
            {/* Quick Flags */}
            <div className="space-y-1.5">
              <div className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                Nhãn ưu tiên
              </div>
              {QUICK_TAG_FILTERS.map((tf) => {
                const count = (feed.days || []).reduce(
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
                      setPage(1);
                      if (!active && (selectedView === "weekly" || selectedView.startsWith("topic:"))) {
                        setSelectedView("all");
                      }
                    }}
                    className={`flex min-h-11 w-full items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium transition-colors sm:min-h-0 ${
                      active
                        ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)] text-[var(--v-ink)]"
                        : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-ink)] hover:border-[var(--v-rule-strong)]"
                    }`}
                  >
                    <span>{tf.short}</span>
                    <span className="font-telemetry tabular-nums text-[11px] text-[var(--v-muted)]">
                      {active ? "Bỏ" : count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Date Issue Switcher */}
            <div>
              <div className="font-telemetry mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                <Calendar className="size-3.5" />
                Số theo ngày
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedView("all");
                    setPage(1);
                  }}
                  className={`flex min-h-11 w-full items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium transition-colors sm:min-h-0 ${
                    selectedView === "all"
                      ? "border-[var(--v-ink)] bg-[var(--v-ink)] text-[var(--v-bg)]"
                      : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-ink)] hover:border-[var(--v-rule-strong)]"
                  }`}
                >
                  <span>Tất cả ngày ({feed.days.length})</span>
                  <span className="font-telemetry tabular-nums text-[11px] opacity-80">
                    {feed.stats.all_items ?? feed.stats.total_items ?? 0}
                  </span>
                </button>

                {feed.days.slice(0, 7).map((d) => {
                  const active = selectedView === d.date;
                  return (
                    <button
                      key={d.date}
                      type="button"
                      onClick={() => {
                        setSelectedView(d.date);
                        setPage(1);
                      }}
                      className={`min-h-11 w-full rounded-[4px] border px-3 py-2 text-left text-xs transition-colors sm:min-h-0 ${
                        active
                          ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)]"
                          : "border-[var(--v-rule)] bg-[var(--v-surface)] hover:border-[var(--v-rule-strong)]"
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-[var(--v-ink)]">
                          {formatNewsDate(d.date).slice(0, 5)} · {formatNewsWeekday(d.date)}
                        </span>
                        <span className="font-telemetry tabular-nums text-[11px] text-[var(--v-accent)]">
                          {d.items.length}
                        </span>
                      </div>
                      {d.noon_count > 0 && (
                        <div className="font-telemetry mt-0.5 text-[10px] text-[var(--v-muted)]">
                          +{d.noon_count} tin trưa
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 7-Day Topic Timeline */}
            {timelineTopics.length > 0 && (
              <div className="space-y-1.5 border-t border-[var(--v-rule)] pt-4">
                <div className="font-telemetry mb-1.5 flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                  <Compass className="size-3.5" />
                  Dòng thời gian 7 ngày
                </div>
                {timelineTopics.slice(0, 6).map((tp) => {
                  const active = selectedView === tp.key;
                  return (
                    <button
                      key={tp.key}
                      type="button"
                      onClick={() => {
                        setSelectedView(tp.key);
                        setPage(1);
                      }}
                      className={`flex min-h-10 w-full items-center justify-between rounded-[4px] border px-3 py-1.5 text-left text-xs transition-colors sm:min-h-0 ${
                        active
                          ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)] font-medium text-[var(--v-ink)]"
                          : "border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-muted)] hover:text-[var(--v-ink)]"
                      }`}
                    >
                      <span className="truncate">{tp.label} tuần này</span>
                      <span className="font-telemetry tabular-nums text-[11px]">{tp.count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Weekly Digest */}
            {feed.weekly && feed.weekly.length > 0 && (
              <div className="space-y-2 border-t border-[var(--v-rule)] pt-4">
                <div className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                  Tổng kết tuần
                </div>
                {feed.weekly.slice(0, 2).map((w, idx) => (
                  <button
                    key={w.week_start}
                    type="button"
                    onClick={() => {
                      setWeeklyIdx(idx);
                      setSelectedView("weekly");
                      setPage(1);
                    }}
                    className={`w-full rounded-[5px] border p-3 text-left text-xs transition-colors ${
                      selectedView === "weekly" && weeklyIdx === idx
                        ? "border-[var(--v-accent)] bg-[var(--v-accent-soft)]"
                        : "border-[var(--v-rule)] bg-[var(--v-surface)] hover:border-[var(--v-rule-strong)]"
                    }`}
                  >
                    <div className="font-medium text-[var(--v-ink)]">{w.title}</div>
                    <p className="mt-1 line-clamp-2 leading-relaxed text-[var(--v-muted)]">{w.intro}</p>
                  </button>
                ))}
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Lightbox */}
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
            className="max-h-[90vh] max-w-[92vw] rounded-[6px] shadow-2xl"
          />
        </div>
      )}

      {/* Scroll To Top */}
      {showToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className={`fixed right-4 z-30 flex size-11 items-center justify-center rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-ink)] text-[var(--v-bg)] shadow-lg transition-opacity hover:opacity-90 ${
            player.queue.length > 0 ? "bottom-24" : "bottom-6"
          }`}
          title="Lên đầu trang"
          aria-label="Lên đầu trang"
        >
          <ArrowUp className="size-4" />
        </button>
      )}

      {/* News Article Reader Drawer */}
      <NewsDetailDrawer22
        item={activeArticle}
        theme={VELLUM_CSS}
        rc
        isPlaying={activeArticle ? activeReadingId === activeArticle.id && player.playing : false}
        hasPrev={articleIndex > 0}
        hasNext={articleIndex >= 0 && articleIndex < filteredItems.length - 1}
        positionLabel={articleIndex >= 0 ? `${articleIndex + 1}/${filteredItems.length}` : ""}
        onClose={() => setActiveArticle(null)}
        onPrev={() => articleIndex > 0 && setActiveArticle(filteredItems[articleIndex - 1])}
        onNext={() =>
          articleIndex >= 0 &&
          articleIndex < filteredItems.length - 1 &&
          setActiveArticle(filteredItems[articleIndex + 1])
        }
        onSpeak={handlePlaySingle}
        onOpenRepoById={handleOpenRepoById}
        onOpenLightbox={setLightboxSrc}
      />

      {/* Repo Quick Peek triggered from News */}
      <RepoQuickPeek22
        repo={peekRepo}
        theme={VELLUM_CSS}
        rc
        isFavorite={peekRepo ? favorites.includes(peekRepo.id) : false}
        hasPrev={false}
        hasNext={false}
        onClose={() => setPeekRepo(null)}
        onPrev={() => {}}
        onNext={() => {}}
        onToggleFavorite={toggleFavorite}
      />

      {/* Persistent Audio / Podcast Player */}
      <NewsAudioPlayer
        player={player}
        voice={voice}
        rate={rate}
        onVoiceChange={(v) => {
          try {
            window.localStorage.setItem("aihub_news_voice", v);
            window.dispatchEvent(new Event("aihub_news_prefs_updated"));
          } catch {
            // ignore
          }
        }}
        onRateChange={(r) => {
          try {
            window.localStorage.setItem("aihub_news_rate", String(r));
            window.dispatchEvent(new Event("aihub_news_prefs_updated"));
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
