"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  GitFork,
  Heart,
  RotateCcw,
  Search,
  Star,
  X,
} from "lucide-react";
import { RepoAvatar, RepoBannerImage } from "@/components/repositories/RepoImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { loadFavorites, toggleFavoriteId } from "@/lib/repositories/favorites";
import {
  type CatalogStats,
  type RepoPage,
  formatCompactNumber,
  formatViDate,
} from "@/lib/repositories/types";
import { cn } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "stars", label: "Nhiều stars nhất" },
  { value: "stars_asc", label: "Ít stars nhất" },
  { value: "updated", label: "Mới cập nhật" },
  { value: "oldest", label: "Cập nhật cũ nhất" },
  { value: "forks", label: "Nhiều forks nhất" },
  { value: "name", label: "Tên A–Z" },
];

const LANG_COLORS: Record<string, string> = {
  Python: "bg-sky-500",
  TypeScript: "bg-blue-500",
  JavaScript: "bg-amber-400",
  Rust: "bg-orange-500",
  Go: "bg-cyan-400",
  "Jupyter Notebook": "bg-orange-400",
  "C++": "bg-pink-500",
  Shell: "bg-emerald-400",
  HTML: "bg-rose-500",
  Java: "bg-red-500",
  Svelte: "bg-orange-500",
};

function pageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) {
    pages.push(p);
  }
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function splitFullName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  if (idx === -1) return { owner: "", name: fullName };
  return { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

export function RepositoryLibrary() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [page, setPage] = useState(1);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [expandCategories, setExpandCategories] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const [data, setData] = useState<RepoPage | null>(null);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFavorites(loadFavorites());
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
    setCategory(params.get("category") || "");
    setLanguage(params.get("language") || "");
    setSort(params.get("sort") || "stars");
    const parsedPage = Number(params.get("page") || "1");
    setPage(Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1);
    setOnlyFavorites(params.get("fav") === "1");
    setHydrated(true);
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (document.activeElement?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;
      e.preventDefault();
      searchRef.current?.focus();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category) params.set("category", category);
    if (language) params.set("language", language);
    if (sort !== "stars") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    if (onlyFavorites) params.set("fav", "1");
    const qs = params.toString();
    const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", nextUrl);
  }, [hydrated, q, category, language, sort, page, onlyFavorites]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/repositories/stats", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => {});
    return () => controller.abort();
  }, [retry]);

  const favoriteQuery = useMemo(
    () => (onlyFavorites ? favorites.join(",") : null),
    [onlyFavorites, favorites]
  );

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({
          q,
          category,
          language,
          sort,
          page: String(page),
        });
        if (favoriteQuery !== null) query.set("favorite_ids", favoriteQuery);
        const res = await fetch(`/api/repositories?${query}`, { signal: controller.signal });
        if (!res.ok) throw new Error("API error");
        setData(await res.json());
      } catch {
        if (!controller.signal.aborted) {
          setError("Không kết nối được API backend. Hãy kiểm tra Docker Compose.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 180);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hydrated, q, category, language, sort, page, favoriteQuery, retry]);

  function handleToggleFavorite(id: number) {
    setFavorites((prev) => toggleFavoriteId(prev, id));
    if (onlyFavorites) setPage(1);
  }

  function resetFilters() {
    setQ("");
    setCategory("");
    setLanguage("");
    setSort("stars");
    setOnlyFavorites(false);
    setPage(1);
  }

  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / 12));
  const hasActiveFilters = Boolean(q.trim() || category || language || sort !== "stars" || onlyFavorites);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Editorial Header */}
      <section className="flex flex-col justify-between gap-5 pb-6 md:flex-row md:items-end">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
            <span className="size-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
            Repository Library
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Thư viện AI Repository tiếng Việt
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-400">
            Tuyển chọn các dự án AI mã nguồn mở công khai trên GitHub — mô tả tiếng Việt ngắn gọn, ảnh xem trước trực tiếp từ GitHub và hướng dẫn đối chiếu từ README gốc.
          </p>
        </div>

        {stats && (
          <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-slate-200/80 pt-3 text-xs text-slate-500 md:border-t-0 md:pt-0 dark:border-slate-800 dark:text-slate-400">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tổng catalog
              </span>
              <span className="tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats.total}
              </span>
              <span className="ml-1 text-slate-500 dark:text-slate-400">repo</span>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Danh mục
              </span>
              <span className="tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">
                {stats.categories.length}
              </span>
            </div>
            <div className="hidden h-7 w-px bg-slate-200 sm:block dark:bg-slate-800" />
            <div className="w-full sm:w-auto">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Đồng bộ cuối
              </span>
              <span className="tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300">
                {formatViDate(stats.last_synced_at, "Chưa đồng bộ")}
              </span>
            </div>
          </div>
        )}
      </section>

      {/* Command Toolbar */}
      <section className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.65)]">
        <div className="grid gap-2.5 md:grid-cols-[1fr_170px_175px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              ref={searchRef}
              aria-label="Tìm repository"
              className="border-slate-200/75 bg-slate-50/70 pl-10 pr-12 focus-visible:bg-white dark:border-slate-800 dark:bg-slate-950/75 dark:focus-visible:bg-slate-950"
              placeholder="Tìm tên repo, mô tả tiếng Việt hoặc tiếng Anh (có/không dấu)..."
              value={q}
              maxLength={200}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(1);
              }}
            />
            {q ? (
              <button
                type="button"
                aria-label="Xóa từ khóa"
                onClick={() => {
                  setQ("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline-block dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500">
                /
              </kbd>
            )}
          </div>

          <select
            aria-label="Ngôn ngữ lập trình"
            value={language}
            onChange={(e) => {
              setLanguage(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-sm text-slate-700 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/80 dark:border-slate-800 dark:bg-slate-950/75 dark:text-slate-200 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-teal-400/70"
          >
            <option value="">Mọi ngôn ngữ</option>
            {stats?.languages.map((lang) => (
              <option key={lang.name} value={lang.name}>
                {lang.name} ({lang.count})
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
            className="h-10 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-sm text-slate-700 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/80 dark:border-slate-800 dark:bg-slate-950/75 dark:text-slate-200 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-teal-400/70"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            aria-pressed={onlyFavorites}
            onClick={() => {
              setOnlyFavorites((v) => !v);
              setPage(1);
            }}
            className={cn(
              "pressable inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3.5 text-sm font-medium",
              onlyFavorites
                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-300"
                : "border-slate-200/80 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-200 dark:hover:bg-slate-800"
            )}
          >
            <Heart className={cn("size-4", onlyFavorites && "fill-rose-500 text-rose-500")} />
            <span className="tabular-nums">Yêu thích ({favorites.length})</span>
          </button>
        </div>

        {/* Category Filter Strip */}
        <div className="mt-3 flex items-start gap-2 border-t border-slate-100 pt-3 dark:border-slate-800/80">
          <nav
            aria-label="Lọc theo danh mục"
            className={cn(
              "flex flex-1 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]",
              expandCategories && "flex-wrap overflow-x-visible pb-0"
            )}
          >
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={cn(
                "pressable shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium",
                category === ""
                  ? "bg-slate-900 text-white dark:bg-teal-600 dark:text-white"
                  : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-white"
              )}
            >
              Mọi danh mục {stats ? `(${stats.total})` : ""}
            </button>
            {stats?.categories.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setCategory(cat.name);
                  setPage(1);
                }}
                className={cn(
                  "pressable shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium",
                  category === cat.name
                    ? "bg-teal-700 text-white dark:bg-teal-600"
                    : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-white"
                )}
              >
                {cat.name}{" "}
                <span
                  className={cn(
                    "tabular-nums",
                    category === cat.name ? "text-teal-100" : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {cat.count}
                </span>
              </button>
            ))}
          </nav>

          {stats && stats.categories.length > 6 && (
            <button
              type="button"
              onClick={() => setExpandCategories((v) => !v)}
              className="pressable hidden shrink-0 items-center gap-1 rounded-lg border border-slate-200/80 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 sm:inline-flex dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <span>{expandCategories ? "Thu gọn" : "Tất cả"}</span>
              {expandCategories ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
            </button>
          )}
        </div>
      </section>

      {/* Results Status Bar */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <p className="tabular-nums" aria-live="polite">
          {loading
            ? "Đang tải danh sách…"
            : error || `${totalItems} repository · trang ${page}/${totalPages}`}
        </p>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="pressable inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-950/60"
          >
            <RotateCcw className="size-3" />
            Đặt lại bộ lọc
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setRetry((x) => x + 1)}>
            Thử lại
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {!error && loading && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[2/1] w-full rounded-none" />
              <div className="p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="mt-3 h-12 w-full" />
                <Skeleton className="mt-4 h-4 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!error && !loading && data?.items.length === 0 && (
        <Card className="mt-4 p-12 text-center">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            Không tìm thấy repository phù hợp
          </p>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            Thử từ khóa khác, bỏ chọn danh mục hoặc tắt bộ lọc chỉ xem yêu thích.
          </p>
          {hasActiveFilters && (
            <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
              Xem toàn bộ thư viện
            </Button>
          )}
        </Card>
      )}

      {/* Repository Grid with 2:1 Preview Images */}
      {!error && !loading && data && data.items.length > 0 && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((repo) => {
            const isFav = favorites.includes(repo.id);
            const { owner, name } = splitFullName(repo.full_name);
            const langColor = repo.language ? LANG_COLORS[repo.language] || "bg-slate-400" : null;

            return (
              <Card
                key={repo.id}
                className="card-lift group flex flex-col overflow-hidden hover:border-slate-300/90 dark:hover:border-slate-700"
              >
                {/* Clean Top Meta Bar (No Overlap) */}
                <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setCategory(repo.category);
                      setPage(1);
                    }}
                    className="inline-flex max-w-[60%] items-center truncate rounded-md bg-teal-50/90 px-2 py-0.5 text-[11px] font-semibold text-teal-800 transition-colors hover:bg-teal-100 dark:bg-teal-500/15 dark:text-teal-300 dark:hover:bg-teal-500/25"
                  >
                    <span className="truncate">{repo.category}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <span
                      title="GitHub Stars"
                      className="tabular-nums inline-flex items-center gap-1 rounded-md bg-amber-50/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                    >
                      <Star className="size-3 fill-amber-400 text-amber-500 dark:text-amber-400" />
                      {formatCompactNumber(repo.stars)}
                    </span>
                    <button
                      type="button"
                      aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                      aria-pressed={isFav}
                      onClick={() => handleToggleFavorite(repo.id)}
                      className="pressable inline-flex size-7 items-center justify-center rounded-md text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                    >
                      <Heart className={cn("size-3.5", isFav && "fill-rose-500 text-rose-500")} />
                    </button>
                  </div>
                </div>

                {/* 2:1 Visual Banner */}
                <Link
                  href={`/repositories/${repo.id}`}
                  className="block aspect-[2/1] w-full overflow-hidden border-b border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950"
                >
                  <RepoBannerImage
                    fullName={repo.full_name}
                    imageUrl={repo.image_url}
                    ownerAvatarUrl={repo.owner_avatar_url}
                    hasCustomImage={repo.has_custom_image}
                    category={repo.category}
                    language={repo.language}
                  />
                </Link>

                {/* Card Body */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <Link href={`/repositories/${repo.id}`} className="flex items-center gap-2.5">
                      <RepoAvatar avatarUrl={repo.owner_avatar_url} owner={owner} />
                      <h2 className="min-w-0 text-[15px] leading-snug truncate">
                        {owner && (
                          <span className="font-normal text-slate-400 dark:text-slate-500">
                            {owner}/
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-300">
                          {name}
                        </span>
                      </h2>
                    </Link>

                    <p className="mt-2.5 line-clamp-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {repo.description_vi}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                    <div className="flex min-w-0 items-center gap-3">
                      {repo.language && (
                        <span className="inline-flex items-center gap-1.5 truncate">
                          <span className={cn("size-2 shrink-0 rounded-full", langColor)} />
                          <span className="truncate">{repo.language}</span>
                        </span>
                      )}
                      <span className="tabular-nums inline-flex items-center gap-1" title="Forks">
                        <GitFork className="size-3 text-slate-400 dark:text-slate-500" />
                        {formatCompactNumber(repo.forks)}
                      </span>
                      {repo.archived && <Badge variant="warning">Archived</Badge>}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/repositories/${repo.id}`}
                        className="font-medium text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300"
                      >
                        Chi tiết →
                      </Link>
                      <a
                        href={repo.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Mở ${repo.full_name} trên GitHub`}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!error && totalItems > 0 && (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="size-4" />
            Trước
          </Button>

          {pageNumbers(page, totalPages).map((entry, idx) =>
            entry === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 dark:text-slate-500">
                …
              </span>
            ) : (
              <Button
                key={entry}
                type="button"
                variant={entry === page ? "default" : "outline"}
                size="sm"
                disabled={loading}
                onClick={() => setPage(entry)}
                className="tabular-nums min-w-8"
              >
                {entry}
              </Button>
            )
          )}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
