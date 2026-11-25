"use client";

import { useSyncExternalStore } from "react";
import { Heart } from "lucide-react";
import { FAVORITES_STORAGE_KEY, loadFavorites, toggleFavoriteId } from "@/lib/repositories/favorites";
import { cn } from "@/lib/utils";

const EMPTY_FAVS: number[] = [];
let cachedRaw: string | null | undefined = undefined;
let cachedList: number[] = EMPTY_FAVS;

function subscribeFavorites(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("aihub_favorites_updated", cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener("aihub_favorites_updated", cb);
    window.removeEventListener("storage", cb);
  };
}

export function getFavoritesSnapshot(): number[] {
  if (typeof window === "undefined") return EMPTY_FAVS;
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedList = loadFavorites();
    }
    return cachedList;
  } catch {
    return EMPTY_FAVS;
  }
}

export function useFavorites(): {
  favorites: number[];
  toggleFavorite: (id: number) => void;
} {
  const favorites = useSyncExternalStore(
    subscribeFavorites,
    getFavoritesSnapshot,
    () => EMPTY_FAVS
  );

  const toggleFavorite = (id: number) => {
    toggleFavoriteId(favorites, id);
    cachedRaw = undefined;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("aihub_favorites_updated"));
    }
  };

  return { favorites, toggleFavorite };
}

export function FavoriteButton({
  repoId,
  showLabel = false,
}: {
  repoId: number;
  showLabel?: boolean;
}) {
  const { favorites, toggleFavorite } = useFavorites();
  const active = favorites.includes(repoId);

  return (
    <button
      type="button"
      aria-label={active ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      aria-pressed={active}
      onClick={() => toggleFavorite(repoId)}
      style={{
        borderColor: active ? "var(--v-accent)" : "var(--v-rule-strong)",
        backgroundColor: active ? "var(--v-accent-soft)" : "var(--v-surface)",
        color: active ? "var(--v-accent)" : "var(--v-ink)",
      }}
      className={cn(
        "pressable inline-flex min-h-11 items-center gap-1.5 rounded-[4px] border px-3 text-xs font-medium sm:min-h-8",
        !showLabel && "min-w-11 justify-center px-2 sm:min-w-8"
      )}
    >
      <Heart className={cn("size-3.5", active && "fill-current")} />
      {showLabel && <span>{active ? "Đã yêu thích" : "Yêu thích"}</span>}
    </button>
  );
}
