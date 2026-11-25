"use client";

import { useEffect, useState } from "react";
import { Clock, Newspaper, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type SyncStatusResponse, formatViDate } from "@/lib/repositories/types";

interface NewsSyncRun {
  id: number;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  fetched_count: number;
  inserted_count: number;
  repo_items_count: number;
  error_summary: string | null;
}

interface NewsSyncStatusResponse {
  scheduler: {
    enabled: boolean;
    interval_hours: number;
    repo_limit: number;
  };
  recent_runs: NewsSyncRun[];
}

function statusVariant(status: string): "accent" | "secondary" | "warning" {
  if (status === "completed") return "accent";
  if (status === "running") return "secondary";
  return "warning";
}

export default function SyncStatusPage() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [newsStatus, setNewsStatus] = useState<NewsSyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    Promise.all([
      fetch("/api/repositories/sync/status", { signal: controller.signal }).then((r) =>
        r.ok ? r.json() : Promise.reject()
      ),
      fetch("/api/news/sync/status", { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ])
      .then(([repoData, newsData]) => {
        setStatus(repoData);
        setNewsStatus(newsData);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setError("Không tải được trạng thái đồng bộ từ backend.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [tick]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
            <span className="size-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
            Metadata & News Schedulers
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">
            Trạng thái đồng bộ dữ liệu
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Theo dõi lịch đồng bộ metadata GitHub API và trình thu thập Tin tức AI độc lập.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setTick((x) => x + 1)}>
          <RefreshCw className="size-3.5" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
          {error}
        </div>
      )}

      {loading && (
        <Card className="space-y-3 p-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-24 w-full" />
        </Card>
      )}

      {!loading && status && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Lịch tự động (Repo)
              </div>
              <div className="mt-1.5 flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                <Clock className="size-4 text-teal-700 dark:text-teal-400" />
                {status.scheduler.enabled ? `Bật (mỗi ${status.scheduler.interval_hours}h)` : "Đang tắt"}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Giới hạn mỗi đợt
              </div>
              <div className="tabular-nums mt-1.5 font-semibold text-slate-900 dark:text-slate-100">
                {status.scheduler.batch_limit} repo
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Tuổi tối thiểu
              </div>
              <div className="tabular-nums mt-1.5 font-semibold text-slate-900 dark:text-slate-100">
                {status.scheduler.min_age_hours} giờ
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
                GitHub Token
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100">
                <ShieldCheck className="size-4 text-teal-700 dark:text-teal-400" />
                {status.scheduler.has_github_token ? "Đã cấu hình" : "Chưa cấu hình (60 req/h)"}
              </div>
            </Card>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                10 lần đồng bộ Repository gần nhất
              </h2>
            </CardHeader>
            <CardContent className="p-0">
              {status.recent_runs.length === 0 ? (
                <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                  Chưa có bản ghi đồng bộ nào. Chạy CLI{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-200">
                    docker compose exec backend python -m app.repositories.sync
                  </code>{" "}
                  hoặc đợi lịch tự động chạy.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                      <tr>
                        <th className="px-5 py-3 font-medium">ID</th>
                        <th className="px-5 py-3 font-medium">Nguồn kích hoạt</th>
                        <th className="px-5 py-3 font-medium">Trạng thái</th>
                        <th className="px-5 py-3 font-medium">Kết quả</th>
                        <th className="px-5 py-3 font-medium">Bắt đầu</th>
                        <th className="px-5 py-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {status.recent_runs.map((run) => (
                        <tr key={run.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                          <td className="tabular-nums px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                            #{run.id}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {run.trigger}
                          </td>
                          <td className="px-5 py-3">
                            <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                          </td>
                          <td className="tabular-nums px-5 py-3 text-slate-700 dark:text-slate-300">
                            {run.synced_count}/{run.total_repos} thành công
                            {run.failed_count > 0 ? ` · ${run.failed_count} lỗi` : ""}
                          </td>
                          <td className="tabular-nums px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                            {formatViDate(run.started_at)}
                          </td>
                          <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                            {run.error_summary || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {newsStatus && (
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <Newspaper className="size-4 text-teal-700 dark:text-teal-400" />
                  <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                    Đồng bộ Tin tức AI & mục Repo (RSS công khai)
                  </h2>
                </div>
                <Badge variant={newsStatus.scheduler.enabled ? "accent" : "secondary"}>
                  {newsStatus.scheduler.enabled
                    ? `Mỗi ${newsStatus.scheduler.interval_hours}h`
                    : "Đang tắt"}
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                {newsStatus.recent_runs.length === 0 ? (
                  <p className="p-6 text-sm text-slate-500 dark:text-slate-400">
                    Chưa có lượt đồng bộ RSS nào. Chạy CLI{" "}
                    <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-slate-800 dark:text-slate-200">
                      docker compose exec backend python -m app.news.sync
                    </code>{" "}
                    để lấy tin mới ngay.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50/80 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                        <tr>
                          <th className="px-5 py-3 font-medium">ID</th>
                          <th className="px-5 py-3 font-medium">Nguồn kích hoạt</th>
                          <th className="px-5 py-3 font-medium">Trạng thái</th>
                          <th className="px-5 py-3 font-medium">Kết quả</th>
                          <th className="px-5 py-3 font-medium">Bắt đầu</th>
                          <th className="px-5 py-3 font-medium">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {newsStatus.recent_runs.map((run) => (
                          <tr key={run.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                            <td className="tabular-nums px-5 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                              #{run.id}
                            </td>
                            <td className="px-5 py-3 font-medium text-slate-800 dark:text-slate-200">
                              {run.trigger}
                            </td>
                            <td className="px-5 py-3">
                              <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                            </td>
                            <td className="tabular-nums px-5 py-3 text-slate-700 dark:text-slate-300">
                              +{run.inserted_count} tin mới ({run.fetched_count} đọc) · +{run.repo_items_count} repo
                            </td>
                            <td className="tabular-nums px-5 py-3 text-xs text-slate-500 dark:text-slate-400">
                              {formatViDate(run.started_at)}
                            </td>
                            <td className="px-5 py-3 text-xs text-slate-600 dark:text-slate-400">
                              {run.error_summary || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-50/75 p-5 text-xs leading-relaxed text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
            <strong className="text-slate-800 dark:text-slate-200">Bảo mật vận hành:</strong> Các endpoint kích hoạt đồng bộ thủ công (
            <code className="font-mono">POST /repositories/sync/trigger</code>,{" "}
            <code className="font-mono">POST /news/sync/trigger</code>) được bảo vệ bởi header{" "}
            <code className="font-mono">X-Admin-Key</code> và chỉ bật khi{" "}
            <code className="font-mono">ADMIN_API_KEY</code> được cấu hình trên backend. Không bao giờ gửi token lên trình duyệt.
          </Card>
        </>
      )}
    </div>
  );
}
