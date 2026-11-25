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
import { RepoAvatar, RepoBannerImage } from "@/components/repositories/RepoImage";
import { CategoryIcon, LanguageLogo } from "@/components/prototypes/vellum22/VellumIcons22";
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
  const safeSources = (repo.source_urls || []).filter((u) => u.startsWith("https://"));
  const { owner, name } = splitName(repo.full_name);

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 lg:py-8">
      {/* Top Action Bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] px-3.5 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:border-[var(--v-rule-strong)] sm:min-h-0"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại Thư viện
        </Link>
        <FavoriteButton repoId={repo.id} showLabel />
      </div>

      <div className="grid min-w-0 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* Main Editorial Folio Column */}
        <div className="min-w-0 space-y-6">
          <article className="overflow-hidden rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)]">
            <div className="aspect-[2/1] w-full overflow-hidden border-b border-[var(--v-rule)] bg-[var(--v-surface-alt)]">
              <RepoBannerImage
                fullName={repo.full_name}
                imageUrl={repo.image_url}
                ownerAvatarUrl={repo.owner_avatar_url}
                hasCustomImage={repo.has_custom_image}
                category={repo.category}
                language={repo.language}
              />
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--v-accent)]/30 bg-[var(--v-accent-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--v-accent)]">
                  <CategoryIcon category={repo.category} className="size-3.5" />
                  {repo.category}
                </span>

                {repo.language && (
                  <span className="font-telemetry inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-2.5 py-1 text-[11px] text-[var(--v-ink)]">
                    <LanguageLogo language={repo.language} />
                  </span>
                )}

                {repo.license && (
                  <span className="font-telemetry inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)] px-2.5 py-1 text-[11px] text-[var(--v-muted)]">
                    <Scale className="size-3" />
                    {repo.license}
                  </span>
                )}

                {repo.archived && (
                  <span className="font-telemetry inline-flex items-center gap-1.5 rounded-[3px] border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="size-3" />
                    Đã lưu trữ (Archived)
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center gap-3">
                <RepoAvatar avatarUrl={repo.owner_avatar_url} owner={owner} />
                <h1 className="font-editorial min-w-0 break-words text-2xl font-medium tracking-tight text-[var(--v-ink)] sm:text-4xl">
                  {owner && <span className="font-normal text-[var(--v-muted)]">{owner}/</span>}
                  <span>{name}</span>
                </h1>
              </div>

              <p className="mt-4 text-[15px] leading-relaxed text-[var(--v-ink)] sm:text-base">
                {repo.description_vi}
              </p>

              {repo.description_upstream && (
                <div className="mt-4 rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-4 py-3 text-xs leading-relaxed text-[var(--v-muted)]">
                  <span className="font-medium text-[var(--v-ink)]">Mô tả gốc trên GitHub: </span>
                  {repo.description_upstream}
                </div>
              )}
            </div>
          </article>

          {/* Vietnamese Installation & Reference Guide */}
          <section className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5 sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--v-rule)] pb-4">
              <h2 className="font-editorial text-xl font-medium tracking-tight text-[var(--v-ink)] sm:text-2xl">
                Hướng dẫn cài đặt &amp; sử dụng (đối chiếu tài liệu gốc)
              </h2>
              <span className="font-telemetry rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--v-muted)]">
                Chỉ tham khảo · Không tự chạy lệnh
              </span>
            </div>

            <div className="pt-5">
              {repo.guide_vi ? (
                <GuideRenderer content={repo.guide_vi} variant="vellum" />
              ) : (
                <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-4 text-sm text-[var(--v-muted)]">
                  Hướng dẫn chi tiết đang chờ đồng bộ từ README upstream. Bạn có thể mở trực tiếp{" "}
                  <a
                    href={repo.readme_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-[var(--v-accent)] underline underline-offset-2"
                  >
                    README gốc trên GitHub
                  </a>{" "}
                  để kiểm tra yêu cầu hệ thống trước khi cài đặt.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sticky Technical Ledger Rail */}
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
          <div className="space-y-2.5 rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5">
            <a
              href={repo.url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 w-full items-center justify-between rounded-[4px] bg-[var(--v-accent)] px-4 py-2.5 text-xs font-medium text-[var(--v-accent-ink)] transition-opacity hover:opacity-90 sm:min-h-0"
            >
              <span>Mở trên GitHub</span>
              <ArrowUpRight className="size-4" />
            </a>
            <a
              href={repo.readme_url}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-11 w-full items-center justify-between rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-bg)] px-4 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0"
            >
              <span className="inline-flex items-center gap-2">
                <BookOpen className="size-3.5 text-[var(--v-muted)]" />
                Đọc README gốc
              </span>
              <ArrowUpRight className="size-3.5 text-[var(--v-muted)]" />
            </a>
            {repo.homepage && (
              <a
                href={repo.homepage}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-11 w-full items-center justify-between rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-bg)] px-4 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0"
              >
                <span className="inline-flex items-center gap-2">
                  <Globe className="size-3.5 text-[var(--v-muted)]" />
                  Website dự án
                </span>
                <ArrowUpRight className="size-3.5 text-[var(--v-muted)]" />
              </a>
            )}
          </div>

          {/* GitHub Metrics */}
          <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5">
            <h3 className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
              Số liệu GitHub
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-2.5">
              <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-3">
                <div className="flex items-center gap-1 text-[11px] text-[var(--v-muted)]">
                  <Star className="size-3.5 fill-amber-400 text-amber-500" />
                  Stars
                </div>
                <div className="font-telemetry tabular-nums mt-1 text-base font-medium text-[var(--v-ink)]">
                  {formatCompactNumber(repo.stars)}
                </div>
              </div>
              <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-3">
                <div className="flex items-center gap-1 text-[11px] text-[var(--v-muted)]">
                  <GitFork className="size-3.5 text-[var(--v-muted)]" />
                  Forks
                </div>
                <div className="font-telemetry tabular-nums mt-1 text-base font-medium text-[var(--v-ink)]">
                  {formatCompactNumber(repo.forks)}
                </div>
              </div>
              <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-3">
                <div className="flex items-center gap-1 text-[11px] text-[var(--v-muted)]">
                  <Eye className="size-3.5 text-[var(--v-muted)]" />
                  Watchers
                </div>
                <div className="font-telemetry tabular-nums mt-1 text-base font-medium text-[var(--v-ink)]">
                  {formatCompactNumber(repo.watchers)}
                </div>
              </div>
              <div className="rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-bg)] p-3">
                <div className="flex items-center gap-1 text-[11px] text-[var(--v-muted)]">
                  <FileCode2 className="size-3.5 text-[var(--v-muted)]" />
                  Nhánh chính
                </div>
                <div className="font-telemetry mt-1 truncate text-xs font-medium text-[var(--v-ink)]">
                  {repo.default_branch || "—"}
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-[var(--v-rule)] pt-3 text-xs text-[var(--v-muted)]">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Upstream
                </span>
                <span className="font-telemetry tabular-nums font-medium text-[var(--v-ink)]">
                  {formatViDate(repo.updated_at)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  Đồng bộ
                </span>
                <span className="font-telemetry tabular-nums font-medium text-[var(--v-ink)]">
                  {formatViDate(repo.synced_at)}
                </span>
              </div>
            </div>
          </div>

          {repo.topics && repo.topics.length > 0 && (
            <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5">
              <h3 className="font-telemetry text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
                Chủ đề (Topics)
              </h3>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {repo.topics.map((topic) => (
                  <span
                    key={topic}
                    className="font-telemetry rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-bg)] px-2 py-0.5 text-[11px] text-[var(--v-muted)]"
                  >
                    #{topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Provenance */}
          <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-5">
            <h3 className="font-telemetry flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[var(--v-muted)]">
              <Link2 className="size-3.5" />
              Provenance
            </h3>
            <div className="mt-2.5 space-y-2 text-xs text-[var(--v-muted)]">
              <p className="font-telemetry tabular-nums">
                GitHub ID: {repo.github_id ?? "Chưa đồng bộ"}
              </p>
              {safeSources.length > 0 ? (
                <ul className="space-y-1">
                  {safeSources.map((src) => (
                    <li key={src}>
                      <a
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-start gap-1 break-all text-[var(--v-accent)] hover:underline"
                      >
                        <span>{src}</span>
                        <ArrowUpRight className="mt-0.5 size-3 shrink-0" />
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="break-all">Nguồn mặc định: {repo.url}</p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
