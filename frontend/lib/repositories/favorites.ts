export const FAVORITES_STORAGE_KEY = "repo-favorites";
const MAX_FAVORITES = 500;

export function loadFavorites(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((x) => Number.isInteger(x) && x > 0).slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function saveFavorites(ids: number[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_FAVORITES)));
  } catch {
    // Ignore storage quota errors in private browsing.
  }
}

export function toggleFavoriteId(current: number[], id: number): number[] {
  if (current.includes(id)) {
    const next = current.filter((x) => x !== id);
    saveFavorites(next);
    return next;
  }
  if (current.length >= MAX_FAVORITES) return current;
  const next = [...current, id];
  saveFavorites(next);
  return next;
}
