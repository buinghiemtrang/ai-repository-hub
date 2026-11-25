"use client";

import { useState } from "react";
import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

const CATEGORY_GRADIENTS: Record<string, string> = {
  "AI Agent":
    "from-teal-500/15 via-cyan-500/10 to-slate-100 dark:from-teal-500/20 dark:via-cyan-950/40 dark:to-slate-950",
  "Claude Skills":
    "from-amber-500/15 via-orange-500/10 to-slate-100 dark:from-amber-500/20 dark:via-orange-950/30 dark:to-slate-950",
  "Lập trình":
    "from-blue-500/15 via-indigo-500/10 to-slate-100 dark:from-blue-500/20 dark:via-indigo-950/40 dark:to-slate-950",
  MCP:
    "from-emerald-500/15 via-teal-500/10 to-slate-100 dark:from-emerald-500/20 dark:via-teal-950/40 dark:to-slate-950",
  "Workflow & Tự động hoá":
    "from-rose-500/15 via-orange-500/10 to-slate-100 dark:from-rose-500/20 dark:via-orange-950/30 dark:to-slate-950",
  "Thiết kế & Sáng tạo":
    "from-violet-500/15 via-fuchsia-500/10 to-slate-100 dark:from-violet-500/20 dark:via-fuchsia-950/30 dark:to-slate-950",
  "Chạy AI cục bộ":
    "from-sky-500/15 via-slate-500/10 to-slate-100 dark:from-sky-500/20 dark:via-slate-900 dark:to-slate-950",
};

function splitName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  if (idx === -1) return { owner: "", name: fullName };
  return { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

export function RepoBannerImage({
  fullName,
  imageUrl,
  ownerAvatarUrl,
  hasCustomImage,
  category,
  language,
  className,
}: {
  fullName: string;
  imageUrl: string;
  ownerAvatarUrl?: string | null;
  hasCustomImage?: boolean;
  category: string;
  language?: string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { owner, name } = splitName(fullName);
  const gradient =
    CATEGORY_GRADIENTS[category] ||
    "from-teal-500/12 via-slate-100 to-slate-200/70 dark:from-teal-500/15 dark:via-slate-900 dark:to-slate-950";

  if (hasCustomImage && !failed && imageUrl) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-white dark:bg-slate-950",
          className
        )}
      >
        <img
          src={imageUrl}
          alt={`Ảnh xem trước ${fullName}`}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center overflow-hidden bg-gradient-to-br px-5 py-4",
        gradient,
        className
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(100,116,139,0.35) 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />
      <div className="relative flex w-full items-center gap-4">
        <div className="shrink-0">
          {ownerAvatarUrl && !avatarFailed ? (
            <img
              src={ownerAvatarUrl}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setAvatarFailed(true)}
              className="size-14 rounded-2xl border border-white/80 bg-white object-cover shadow-md ring-1 ring-slate-900/5 transition-transform duration-300 ease-out group-hover:scale-105 dark:border-slate-700 dark:bg-slate-900 dark:ring-white/10"
            />
          ) : (
            <div className="flex size-14 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-teal-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-teal-300">
              <Code2 className="size-6" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
            @{owner || "github"}
          </div>
          <div className="mt-0.5 truncate text-base font-bold tracking-tight text-slate-900 dark:text-slate-100">
            {name}
          </div>
          {language && (
            <span className="mt-1.5 inline-block rounded-md border border-slate-200/80 bg-white/80 px-2 py-0.5 text-[10px] font-medium text-slate-700 backdrop-blur-xs dark:border-slate-700/80 dark:bg-slate-900/80 dark:text-slate-300">
              {language}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function RepoAvatar({
  avatarUrl,
  owner,
}: {
  avatarUrl?: string | null;
  owner: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!avatarUrl || failed) {
    return (
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-200/80 bg-slate-100 text-[10px] font-bold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        {(owner || "?").slice(0, 2)}
      </span>
    );
  }
  return (
    <img
      src={avatarUrl}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-6 shrink-0 rounded-md border border-slate-200/80 bg-white object-cover dark:border-slate-700"
    />
  );
}
