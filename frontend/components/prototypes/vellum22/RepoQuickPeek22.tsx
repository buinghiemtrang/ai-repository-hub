"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  Copy,
  GitFork,
  Heart,
  Scale,
  Star,
  X,
} from "lucide-react";
import { RepoThumbnail22 } from "@/components/prototypes/vellum22/RepoThumbnail22";
import {
  BrandLogoBadge,
  LanguageLogo,
  resolveBrandIcon,
} from "@/components/prototypes/vellum22/VellumIcons22";
import { VELLUM_EASE, type VellumTheme } from "@/components/prototypes/vellum/tokens";
import { formatCompactNumber, formatViDate, type RepoItem } from "@/lib/repositories/types";

interface RepoQuickPeek22Props {
  repo: RepoItem | null;
  theme: VellumTheme;
  dark: boolean;
  isFavorite: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  positionLabel?: string;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleFavorite: (id: number) => void;
}

interface ParsedGuideSection {
  heading: string;
  body: string;
}

function parseGuideSections(guide: string | null | undefined): ParsedGuideSection[] {
  if (!guide) return [];
  const raw = guide.trim();
  if (!raw) return [];
  const chunks = raw.split(/\n(?=#{1,3}\s)/);
  return chunks
    .slice(0, 5)
    .map((chunk) => {
      const lines = chunk.trim().split("\n");
      const first = lines[0] || "";
      if (first.startsWith("#")) {
        return {
          heading: first.replace(/^#{1,3}\s*/, "").trim(),
          body: lines.slice(1).join("\n").trim(),
        };
      }
      return { heading: "Tổng quan từ README", body: chunk.trim() };
    })
    .filter((s) => s.heading || s.body);
}

export function RepoQuickPeek22({
  repo,
  theme,
  dark,
  isFavorite,
  hasPrev,
  hasNext,
  positionLabel,
  onClose,
  onPrev,
  onNext,
  onToggleFavorite,
}: RepoQuickPeek22Props) {
  const [detail, setDetail] = useState<RepoItem | null>(null);
  const [loadingGuide, setLoadingGuide] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const asideRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

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

  // Focus management: focus Close on open, restore exact trigger element on close
  useEffect(() => {
    if (repo) {
      if (!openerRef.current) {
        openerRef.current = document.activeElement as HTMLElement | null;
      }
      const timer = setTimeout(() => closeBtnRef.current?.focus(), 40);
      return () => clearTimeout(timer);
    } else if (openerRef.current && typeof openerRef.current.focus === "function") {
      openerRef.current.focus();
      openerRef.current = null;
    }
  }, [repo]);

  // Keyboard navigation (`Esc`, `←`, `→`) and focus containment (`Tab`)
  useEffect(() => {
    if (!repo) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === "ArrowRight" && hasNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === "Tab" && asideRef.current) {
        const focusables = asideRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [repo, hasPrev, hasNext, onClose, onPrev, onNext]);

  const current = detail && detail.id === repo?.id ? detail : repo;
  const sections = useMemo(() => parseGuideSections(current?.guide_vi), [current?.guide_vi]);

  const copyRepoUrl = async () => {
    if (!current?.url || typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(current.url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      // ignore
    }
  };

  return (
    <AnimatePresence>
      {current && (
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
            ref={asideRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Folio Quick Preview: ${current.full_name}`}
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
                  className="flex size-8 items-center justify-center rounded-[4px] border transition-colors hover:opacity-80 disabled:opacity-30"
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
                  className="flex size-8 items-center justify-center rounded-[4px] border transition-colors hover:opacity-80 disabled:opacity-30"
                  title="Repo sau (→)"
                  aria-label="Repo sau"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  ref={closeBtnRef}
                  type="button"
                  onClick={onClose}
                  style={{ borderColor: theme.rule }}
                  className="ml-1 flex size-8 items-center justify-center rounded-[4px] border transition-colors hover:opacity-80"
                  title="Đóng (Esc)"
                  aria-label="Đóng Folio"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 space-y-5 overflow-y-auto p-6">
              {/* Animated Specimen Image Reveal */}
              <motion.div
                key={`thumb-${current.id}`}
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.28, ease: VELLUM_EASE }}
                className="overflow-hidden rounded-[5px] border"
                style={{ borderColor: theme.rule }}
              >
                <RepoThumbnail22 repo={current} theme={theme} dark={dark} aspectClass="aspect-[16/9]" priority />
              </motion.div>

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
                      backgroundColor: isFavorite ? theme.accentSoft : "transparent",
                      color: isFavorite ? theme.accent : theme.muted,
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-[4px] border px-2.5 py-1.5 text-xs font-medium transition-transform active:scale-[0.96]"
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
                className="grid grid-cols-2 gap-px overflow-hidden rounded-[5px] border text-xs sm:grid-cols-4"
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

              {/* Structured Editorial README Breakdown */}
              <div style={{ borderColor: theme.rule }} className="space-y-3 border-t pt-4">
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
                  <div className="space-y-2">
                    <div style={{ backgroundColor: theme.surfaceAlt }} className="h-4 w-1/3 animate-pulse rounded" />
                    <div style={{ backgroundColor: theme.surfaceAlt }} className="h-16 w-full animate-pulse rounded" />
                  </div>
                ) : sections.length > 0 ? (
                  <div className="space-y-2.5">
                    {sections.map((sec, i) => (
                      <div
                        key={i}
                        style={{ backgroundColor: theme.bg, borderColor: theme.rule }}
                        className="rounded-[5px] border p-3.5"
                      >
                        {sec.heading && (
                          <div className="text-xs font-semibold">{sec.heading}</div>
                        )}
                        {sec.body && (
                          <p
                            style={{ color: theme.muted }}
                            className="mt-1 line-clamp-5 text-xs leading-relaxed whitespace-pre-line"
                          >
                            {sec.body.slice(0, 420)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
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
              className="flex flex-wrap items-center justify-between gap-2.5 border-t px-6 py-3.5"
            >
              <div className="flex items-center gap-2">
                <Link
                  href={`/repositories/${current.id}`}
                  style={{ borderColor: theme.ruleStrong }}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border px-3 py-2 text-xs font-medium transition-colors hover:opacity-80"
                >
                  Chi tiết đầy đủ
                </Link>
                <button
                  type="button"
                  onClick={copyRepoUrl}
                  style={{ borderColor: theme.rule, color: theme.muted }}
                  className="inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-2 text-xs font-medium transition-colors hover:opacity-90"
                  title="Sao chép liên kết GitHub"
                >
                  {copiedUrl ? (
                    <>
                      <Check style={{ color: theme.accent }} className="size-3.5" />
                      <span style={{ color: theme.accent }}>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      <span>URL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span
                  style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
                  className="hidden text-[10px] sm:inline"
                >
                  ← / → · Esc
                </span>
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                  className="inline-flex items-center gap-1.5 rounded-[4px] px-4 py-2 text-xs font-medium transition-transform hover:-translate-y-[1px] active:scale-[0.985]"
                >
                  Mở trên GitHub
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
