"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitFork,
  Heart,
  LayoutGrid,
  List,
  RotateCcw,
  Search,
  Star,
  X,
} from "lucide-react";
import { RepoThumbnail22 } from "@/components/prototypes/vellum22/RepoThumbnail22";
import {
  BrandLogoBadge,
  CategoryIcon,
  LanguageLogo,
  resolveBrandIcon,
} from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";
import {
  type CatalogStats,
  type RepoItem,
  type RepoPage,
  formatCompactNumber,
  formatViDate,
} from "@/lib/repositories/types";

interface VellumLibraryView22Props {
  theme: VellumTheme;
  dark: boolean;
  rc?: boolean;
  stats: CatalogStats | null;
  favorites: number[];
  onlyFavorites: boolean;
  initialQ?: string;
  initialCategory?: string;
  onToggleFavorite: (id: number) => void;
  onResetOnlyFavorites: () => void;
  onOpenQuickPeek: (repo: RepoItem, list: RepoItem[]) => void;
  externalSearchFocusTick: number;
}

const SORT_OPTIONS = [
  { value: "stars", label: "Nhiều stars nhất" },
  { value: "updated", label: "Mới cập nhật" },
  { value: "forks", label: "Nhiều forks nhất" },
  { value: "name", label: "Tên A–Z" },
  { value: "stars_asc", label: "Ít stars nhất" },
  { value: "oldest", label: "Cập nhật cũ nhất" },
];

const EDITORIAL_COLLECTIONS = [
  {
    category: "AI Agent",
    subtitle: "Agent tự trị & đa tác vụ",
    iconSrc: "/icons/claude-code.svg",
    invertDark: false,
  },
  {
    category: "Claude Skills",
    subtitle: "Kỹ năng coding agent",
    iconSrc: "/icons/claude.svg",
    invertDark: false,
  },
  {
    category: "Workflow & Tự động hoá",
    subtitle: "Pipeline & API",
    iconSrc: "/icons/dify.svg",
    invertDark: false,
  },
  {
    category: "Chạy AI cục bộ",
    subtitle: "LLM offline & GPU",
    iconSrc: "/icons/ollama.svg",
    invertDark: true,
  },
];

export function VellumLibraryView22({
  theme,
  dark,
  rc = false,
  stats,
  favorites,
  onlyFavorites,
  initialQ = "",
  initialCategory = "",
  onToggleFavorite,
  onResetOnlyFavorites,
  onOpenQuickPeek,
  externalSearchFocusTick,
}: VellumLibraryView22Props) {
  const [q, setQ] = useState(initialQ);
  const [category, setCategory] = useState(initialCategory);
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [data, setData] = useState<RepoPage | null>(null);
  const [topRepos, setTopRepos] = useState<RepoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQ(initialQ);
    setCategory(initialCategory);
    setPage(1);
  }, [initialQ, initialCategory]);

  useEffect(() => {
    if (externalSearchFocusTick > 0) {
      searchInputRef.current?.focus();
    }
  }, [externalSearchFocusTick]);

  // Fetch initial unfiltered top repos once for Featured Spotlight & Top 5 strip
  useEffect(() => {
    fetch("/api/repositories?sort=stars&page=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: RepoPage | null) => {
        if (d?.items) setTopRepos(d.items);
      })
      .catch(() => {});
  }, []);

  const favoriteIdsParam = useMemo(
    () => (onlyFavorites ? favorites.join(",") : null),
    [onlyFavorites, favorites]
  );

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q,
          category,
          language,
          sort,
          page: String(page),
        });
        if (favoriteIdsParam !== null) params.set("favorite_ids", favoriteIdsParam);
        const res = await fetch(`/api/repositories?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error("API error");
        setData(await res.json());
      } catch {
        if (!controller.signal.aborted) {
          setError("Không kết nối được backend Repository API.");
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 140);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, category, language, sort, page, favoriteIdsParam, retryTick]);

  const items = data?.items || [];
  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / 12));
  const hasFilters = Boolean(q.trim() || category || language || sort !== "stars" || onlyFavorites);

  const featuredCandidates = useMemo(() => {
    const custom = topRepos.filter((r) => r.has_custom_image && r.image_url);
    return (custom.length > 0 ? custom : topRepos).slice(0, 4);
  }, [topRepos]);

  const featuredRepo = featuredCandidates[featuredIndex % Math.max(1, featuredCandidates.length)];
  const topStarredStrip = topRepos.slice(0, 5);

  const resetAll = () => {
    setQ("");
    setCategory("");
    setLanguage("");
    setSort("stars");
    setPage(1);
    if (onlyFavorites) onResetOnlyFavorites();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:py-6">
      {/* Row 1: Compact Featured Spotlight (8 cols) + Top 5 GitHub Stars (4 cols) so Catalog Grid stays above the fold */}
      {!hasFilters && page === 1 && featuredRepo && (
        <section className="grid gap-4 lg:grid-cols-12">
          {/* Compact Spotlight Card (~230px tall on desktop) */}
          <div
            style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
            className="grid overflow-hidden rounded-[6px] border sm:grid-cols-12 lg:col-span-8"
          >
            <button
              type="button"
              onClick={() => onOpenQuickPeek(featuredRepo, featuredCandidates)}
              className="group relative block text-left sm:col-span-5"
              title="Mở Specimen Folio Quick Preview"
            >
              <RepoThumbnail22
                repo={featuredRepo}
                theme={theme}
                dark={dark}
                aspectClass="aspect-[16/10] sm:h-full sm:min-h-[212px]"
                priority
              />
              <span
                style={{ backgroundColor: theme.surface, color: theme.ink, borderColor: theme.ruleStrong }}
                className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-[4px] border px-2 py-0.5 text-[10.5px] font-medium opacity-95 transition-transform duration-150 group-hover:translate-x-0.5"
              >
                <Eye style={{ color: theme.accent }} className="size-3" />
                Folio
              </span>
            </button>

            <div
              style={{ borderColor: theme.rule }}
              className="flex flex-col justify-between border-t p-4 sm:col-span-7 sm:border-t-0 sm:border-l sm:p-5"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                    className="inline-flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-widest"
                  >
                    <CategoryIcon category={featuredRepo.category} className="size-3" />
                    Tiêu điểm · {featuredRepo.category}
                  </span>

                  {featuredCandidates.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {featuredCandidates.map((cand, idx) => (
                        <button
                          key={cand.id}
                          type="button"
                          onClick={() => setFeaturedIndex(idx)}
                          style={{
                            backgroundColor: idx === featuredIndex ? theme.accent : theme.surfaceAlt,
                            color: idx === featuredIndex ? theme.accentInk : theme.muted,
                            fontFamily: "var(--font-jetbrains)",
                          }}
                          className={`rounded-[3px] text-[10px] font-medium transition-colors duration-150 ${
                            rc ? "min-h-11 min-w-11 px-2 sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5" : "px-1.5 py-0.5"
                          }`}
                        >
                          0{idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={featuredRepo.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.18, ease: VELLUM_EASE }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <BrandLogoBadge
                        icon={resolveBrandIcon(featuredRepo.full_name, featuredRepo.category, featuredRepo.topics)}
                        dark={dark}
                        size={19}
                      />
                      <h1
                        style={{ fontFamily: "var(--font-newsreader)" }}
                        className="truncate text-xl leading-tight font-medium tracking-tight sm:text-2xl"
                      >
                        {featuredRepo.full_name}
                      </h1>
                    </div>

                    <p style={{ color: theme.muted }} className="line-clamp-2 text-xs leading-relaxed sm:text-[13px]">
                      {featuredRepo.description_vi}
                    </p>

                    <div
                      style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }}
                      className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px]"
                    >
                      <span style={{ color: theme.ink }} className="tabular-nums inline-flex items-center gap-1 font-medium">
                        <Star style={{ color: theme.accent }} className="size-3 fill-current" />
                        {formatCompactNumber(featuredRepo.stars)}
                      </span>
                      <span className="tabular-nums inline-flex items-center gap-1">
                        <GitFork className="size-3" />
                        {formatCompactNumber(featuredRepo.forks)}
                      </span>
                      <LanguageLogo language={featuredRepo.language} dark={dark} />
                      <span className="hidden sm:inline">{formatViDate(featuredRepo.updated_at)}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenQuickPeek(featuredRepo, featuredCandidates)}
                  style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                  className={`inline-flex items-center gap-1.5 rounded-[4px] px-3.5 py-1.5 text-xs font-medium transition-transform duration-150 hover:-translate-y-[1px] active:scale-[0.985] ${
                    rc ? "min-h-11 sm:min-h-0" : ""
                  }`}
                >
                  <Eye className="size-3.5" />
                  Xem nhanh Folio
                </button>
                <a
                  href={featuredRepo.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ borderColor: theme.ruleStrong, color: theme.ink }}
                  className={`inline-flex items-center gap-1 rounded-[4px] border px-3 py-1.5 text-xs font-medium transition-all duration-150 hover:-translate-y-[1px] hover:opacity-85 active:scale-[0.985] ${
                    rc ? "min-h-11 sm:min-h-0" : ""
                  }`}
                >
                  GitHub
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Rail: Top 5 by Real GitHub Stars */}
          <div
            style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
            className="flex flex-col justify-between overflow-hidden rounded-[6px] border lg:col-span-4"
          >
            <div
              style={{ borderColor: theme.rule }}
              className="flex items-center justify-between border-b px-3.5 py-2.5"
            >
              <h2 style={{ fontFamily: "var(--font-newsreader)" }} className="text-base font-medium">
                Nổi bật theo GitHub Stars
              </h2>
              <span style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }} className="text-[10px] uppercase">
                Top 5
              </span>
            </div>
            <div className="divide-y" style={{ borderColor: theme.rule }}>
              {topStarredStrip.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onOpenQuickPeek(r, topStarredStrip)}
                  style={{ borderColor: theme.rule }}
                  className="group flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-150 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                >
                  <span
                    style={{ color: theme.accent, fontFamily: "var(--font-newsreader)" }}
                    className="w-4 shrink-0 text-sm italic"
                  >
                    0{idx + 1}
                  </span>
                  {r.owner_avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.owner_avatar_url}
                      alt=""
                      loading="lazy"
                      className="size-5 shrink-0 rounded-[3px] border border-black/10 object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs font-medium group-hover:underline">
                    {r.full_name}
                  </span>
                  <span
                    style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                    className="tabular-nums shrink-0 text-[10.5px]"
                  >
                    ★ {formatCompactNumber(r.stars)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Row 2: Slim Editorial Collections Strip (4 cols inline — saves vertical height so cards sit above the fold) */}
      {!hasFilters && page === 1 && stats && (
        <section className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          {EDITORIAL_COLLECTIONS.map((col) => {
            const count = stats.categories.find((c) => c.name === col.category)?.count ?? 0;
            return (
              <button
                key={col.category}
                type="button"
                onClick={() => {
                  setCategory(col.category);
                  setPage(1);
                }}
                style={{
                  backgroundColor: theme.surface,
                  borderColor: theme.rule,
                }}
                className="group flex items-center gap-2.5 rounded-[5px] border px-3 py-2.5 text-left transition-all duration-150 hover:-translate-y-[2px]"
              >
                <div
                  style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.rule }}
                  className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.iconSrc}
                    alt={col.category}
                    className="size-4 object-contain"
                    style={{
                      filter: dark && col.invertDark ? "invert(1) brightness(1.1)" : undefined,
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-medium group-hover:underline">
                      {col.category}
                    </span>
                    <span
                      style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                      className="tabular-nums shrink-0 text-[11px] font-medium"
                    >
                      {count}
                    </span>
                  </div>
                  <p style={{ color: theme.muted }} className="truncate text-[11px]">
                    {col.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {/* Row 3: Search, Filter & Grid/List Toolbar */}
      <section
        style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
        className="space-y-2.5 rounded-[6px] border p-3"
      >
        <div className="flex flex-wrap items-center gap-2">
          <div
            style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
            className="relative flex min-w-[220px] flex-1 items-center rounded-[4px] border px-3 transition-all duration-150 focus-within:ring-2 focus-within:ring-[#c84b24]/40"
          >
            <Search style={{ color: theme.muted }} className="size-4 shrink-0" />
            <input
              ref={searchInputRef}
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên repo, mô tả tiếng Việt hoặc tiếng Anh (nhấn /)..."
              className={`w-full bg-transparent px-2.5 text-sm outline-none ${
                rc
                  ? `h-11 sm:h-9 ${dark ? "placeholder:text-[#B8B0A4]" : "placeholder:text-[#57534B]"}`
                  : "h-9"
              }`}
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                style={{ color: theme.muted }}
                className={rc ? "flex size-11 -mr-2.5 items-center justify-center sm:size-6 sm:mr-0" : ""}
                aria-label="Xoá từ khoá"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <select
            aria-label="Lọc ngôn ngữ"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
            className={`rounded-[4px] border px-2.5 text-xs outline-none ${rc ? "h-11 sm:h-9" : "h-9"}`}
          >
            <option value="">Mọi ngôn ngữ</option>
            {stats?.languages.map((l) => (
              <option key={l.name} value={l.name}>
                {l.name} ({l.count})
              </option>
            ))}
          </select>

          <select
            aria-label="Sắp xếp"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
            className={`rounded-[4px] border px-2.5 text-xs outline-none ${rc ? "h-11 sm:h-9" : "h-9"}`}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div
            style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
            className="relative flex items-center rounded-[4px] border p-0.5"
          >
            {(
              [
                { id: "grid" as const, icon: LayoutGrid, label: "Lưới" },
                { id: "list" as const, icon: List, label: "Danh sách" },
              ] as const
            ).map((m) => {
              const Icon = m.icon;
              const active = viewMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setViewMode(m.id)}
                  style={{ color: active ? theme.accentInk : theme.muted }}
                  className={`relative z-10 inline-flex items-center gap-1 px-2.5 text-xs font-medium ${
                    rc ? "h-10 sm:h-7" : "h-7"
                  }`}
                  title={`Chế độ ${m.label}`}
                >
                  {active && (
                    <motion.span
                      layoutId="vellum22-view-pill"
                      transition={{ duration: 0.22, ease: VELLUM_EASE }}
                      style={{ backgroundColor: theme.accent }}
                      className="absolute inset-0 -z-10 rounded-[3px]"
                    />
                  )}
                  <Icon className="size-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Category Strip */}
        {stats && (
          <div
            style={{ borderColor: theme.rule }}
            className={`flex items-center overflow-x-auto border-t pt-2 pb-0.5 [scrollbar-width:none] ${
              rc ? "gap-2 sm:gap-1.5" : "gap-1.5"
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              style={{
                backgroundColor: category === "" ? theme.ink : theme.bg,
                color: category === "" ? theme.bg : theme.ink,
                borderColor: theme.rule,
              }}
              className={`shrink-0 rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                rc ? "min-h-11 sm:min-h-0" : ""
              }`}
            >
              Tất cả <span className="tabular-nums opacity-80">{stats.total}</span>
            </button>
            {stats.categories.map((cat) => {
              const active = category === cat.name;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => {
                    setCategory(active ? "" : cat.name);
                    setPage(1);
                  }}
                  style={{
                    backgroundColor: active ? theme.accent : theme.bg,
                    color: active ? theme.accentInk : theme.ink,
                    borderColor: active ? theme.accent : theme.rule,
                  }}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors duration-150 ${
                    rc ? "min-h-11 sm:min-h-0" : ""
                  }`}
                >
                  <CategoryIcon category={cat.name} className="size-3" />
                  <span>{cat.name}</span>
                  <span className="tabular-nums opacity-80">{cat.count}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Status & Filter Reset Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs" style={{ color: theme.muted }}>
        <span className="tabular-nums">
          {loading
            ? "Đang tải danh mục..."
            : error || `${totalItems} repository · trang ${page}/${totalPages}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            style={{ color: theme.accent }}
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            <RotateCcw className="size-3" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div
          style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft }}
          className="flex items-center justify-between rounded-[5px] border p-4 text-sm"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryTick((t) => t + 1)}
            style={{ borderColor: theme.ruleStrong }}
            className="rounded-[4px] border px-3 py-1 text-xs font-medium"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {!error && loading && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="animate-pulse overflow-hidden rounded-[6px] border"
            >
              <div style={{ backgroundColor: theme.surfaceAlt }} className="aspect-[16/10] w-full" />
              <div className="space-y-2.5 p-4">
                <div style={{ backgroundColor: theme.surfaceAlt }} className="h-4 w-2/3 rounded" />
                <div style={{ backgroundColor: theme.surfaceAlt }} className="h-9 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!error && !loading && items.length === 0 && (
        <div
          style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
          className="rounded-[6px] border p-10 text-center"
        >
          <p style={{ fontFamily: "var(--font-newsreader)" }} className="text-xl font-medium">
            Không có repository khớp bộ lọc
          </p>
          <p style={{ color: theme.muted }} className="mt-1 text-sm">
            Thử đổi từ khóa tìm kiếm hoặc đặt lại danh mục.
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetAll}
              style={{ backgroundColor: theme.accent, color: theme.accentInk }}
              className="mt-4 rounded-[4px] px-4 py-2 text-xs font-medium"
            >
              Xem toàn bộ thư viện
            </button>
          )}
        </div>
      )}

      {/* Discovery Content: Visual Grid OR Compact List */}
      {!error && !loading && items.length > 0 && (
        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key={`grid-${page}-${category}-${language}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: VELLUM_EASE }}
              className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((repo) => {
                const isFav = favorites.includes(repo.id);
                const brand = resolveBrandIcon(repo.full_name, repo.category, repo.topics);
                return (
                  <article
                    key={repo.id}
                    style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
                    className="group flex flex-col justify-between overflow-hidden rounded-[6px] border transition-all duration-150 hover:-translate-y-[2px] hover:shadow-md"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenQuickPeek(repo, items)}
                        className="relative block w-full text-left"
                        title={`Mở Folio: ${repo.full_name}`}
                      >
                        <RepoThumbnail22 repo={repo} theme={theme} dark={dark} aspectClass="aspect-[16/10]" />
                      </button>

                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-2 text-[11px]" style={{ color: theme.muted }}>
                          <span className="inline-flex items-center gap-1 truncate font-medium">
                            <CategoryIcon category={repo.category} className="size-3" />
                            {repo.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => onToggleFavorite(repo.id)}
                            aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                            style={{ color: isFav ? theme.accent : theme.muted }}
                            className={`shrink-0 transition-transform duration-150 active:scale-90 ${
                              rc ? "flex min-h-11 min-w-11 -m-3 items-center justify-center sm:min-h-0 sm:min-w-0 sm:m-0 sm:p-0.5" : "p-0.5"
                            }`}
                          >
                            <Heart className={`size-3.5 ${isFav ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenQuickPeek(repo, items)}
                          className="flex w-full items-center gap-2 text-left"
                        >
                          <BrandLogoBadge icon={brand} dark={dark} size={16} />
                          <h3
                            style={{ fontFamily: "var(--font-newsreader)" }}
                            className="truncate text-lg font-medium group-hover:underline"
                          >
                            {repo.full_name}
                          </h3>
                        </button>

                        <p style={{ color: theme.muted }} className="line-clamp-2 text-xs leading-relaxed">
                          {repo.description_vi}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{ borderColor: theme.rule, color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                      className="flex items-center justify-between border-t px-4 py-2.5 text-[11px]"
                    >
                      <div className="flex items-center gap-3">
                        <span style={{ color: theme.ink }} className="tabular-nums inline-flex items-center gap-1 font-medium">
                          <Star style={{ color: theme.accent }} className="size-3 fill-current" />
                          {formatCompactNumber(repo.stars)}
                        </span>
                        <LanguageLogo language={repo.language} dark={dark} />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          onClick={() => onOpenQuickPeek(repo, items)}
                          style={{ color: theme.ink }}
                          className={`font-sans font-medium hover:underline ${
                            rc ? "inline-flex min-h-11 items-center px-2 sm:min-h-0 sm:px-0" : ""
                          }`}
                        >
                          Folio
                        </button>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`GitHub ${repo.full_name}`}
                          className={`hover:opacity-70 ${
                            rc ? "inline-flex min-h-11 min-w-11 items-center justify-center sm:min-h-0 sm:min-w-0" : ""
                          }`}
                        >
                          <ArrowUpRight className="size-3.5" />
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </motion.div>
          ) : (
            <motion.div
              key={`list-${page}-${category}-${language}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: VELLUM_EASE }}
              style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
              className="divide-y overflow-hidden rounded-[6px] border"
            >
              {items.map((repo) => {
                const isFav = favorites.includes(repo.id);
                const brand = resolveBrandIcon(repo.full_name, repo.category, repo.topics);
                return (
                  <div
                    key={repo.id}
                    style={{ borderColor: theme.rule }}
                    className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 transition-colors duration-150 hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {repo.owner_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={repo.owner_avatar_url}
                          alt=""
                          loading="lazy"
                          className="size-8 shrink-0 rounded-[4px] border border-black/10 object-cover"
                        />
                      ) : (
                        <div
                          style={{ backgroundColor: theme.surfaceAlt, borderColor: theme.rule }}
                          className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border"
                        >
                          <BrandLogoBadge icon={brand} dark={dark} size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onOpenQuickPeek(repo, items)}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {repo.full_name}
                          </button>
                          <span style={{ color: theme.muted }} className="hidden text-[11px] sm:inline">
                            · {repo.category}
                          </span>
                        </div>
                        <p style={{ color: theme.muted }} className="truncate text-xs">
                          {repo.description_vi}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }}
                      className="flex shrink-0 items-center gap-4 text-[11px]"
                    >
                      <span className="hidden md:inline">
                        <LanguageLogo language={repo.language} dark={dark} />
                      </span>
                      <span style={{ color: theme.ink }} className="tabular-nums inline-flex items-center gap-1 font-medium">
                        <Star style={{ color: theme.accent }} className="size-3 fill-current" />
                        {formatCompactNumber(repo.stars)}
                      </span>
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(repo.id)}
                        style={{ color: isFav ? theme.accent : theme.muted }}
                        className={rc ? "inline-flex min-h-11 min-w-11 items-center justify-center sm:min-h-0 sm:min-w-0" : ""}
                        aria-label="Yêu thích"
                      >
                        <Heart className={`size-3.5 ${isFav ? "fill-current" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenQuickPeek(repo, items)}
                        style={{ borderColor: theme.rule, color: theme.ink }}
                        className={`rounded-[4px] border px-2.5 py-1 font-sans text-xs font-medium transition-colors hover:opacity-80 ${
                          rc ? "min-h-11 sm:min-h-0" : ""
                        }`}
                      >
                        Folio
                      </button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Pagination */}
      {!error && totalItems > 0 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
            className={`inline-flex items-center gap-1 rounded-[4px] border px-3 text-xs font-medium transition-colors hover:opacity-85 disabled:opacity-40 ${
              rc ? "min-h-11 px-4 sm:min-h-0 sm:h-8 sm:px-3" : "h-8"
            }`}
          >
            <ChevronLeft className="size-3.5" />
            Trước
          </button>
          <span style={{ fontFamily: "var(--font-jetbrains)", color: theme.muted }} className="tabular-nums px-2 text-xs">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            style={{ borderColor: theme.rule, backgroundColor: theme.surface }}
            className={`inline-flex items-center gap-1 rounded-[4px] border px-3 text-xs font-medium transition-colors hover:opacity-85 disabled:opacity-40 ${
              rc ? "min-h-11 px-4 sm:min-h-0 sm:h-8 sm:px-3" : "h-8"
            }`}
          >
            Sau
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
