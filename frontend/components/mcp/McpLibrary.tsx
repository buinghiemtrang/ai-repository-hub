"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, KeyRound, Plug, RotateCcw, Search, Star, X } from "lucide-react";
import { RepoAvatar } from "@/components/repositories/RepoImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  type McpServerPage,
  type McpStats,
  STATUS_LABELS,
  TRANSPORT_LABELS,
} from "@/lib/mcp/types";
import { formatCompactNumber, formatViDate } from "@/lib/repositories/types";

const SORT_OPTIONS = [
  { value: "stars", label: "Nhiều stars nhất" },
  { value: "updated", label: "Mới cập nhật" },
  { value: "name", label: "Tên A–Z" },
];

const SELECT_CLASS =
  "h-10 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-sm text-slate-700 focus-visible:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600/80 dark:border-slate-800 dark:bg-slate-950/75 dark:text-slate-200 dark:focus-visible:bg-slate-950 dark:focus-visible:ring-teal-400/70";

const PAGE_SIZE = 12;

function pageNumbers(current: number, totalPages: number): (number | "...")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(totalPages - 1, current + 1); p++) pages.push(p);
  if (current < totalPages - 2) pages.push("...");
  pages.push(totalPages);
  return pages;
}

function splitFullName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  return idx === -1 ? { owner: "", name: fullName } : { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

export function McpLibrary() {
  const [q, setQ] = useState("");
  const [transport, setTransport] = useState("");
  const [secret, setSecret] = useState("");
  const [language, setLanguage] = useState("");
  const [sort, setSort] = useState("stars");
  const [page, setPage] = useState(1);
  const [hydrated, setHydrated] = useState(false);

  const [data, setData] = useState<McpServerPage | null>(null);
  const [stats, setStats] = useState<McpStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQ(params.get("q") || "");
    setTransport(params.get("transport") || "");
    setSecret(params.get("secret") || "");
    setLanguage(params.get("language") || "");
    setSort(params.get("sort") || "stars");
    const parsedPage = Number(params.get("page") || "1");
    setPage(Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : 1);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (transport) params.set("transport", transport);
    if (secret) params.set("secret", secret);
    if (language) params.set("language", language);
    if (sort !== "stars") params.set("sort", sort);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [hydrated, q, transport, secret, language, sort, page]);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/mcp/stats", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStats)
      .catch(() => {});
    return () => controller.abort();
  }, [retry]);

  useEffect(() => {
    if (!hydrated) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(async () => {
      try {
        const query = new URLSearchParams({ q, transport, secret, language, sort, page: String(page) });
        const res = await fetch(`/api/mcp/servers?${query}`, { signal: controller.signal });
        if (!res.ok) throw new Error("API error");
        setData(await res.json());
      } catch {
        if (!controller.signal.aborted) setError("Không kết nối được API backend. Hãy kiểm tra Docker Compose.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [hydrated, q, transport, secret, language, sort, page, retry]);

  function resetFilters() {
    setQ("");
    setTransport("");
    setSecret("");
    setLanguage("");
    setSort("stars");
    setPage(1);
  }

  const totalItems = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const hasActiveFilters = Boolean(q.trim() || transport || secret || language || sort !== "stars");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <section className="flex flex-col justify-between gap-5 pb-6 md:flex-row md:items-end">
        <div className="max-w-2xl space-y-2.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold tracking-wide text-teal-700 uppercase dark:text-teal-400">
            <Plug className="size-3.5" />
            MCP Registry
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-slate-50">
            Danh mục MCP Server
          </h1>
          <p className="text-sm leading-relaxed text-slate-600 sm:text-[15px] dark:text-slate-400">
            Các MCP server trong catalog repository, kèm transport, biến môi trường cần thiết và mẫu cấu hình cho Claude Desktop, Claude Code, Cursor. Thông tin được đọc từ{" "}
            <code className="font-mono text-[13px]">server.json</code> và README gốc. Hub chỉ lưu tên biến môi trường, không lưu giá trị.
          </p>
        </div>

        {stats && (
          <div className="flex shrink-0 flex-wrap items-center gap-4 border-t border-slate-200/80 pt-3 text-xs text-slate-500 md:border-t-0 md:pt-0 dark:border-slate-800 dark:text-slate-400">
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">MCP repo</span>
              <span className="tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">{stats.total}</span>
            </div>
            <div className="h-7 w-px bg-slate-200 dark:bg-slate-800" />
            <div>
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Đã nhận diện</span>
              <span className="tabular-nums text-lg font-bold text-slate-900 dark:text-slate-100">{stats.detected}</span>
            </div>
            <div className="hidden h-7 w-px bg-slate-200 sm:block dark:bg-slate-800" />
            <div className="w-full sm:w-auto">
              <span className="block text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">Trích xuất cuối</span>
              <span className="tabular-nums text-xs font-medium text-slate-700 dark:text-slate-300">
                {formatViDate(stats.last_extracted_at, "Chưa trích xuất")}
              </span>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/90 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.05),0_10px_28px_-14px_rgba(15,23,42,0.08)] dark:border-slate-800/90 dark:bg-slate-900/90 dark:shadow-[0_10px_30px_-14px_rgba(0,0,0,0.65)]">
        <div className="grid gap-2.5 md:grid-cols-[1fr_160px_170px_150px_150px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
            <Input
              ref={searchRef}
              aria-label="Tìm MCP server"
              className="border-slate-200/75 bg-slate-50/70 pl-10 pr-10 focus-visible:bg-white dark:border-slate-800 dark:bg-slate-950/75 dark:focus-visible:bg-slate-950"
              placeholder="Tìm tên server, repo hoặc mô tả (có/không dấu)..."
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
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <select aria-label="Transport" value={transport} className={SELECT_CLASS}
            onChange={(e) => { setTransport(e.target.value); setPage(1); }}>
            <option value="">Mọi transport</option>
            {(stats?.transports ?? [{ name: "stdio", count: 0 }, { name: "http", count: 0 }, { name: "sse", count: 0 }]).map((t) => (
              <option key={t.name} value={t.name}>
                {TRANSPORT_LABELS[t.name]}{stats ? ` (${t.count})` : ""}
              </option>
            ))}
          </select>

          <select aria-label="Yêu cầu secret" value={secret} className={SELECT_CLASS}
            onChange={(e) => { setSecret(e.target.value); setPage(1); }}>
            <option value="">Mọi yêu cầu secret</option>
            <option value="required">Cần API key/token</option>
            <option value="none">Không cần secret</option>
          </select>

          <select aria-label="Ngôn ngữ lập trình" value={language} className={SELECT_CLASS}
            onChange={(e) => { setLanguage(e.target.value); setPage(1); }}>
            <option value="">Mọi ngôn ngữ</option>
            {stats?.languages.map((lang) => (
              <option key={lang.name} value={lang.name}>
                {lang.name} ({lang.count})
              </option>
            ))}
          </select>

          <select aria-label="Sắp xếp" value={sort} className={SELECT_CLASS}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}>
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <p className="tabular-nums" aria-live="polite">
          {loading ? "Đang tải danh sách…" : error || `${totalItems} MCP server · trang ${page}/${totalPages}`}
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

      {error && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          <span>{error}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => setRetry((x) => x + 1)}>
            Thử lại
          </Button>
        </div>
      )}

      {!error && loading && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="mt-3 h-12 w-full" />
              <Skeleton className="mt-4 h-4 w-1/2" />
            </Card>
          ))}
        </div>
      )}

      {!error && !loading && data?.items.length === 0 && (
        <Card className="mt-4 p-12 text-center">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
            {hasActiveFilters ? "Không tìm thấy MCP server phù hợp" : "Chưa có MCP server nào trong catalog"}
          </p>
          <p className="mx-auto mt-1.5 max-w-lg text-sm text-slate-500 dark:text-slate-400">
            {hasActiveFilters ? (
              "Thử từ khóa khác hoặc bỏ bớt bộ lọc."
            ) : (
              <>
                Module MCP lấy các repo thuộc danh mục {stats?.categories.join(", ") || "MCP"} trong catalog. Sau khi import catalog, chạy{" "}
                <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-200">
                  docker compose exec backend python -m app.mcp.sync
                </code>{" "}
                hoặc đợi lịch tự động chạy.
              </>
            )}
          </p>
          {hasActiveFilters && (
            <Button type="button" variant="outline" className="mt-5" onClick={resetFilters}>
              Xem toàn bộ danh mục
            </Button>
          )}
        </Card>
      )}

      {!error && !loading && data && data.items.length > 0 && (
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((item) => {
            const { owner, name } = splitFullName(item.full_name);
            const href = `/mcp/${item.repository_id}`;
            return (
              <Card
                key={item.repository_id}
                className="card-lift group flex flex-col hover:border-slate-300/90 dark:hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-slate-800/80">
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    {item.transports.length > 0 ? (
                      item.transports.map((t) => (
                        <span key={t} className="rounded-md bg-teal-50/90 px-2 py-0.5 font-mono text-[11px] font-semibold text-teal-800 dark:bg-teal-500/15 dark:text-teal-300">
                          {t}
                        </span>
                      ))
                    ) : (
                      <Badge variant="secondary">{STATUS_LABELS[item.status]}</Badge>
                    )}
                  </div>
                  <span title="GitHub Stars" className="tabular-nums inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-50/90 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
                    <Star className="size-3 fill-amber-400 text-amber-500 dark:text-amber-400" />
                    {formatCompactNumber(item.stars)}
                  </span>
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <Link href={href} className="flex items-center gap-2.5">
                      <RepoAvatar avatarUrl={item.owner_avatar_url} owner={owner} />
                      <h2 className="min-w-0 truncate text-[15px] leading-snug">
                        {owner && <span className="font-normal text-slate-400 dark:text-slate-500">{owner}/</span>}
                        <span className="font-semibold text-slate-900 group-hover:text-teal-700 dark:text-slate-100 dark:group-hover:text-teal-300">
                          {name}
                        </span>
                      </h2>
                    </Link>
                    {item.server_name && (
                      <p className="mt-1.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        server: {item.server_name}
                      </p>
                    )}
                    <p className="mt-2 line-clamp-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                      {item.description_vi}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
                    <div className="flex min-w-0 items-center gap-3">
                      {item.language && <span className="truncate">{item.language}</span>}
                      {item.requires_secret ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400" title="Cần API key/token">
                          <KeyRound className="size-3" />
                          Cần secret
                        </span>
                      ) : item.env_count > 0 ? (
                        <span className="tabular-nums">{item.env_count} biến env</span>
                      ) : null}
                      {item.archived && <Badge variant="warning">Archived</Badge>}
                    </div>
                    <Link href={href} className="shrink-0 font-medium text-slate-700 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-300">
                      Cấu hình →
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {!error && totalItems > PAGE_SIZE && (
        <div className="mt-9 flex flex-wrap items-center justify-center gap-1.5">
          <Button type="button" variant="outline" size="sm" disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}>
            <ChevronLeft className="size-4" />
            Trước
          </Button>
          {pageNumbers(page, totalPages).map((entry, idx) =>
            entry === "..." ? (
              <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 dark:text-slate-500">…</span>
            ) : (
              <Button key={entry} type="button" variant={entry === page ? "default" : "outline"} size="sm"
                disabled={loading} onClick={() => setPage(entry)} className="tabular-nums min-w-8">
                {entry}
              </Button>
            )
          )}
          <Button type="button" variant="outline" size="sm" disabled={loading || page >= totalPages}
            onClick={() => setPage((p) => p + 1)}>
            Sau
            <ChevronRight className="size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
