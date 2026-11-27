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
  Plug,
  Scale,
  Star,
} from "lucide-react";
import { FavoriteButton } from "@/components/repositories/FavoriteButton";
import { GuideRenderer } from "@/components/repositories/GuideRenderer";
import { RepoAvatar, RepoBannerImage } from "@/components/repositories/RepoImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/skeleton";
import { type RepoItem, formatCompactNumber, formatViDate } from "@/lib/repositories/types";

export const dynamic = "force-dynamic";

function splitName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  if (idx === -1) return { owner: "", name: fullName };
  return { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

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
  let hasMcpProfile = false;
  try {
    const mcpRes = await fetch(`${process.env.API_URL || "http://localhost:8000"}/mcp/servers/${repo.id}`, {
      cache: "no-store",
    });
    hasMcpProfile = mcpRes.ok;
  } catch {
    hasMcpProfile = false;
  }
  const safeSources = (repo.source_urls || []).filter((u) => u.startsWith("https://"));
  const { owner, name } = splitName(repo.full_name);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Quay lại Thư viện
        </Link>
        <FavoriteButton repoId={repo.id} showLabel />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main Editorial Column */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <div className="aspect-[2/1] w-full overflow-hidden border-b border-slate-100 bg-slate-50 dark:border-slate-800/80 dark:bg-slate-950">
              <RepoBannerImage
                fullName={repo.full_name}
                imageUrl={repo.image_url}
                ownerAvatarUrl={repo.owner_avatar_url}
                hasCustomImage={repo.has_custom_image}
                category={repo.category}
                language={repo.language}
              />
            </div>

            <div className="p-6 sm:p-8">
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

              <div className="mt-4 flex items-center gap-3">
                <RepoAvatar avatarUrl={repo.owner_avatar_url} owner={owner} />
                <h1 className="text-2xl font-bold tracking-tight break-words sm:text-3xl">
                  {owner && (
                    <span className="font-normal text-slate-400 dark:text-slate-500">{owner}/</span>
                  )}
                  <span className="text-slate-900 dark:text-slate-50">{name}</span>
                </h1>
              </div>

              <p className="mt-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">
                {repo.description_vi}
              </p>

              {repo.description_upstream && (
                <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/75 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Mô tả gốc trên GitHub:{" "}
                  </span>
                  {repo.description_upstream}
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Hướng dẫn cài đặt &amp; sử dụng (đối chiếu tài liệu gốc)
              </h2>
              <Badge variant="outline">Chỉ tham khảo · Không tự chạy lệnh</Badge>
            </div>
            <Separator className="mb-5" />
            {repo.guide_vi ? (
              <GuideRenderer content={repo.guide_vi} />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                Hướng dẫn chi tiết đang chờ đồng bộ từ README upstream. Bạn có thể mở trực tiếp{" "}
                <a
                  href={repo.readme_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-teal-700 underline dark:text-teal-400"
                >
                  README gốc trên GitHub
                </a>{" "}
                để kiểm tra yêu cầu hệ thống trước khi cài đặt.
              </div>
            )}
          </Card>
        </div>

        {/* Sticky Sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card className="p-5 space-y-3">
            <Button asChild variant="primary" className="w-full justify-between">
              <a href={repo.url} target="_blank" rel="noreferrer">
                <span>Mở trên GitHub</span>
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <a href={repo.readme_url} target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="size-4 text-slate-500 dark:text-slate-400" />
                  Đọc README gốc
                </span>
                <ArrowUpRight className="size-3.5 text-slate-400" />
              </a>
            </Button>
            {hasMcpProfile && (
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href={`/mcp/${repo.id}`}>
                  <span className="inline-flex items-center gap-2">
                    <Plug className="size-4 text-slate-500 dark:text-slate-400" />
                    Cấu hình MCP server
                  </span>
                  <ArrowUpRight className="size-3.5 text-slate-400" />
                </Link>
              </Button>
            )}
            {repo.homepage && (
              <Button asChild variant="outline" className="w-full justify-between">
                <a href={repo.homepage} target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="size-4 text-slate-500 dark:text-slate-400" />
                    Website dự án
                  </span>
                  <ArrowUpRight className="size-3.5 text-slate-400" />
                </a>
              </Button>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Số liệu GitHub
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/70">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Star className="size-3.5 fill-amber-400 text-amber-500" />
                  Stars
                </div>
                <div className="tabular-nums mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCompactNumber(repo.stars)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/70">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <GitFork className="size-3.5 text-slate-400" />
                  Forks
                </div>
                <div className="tabular-nums mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCompactNumber(repo.forks)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/70">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <Eye className="size-3.5 text-slate-400" />
                  Watchers
                </div>
                <div className="tabular-nums mt-1 text-lg font-bold text-slate-900 dark:text-slate-100">
                  {formatCompactNumber(repo.watchers)}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/70">
                <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                  <FileCode2 className="size-3.5 text-slate-400" />
                  Nhánh chính
                </div>
                <div className="mt-1 truncate font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {repo.default_branch || "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Upstream
                </span>
                <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                  {formatViDate(repo.updated_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Đồng bộ
                </span>
                <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                  {formatViDate(repo.synced_at)}
                </span>
              </div>
            </div>
          </Card>

          {repo.topics && repo.topics.length > 0 && (
            <Card className="p-5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Chủ đề (Topics)
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-md border border-slate-200/80 bg-slate-50 px-2 py-0.5 text-xs text-slate-600 dark:border-slate-700/80 dark:bg-slate-950/70 dark:text-slate-300"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-5">
            <CardHeader className="p-0 pb-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                <Link2 className="size-3.5" />
                Provenance
              </h3>
            </CardHeader>
            <CardContent className="p-0 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <p className="tabular-nums">GitHub ID: {repo.github_id ?? "Chưa đồng bộ"}</p>
              {safeSources.length > 0 ? (
                <ul className="space-y-1">
                  {safeSources.map((src) => (
                    <li key={src}>
                      <a
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1 break-all text-teal-700 hover:underline dark:text-teal-400"
                      >
                        <span>{src}</span>
                        <ArrowUpRight className="mt-0.5 size-3 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nguồn mặc định: {repo.url}</p>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
