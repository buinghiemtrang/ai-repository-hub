"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useFavorites } from "@/components/repositories/FavoriteButton";
import { RepoQuickPeek22 } from "@/components/prototypes/vellum22/RepoQuickPeek22";
import { RepoThumbnail22, toSizedAvatarUrl } from "@/components/prototypes/vellum22/RepoThumbnail22";
import {
  BrandLogoBadge,
  CategoryIcon,
  LanguageLogo,
  resolveBrandIcon,
} from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_CSS, VELLUM_EASE } from "@/components/prototypes/vellum/tokens";
import {
  type CatalogStats,
  type RepoItem,
  type RepoPage,
  formatCompactNumber,
  formatViDate,
} from "@/lib/repositories/types";

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

interface RepositoryLibraryProps {
  initialStats?: CatalogStats | null;
  initialData?: RepoPage | null;
  initialTopRepos?: RepoItem[];
}

export function RepositoryLibrary({
  initialStats = null,
  initialData = null,
  initialTopRepos = [],
}: RepositoryLibraryProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();

  const urlQ = searchParams.get("q") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlLanguage = searchParams.get("language") || "";
  const urlSort = searchParams.get("sort") || "stars";
  const urlPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const onlyFavorites = searchParams.get("favorites") === "1";

  const [q, setQ] = useState(urlQ);
  const [category, setCategory] = useState(urlCategory);
  const [language, setLanguage] = useState(urlLanguage);
  const [sort, setSort] = useState(urlSort);
  const [page, setPage] = useState(urlPage);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const [stats, setStats] = useState<CatalogStats | null>(initialStats);
  const [data, setData] = useState<RepoPage | null>(initialData);
  const [topRepos, setTopRepos] = useState<RepoItem[]>(initialTopRepos);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState("");
  const [retryTick, setRetryTick] = useState(0);

  // Signature Interaction: Specimen Folio Quick Preview
  const [peekRepo, setPeekRepo] = useState<RepoItem | null>(null);
  const [peekList, setPeekList] = useState<RepoItem[]>([]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const didUseInitialRef = useRef(Boolean(initialData));

  // Sync URL query params into local filter state on back/forward or Header quick links
  useEffect(() => {
    const t = queueMicrotask(() => {
      setQ(urlQ);
      setCategory(urlCategory);
      setLanguage(urlLanguage);
      setSort(urlSort);
      setPage(urlPage);
      if (searchParams.get("focus") === "1") {
        searchInputRef.current?.focus();
      }
    });
    void t;
  }, [urlQ, urlCategory, urlLanguage, urlSort, urlPage, searchParams]);

  // Listen for Header quick search button or `/` shortcut
  useEffect(() => {
    const onFocusSearch = () => searchInputRef.current?.focus();
    window.addEventListener("aihub_focus_search", onFocusSearch);
    return () => window.removeEventListener("aihub_focus_search", onFocusSearch);
  }, []);

  // Load stats & unfiltered top repos if not provided by SSR
  useEffect(() => {
    if (!stats) {
      fetch("/api/repositories/stats")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => d && setStats(d))
        .catch(() => {});
    }
    if (topRepos.length === 0) {
      fetch("/api/repositories?sort=stars&page=1")
        .then((r) => (r.ok ? r.json() : null))
        .then((d: RepoPage | null) => {
          if (d?.items) setTopRepos(d.items);
        })
        .catch(() => {});
    }
  }, [stats, topRepos.length]);

  const favoriteIdsParam = useMemo(
    () => (onlyFavorites ? favorites.join(",") : null),
    [onlyFavorites, favorites]
  );

  // Fetch filtered repository page cleanly
  useEffect(() => {
    const isInitialDefault =
      didUseInitialRef.current &&
      !q &&
      !category &&
      !language &&
      sort === "stars" &&
      page === 1 &&
      favoriteIdsParam === null &&
      retryTick === 0;

    if (isInitialDefault) {
      didUseInitialRef.current = false;
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setError("");
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
  const peekIndex = peekRepo ? peekList.findIndex((r) => r.id === peekRepo.id) : -1;

  const resetAll = useCallback(() => {
    setQ("");
    setCategory("");
    setLanguage("");
    setSort("stars");
    setPage(1);
    if (onlyFavorites || searchParams.toString()) {
      router.push("/");
    }
  }, [onlyFavorites, searchParams, router]);

  return (
    <div className="mx-auto max-w-7xl min-w-0 space-y-4 px-3 py-5 sm:px-6 lg:py-6">
      {/* Row 1: Compact Featured Spotlight (8 cols) + Top 5 GitHub Stars (4 cols) */}
      {!hasFilters && page === 1 && featuredRepo && (
        <section className="grid min-w-0 gap-4 lg:grid-cols-12">
          <div className="grid min-w-0 overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] sm:grid-cols-12 lg:col-span-8">
            <button
              type="button"
              onClick={() => {
                setPeekRepo(featuredRepo);
                setPeekList(featuredCandidates);
              }}
              className="group relative block min-w-0 text-left sm:col-span-5"
              title="Mở Specimen Folio Quick Preview"
            >
              <RepoThumbnail22
                repo={featuredRepo}
                theme={VELLUM_CSS}
                aspectClass="aspect-[16/10] sm:h-full sm:min-h-[212px]"
                sizes="(max-width: 640px) 92vw, 420px"
                priority
              />
              <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] px-2 py-0.5 text-[10.5px] font-medium text-[var(--v-ink)] opacity-95 transition-transform duration-150 group-hover:translate-x-0.5">
                <Eye className="size-3 text-[var(--v-accent)]" />
                Folio
              </span>
            </button>

            <div className="flex min-w-0 flex-col justify-between border-t border-[var(--v-rule)] p-4 sm:col-span-7 sm:border-t-0 sm:border-l sm:p-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-telemetry inline-flex items-center gap-1.5 text-[10.5px] font-medium tracking-widest text-[var(--v-accent)] uppercase">
                    <CategoryIcon category={featuredRepo.category} className="size-3" />
                    Tiêu điểm · {featuredRepo.category}
                  </span>

                  {featuredCandidates.length > 1 && (
                    <div className="flex flex-wrap items-center gap-1">
                      {featuredCandidates.map((cand, idx) => {
                        const active = idx === featuredIndex;
                        return (
                          <button
                            key={cand.id}
                            type="button"
                            onClick={() => setFeaturedIndex(idx)}
                            style={{
                              backgroundColor: active ? "var(--v-accent)" : "var(--v-surface-alt)",
                              color: active ? "var(--v-accent-ink)" : "var(--v-muted)",
                            }}
                            className="font-telemetry min-h-11 min-w-11 rounded-[3px] px-2 text-[10px] font-medium transition-colors duration-150 sm:min-h-0 sm:min-w-0 sm:px-1.5 sm:py-0.5"
                          >
                            0{idx + 1}
                          </button>
                        );
                      })}
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
                        size={19}
                      />
                      <h1 className="font-editorial truncate text-xl leading-tight font-medium tracking-tight sm:text-2xl">
                        {featuredRepo.full_name}
                      </h1>
                    </div>

                    <p className="line-clamp-2 text-xs leading-relaxed text-[var(--v-muted)] sm:text-[13px]">
                      {featuredRepo.description_vi}
                    </p>

                    <div className="font-telemetry flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11px] text-[var(--v-muted)]">
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--v-ink)]">
                        <Star className="size-3 fill-current text-[var(--v-accent)]" />
                        {formatCompactNumber(featuredRepo.stars)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <GitFork className="size-3" />
                        {formatCompactNumber(featuredRepo.forks)}
                      </span>
                      <LanguageLogo language={featuredRepo.language} />
                      <span className="hidden sm:inline">{formatViDate(featuredRepo.updated_at)}</span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeekRepo(featuredRepo);
                    setPeekList(featuredCandidates);
                  }}
                  className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-[4px] bg-[var(--v-accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--v-accent-ink)] hover:-translate-y-[1px] sm:min-h-0"
                >
                  <Eye className="size-3.5" />
                  Xem nhanh Folio
                </button>
                <a
                  href={featuredRepo.url}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule-strong)] px-3 py-1.5 text-xs font-medium text-[var(--v-ink)] hover:-translate-y-[1px] hover:opacity-85 sm:min-h-0"
                >
                  GitHub
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Right Rail: Top 5 by Real GitHub Stars */}
          <div className="flex min-w-0 flex-col justify-between overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] lg:col-span-4">
            <div className="flex items-center justify-between border-b border-[var(--v-rule)] px-3.5 py-2.5">
              <h2 className="font-editorial text-base font-medium">Nổi bật theo GitHub Stars</h2>
              <span className="font-telemetry text-[10px] text-[var(--v-muted)] uppercase">Top 5</span>
            </div>
            <div className="divide-y divide-[var(--v-rule)]">
              {topStarredStrip.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setPeekRepo(r);
                    setPeekList(topStarredStrip);
                  }}
                  className="group flex w-full min-w-0 items-center gap-2.5 px-3.5 py-2 text-left transition-colors duration-150 hover:bg-black/[0.03] dark:hover:bg-white/[0.03]"
                >
                  <span className="font-editorial w-4 shrink-0 text-sm italic text-[var(--v-accent)]">
                    0{idx + 1}
                  </span>
                  {r.owner_avatar_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={toSizedAvatarUrl(r.owner_avatar_url, 64)}
                      alt=""
                      width={20}
                      height={20}
                      loading="lazy"
                      className="size-5 shrink-0 rounded-[3px] border border-[var(--v-rule)] object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1 truncate text-xs font-medium group-hover:underline">
                    {r.full_name}
                  </span>
                  <span className="font-telemetry shrink-0 text-[10.5px] text-[var(--v-muted)]">
                    ★ {formatCompactNumber(r.stars)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Row 2: Slim Editorial Collections Strip */}
      {!hasFilters && page === 1 && stats && (
        <section className="grid min-w-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
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
                className="group card-lift flex min-w-0 items-center gap-2.5 rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-3 py-2.5 text-left"
              >
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={col.iconSrc}
                    alt={col.category}
                    width={16}
                    height={16}
                    className={`size-4 object-contain ${col.invertDark ? "vellum-invert-dark" : ""}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="truncate text-xs font-medium group-hover:underline">
                      {col.category}
                    </span>
                    <span className="font-telemetry shrink-0 text-[11px] font-medium text-[var(--v-accent)]">
                      {count}
                    </span>
                  </div>
                  <p className="truncate text-[11px] text-[var(--v-muted)]">{col.subtitle}</p>
                </div>
              </button>
            );
          })}
        </section>
      )}

      {/* Row 3: Search, Filter & Grid/List Toolbar */}
      <section className="min-w-0 space-y-2.5 rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex w-full min-w-0 items-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-3 transition-all duration-150 focus-within:border-[var(--v-accent)] focus-within:ring-2 focus-within:ring-[var(--v-accent)]/25 sm:w-auto sm:flex-1">
            <Search className="size-4 shrink-0 text-[var(--v-muted)]" />
            <input
              ref={searchInputRef}
              type="search"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
              placeholder="Tìm tên repo, mô tả tiếng Việt hoặc tiếng Anh (nhấn /)..."
              className="vellum-placeholder h-11 w-full bg-transparent px-2.5 text-sm outline-none sm:h-9"
            />
            {q && (
              <button
                type="button"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                className="-mr-2.5 flex size-11 items-center justify-center text-[var(--v-muted)] sm:mr-0 sm:size-6"
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
            className="h-11 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-2.5 text-xs outline-none sm:h-9"
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
            className="h-11 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-2.5 text-xs outline-none sm:h-9"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <div className="relative flex items-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-0.5">
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
                  style={{ color: active ? "var(--v-accent-ink)" : "var(--v-muted)" }}
                  className="relative z-10 inline-flex h-10 items-center gap-1 px-2.5 text-xs font-medium sm:h-7"
                  title={`Chế độ ${m.label}`}
                >
                  {active && (
                    <motion.span
                      layoutId="vellum-official-view-pill"
                      transition={{ duration: 0.22, ease: VELLUM_EASE }}
                      className="absolute inset-0 -z-10 rounded-[3px] bg-[var(--v-accent)]"
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
          <div className="flex items-center gap-2 overflow-x-auto border-t border-[var(--v-rule)] pt-2 pb-0.5 [scrollbar-width:none] sm:gap-1.5">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              style={{
                backgroundColor: category === "" ? "var(--v-ink)" : "var(--v-bg)",
                color: category === "" ? "var(--v-bg)" : "var(--v-ink)",
                borderColor: "var(--v-rule)",
              }}
              className="min-h-11 shrink-0 rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors duration-150 sm:min-h-0"
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
                    backgroundColor: active ? "var(--v-accent)" : "var(--v-bg)",
                    color: active ? "var(--v-accent-ink)" : "var(--v-ink)",
                    borderColor: active ? "var(--v-accent)" : "var(--v-rule)",
                  }}
                  className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-medium transition-colors duration-150 sm:min-h-0"
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

      {/* Status Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--v-muted)]">
        <span className="tabular-nums">
          {loading
            ? "Đang tải danh mục..."
            : error || `${totalItems} repository · trang ${page}/${totalPages}`}
        </span>
        {hasFilters && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex min-h-11 items-center gap-1 font-medium text-[var(--v-accent)] hover:underline sm:min-h-0"
          >
            <RotateCcw className="size-3" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="flex items-center justify-between rounded-[5px] border border-[var(--v-accent)] bg-[var(--v-accent-soft)] p-4 text-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setRetryTick((t) => t + 1)}
            className="min-h-11 rounded-[4px] border border-[var(--v-rule-strong)] px-3 py-1 text-xs font-medium sm:min-h-0"
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
              className="animate-pulse overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]"
            >
              <div className="aspect-[16/10] w-full bg-[var(--v-surface-alt)]" />
              <div className="space-y-2.5 p-4">
                <div className="h-4 w-2/3 rounded bg-[var(--v-surface-alt)]" />
                <div className="h-9 w-full rounded bg-[var(--v-surface-alt)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!error && !loading && items.length === 0 && (
        <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-10 text-center">
          <p className="font-editorial text-xl font-medium">
            {onlyFavorites && favorites.length === 0
              ? "Bạn chưa lưu repository yêu thích nào"
              : "Không có repository khớp bộ lọc"}
          </p>
          <p className="mt-1 text-sm text-[var(--v-muted)]">
            {onlyFavorites && favorites.length === 0
              ? "Bấm biểu tượng trái tim trên bất kỳ thẻ repository nào để lưu vào danh sách cá nhân."
              : "Thử đổi từ khóa tìm kiếm hoặc đặt lại danh mục."}
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={resetAll}
              className="mt-4 min-h-11 rounded-[4px] bg-[var(--v-accent)] px-4 py-2 text-xs font-medium text-[var(--v-accent-ink)] sm:min-h-0"
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
                    className="group card-lift flex min-w-0 flex-col justify-between overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => {
                          setPeekRepo(repo);
                          setPeekList(items);
                        }}
                        className="relative block w-full text-left"
                        title={`Mở Folio: ${repo.full_name}`}
                      >
                        <RepoThumbnail22 repo={repo} theme={VELLUM_CSS} aspectClass="aspect-[16/10]" />
                      </button>

                      <div className="space-y-2 p-4">
                        <div className="flex items-center justify-between gap-2 text-[11px] text-[var(--v-muted)]">
                          <span className="inline-flex items-center gap-1 truncate font-medium">
                            <CategoryIcon category={repo.category} className="size-3" />
                            {repo.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(repo.id)}
                            aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                            style={{ color: isFav ? "var(--v-accent)" : "var(--v-muted)" }}
                            className="-m-3 flex min-h-11 min-w-11 shrink-0 items-center justify-center transition-transform duration-150 active:scale-90 sm:m-0 sm:min-h-0 sm:min-w-0 sm:p-0.5"
                          >
                            <Heart className={`size-3.5 ${isFav ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setPeekRepo(repo);
                            setPeekList(items);
                          }}
                          className="flex w-full items-center gap-2 text-left"
                        >
                          <BrandLogoBadge icon={brand} size={16} />
                          <h3 className="font-editorial truncate text-lg font-medium group-hover:underline">
                            {repo.full_name}
                          </h3>
                        </button>

                        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--v-muted)]">
                          {repo.description_vi}
                        </p>
                      </div>
                    </div>

                    <div className="font-telemetry flex items-center justify-between border-t border-[var(--v-rule)] px-4 py-2.5 text-[11px] text-[var(--v-muted)]">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1 font-medium text-[var(--v-ink)]">
                          <Star className="size-3 fill-current text-[var(--v-accent)]" />
                          {formatCompactNumber(repo.stars)}
                        </span>
                        <LanguageLogo language={repo.language} />
                      </div>
                      <div className="flex items-center gap-2 sm:gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPeekRepo(repo);
                            setPeekList(items);
                          }}
                          className="inline-flex min-h-11 items-center px-2 font-sans font-medium text-[var(--v-ink)] hover:underline sm:min-h-0 sm:px-0"
                        >
                          Folio
                        </button>
                        <a
                          href={repo.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label={`GitHub ${repo.full_name}`}
                          className="inline-flex min-h-11 min-w-11 items-center justify-center hover:opacity-70 sm:min-h-0 sm:min-w-0"
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
              className="divide-y divide-[var(--v-rule)] overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]"
            >
              {items.map((repo) => {
                const isFav = favorites.includes(repo.id);
                const brand = resolveBrandIcon(repo.full_name, repo.category, repo.topics);
                return (
                  <div
                    key={repo.id}
                    className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 transition-colors duration-150 hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {repo.owner_avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={toSizedAvatarUrl(repo.owner_avatar_url, 64)}
                          alt=""
                          width={32}
                          height={32}
                          loading="lazy"
                          className="size-8 shrink-0 rounded-[4px] border border-[var(--v-rule)] object-cover"
                        />
                      ) : (
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)]">
                          <BrandLogoBadge icon={brand} size={18} />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setPeekRepo(repo);
                              setPeekList(items);
                            }}
                            className="truncate text-sm font-medium hover:underline"
                          >
                            {repo.full_name}
                          </button>
                          <span className="hidden text-[11px] text-[var(--v-muted)] sm:inline">
                            · {repo.category}
                          </span>
                        </div>
                        <p className="truncate text-xs text-[var(--v-muted)]">{repo.description_vi}</p>
                      </div>
                    </div>

                    <div className="font-telemetry flex shrink-0 items-center gap-3 text-[11px] text-[var(--v-muted)] sm:gap-4">
                      <span className="hidden md:inline">
                        <LanguageLogo language={repo.language} />
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-[var(--v-ink)]">
                        <Star className="size-3 fill-current text-[var(--v-accent)]" />
                        {formatCompactNumber(repo.stars)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleFavorite(repo.id)}
                        style={{ color: isFav ? "var(--v-accent)" : "var(--v-muted)" }}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center sm:min-h-0 sm:min-w-0"
                        aria-label="Yêu thích"
                      >
                        <Heart className={`size-3.5 ${isFav ? "fill-current" : ""}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPeekRepo(repo);
                          setPeekList(items);
                        }}
                        className="min-h-11 rounded-[4px] border border-[var(--v-rule)] px-2.5 py-1 font-sans text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-80 sm:min-h-0"
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
            className="inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-4 text-xs font-medium transition-colors hover:opacity-85 disabled:opacity-40 sm:h-8 sm:min-h-0 sm:px-3"
          >
            <ChevronLeft className="size-3.5" />
            Trước
          </button>
          <span className="font-telemetry px-2 text-xs text-[var(--v-muted)]">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex min-h-11 items-center gap-1 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-4 text-xs font-medium transition-colors hover:opacity-85 disabled:opacity-40 sm:h-8 sm:min-h-0 sm:px-3"
          >
            Sau
            <ChevronRight className="size-3.5" />
          </button>
        </div>
      )}

      {/* Signature Folio Quick Preview */}
      <RepoQuickPeek22
        repo={peekRepo}
        theme={VELLUM_CSS}
        rc
        isFavorite={peekRepo ? favorites.includes(peekRepo.id) : false}
        hasPrev={peekIndex > 0}
        hasNext={peekIndex >= 0 && peekIndex < peekList.length - 1}
        positionLabel={peekIndex >= 0 && peekList.length > 1 ? `${peekIndex + 1}/${peekList.length}` : undefined}
        onClose={() => setPeekRepo(null)}
        onPrev={() => peekIndex > 0 && setPeekRepo(peekList[peekIndex - 1])}
        onNext={() => peekIndex >= 0 && peekIndex < peekList.length - 1 && setPeekRepo(peekList[peekIndex + 1])}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
