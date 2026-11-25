"use client";

import { useEffect, useState } from "react";
import { Clock, Newspaper, RefreshCw, ShieldCheck } from "lucide-react";
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

function statusPillClasses(status: string): string {
  if (status === "completed") {
    return "border-[var(--v-accent)]/35 bg-[var(--v-accent-soft)] text-[var(--v-accent)]";
  }
  if (status === "running") {
    return "border-[var(--v-rule-strong)] bg-[var(--v-surface-alt)] text-[var(--v-ink)]";
  }
  return "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300";
}

export default function SyncStatusPage() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [newsStatus, setNewsStatus] = useState<NewsSyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch("/api/repositories/sync/status", { signal: controller.signal }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json() as Promise<SyncStatusResponse>;
      }),
      fetch("/api/news/sync/status", { signal: controller.signal })
        .then((r) => (r.ok ? (r.json() as Promise<NewsSyncStatusResponse>) : null))
        .catch(() => null),
    ])
      .then(([repoData, newsData]) => {
        if (controller.signal.aborted) return;
        setStatus(repoData);
        setNewsStatus(newsData);
        setError("");
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
  }, [refreshNonce]);

  const handleRefresh = () => {
    setLoading(true);
    setError("");
    setRefreshNonce((n) => n + 1);
  };

  return (
    <div className="mx-auto max-w-7xl min-w-0 space-y-6 px-3 py-6 sm:px-6 lg:py-8">
      {/* Masthead */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--v-rule)] pb-5">
        <div className="min-w-0 space-y-1.5">
          <div className="font-telemetry flex items-center gap-2 text-[11px] font-medium uppercase tracking-widest text-[var(--v-accent)]">
            <span className="size-1.5 rounded-full bg-[var(--v-accent)]" />
            Metadata &amp; News Schedulers
          </div>
          <h1 className="font-editorial text-3xl font-medium tracking-tight text-[var(--v-ink)] sm:text-4xl">
            Trạng thái đồng bộ dữ liệu
          </h1>
          <p className="text-sm text-[var(--v-muted)]">
            Theo dõi lịch đồng bộ metadata GitHub API và trình thu thập Tin tức AI độc lập.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] px-3.5 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0 sm:h-9"
        >
          <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
          Làm mới
        </button>
      </div>

      {error && (
        <div className="rounded-[5px] border border-[var(--v-accent)]/40 bg-[var(--v-accent-soft)] p-4 text-sm text-[var(--v-ink)]">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-3 rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-6">
          <div className="h-6 w-56 animate-pulse rounded bg-[var(--v-surface-alt)]" />
          <div className="h-24 w-full animate-pulse rounded bg-[var(--v-surface-alt)]" />
        </div>
      )}

      {!loading && status && (
        <>
          {/* Metrics Strip */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
              <div className="font-telemetry text-[10px] uppercase tracking-wider text-[var(--v-muted)]">
                Lịch tự động (Repo)
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-sm font-medium text-[var(--v-ink)]">
                <Clock className="size-4 text-[var(--v-accent)]" />
                {status.scheduler.enabled ? `Bật (mỗi ${status.scheduler.interval_hours}h)` : "Đang tắt"}
              </div>
            </div>
            <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
              <div className="font-telemetry text-[10px] uppercase tracking-wider text-[var(--v-muted)]">
                Giới hạn mỗi đợt
              </div>
              <div className="font-telemetry tabular-nums mt-1.5 text-sm font-medium text-[var(--v-ink)]">
                {status.scheduler.batch_limit} repo
              </div>
            </div>
            <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
              <div className="font-telemetry text-[10px] uppercase tracking-wider text-[var(--v-muted)]">
                Tuổi tối thiểu
              </div>
              <div className="font-telemetry tabular-nums mt-1.5 text-sm font-medium text-[var(--v-ink)]">
                {status.scheduler.min_age_hours} giờ
              </div>
            </div>
            <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-4">
              <div className="font-telemetry text-[10px] uppercase tracking-wider text-[var(--v-muted)]">
                GitHub Token
              </div>
              <div className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-[var(--v-ink)]">
                <ShieldCheck className="size-4 text-[var(--v-accent)]" />
                {status.scheduler.has_github_token ? "Đã cấu hình" : "Chưa cấu hình (60 req/h)"}
              </div>
            </div>
          </div>

          {/* Repository Sync Ledger Table */}
          <div className="overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]">
            <div className="border-b border-[var(--v-rule)] px-5 py-3.5">
              <h2 className="font-editorial text-lg font-medium text-[var(--v-ink)]">
                10 lần đồng bộ Repository gần nhất
              </h2>
            </div>
            {status.recent_runs.length === 0 ? (
              <p className="p-6 text-sm text-[var(--v-muted)]">
                Chưa có bản ghi đồng bộ nào. Đợi lịch tự động chạy hoặc chạy đồng bộ quản trị trên backend.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="font-telemetry border-b border-[var(--v-rule)] bg-[var(--v-surface-alt)] text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                    <tr>
                      <th className="px-5 py-3 font-medium">ID</th>
                      <th className="px-5 py-3 font-medium">Nguồn kích hoạt</th>
                      <th className="px-5 py-3 font-medium">Trạng thái</th>
                      <th className="px-5 py-3 font-medium">Kết quả</th>
                      <th className="px-5 py-3 font-medium">Bắt đầu</th>
                      <th className="px-5 py-3 font-medium">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--v-rule)]">
                    {status.recent_runs.map((run) => (
                      <tr key={run.id} className="hover:bg-[var(--v-bg)]/60">
                        <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-muted)]">
                          #{run.id}
                        </td>
                        <td className="px-5 py-3 font-medium text-[var(--v-ink)]">{run.trigger}</td>
                        <td className="px-5 py-3">
                          <span
                            className={`font-telemetry inline-block rounded-[3px] border px-2 py-0.5 text-[11px] font-medium ${statusPillClasses(run.status)}`}
                          >
                            {run.status}
                          </span>
                        </td>
                        <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-ink)]">
                          {run.synced_count}/{run.total_repos} thành công
                          {run.failed_count > 0 ? ` · ${run.failed_count} lỗi` : ""}
                        </td>
                        <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-muted)]">
                          {formatViDate(run.started_at)}
                        </td>
                        <td className="px-5 py-3 text-xs text-[var(--v-muted)]">
                          {run.error_summary || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* News RSS Sync Ledger Table */}
          {newsStatus && (
            <div className="overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--v-rule)] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <Newspaper className="size-4 text-[var(--v-accent)]" />
                  <h2 className="font-editorial text-lg font-medium text-[var(--v-ink)]">
                    Lần đồng bộ Tin tức AI gần nhất (RSS + Repo nội bộ)
                  </h2>
                </div>
                <span className="font-telemetry text-[11px] text-[var(--v-muted)]">
                  {newsStatus.scheduler.enabled
                    ? `Tự động mỗi ${newsStatus.scheduler.interval_hours}h`
                    : "Scheduler đang tắt"}
                </span>
              </div>

              {newsStatus.recent_runs.length === 0 ? (
                <p className="p-6 text-sm text-[var(--v-muted)]">
                  Chưa có bản ghi đồng bộ Tin tức nào.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-sm">
                    <thead className="font-telemetry border-b border-[var(--v-rule)] bg-[var(--v-surface-alt)] text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                      <tr>
                        <th className="px-5 py-3 font-medium">ID</th>
                        <th className="px-5 py-3 font-medium">Nguồn kích hoạt</th>
                        <th className="px-5 py-3 font-medium">Trạng thái</th>
                        <th className="px-5 py-3 font-medium">Bài thu thập</th>
                        <th className="px-5 py-3 font-medium">Bắt đầu</th>
                        <th className="px-5 py-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--v-rule)]">
                      {newsStatus.recent_runs.map((run) => (
                        <tr key={run.id} className="hover:bg-[var(--v-bg)]/60">
                          <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-muted)]">
                            #{run.id}
                          </td>
                          <td className="px-5 py-3 font-medium text-[var(--v-ink)]">
                            {run.trigger}
                          </td>
                          <td className="px-5 py-3">
                            <span
                              className={`font-telemetry inline-block rounded-[3px] border px-2 py-0.5 text-[11px] font-medium ${statusPillClasses(run.status)}`}
                            >
                              {run.status}
                            </span>
                          </td>
                          <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-ink)]">
                            {run.fetched_count} quét · +{run.inserted_count} mới ({run.repo_items_count} tin Repo)
                          </td>
                          <td className="font-telemetry tabular-nums px-5 py-3 text-xs text-[var(--v-muted)]">
                            {formatViDate(run.started_at)}
                          </td>
                          <td className="px-5 py-3 text-xs text-[var(--v-muted)]">
                            {run.error_summary || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="rounded-[5px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)] p-5 text-xs leading-relaxed text-[var(--v-muted)]">
            <strong className="text-[var(--v-ink)]">Bảo mật vận hành:</strong> Các endpoint kích hoạt đồng bộ thủ công (
            <code className="font-telemetry text-[var(--v-ink)]">POST /repositories/sync/trigger</code>,{" "}
            <code className="font-telemetry text-[var(--v-ink)]">POST /news/sync/trigger</code>) được bảo vệ bởi header{" "}
            <code className="font-telemetry text-[var(--v-ink)]">X-Admin-Key</code> và chỉ bật khi{" "}
            <code className="font-telemetry text-[var(--v-ink)]">ADMIN_API_KEY</code> được cấu hình trên backend. Không bao giờ gửi token lên trình duyệt.
          </div>
        </>
      )}
    </div>
  );
}
