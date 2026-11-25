"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  FolderGit2,
  Pause,
  Play,
  Tag,
  X,
} from "lucide-react";
import { NewsCategoryIcon } from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";
import {
  IMPORTANT_TAG,
  type NewsItem,
  formatNewsDate,
  formatNewsWeekday,
  urlHost,
} from "@/lib/news/types";

interface NewsDetailDrawer22Props {
  item: NewsItem | null;
  theme: VellumTheme;
  dark: boolean;
  rc?: boolean;
  isPlaying: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  positionLabel: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSpeak: (item: NewsItem) => void;
  onOpenRepoById?: (repoId: number) => void;
}

export function NewsDetailDrawer22({
  item,
  theme,
  dark,
  rc = false,
  isPlaying,
  hasPrev,
  hasNext,
  positionLabel,
  onClose,
  onPrev,
  onNext,
  onSpeak,
  onOpenRepoById,
}: NewsDetailDrawer22Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setImgFailed(false);
  }, [item?.id]);

  // Manage focus & restoration when drawer opens / closes
  useEffect(() => {
    if (item) {
      lastFocusedRef.current = document.activeElement as HTMLElement | null;
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    } else if (lastFocusedRef.current && typeof lastFocusedRef.current.focus === "function") {
      lastFocusedRef.current.focus();
      lastFocusedRef.current = null;
    }
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, hasPrev, hasNext, onClose, onPrev, onNext]);

  const paragraphs = item
    ? (item.full_text || item.excerpt || item.summary || "")
        .split(/\n{2,}|\r\n\r\n/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [];

  return (
    <AnimatePresence>
      {item && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: VELLUM_EASE }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45 backdrop-blur-[1px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Đọc bài viết: ${item.title}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: VELLUM_EASE }}
            style={{
              backgroundColor: theme.surface,
              color: theme.ink,
              borderColor: theme.rule,
            }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l shadow-2xl"
          >
            {/* Header Bar */}
            <div
              style={{ borderColor: theme.rule }}
              className="flex items-center justify-between border-b px-5 py-3.5"
            >
              <div className="flex items-center gap-2">
                <span style={{ color: theme.accent }}>
                  <NewsCategoryIcon section={item.section} dark={dark} size={16} />
                </span>
                <span
                  style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                  className="text-[11px] font-medium uppercase tracking-wider"
                >
                  {item.section}
                </span>
                {positionLabel && (
                  <span
                    style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                    className="tabular-nums text-[10px]"
                  >
                    · {positionLabel}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={onPrev}
                  style={{ borderColor: theme.rule }}
                  className={`flex items-center justify-center rounded-[4px] border transition-colors hover:opacity-80 disabled:opacity-35 ${
                    rc ? "size-11 sm:size-8 focus-visible:outline-2 focus-visible:outline-offset-2" : "size-8"
                  }`}
                  title="Tin trước (←)"
                  aria-label="Tin trước"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={onNext}
                  style={{ borderColor: theme.rule }}
                  className={`flex items-center justify-center rounded-[4px] border transition-colors hover:opacity-80 disabled:opacity-35 ${
                    rc ? "size-11 sm:size-8 focus-visible:outline-2 focus-visible:outline-offset-2" : "size-8"
                  }`}
                  title="Tin sau (→)"
                  aria-label="Tin sau"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  style={{ borderColor: theme.rule }}
                  className={`ml-1 flex items-center justify-center rounded-[4px] border transition-colors hover:opacity-80 ${
                    rc ? "size-11 sm:size-8 focus-visible:outline-2 focus-visible:outline-offset-2" : "size-8"
                  }`}
                  title="Đóng (Esc)"
                  aria-label="Đóng chi tiết tin tức"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {item.images?.[0] && !imgFailed && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.985 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.28, ease: VELLUM_EASE }}
                  style={{ borderColor: theme.rule, backgroundColor: dark ? "#141312" : "#ffffff" }}
                  className="overflow-hidden rounded-[5px] border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    onError={() => setImgFailed(true)}
                    className="max-h-72 w-full object-contain"
                  />
                </motion.div>
              )}

              <div className="space-y-2.5">
                <div
                  style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
                >
                  <span>
                    {formatNewsWeekday(item.date)}, {formatNewsDate(item.date)}
                  </span>
                  {item.time && <span>· {item.time}</span>}
                  <span>· {item.source_label || item.source}</span>
                  {item.tags?.includes(IMPORTANT_TAG) && (
                    <span style={{ color: theme.accent }} className="font-medium">
                      · {IMPORTANT_TAG}
                    </span>
                  )}
                </div>

                <h2
                  style={{ fontFamily: "var(--font-newsreader)" }}
                  className="text-2xl leading-snug font-medium sm:text-3xl"
                >
                  {item.title}
                </h2>
              </div>

              {/* Article Copy */}
              <div className="space-y-3 text-sm leading-relaxed">
                {paragraphs.length > 0 ? (
                  paragraphs.map((p, idx) => (
                    <p key={idx} style={{ color: idx === 0 ? theme.ink : theme.muted }}>
                      {p}
                    </p>
                  ))
                ) : (
                  <p style={{ color: theme.muted }}>{item.summary}</p>
                )}
              </div>

              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Tag style={{ color: theme.muted }} className="size-3.5" />
                  {item.tags.map((t) => (
                    <span
                      key={t}
                      style={{
                        borderColor: theme.rule,
                        backgroundColor: theme.bg,
                        color: theme.muted,
                        fontFamily: "var(--font-jetbrains)",
                      }}
                      className="rounded-[3px] border px-2 py-0.5 text-[11px]"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* Source links */}
              {item.sources && item.sources.length > 0 && (
                <div style={{ borderColor: theme.rule }} className="space-y-2 border-t pt-4">
                  <div
                    style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                    className="text-[11px] uppercase tracking-wider"
                  >
                    Nguồn tham chiếu
                  </div>
                  <div className="space-y-1.5">
                    {item.sources.map((src, i) => (
                      <a
                        key={`${src.url}-${i}`}
                        href={src.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
                        className="flex items-center justify-between gap-2 rounded-[4px] border px-3 py-2 text-xs transition-colors hover:opacity-85"
                      >
                        <span className="truncate font-medium">{src.name || urlHost(src.url)}</span>
                        <ArrowUpRight style={{ color: theme.muted }} className="size-3.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div
              style={{ borderColor: theme.rule, backgroundColor: theme.bg }}
              className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-3.5"
            >
              <button
                type="button"
                onClick={() => onSpeak(item)}
                style={{
                  borderColor: isPlaying ? theme.accent : theme.ruleStrong,
                  backgroundColor: isPlaying ? theme.accentSoft : theme.surface,
                  color: isPlaying ? theme.accent : theme.ink,
                }}
                className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-xs font-medium transition-transform active:scale-[0.98] ${
                  rc ? "min-h-11 sm:min-h-0" : ""
                }`}
              >
                {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
                {isPlaying ? "Dừng nghe" : "Nghe bản tin"}
              </button>

              <div className="flex items-center gap-2">
                {item.repository_id && onOpenRepoById && (
                  <button
                    type="button"
                    onClick={() => onOpenRepoById(item.repository_id!)}
                    style={{ borderColor: theme.ruleStrong, color: theme.ink }}
                    className={`inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-xs font-medium hover:opacity-85 ${
                      rc ? "min-h-11 sm:min-h-0" : ""
                    }`}
                  >
                    <FolderGit2 className="size-3.5" />
                    Mở Repo Folio
                  </button>
                )}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                    className={`inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-medium transition-transform active:scale-[0.98] ${
                      rc ? "min-h-11 sm:min-h-0" : ""
                    }`}
                  >
                    Mở bài gốc
                    <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
