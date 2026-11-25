import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  Eye,
  FileCode2,
  GitFork,
  Globe,
  Link2,
  Scale,
  Star,
} from "lucide-react";
import { FavoriteButton } from "@/components/repositories/FavoriteButton";
import { GuideRenderer } from "@/components/repositories/GuideRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/skeleton";
import { type RepoItem, formatCompactNumber, formatViDate } from "@/lib/repositories/types";

export const dynamic = "force-dynamic";

export default async function DetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const res = await fetch((process.env.API_URL || "http://localhost:8000") + "/repositories/" + id, {
    cache: "no-store",
  });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("API unavailable");

  const repo: RepoItem = await res.json();
  const safeSources = (repo.source_urls || []).filter((u) => u.startsWith("https://"));

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:py-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="size-4" />
          Quay lại Thư viện
        </Link>
        <FavoriteButton repoId={repo.id} showLabel />
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">{repo.category}</Badge>
            {repo.language && <Badge variant="outline">{repo.language}</Badge>}
            {repo.license && (
              <Badge variant="secondary">
                <Scale className="size-3" />
                {repo.license}
              </Badge>
            )}
            {repo.archived && (
              <Badge variant="warning">
                <AlertTriangle className="size-3" />
                Đã lưu trữ (Archived)
              </Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold tracking-tight break-words text-slate-900 sm:text-3xl">
            {repo.full_name}
          </h1>

          <p className="mt-2 text-base leading-7 text-slate-700">{repo.description_vi}</p>

          {repo.description_upstream && (
            <p className="mt-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs leading-5 text-slate-600">
              <span className="font-semibold text-slate-800">Mô tả upstream (GitHub): </span>
              {repo.description_upstream}
            </p>
          )}

          {repo.topics && repo.topics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {repo.topics.map((topic) => (
                <span
                  key={topic}
                  className="rounded-md border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-600"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button asChild variant="primary">
              <a href={repo.url} target="_blank" rel="noreferrer">
                Mở trên GitHub
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={repo.readme_url} target="_blank" rel="noreferrer">
                <BookOpen className="size-4" />
                Đọc README gốc
                <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
            {repo.homepage && (
              <Button asChild variant="outline">
                <a href={repo.homepage} target="_blank" rel="noreferrer">
                  <Globe className="size-4" />
                  Website dự án
                  <ArrowUpRight className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Star className="size-3.5 text-amber-500" />
                Stars
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {formatCompactNumber(repo.stars)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <GitFork className="size-3.5" />
                Forks
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {formatCompactNumber(repo.forks)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <Eye className="size-3.5" />
                Watchers
              </div>
              <div className="mt-1 text-lg font-bold text-slate-900">
                {formatCompactNumber(repo.watchers)}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <FileCode2 className="size-3.5" />
                Nhánh chính
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-900">
                {repo.default_branch || "Chưa xác minh"}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Cập nhật upstream: <strong className="text-slate-700">{formatViDate(repo.updated_at)}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" />
              Đồng bộ metadata: <strong className="text-slate-700">{formatViDate(repo.synced_at)}</strong>
            </span>
          </div>

          <Separator />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-slate-900">
                Hướng dẫn cài đặt &amp; sử dụng (đối chiếu tài liệu gốc)
              </h2>
              <Badge variant="outline">Chỉ tham khảo · Không tự chạy lệnh</Badge>
            </div>
            {repo.guide_vi ? (
              <GuideRenderer content={repo.guide_vi} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Hướng dẫn chi tiết đang chờ đồng bộ từ README upstream. Bạn có thể mở trực tiếp{" "}
                <a href={repo.readme_url} target="_blank" rel="noreferrer" className="font-medium text-teal-700 underline">
                  README gốc trên GitHub
                </a>{" "}
                để kiểm tra yêu cầu hệ thống trước khi cài đặt.
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-2.5">
            <h2 className="flex items-center gap-2 text-base font-semibold text-slate-900">
              <Link2 className="size-4 text-slate-500" />
              Nguồn dữ liệu &amp; Provenance
            </h2>
            <p className="text-xs text-slate-500">
              GitHub ID ổn định: {repo.github_id ?? "Chưa đồng bộ"} · Phát hiện lúc: {formatViDate(repo.discovered_at)}
            </p>
            {safeSources.length > 0 ? (
              <ul className="space-y-1.5 text-sm">
                {safeSources.map((src) => (
                  <li key={src}>
                    <a
                      href={src}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 break-all text-teal-700 hover:underline"
                    >
                      {src}
                      <ArrowUpRight className="size-3.5 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">
                Seed khởi tạo; liên kết GitHub chuẩn:{" "}
                <a href={repo.url} target="_blank" rel="noreferrer" className="text-teal-700 underline">
                  {repo.url}
                </a>
              </p>
            )}
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
