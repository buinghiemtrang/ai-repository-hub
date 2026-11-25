"use client";

import { useEffect, useState } from "react";
import { Clock, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { type SyncStatusResponse, formatViDate } from "@/lib/repositories/types";

function statusVariant(status: string): "accent" | "secondary" | "warning" {
  if (status === "completed") return "accent";
  if (status === "running") return "secondary";
  return "warning";
}

export default function SyncStatusPage() {
  const [status, setStatus] = useState<SyncStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("/api/repositories/sync/status", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setStatus)
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
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:py-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Trạng thái đồng bộ dữ liệu</h1>
          <p className="mt-1 text-sm text-slate-600">
            Theo dõi lịch đồng bộ metadata tự động và nhật ký thực thi từ GitHub API.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setTick((x) => x + 1)}>
          <RefreshCw className="size-4" />
          Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {error}
        </div>
      )}

      {loading && (
        <Card className="p-6 space-y-3">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-24 w-full" />
        </Card>
      )}

      {!loading && status && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="text-xs text-slate-500">Lịch tự động</div>
              <div className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                <Clock className="size-4 text-teal-700" />
                {status.scheduler.enabled ? `Bật (mỗi ${status.scheduler.interval_hours}h)` : "Đang tắt"}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Giới hạn mỗi đợt</div>
              <div className="mt-1 font-semibold text-slate-900">{status.scheduler.batch_limit} repo</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">Tuổi dữ liệu tối thiểu</div>
              <div className="mt-1 font-semibold text-slate-900">{status.scheduler.min_age_hours} giờ</div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-slate-500">GitHub Token</div>
              <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-900">
                <ShieldCheck className="size-4 text-teal-700" />
                {status.scheduler.has_github_token ? "Đã cấu hình" : "Chưa cấu hình (60 req/h)"}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader className="border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">10 lần đồng bộ gần nhất</h2>
            </CardHeader>
            <CardContent className="p-0">
              {status.recent_runs.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">
                  Chưa có bản ghi đồng bộ nào. Chạy CLI{" "}
                  <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
                    docker compose exec backend python -m app.repositories.sync
                  </code>{" "}
                  hoặc đợi lịch tự động chạy.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">ID</th>
                        <th className="px-4 py-3 font-medium">Nguồn kích hoạt</th>
                        <th className="px-4 py-3 font-medium">Trạng thái</th>
                        <th className="px-4 py-3 font-medium">Kết quả</th>
                        <th className="px-4 py-3 font-medium">Bắt đầu</th>
                        <th className="px-4 py-3 font-medium">Ghi chú</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {status.recent_runs.map((run) => (
                        <tr key={run.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono text-xs text-slate-500">#{run.id}</td>
                          <td className="px-4 py-3 font-medium text-slate-800">{run.trigger}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(run.status)}>{run.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {run.synced_count}/{run.total_repos} thành công
                            {run.failed_count > 0 ? ` · ${run.failed_count} lỗi` : ""}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500">
                            {formatViDate(run.started_at)}
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-600">
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

          <Card className="bg-slate-50/80 p-5 text-xs leading-6 text-slate-600">
            <strong className="text-slate-800">Bảo mật vận hành:</strong> Endpoint kích hoạt đồng bộ thủ công (
            <code>POST /repositories/sync/trigger</code>) được bảo vệ bởi header <code>X-Admin-Key</code> và chỉ bật khi
            <code>ADMIN_API_KEY</code> được cấu hình trên backend. Không bao giờ gửi token lên trình duyệt.
          </Card>
        </>
      )}
    </div>
  );
}
