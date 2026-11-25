"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadFavorites, toggleFavoriteId } from "@/lib/repositories/favorites";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  repoId,
  showLabel = false,
}: {
  repoId: number;
  showLabel?: boolean;
}) {
  const [favorites, setFavorites] = useState<number[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
  }, []);

  const active = favorites.includes(repoId);

  return (
    <Button
      type="button"
      variant="outline"
      size={showLabel ? "default" : "sm"}
      aria-label={active ? "Bỏ yêu thích" : "Thêm vào yêu thích"}
      aria-pressed={active}
      onClick={() => setFavorites((prev) => toggleFavoriteId(prev, repoId))}
      className={cn(
        active
          ? "border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-500/35 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
          : "border-slate-200 bg-white text-slate-600 hover:text-rose-600 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-rose-400",
        !showLabel && "h-8 px-2.5"
      )}
    >
      <Heart className={cn("size-4", active && "fill-rose-500 text-rose-500")} />
      {showLabel && <span>{active ? "Đã yêu thích" : "Yêu thích"}</span>}
    </Button>
  );
}
