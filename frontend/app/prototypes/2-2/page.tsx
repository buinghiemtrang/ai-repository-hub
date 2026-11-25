"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { RepoQuickPeek22 } from "@/components/prototypes/vellum22/RepoQuickPeek22";
import { VellumHeader22, type VellumTab22 } from "@/components/prototypes/vellum22/VellumHeader22";
import { VellumLibraryView22 } from "@/components/prototypes/vellum22/VellumLibraryView22";
import { VellumNewsView22 } from "@/components/prototypes/vellum22/VellumNewsView22";
import { VellumStudioView22 } from "@/components/prototypes/vellum22/VellumStudioView22";
import { VELLUM_DARK, VELLUM_EASE, VELLUM_LIGHT } from "@/components/prototypes/vellum/tokens";
import { loadFavorites, toggleFavoriteId } from "@/lib/repositories/favorites";
import type { CatalogStats, RepoItem } from "@/lib/repositories/types";

export default function PrototypeTwoTwoPage() {
  const [dark, setDark] = useState(false);
  const [tab, setTab] = useState<VellumTab22>("repos");
  const [studioTool, setStudioTool] = useState<string>("video");
  const [libFilterQ, setLibFilterQ] = useState<string>("");
  const [libFilterCategory, setLibFilterCategory] = useState<string>("");
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [searchFocusTick, setSearchFocusTick] = useState(0);

  // Signature Interaction: Specimen Folio Quick Preview
  const [peekRepo, setPeekRepo] = useState<RepoItem | null>(null);
  const [peekList, setPeekList] = useState<RepoItem[]>([]);

  useEffect(() => {
    setFavorites(loadFavorites());
    try {
      const savedDark = localStorage.getItem("aihub_p22_dark");
      if (savedDark === "1") setDark(true);
    } catch {
      // ignore
    }
    fetch("/api/repositories/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
  }, []);

  // Global `/` shortcut to focus search in Repository view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (document.activeElement?.tagName || "").toLowerCase();
        if (tag !== "input" && tag !== "textarea" && tag !== "select") {
          e.preventDefault();
          setTab("repos");
          setSearchFocusTick((t) => t + 1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleDark = () => {
    setDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("aihub_p22_dark", next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleToggleFavorite = (id: number) => {
    setFavorites((prev) => toggleFavoriteId(prev, id));
  };

  const handleOpenRepoById = async (repoId: number) => {
    try {
      const res = await fetch(`/api/repositories/${repoId}`);
      if (!res.ok) return;
      const item: RepoItem = await res.json();
      setPeekRepo(item);
      setPeekList([item]);
    } catch {
      // ignore
    }
  };

  const theme = dark ? VELLUM_DARK : VELLUM_LIGHT;
  const peekIndex = peekRepo ? peekList.findIndex((r) => r.id === peekRepo.id) : -1;

  return (
    <MotionConfig reducedMotion="user">
      <div
        style={{
          backgroundColor: theme.bg,
          color: theme.ink,
          fontFamily: "var(--font-hanken), system-ui, sans-serif",
        }}
        className="flex min-h-screen flex-col transition-colors duration-200"
      >
        <VellumHeader22
          theme={theme}
          dark={dark}
          tab={tab}
          favoritesCount={favorites.length}
          onlyFavorites={onlyFavorites}
          onTabChange={setTab}
          onToggleDark={toggleDark}
          onFocusSearch={() => {
            setTab("repos");
            setSearchFocusTick((t) => t + 1);
          }}
          onToggleFavorites={() => setOnlyFavorites((v) => !v)}
          onOpenStudioTool={(toolKey) => {
            setStudioTool(toolKey);
            setTab("studio");
          }}
        />

        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2, ease: VELLUM_EASE }}
            >
              {tab === "repos" && (
                <VellumLibraryView22
                  theme={theme}
                  dark={dark}
                  stats={stats}
                  favorites={favorites}
                  onlyFavorites={onlyFavorites}
                  initialQ={libFilterQ}
                  initialCategory={libFilterCategory}
                  onToggleFavorite={handleToggleFavorite}
                  onResetOnlyFavorites={() => setOnlyFavorites(false)}
                  onOpenQuickPeek={(repo, list) => {
                    setPeekRepo(repo);
                    setPeekList(list);
                  }}
                  externalSearchFocusTick={searchFocusTick}
                />
              )}
              {tab === "news" && (
                <VellumNewsView22
                  theme={theme}
                  dark={dark}
                  onOpenRepoById={handleOpenRepoById}
                />
              )}
              {tab === "studio" && (
                <VellumStudioView22
                  theme={theme}
                  dark={dark}
                  initialTool={studioTool}
                  onExploreRepos={({ q, category }) => {
                    setLibFilterQ(q || "");
                    setLibFilterCategory(category || "");
                    setTab("repos");
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer style={{ borderColor: theme.rule, color: theme.muted }} className="border-t py-5 text-xs">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 sm:px-6">
            <span>AI Repo Hub · Prototype P2.2 (Vellum Digital Polish) · Dữ liệu thật từ PostgreSQL</span>
            <span>Logos &amp; icons: CC0/MIT via Taste Skill · Không tự động thực thi mã nguồn tải về</span>
          </div>
        </footer>

        <RepoQuickPeek22
          repo={peekRepo}
          theme={theme}
          dark={dark}
          isFavorite={peekRepo ? favorites.includes(peekRepo.id) : false}
          hasPrev={peekIndex > 0}
          hasNext={peekIndex >= 0 && peekIndex < peekList.length - 1}
          positionLabel={peekIndex >= 0 && peekList.length > 1 ? `${peekIndex + 1}/${peekList.length}` : undefined}
          onClose={() => setPeekRepo(null)}
          onPrev={() => peekIndex > 0 && setPeekRepo(peekList[peekIndex - 1])}
          onNext={() => peekIndex >= 0 && peekIndex < peekList.length - 1 && setPeekRepo(peekList[peekIndex + 1])}
          onToggleFavorite={handleToggleFavorite}
        />
      </div>
    </MotionConfig>
  );
}
