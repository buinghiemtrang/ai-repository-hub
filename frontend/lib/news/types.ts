export interface NewsSectionMeta {
  name: string;
  short: string;
  color: string;
}

export interface NewsSourceLink {
  name: string;
  url: string;
}

export interface NewsVideo {
  url?: string;
  embed?: string;
  poster?: string;
  aspect?: "16:9" | "9:16" | "1:1" | string;
}

export interface NewsItem {
  id: string;
  db_id?: number;
  date: string;
  section: string;
  batch: "morning" | "noon" | string;
  tip: boolean;
  picked: boolean;
  title: string;
  summary: string;
  excerpt: string | null;
  full_text: string | null;
  speech_text: string;
  source: string;
  source_label: string;
  author: string | null;
  url: string | null;
  time: string | null;
  time_estimated: boolean;
  tags: string[];
  images: string[];
  video: NewsVideo | null;
  sources: NewsSourceLink[];
  confidence: string | null;
  repository_id: number | null;
}

export interface NewsDay {
  date: string;
  intro: string | null;
  count: number;
  noon_count: number;
  tips: number;
  important: number;
  heads: string[];
  items: NewsItem[];
}

export interface WeeklyDigestItem {
  id: string;
  why: string[];
}

export interface WeeklyDigest {
  week_start: string;
  week_end: string;
  title: string;
  intro: string;
  items: WeeklyDigestItem[];
}

export interface NewsFeedPayload {
  generated: string;
  sections: NewsSectionMeta[];
  days: NewsDay[];
  weekly: WeeklyDigest[];
  section_counts?: Record<string, number>;
  stats: {
    total_days: number;
    total_items: number;
    all_items?: number;
    repo_items: number;
  };
}

export const IMPORTANT_TAG = "Tin quan trọng";
export const SECURITY_TAG = "Bảo mật";
export const REPO_TAG = "Repo nổi bật";

export function normalizeVi(input: string): string {
  return (input || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();
}

const WEEKDAYS_VI = [
  "Chủ nhật",
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
];

export function formatNewsDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-");
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export function formatNewsWeekday(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return "";
  return WEEKDAYS_VI[new Date(y, m - 1, d).getDay()] || "";
}

export function urlHost(url: string | null | undefined): string {
  if (!url) return "";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function detectSourceKind(item: NewsItem): string {
  if (item.tip) return "Mẹo";
  const hay = `${urlHost(item.url)} ${normalizeVi(item.source)}`;
  if (/github|thu vien repo|ai repo hub/.test(hay)) return "GitHub";
  if (/facebook|fb\.watch/.test(hay)) return "Facebook";
  if (/(^|\s|\.)x\.com|twitter/.test(hay)) return "X";
  if (/reddit/.test(hay)) return "Reddit";
  if (/youtube|youtu\.be/.test(hay)) return "YouTube";
  return "Web / blog";
}
