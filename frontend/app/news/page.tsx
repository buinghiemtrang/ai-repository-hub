import { Suspense } from "react";
import { NewsFeedWorkspace } from "@/components/news/NewsFeedWorkspace";
import type { NewsFeedPayload } from "@/lib/news/types";

export const dynamic = "force-dynamic";

async function loadInitialFeed(): Promise<NewsFeedPayload | null> {
  const apiBase = process.env.API_URL || "http://localhost:8000";
  try {
    const res = await fetch(`${apiBase}/news/feed?days_limit=90`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as NewsFeedPayload;
  } catch {
    return null;
  }
}

export default async function NewsPage() {
  const initialFeed = await loadInitialFeed();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-6 px-3 py-6 sm:px-6 lg:py-8">
          <div className="h-28 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)]" />
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="h-80 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)] lg:col-span-9" />
            <div className="h-80 animate-pulse rounded-[6px] bg-[var(--v-surface-alt)] lg:col-span-3" />
          </div>
        </div>
      }
    >
      <NewsFeedWorkspace initialFeed={initialFeed} />
    </Suspense>
  );
}
