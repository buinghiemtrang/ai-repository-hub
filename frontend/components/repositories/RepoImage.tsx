"use client";

import { useState } from "react";
import Image from "next/image";
import { isOptimizableImageHost, toSizedAvatarUrl } from "@/components/prototypes/vellum22/RepoThumbnail22";
import { BrandLogoBadge, resolveBrandIcon } from "@/components/prototypes/vellum22/VellumIcons22";
import { cn } from "@/lib/utils";

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
  const { owner } = splitName(fullName);
  const brandIcon = resolveBrandIcon(fullName, category);
  const avatarSrc = toSizedAvatarUrl(ownerAvatarUrl, 128);

  if (hasCustomImage && !failed && imageUrl) {
    const canOptimize = isOptimizableImageHost(imageUrl);
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-white dark:bg-[#141312]",
          className
        )}
      >
        {canOptimize ? (
          <Image
            src={imageUrl}
            alt={`Ảnh xem trước ${fullName}`}
            fill
            priority
            sizes="(max-width: 1024px) 94vw, 720px"
            quality={80}
            onError={() => setFailed(true)}
            className="object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`Ảnh xem trước ${fullName}`}
            loading="eager"
            decoding="async"
            onError={() => setFailed(true)}
            className="h-full w-full object-contain transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full w-full flex-col justify-between overflow-hidden bg-[var(--v-surface-alt)] px-6 py-5",
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(var(--v-rule) 1px, transparent 1px), linear-gradient(90deg, var(--v-rule) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      <div className="font-telemetry flex items-center justify-between text-[11px] uppercase tracking-widest text-[var(--v-accent)]">
        <span>SPECIMEN · {category}</span>
        <span className="text-[var(--v-muted)]">@{owner || "github"}</span>
      </div>

      <div className="my-auto flex items-center justify-center gap-4 py-4">
        {avatarSrc && !avatarFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={owner}
            width={64}
            height={64}
            loading="eager"
            onError={() => setAvatarFailed(true)}
            className="size-16 rounded-[8px] border-2 border-[var(--v-surface)] bg-white object-cover shadow-xs"
          />
        ) : (
          <div className="flex size-16 items-center justify-center rounded-[8px] border border-[var(--v-rule-strong)] bg-[var(--v-surface)] font-mono text-base font-medium uppercase text-[var(--v-ink)]">
            {(owner || "GH").slice(0, 2)}
          </div>
        )}

        <div className="flex size-16 items-center justify-center rounded-[8px] border border-[var(--v-rule)] bg-[var(--v-surface)] shadow-xs">
          <BrandLogoBadge icon={brandIcon} size={32} />
        </div>
      </div>

      <div className="h-2" />
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
  const avatarSrc = toSizedAvatarUrl(avatarUrl, 64);
  if (!avatarSrc || failed) {
    return (
      <span className="flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-surface-alt)] font-mono text-[10px] font-bold uppercase text-[var(--v-ink)]">
        {(owner || "?").slice(0, 2)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarSrc}
      alt=""
      width={28}
      height={28}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="size-7 shrink-0 rounded-[4px] border border-[var(--v-rule)] bg-white object-cover"
    />
  );
}
