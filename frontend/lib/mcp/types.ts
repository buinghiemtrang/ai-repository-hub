export type McpTransport = "stdio" | "http" | "sse";
export type McpStatus = "detected" | "no_config_found" | "pending";

export type McpEnvVar = {
  name: string;
  description: string | null;
  required: boolean | null;
  is_secret: boolean;
  source: string;
};

export type McpInstallMethod = {
  kind: string;
  transport: "stdio";
  command: string;
  args: string[];
  package: string | null;
  env: string[];
  source: string;
};

export type McpRemote = {
  transport: "http" | "sse";
  url: string;
  headers: { name: string; description: string | null; is_secret: boolean }[];
  source: string;
};

export type McpClientConfig = {
  client: "claude_desktop" | "claude_code" | "cursor";
  label: string;
  format: "json" | "shell" | "text";
  path_hint: string;
  content: string;
  note: string | null;
};

export type McpServerItem = {
  repository_id: number;
  full_name: string;
  description_vi: string;
  description_upstream: string | null;
  language: string | null;
  license: string | null;
  stars: number | null;
  archived: boolean;
  owner_avatar_url: string | null;
  updated_at: string | null;
  url: string;
  status: McpStatus;
  server_name: string | null;
  transports: McpTransport[];
  requires_secret: boolean;
  env_count: number;
  sources: string[];
  extracted_at: string | null;
};

export type McpServerDetail = McpServerItem & {
  homepage: string | null;
  topics: string[];
  default_branch: string | null;
  install_methods: McpInstallMethod[];
  remotes: McpRemote[];
  env_vars: McpEnvVar[];
  evidence_urls: string[];
  client_configs: McpClientConfig[];
};

export type McpServerPage = {
  items: McpServerItem[];
  total: number;
  page: number;
  page_size: number;
};

export type McpStats = {
  total: number;
  detected: number;
  no_config_found: number;
  pending: number;
  requires_secret: number;
  transports: { name: McpTransport; count: number }[];
  languages: { name: string; count: number }[];
  categories: string[];
  last_extracted_at: string | null;
};

export type McpSyncStatus = {
  scheduler: {
    enabled: boolean;
    interval_hours: number;
    min_age_hours: number;
    batch_limit: number;
    has_github_token: boolean;
  };
  recent_runs: {
    id: number;
    trigger: string;
    status: string;
    started_at: string;
    finished_at: string | null;
    total_repos: number;
    detected_count: number;
    failed_count: number;
    rate_limited: boolean;
    error_summary: string | null;
  }[];
};

export const TRANSPORT_LABELS: Record<McpTransport, string> = {
  stdio: "stdio (chạy cục bộ)",
  http: "HTTP (từ xa)",
  sse: "SSE (từ xa)",
};

export const STATUS_LABELS: Record<McpStatus, string> = {
  detected: "Đã nhận diện cấu hình",
  no_config_found: "Chưa thấy cấu hình",
  pending: "Chờ trích xuất",
};
