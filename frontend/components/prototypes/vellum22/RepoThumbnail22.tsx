"use client";

import { useState } from "react";
import { BrandLogoBadge, resolveBrandIcon } from "@/components/prototypes/vellum22/VellumIcons22";
import type { VellumTheme } from "@/components/prototypes/vellum/tokens";
import type { RepoItem } from "@/lib/repositories/types";

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

const PLATE_PALETTES_LIGHT = [
  { bg: "#ECE7DC", pattern: "rgba(23,22,20,0.055)", accent: "#C03A17" },
  { bg: "#E3E7E2", pattern: "rgba(23,36,28,0.06)", accent: "#1F5E43" },
  { bg: "#E5E8EE", pattern: "rgba(23,30,46,0.06)", accent: "#224B8E" },
  { bg: "#ECE2DF", pattern: "rgba(46,24,20,0.055)", accent: "#9B2C2C" },
  { bg: "#EAE5D8", pattern: "rgba(44,36,20,0.055)", accent: "#8C5E1A" },
];

const PLATE_PALETTES_DARK = [
  { bg: "#221F1C", pattern: "rgba(239,235,227,0.055)", accent: "#E56B45" },
  { bg: "#1B221E", pattern: "rgba(225,240,232,0.055)", accent: "#68B894" },
  { bg: "#1B1F27", pattern: "rgba(225,233,245,0.055)", accent: "#6C9AE2" },
  { bg: "#241C1B", pattern: "rgba(245,225,222,0.055)", accent: "#DF7868" },
  { bg: "#231F18", pattern: "rgba(245,238,220,0.055)", accent: "#D5A04C" },
];

function splitRepoName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  if (idx === -1) return { owner: "", name: fullName };
  return { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

export function RepoThumbnail22({
  repo,
  theme,
  dark,
  aspectClass = "aspect-[16/10]",
  priority = false,
}: {
  repo: RepoItem;
  theme: VellumTheme;
  dark: boolean;
  aspectClass?: string;
  priority?: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const { owner } = splitRepoName(repo.full_name);

  const brandIcon = resolveBrandIcon(repo.full_name, repo.category, repo.topics);
  const hash = hashString(repo.full_name);
  const plateSet = dark ? PLATE_PALETTES_DARK : PLATE_PALETTES_LIGHT;
  const plate = plateSet[hash % plateSet.length];
  const patternKind = hash % 3;

  // Priority 1: Custom GitHub OG / README preview with object-contain so wide logos never clip
  if (repo.has_custom_image && repo.image_url && !imgFailed) {
    return (
      <div
        style={{ backgroundColor: dark ? "#141312" : "#ffffff", borderColor: theme.rule }}
        className={`relative flex w-full items-center justify-center overflow-hidden border-b ${aspectClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={repo.image_url}
          alt={`Preview ${repo.full_name}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setImgFailed(true)}
          className="size-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
        />
        {/* Single crisp owner + brand stamp (avoids repeating text metadata) */}
        <div
          style={{
            backgroundColor: dark ? "rgba(23, 22, 20, 0.92)" : "rgba(255, 255, 255, 0.92)",
            borderColor: theme.ruleStrong,
          }}
          className="pointer-events-none absolute right-2.5 bottom-2.5 flex items-center gap-1.5 rounded-[4px] border px-1.5 py-1 shadow-xs backdrop-blur-xs"
        >
          {repo.owner_avatar_url && !avatarFailed && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={repo.owner_avatar_url}
              alt=""
              loading="lazy"
              onError={() => setAvatarFailed(true)}
              className="size-4 rounded-[3px] object-cover"
            />
          )}
          <BrandLogoBadge icon={brandIcon} dark={dark} size={14} />
        </div>
      </div>
    );
  }

  // Priority 2: Refined Vellum Specimen Plate (deduplicated: language & category live in card footer/header)
  const bgStyle: React.CSSProperties =
    patternKind === 0
      ? {
          backgroundColor: plate.bg,
          backgroundImage: `linear-gradient(${plate.pattern} 1px, transparent 1px), linear-gradient(90deg, ${plate.pattern} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }
      : patternKind === 1
        ? {
            backgroundColor: plate.bg,
            backgroundImage: `radial-gradient(${plate.pattern} 1.25px, transparent 1.25px)`,
            backgroundSize: "14px 14px",
          }
        : {
            backgroundColor: plate.bg,
            backgroundImage: `repeating-linear-gradient(-45deg, transparent, transparent 14px, ${plate.pattern} 14px, ${plate.pattern} 15px)`,
          };

  return (
    <div
      style={{ ...bgStyle, borderColor: theme.rule }}
      className={`relative flex w-full flex-col justify-between overflow-hidden border-b p-3.5 ${aspectClass}`}
    >
      <div className="flex items-center justify-between">
        <span
          style={{ color: plate.accent, fontFamily: "var(--font-jetbrains)" }}
          className="text-[10px] font-medium uppercase tracking-widest"
        >
          PLATE · #{String(repo.id).padStart(3, "0")}
        </span>
        <span
          style={{ color: theme.muted, fontFamily: "var(--font-jetbrains)" }}
          className="text-[10px]"
        >
          @{owner || "github"}
        </span>
      </div>

      {/* Center visual pair: real owner avatar + brand SVG (scales smoothly on hover) */}
      <div className="my-auto flex items-center justify-center gap-3 py-1 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
        {repo.owner_avatar_url && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={repo.owner_avatar_url}
            alt={owner}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            onError={() => setAvatarFailed(true)}
            style={{ borderColor: theme.surface }}
            className="size-12 rounded-[8px] border-2 bg-white object-cover shadow-xs"
          />
        ) : (
          <div
            style={{ backgroundColor: theme.surface, borderColor: theme.rule, color: theme.ink }}
            className="flex size-12 items-center justify-center rounded-[8px] border font-mono text-sm font-medium uppercase"
          >
            {(owner || "GH").slice(0, 2)}
          </div>
        )}

        <div
          style={{ backgroundColor: theme.surface, borderColor: theme.rule }}
          className="flex size-12 items-center justify-center rounded-[8px] border shadow-xs"
        >
          <BrandLogoBadge icon={brandIcon} dark={dark} size={26} />
        </div>
      </div>

      <div className="h-1" />
    </div>
  );
}
