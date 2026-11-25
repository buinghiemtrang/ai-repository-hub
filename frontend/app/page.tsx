import { Suspense } from "react";
import { RepositoryLibrary } from "@/components/repositories/RepositoryLibrary";
import type { CatalogStats, RepoPage } from "@/lib/repositories/types";

export const dynamic = "force-dynamic";

async function loadInitialCatalog(): Promise<{
  stats: CatalogStats | null;
  pageData: RepoPage | null;
}> {
  const api = process.env.API_URL || "http://localhost:8000";
  try {
    const [statsRes, pageRes] = await Promise.all([
      fetch(`${api}/repositories/stats`, { cache: "no-store" }),
      fetch(`${api}/repositories?sort=stars&page=1`, { cache: "no-store" }),
    ]);
    const stats = statsRes.ok ? ((await statsRes.json()) as CatalogStats) : null;
    const pageData = pageRes.ok ? ((await pageRes.json()) as RepoPage) : null;
    return { stats, pageData };
  } catch {
    return { stats: null, pageData: null };
  }
}

export default async function HomePage() {
  const { stats, pageData } = await loadInitialCatalog();

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-8 text-sm text-[var(--v-muted)] sm:px-6">
          Đang tải thư viện repository…
        </div>
      }
    >
      <RepositoryLibrary
        initialStats={stats}
        initialData={pageData}
        initialTopRepos={pageData?.items || []}
      />
    </Suspense>
  );
}
