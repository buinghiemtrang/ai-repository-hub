"use client";

import { useEffect, useState } from "react";
import type { NewsFeedPayload } from "@/lib/news/types";
import type { CatalogStats, RepoItem, RepoPage } from "@/lib/repositories/types";

export interface PrototypeData {
  repos: RepoItem[];
  totalRepos: number;
  stats: CatalogStats | null;
  news: NewsFeedPayload | null;
  loading: boolean;
  q: string;
  setQ: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  language: string;
  setLanguage: (v: string) => void;
}

export function usePrototypeData(): PrototypeData {
  const [repos, setRepos] = useState<RepoItem[]>([]);
  const [totalRepos, setTotalRepos] = useState(0);
  const [stats, setStats] = useState<CatalogStats | null>(null);
  const [news, setNews] = useState<NewsFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [language, setLanguage] = useState("");

  useEffect(() => {
    fetch("/api/repositories/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setStats(d))
      .catch(() => {});
    fetch("/api/news/feed?days_limit=5")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setNews(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ q, category, language, sort: "stars", page: "1" });
    const t = setTimeout(() => {
      fetch(`/api/repositories?${params}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject()))
        .then((d: RepoPage) => {
          setRepos(d.items);
          setTotalRepos(d.total);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 150);
    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [q, category, language]);

  return { repos, totalRepos, stats, news, loading, q, setQ, category, setCategory, language, setLanguage };
}
