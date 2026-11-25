"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  GitFork,
  Heart,
  Scale,
  Star,
  X,
} from "lucide-react";
import { RepoThumbnail } from "@/components/prototypes/vellum/RepoThumbnail";
import {
  BrandLogoBadge,
  LanguageLogo,
  resolveBrandIcon,
} from "@/components/prototypes/vellum/VellumIcons";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";
import { formatCompactNumber, formatViDate, type RepoItem } from "@/lib/repositories/types";

interface RepoQuickPeekProps {
  repo: RepoItem | null;
  theme: VellumTheme;
  dark: boolean;
  isFavorite: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: (id: number) => void;
}

export function RepoQuickPeek({
  repo,
  theme,
  dark,
  isFavorite,
  hasPrev,
  hasNext,
  onClose,
  onPrev,
  onNext,
  onToggleFavorite,
}: RepoQuickPeekProps) {
  const [detail, setDetail] = useState<RepoItem | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);

  useEffect(() => {
    if (!repo) {
      setDetail(null);
      return;
    }
    let active = true;
    setLoadingGuide(true);
    fetch(`/api/repositories/${repo.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setDetail(d);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingGuide(false);
      });
    return () => {
      active = false;
    };
  }, [repo]);

  useEffect(() => {
    if (!repo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft" && hasPrev) onPrev();
      else if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [repo, hasPrev, hasNext, onClose, onPrev, onNext]);

  const current = detail && detail.id === repo?.id ? detail : repo;

  return (
    <AnimatePresence>
      {current && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/45"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Xem nhanh ${current.full_name}`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.28, ease: VELLUM_EASE }}
            style={{
              backgroundColor: theme.surface,
              color: theme.ink,
              borderColor: theme.rule,
            }}
            className="relative z-10 flex h-full w-full max-w-xl flex-col border-l shadow-2xl"
          >
            {/* Top Folio Bar */}
            <div
              style={{ borderColor: theme.rule }}
              className="flex items-center justify-between border-b px-5 py-3.5"
            >
              <div className="flex items-center gap-2.5">
                <BrandLogoBadge
                  icon={resolveBrandIcon(current.full_name, current.category, current.topics)}
                  dark={dark}
                  size={18}
                />
                <span
                  style={{ color: theme.accent, fontFamily: "var(--font-jetbrains)" }}
                  className="text-[11px] font-medium uppercase tracking-wider"
                >
                  Specimen Folio · {current.category}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={!hasPrev}
                  onClick={onPrev}
                  style={{ borderColor: theme.rule }}
                  className="flex size-8 items-center justify-center rounded-[4px] border disabled:opacity-30"
                  title="Repo trước (←)"
                  aria-label="Repo trước"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={onNext}
                  style={{ borderColor: theme.rule }}
                  className="flex size-8 items-center justify-center rounded-[4px] border disabled:opacity-30"
                  title="Repo sau (→)"
                  aria-label="Repo sau"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  style={{ borderColor: theme.rule }}
                  className="ml-1 flex size-8 items-center justify-center rounded-[4px] border"
                  title="Đóng (Esc)"
                  aria-label="Đóng"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              <RepoThumbnail repo={current} theme={theme} dark={dark} aspectClass="aspect-[16/9]" priority />

              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-3">
                  <h2
                    style={{ fontFamily: "var(--font-newsreader)" }}
                    className="text-2xl leading-tight font-medium sm:text-3xl"
                  >
                    {current.full_name}
                  </h2>
                  <button
                    type="button"
                    onClick={() => onToggleFavorite(current.id)}
                    style={{
                      borderColor: isFavorite ? theme.accent : theme.rule,
                      color: isFavorite ? theme.accent : theme.muted,
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs font-medium"
                  >
                    <Heart className={`size-3.5 ${isFavorite ? "fill-current" : ""}`} />
                    {isFavorite ? "Đã lưu" : "Lưu"}
                  </button>
                </div>

                <p className="text-sm leading-relaxed">{current.description_vi}</p>
                {current.description_upstream && (
                  <p style={{ color: theme.muted }} className="text-xs italic">
                    Upstream: {current.description_upstream}
                  </p>
                )}
              </div>

              {/* Technical Ledger */}
              <div
                style={{ borderColor: theme.rule, backgroundColor: theme.bg }}
                className="grid grid-cols-2 gap-px overflow-hidden border text-xs sm:grid-cols-4"
              >
                <div style={{ backgroundColor: theme.surface }} className="p-3">
                  <div style={{ color: theme.muted }} className="text-[10px] uppercase">
                    Stars
                  </div>
                  <div className="tabular-nums mt-1 inline-flex items-center gap-1 font-mono font-medium">
                    <Star style={{ color: theme.accent }} className="size-3 fill-current" />
                    {formatCompactNumber(current.stars)}
                  </div>
                </div>
                <div style={{ backgroundColor: theme.surface }} className="p-3">
                  <div style={{ color: theme.muted }} className="text-[10px] uppercase">
                    Forks
                  </div>
                  <div className="tabular-nums mt-1 inline-flex items-center gap-1 font-mono font-medium">
                    <GitFork className="size-3" />
                    {formatCompactNumber(current.forks)}
                  </div>
                </div>
                <div style={{ backgroundColor: theme.surface }} className="p-3">
                  <div style={{ color: theme.muted }} className="text-[10px] uppercase">
                    Ngôn ngữ
                  </div>
                  <div className="mt-1 font-medium">
                    <LanguageLogo language={current.language} dark={dark} />
                  </div>
                </div>
                <div style={{ backgroundColor: theme.surface }} className="p-3">
                  <div style={{ color: theme.muted }} className="text-[10px] uppercase">
                    Giấy phép
                  </div>
                  <div className="mt-1 inline-flex items-center gap-1 font-mono font-medium">
                    <Scale className="size-3" />
                    {current.license || "—"}
                  </div>
                </div>
              </div>

              {/* Guide Preview */}
              <div style={{ borderColor: theme.rule }} className="space-y-2 border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider">
                    <BookOpen className="size-3.5" />
                    Hướng dẫn đối chiếu README
                  </span>
                  <span style={{ color: theme.muted }} className="text-[11px]">
                    Cập nhật {formatViDate(current.updated_at)}
                  </span>
                </div>
                {loadingGuide && !detail?.guide_vi ? (
                  <div style={{ color: theme.muted }} className="text-xs italic">
                    Đang tải hướng dẫn chi tiết...
                  </div>
                ) : current.guide_vi ? (
                  <pre
                    style={{
                      backgroundColor: theme.bg,
                      borderColor: theme.rule,
                      fontFamily: "var(--font-jetbrains)",
                    }}
                    className="max-h-60 overflow-y-auto border p-3.5 text-[11.5px] leading-relaxed whitespace-pre-wrap"
                  >
                    {current.guide_vi.slice(0, 1100)}
                  </pre>
                ) : (
                  <p style={{ color: theme.muted }} className="text-xs">
                    Chưa có hướng dẫn tóm tắt; vui lòng mở trực tiếp README trên GitHub.
                  </p>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div
              style={{ borderColor: theme.rule, backgroundColor: theme.bg }}
              className="flex items-center justify-between gap-3 border-t px-6 py-3.5"
            >
              <Link
                href={`/repositories/${current.id}`}
                style={{ borderColor: theme.ruleStrong }}
                className="inline-flex items-center gap-1.5 rounded-[4px] border px-3.5 py-2 text-xs font-medium hover:opacity-80"
              >
                Trang chi tiết đầy đủ
              </Link>
              <a
                href={current.url}
                target="_blank"
                rel="noreferrer"
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-medium transition-transform active:scale-[0.98]"
              >
                Mở trên GitHub
                <ArrowUpRight className="size-3.5" />
              </a>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
