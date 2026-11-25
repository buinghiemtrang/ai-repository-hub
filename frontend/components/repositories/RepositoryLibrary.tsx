"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  GitFork,
  Heart,
  RotateCcw,
  Search,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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

export function RepositoryLibrary() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [page, setPage] = useState(1);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const [data, setData] = useState<RepoPage | null>(null);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

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
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-teal-50/60 p-6 shadow-xs md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <Badge variant="accent">
              <Sparkles className="size-3.5" />
              Module 1 · Repository Library
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Thư viện AI Repository tiếng Việt
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Tổng hợp các repository AI mã nguồn mở công khai từ GitHub — kèm mô tả tiếng Việt, số liệu đồng bộ thực tế và hướng dẫn cài đặt đối chiếu từ tài liệu gốc.
            </p>
          </div>
          {stats && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <div className="text-slate-500">Tổng catalog</div>
                <div className="mt-0.5 text-lg font-bold text-slate-900">{stats.total}</div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
                <div className="text-slate-500">Đồng bộ gần nhất</div>
                <div className="mt-0.5 text-sm font-semibold text-slate-900">
                  {formatViDate(stats.last_synced_at, "Chưa đồng bộ")}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_190px_190px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <Input
                aria-label="Tìm repository"
                className="pl-10 pr-9"
                placeholder="Tìm theo tên repo, mô tả tiếng Việt hoặc tiếng Anh (có/không dấu)..."
                value={q}
                maxLength={200}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
              {q && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa"
                  onClick={() => {
                    setQ("");
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-700"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            <select
              aria-label="Ngôn ngữ lập trình"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setPage(1);
              }}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
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
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <nav aria-label="Lọc theo danh mục" className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                category === ""
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
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
                  "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  category === cat.name
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                {cat.name} <span className="opacity-75">({cat.count})</span>
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                aria-pressed={onlyFavorites}
                onClick={() => {
                  setOnlyFavorites((v) => !v);
                  setPage(1);
                }}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                  onlyFavorites
                    ? "border-rose-300 bg-rose-50 text-rose-700"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                )}
              >
                <Heart className={cn("size-3.5", onlyFavorites && "fill-rose-500 text-rose-500")} />
                <span>Yêu thích ({favorites.length})</span>
              </button>
              <p className="text-xs text-slate-500" aria-live="polite">
                {loading
                  ? "Đang tải danh sách…"
                  : error || `${totalItems} repository · trang ${page}/${totalPages}`}
              </p>
            </div>

            {hasActiveFilters && (
              <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
                <RotateCcw className="size-3.5" />
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        </div>
      </section>

      {error && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setRetry((x) => x + 1)}>
            Thử lại
          </Button>
        </div>
      )}

      {!error && loading && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="mt-4 h-6 w-3/4" />
              <Skeleton className="mt-3 h-16 w-full" />
              <Skeleton className="mt-4 h-9 w-full" />
            </Card>
          ))}
        </div>
      )}

      {!error && !loading && data?.items.length === 0 && (
        <Card className="mt-6 p-10 text-center">
          <p className="text-base font-medium text-slate-800">Không tìm thấy repository phù hợp.</p>
          <p className="mt-1 text-sm text-slate-500">
            Thử từ khóa khác, bỏ lọc danh mục hoặc tắt chế độ chỉ xem yêu thích.
          </p>
          {hasActiveFilters && (
            <Button type="button" variant="outline" className="mt-4" onClick={resetFilters}>
              Xem toàn bộ thư viện
            </Button>
          )}
        </Card>
      )}

      {!error && !loading && data && data.items.length > 0 && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((repo) => {
            const isFav = favorites.includes(repo.id);
            return (
              <Card
                key={repo.id}
                className="flex flex-col justify-between transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="accent">{repo.category}</Badge>
                      {repo.language && <Badge variant="outline">{repo.language}</Badge>}
                      {repo.archived && <Badge variant="warning">Lưu trữ</Badge>}
                    </div>
                    <button
                      type="button"
                      aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                      aria-pressed={isFav}
                      onClick={() => handleToggleFavorite(repo.id)}
                      className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Heart className={cn("size-4", isFav && "fill-rose-500 text-rose-500")} />
                    </button>
                  </div>
                  <Link
                    href={`/repositories/${repo.id}`}
                    className="mt-2 text-base font-semibold break-words text-slate-900 hover:text-teal-700"
                  >
                    {repo.full_name}
                  </Link>
                </CardHeader>

                <CardContent className="grow space-y-3 pb-4">
                  <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                    {repo.description_vi}
                  </p>
                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {repo.topics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                        >
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex-col items-stretch gap-3 border-t border-slate-100 pt-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1" title="Stars">
                        <Star className="size-3.5 text-amber-500" />
                        {formatCompactNumber(repo.stars)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Forks">
                        <GitFork className="size-3.5" />
                        {formatCompactNumber(repo.forks)}
                      </span>
                      <span className="inline-flex items-center gap-1" title="Watchers">
                        <Eye className="size-3.5" />
                        {formatCompactNumber(repo.watchers)}
                      </span>
                    </div>
                    <span>{repo.license || "—"}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/repositories/${repo.id}`}>Xem chi tiết →</Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <a href={repo.url} target="_blank" rel="noreferrer">
                        GitHub
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {!error && totalItems > 0 && (
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
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
              <span key={`dots-${idx}`} className="px-2 text-sm text-slate-400">
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
                className="min-w-9"
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
