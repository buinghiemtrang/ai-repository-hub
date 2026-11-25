export type RepoItem = {
  id: number;
  full_name: string;
  github_id: number | null;
  category: string;
  description_vi: string;
  description_upstream: string | null;
  homepage: string | null;
  topics: string[];
  language: string | null;
  default_branch: string | null;
  archived: boolean;
  stars: number | null;
  forks: number | null;
  watchers: number | null;
  updated_at: string | null;
  synced_at: string | null;
  discovered_at: string | null;
  license: string | null;
  source_urls: string[] | null;
  url: string;
  readme_url: string;
  guide_vi?: string | null;
};

export type RepoPage = {
  items: RepoItem[];
  total: number;
  page: number;
  page_size: number;
};

export type CountEntry = {
  name: string;
  count: number;
};

export type CatalogStats = {
  total: number;
  categories: CountEntry[];
  languages: CountEntry[];
  last_synced_at: string | null;
};

export type SyncRunEntry = {
  id: number;
  trigger: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  total_repos: number;
  synced_count: number;
  failed_count: number;
  rate_limited: boolean;
  error_summary: string | null;
};

export type SyncStatusResponse = {
  scheduler: {
    enabled: boolean;
    interval_hours: number;
    min_age_hours: number;
    batch_limit: number;
    has_github_token: boolean;
  };
  recent_runs: SyncRunEntry[];
};

export function formatCompactNumber(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export function formatViDate(value: string | null, fallback = "Chưa xác minh"): string {
  if (!value) return fallback;
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
}
