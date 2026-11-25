"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  ChevronDown,
  ChevronUp,
  FolderGit2,
  Lightbulb,
  Pause,
  Play,
  ShieldCheck,
} from "lucide-react";
import {
  IMPORTANT_TAG,
  type NewsItem,
  type NewsSectionMeta,
  REPO_TAG,
  SECURITY_TAG,
  normalizeVi,
  urlHost,
} from "@/lib/news/types";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  item: NewsItem;
  sectionMeta?: NewsSectionMeta;
  showSectionBadge?: boolean;
  query: string;
  isReading: boolean;
  isPlaying: boolean;
  isFlashed: boolean;
  onPlaySingle: (item: NewsItem) => void;
  onOpenLightbox: (src: string) => void;
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q || !text) return <>{text}</>;
  const normText = normalizeVi(text);
  if (normText.length !== text.length) {
    return <>{text}</>;
  }
  const terms = normalizeVi(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return <>{text}</>;

  const marks = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    let idx = 0;
    while ((idx = normText.indexOf(term, idx)) >= 0) {
      for (let k = idx; k < idx + term.length; k++) {
        marks[k] = true;
      }
      idx += term.length;
    }
  }

  const parts: { text: string; hit: boolean }[] = [];
  let start = 0;
  let curHit = marks[0];
  for (let i = 1; i < text.length; i++) {
    if (marks[i] !== curHit) {
      parts.push({ text: text.slice(start, i), hit: curHit });
      start = i;
      curHit = marks[i];
    }
  }
  parts.push({ text: text.slice(start), hit: curHit });

  return (
    <>
      {parts.map((p, idx) =>
        p.hit ? (
          <mark
            key={idx}
            className="rounded bg-amber-200/80 px-0.5 text-slate-900 dark:bg-amber-400/30 dark:text-amber-100"
          >
            {p.text}
          </mark>
        ) : (
          <Fragment key={idx}>{p.text}</Fragment>
        )
      )}
    </>
  );
}

function tagClasses(tag: string): string {
  if (tag === IMPORTANT_TAG) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300";
  }
  if (tag === SECURITY_TAG) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300";
  }
  if (tag === REPO_TAG) {
    return "border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300";
  }
  return "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300";
}

function tagPrefix(tag: string): string {
  if (tag === IMPORTANT_TAG) return "🔴 ";
  if (tag === SECURITY_TAG) return "🛡️ ";
  if (tag === REPO_TAG) return "📦 ";
  return "#";
}

export function NewsCard({
  item,
  sectionMeta,
  showSectionBadge = false,
  query,
  isReading,
  isPlaying,
  isFlashed,
  onPlaySingle,
  onOpenLightbox,
}: NewsCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [videoActivated, setVideoActivated] = useState(false);

  const isImportant = item.tags.includes(IMPORTANT_TAG);
  const isNoon = item.batch === "noon";
  const hasVideo = Boolean(item.video && (item.video.embed || item.video.url));
  const images = hasVideo ? [] : item.images || [];
  const hasMedia = images.length > 0 || hasVideo;

  if (item.tip) {
    return (
      <div
        id={`item-${item.id}`}
        className={cn(
          "rounded-2xl border border-amber-200/90 bg-gradient-to-br from-amber-50/90 to-orange-50/50 p-4 transition-all dark:border-amber-500/30 dark:from-amber-950/30 dark:to-orange-950/20",
          isReading && "ring-2 ring-orange-500 shadow-lg",
          isFlashed && "ring-2 ring-violet-500"
        )}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Lightbulb className="size-3.5" />
            Mẹo hay
          </span>
          {isNoon && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:bg-sky-500/20 dark:text-sky-300">
              🆕 Tin mới 12h trưa
            </span>
          )}
        </div>
        <h4 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <HighlightedText text={item.title} query={query} />
        </h4>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          <HighlightedText text={item.summary} query={query} />
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPlaySingle(item)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
              isReading
                ? "border-orange-500 bg-orange-500 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            )}
          >
            {isReading && isPlaying ? <Pause className="size-3" /> : <Play className="size-3" />}
            Đọc bài này
          </button>
        </div>
      </div>
    );
  }

  return (
    <article
      id={`item-${item.id}`}
      className={cn(
        "card-lift overflow-hidden rounded-2xl border bg-white shadow-xs dark:bg-[#111827]",
        isImportant
          ? "border-rose-200 dark:border-rose-500/35"
          : "border-slate-200/90 dark:border-slate-800",
        isReading && "ring-2 ring-orange-500 shadow-lg",
        isFlashed && "ring-2 ring-violet-500"
      )}
    >
      <div className={cn("flex flex-col", hasMedia && "md:flex-row")}>
        {hasMedia && (
          <div className="relative shrink-0 bg-slate-100 md:w-64 lg:w-72 dark:bg-slate-900">
            {hasVideo && item.video ? (
              videoActivated ? (
                item.video.embed ? (
                  <iframe
                    src={item.video.embed}
                    title={item.title}
                    className="aspect-video w-full border-0 md:h-full"
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <video
                    controls
                    autoPlay
                    playsInline
                    poster={item.video.poster}
                    src={item.video.url}
                    className="aspect-video w-full object-cover md:h-full"
                  />
                )
              ) : (
                <button
                  type="button"
                  onClick={() => setVideoActivated(true)}
                  className="group relative flex aspect-video w-full items-center justify-center overflow-hidden bg-slate-900 text-white md:h-full"
                >
                  {item.video.poster && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.video.poster}
                      alt=""
                      loading="lazy"
                      className="size-full object-cover opacity-80 transition-transform duration-200 group-hover:scale-105"
                    />
                  )}
                  <span className="absolute flex size-12 items-center justify-center rounded-full bg-orange-500/90 text-white shadow-lg">
                    <Play className="size-5 translate-x-0.5" />
                  </span>
                </button>
              )
            ) : (
              <div className={cn("grid gap-1 p-2", images.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                {images.map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onOpenLightbox(src)}
                    className="group overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950"
                    title="Bấm để phóng to ảnh"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={item.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-video w-full object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col justify-between p-4 sm:p-5">
          <div className="space-y-2.5">
            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              {isNoon && (
                <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-500/20 dark:text-sky-300">
                  🆕 Tin mới 12h trưa
                </span>
              )}
              {(showSectionBadge || item.section === "Repo") && (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold text-white"
                  style={{ backgroundColor: sectionMeta?.color || "#0f766e" }}
                >
                  {sectionMeta?.short || item.section}
                </span>
              )}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                <HighlightedText text={item.source_label || item.source} query={query} />
              </span>
              {item.author && (
                <>
                  <span>·</span>
                  <span>
                    <HighlightedText text={item.author} query={query} />
                  </span>
                </>
              )}
              {item.time && (
                <>
                  <span>·</span>
                  <span className="tabular-nums">
                    🕒 {item.time} (UTC+7)
                    {item.time_estimated && <span className="ml-1 opacity-75">(ước lượng)</span>}
                  </span>
                </>
              )}
            </div>

            {/* Tags */}
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[11px] font-medium",
                      tagClasses(tag)
                    )}
                  >
                    {tagPrefix(tag)}
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <h4 className="text-base font-bold leading-snug text-slate-900 sm:text-[17px] dark:text-slate-50">
              <HighlightedText text={item.title} query={query} />
            </h4>

            {/* Summary */}
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <HighlightedText text={item.summary} query={query} />
            </p>

            {/* Excerpt */}
            {item.excerpt && (
              <blockquote className="border-l-2 border-teal-500/70 bg-slate-50 px-3 py-2 text-xs italic text-slate-600 dark:bg-slate-900/60 dark:text-slate-400">
                “<HighlightedText text={item.excerpt} query={query} />”
              </blockquote>
            )}

            {/* Expandable Full Text */}
            {item.full_text && (
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Chi tiết / Toàn văn tham khảo
                </div>
                <div
                  className={cn(
                    "mt-1 whitespace-pre-wrap text-xs leading-relaxed text-slate-700 dark:text-slate-300",
                    !expanded && "line-clamp-4"
                  )}
                >
                  <HighlightedText text={item.full_text} query={query} />
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded((v) => !v)}
                  className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:underline dark:text-teal-400"
                >
                  {expanded ? (
                    <>
                      Thu gọn <ChevronUp className="size-3.5" />
                    </>
                  ) : (
                    <>
                      Xem thêm <ChevronDown className="size-3.5" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Confidence & Reference Sources */}
            {(item.confidence || (item.sources && item.sources.length > 0)) && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {item.confidence && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <ShieldCheck className="size-3" />
                    Độ tin cậy: {item.confidence}
                  </span>
                )}
                {item.sources && item.sources.length > 0 && (
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span>📚 Nguồn đối chiếu ({item.sources.length}):</span>
                    {item.sources.map((src, idx) => (
                      <Fragment key={src.url}>
                        {idx > 0 && <span>·</span>}
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                        >
                          {src.name} ↗
                        </a>
                      </Fragment>
                    ))}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Row (Audio + Original Link + Catalog Repo Link; NO reaction/comment/submit) */}
          <div className="mt-4 flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => onPlaySingle(item)}
              className={cn(
                "pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold",
                isReading
                  ? "border-orange-500 bg-orange-500 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-orange-400 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              )}
            >
              {isReading && isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              Đọc bài này
            </button>

            {item.repository_id && (
              <Link
                href={`/repositories/${item.repository_id}`}
                className="pressable inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 hover:bg-teal-100 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300"
              >
                <FolderGit2 className="size-3.5" />
                Xem chi tiết Repo
              </Link>
            )}

            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-teal-700 dark:text-slate-300 dark:hover:text-teal-400"
              >
                Mở bài gốc · {urlHost(item.url)}
                <ArrowUpRight className="size-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
