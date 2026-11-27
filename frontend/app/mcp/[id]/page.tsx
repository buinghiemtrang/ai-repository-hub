import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Calendar,
  FileJson,
  Globe,
  KeyRound,
  Library,
  Link2,
  Scale,
  ShieldAlert,
  Star,
  Terminal,
} from "lucide-react";
import { ClientConfigTabs } from "@/components/mcp/ClientConfigTabs";
import { RepoAvatar } from "@/components/repositories/RepoImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/skeleton";
import { type McpServerDetail, STATUS_LABELS, TRANSPORT_LABELS } from "@/lib/mcp/types";
import { formatCompactNumber, formatViDate } from "@/lib/repositories/types";

export const dynamic = "force-dynamic";

const SOURCE_LABELS: Record<string, string> = {
  "server.json": "server.json",
  readme: "README",
};

function splitName(fullName: string): { owner: string; name: string } {
  const idx = fullName.indexOf("/");
  return idx === -1 ? { owner: "", name: fullName } : { owner: fullName.slice(0, idx), name: fullName.slice(idx + 1) };
}

function SectionTitle({ icon: Icon, children }: { icon: typeof Terminal; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
      <Icon className="size-4.5 text-teal-700 dark:text-teal-400" />
      {children}
    </h2>
  );
}

export default async function McpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^\d{1,10}$/.test(id)) notFound();

  const res = await fetch(`${process.env.API_URL || "http://localhost:8000"}/mcp/servers/${id}`, { cache: "no-store" });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("API unavailable");

  const server: McpServerDetail = await res.json();
  const { owner, name } = splitName(server.full_name);
  const detected = server.status === "detected";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <div className="mb-6">
        <Link
          href="/mcp"
          className="pressable inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Quay lại danh mục MCP
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={detected ? "accent" : "secondary"}>{STATUS_LABELS[server.status]}</Badge>
              {server.transports.map((t) => (
                <Badge key={t} variant="outline">
                  <span className="font-mono">{TRANSPORT_LABELS[t]}</span>
                </Badge>
              ))}
              {server.requires_secret && (
                <Badge variant="warning">
                  <KeyRound className="size-3" />
                  Cần API key/token
                </Badge>
              )}
              {server.archived && (
                <Badge variant="warning">
                  <AlertTriangle className="size-3" />
                  Đã lưu trữ (Archived)
                </Badge>
              )}
            </div>

            <div className="mt-4 flex items-center gap-3">
              <RepoAvatar avatarUrl={server.owner_avatar_url} owner={owner} />
              <h1 className="min-w-0 text-2xl font-bold tracking-tight break-words sm:text-3xl">
                {owner && <span className="font-normal text-slate-400 dark:text-slate-500">{owner}/</span>}
                <span className="text-slate-900 dark:text-slate-50">{name}</span>
              </h1>
            </div>
            {server.server_name && (
              <p className="mt-2 font-mono text-xs text-slate-500 dark:text-slate-400">Tên server: {server.server_name}</p>
            )}
            <p className="mt-3 text-base leading-relaxed text-slate-700 dark:text-slate-300">{server.description_vi}</p>
            {server.description_upstream && (
              <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50/75 px-4 py-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Mô tả gốc trên GitHub: </span>
                {server.description_upstream}
              </div>
            )}
          </Card>

          {!detected && (
            <Card className="p-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {server.status === "pending"
                ? "Repository này chưa được trích xuất cấu hình MCP. Lịch đồng bộ MCP sẽ xử lý trong lần chạy tới."
                : "Không tìm thấy server.json hoặc khối cấu hình MCP chuẩn (mcpServers / claude mcp add) trong README gốc. Hãy đọc README trên GitHub để biết cách cài đặt."}{" "}
              <a href={`${server.url}#readme`} target="_blank" rel="noreferrer" className="font-medium text-teal-700 underline dark:text-teal-400">
                Mở README gốc
              </a>
            </Card>
          )}

          {server.client_configs.length > 0 && (
            <Card className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
                <SectionTitle icon={FileJson}>Mẫu cấu hình client</SectionTitle>
                <Badge variant="outline">Chỉ sao chép · Không tự chạy</Badge>
              </div>
              <Separator className="mb-5" />
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                <p>
                  Mẫu được sinh từ tài liệu gốc. Thay giá trị dạng <code className="font-mono">&lt;TÊN_BIẾN&gt;</code> bằng giá trị thật của bạn ngay trên máy mình.
                  Kiểm tra lệnh và quyền truy cập của server trước khi cài.
                </p>
              </div>
              <ClientConfigTabs configs={server.client_configs} />
            </Card>
          )}

          {(server.install_methods.length > 0 || server.remotes.length > 0) && (
            <Card className="p-6 sm:p-8">
              <SectionTitle icon={Terminal}>Cách chạy đã nhận diện</SectionTitle>
              <Separator className="my-4" />
              <ul className="space-y-3">
                {server.install_methods.map((m, idx) => (
                  <li key={`m-${idx}`} className="rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <Badge variant="secondary">stdio</Badge>
                      <Badge variant="outline">{m.kind}</Badge>
                      <span className="text-slate-400 dark:text-slate-500">nguồn: {SOURCE_LABELS[m.source] ?? m.source}</span>
                    </div>
                    <pre className="mt-2 overflow-x-auto rounded-lg bg-slate-950 px-3 py-2 font-mono text-xs leading-6 text-emerald-100">
                      <code>{[m.command, ...m.args].join(" ")}</code>
                    </pre>
                    {m.env.length > 0 && (
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Biến môi trường: <span className="font-mono">{m.env.join(", ")}</span>
                      </p>
                    )}
                  </li>
                ))}
                {server.remotes.map((r, idx) => (
                  <li key={`r-${idx}`} className="rounded-xl border border-slate-200/80 p-3.5 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <Badge variant="secondary">{r.transport}</Badge>
                      <Badge variant="outline">remote</Badge>
                      <span className="text-slate-400 dark:text-slate-500">nguồn: {SOURCE_LABELS[r.source] ?? r.source}</span>
                    </div>
                    <p className="mt-2 font-mono text-xs break-all text-slate-800 dark:text-slate-200">{r.url}</p>
                    {r.headers.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Header: <span className="font-mono">{r.headers.map((h) => h.name).join(", ")}</span>
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {server.env_vars.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-6 pb-4 sm:px-8">
                <SectionTitle icon={KeyRound}>Biến môi trường</SectionTitle>
                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  Hub chỉ lưu tên biến. Cột &quot;Bí mật&quot; lấy từ server.json nếu có, nếu không thì đoán theo tên biến (KEY, TOKEN, SECRET…).
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-y border-slate-200 bg-slate-50/80 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                    <tr>
                      <th className="px-6 py-2.5 font-medium sm:px-8">Tên</th>
                      <th className="px-4 py-2.5 font-medium">Bắt buộc</th>
                      <th className="px-4 py-2.5 font-medium">Bí mật</th>
                      <th className="px-4 py-2.5 font-medium">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {server.env_vars.map((v) => (
                      <tr key={v.name}>
                        <td className="px-6 py-2.5 font-mono text-xs font-semibold text-slate-800 sm:px-8 dark:text-slate-200">{v.name}</td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">
                          {v.required === null ? "—" : v.required ? "Có" : "Không"}
                        </td>
                        <td className="px-4 py-2.5 text-xs">
                          {v.is_secret ? <Badge variant="warning">Có</Badge> : <span className="text-slate-500 dark:text-slate-400">Không</span>}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 dark:text-slate-400">{v.description || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20">
          <Card className="space-y-3 p-5">
            <Button asChild variant="primary" className="w-full justify-between">
              <a href={server.url} target="_blank" rel="noreferrer">
                <span>Mở trên GitHub</span>
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <Link href={`/repositories/${server.repository_id}`}>
                <span className="inline-flex items-center gap-2">
                  <Library className="size-4 text-slate-500 dark:text-slate-400" />
                  Xem trong Thư viện
                </span>
                <ArrowUpRight className="size-3.5 text-slate-400" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-between">
              <a href={`${server.url}#readme`} target="_blank" rel="noreferrer">
                <span className="inline-flex items-center gap-2">
                  <BookOpen className="size-4 text-slate-500 dark:text-slate-400" />
                  Đọc README gốc
                </span>
                <ArrowUpRight className="size-3.5 text-slate-400" />
              </a>
            </Button>
            {server.homepage && (
              <Button asChild variant="outline" className="w-full justify-between">
                <a href={server.homepage} target="_blank" rel="noreferrer">
                  <span className="inline-flex items-center gap-2">
                    <Globe className="size-4 text-slate-500 dark:text-slate-400" />
                    Website dự án
                  </span>
                  <ArrowUpRight className="size-3.5 text-slate-400" />
                </a>
              </Button>
            )}
          </Card>

          <Card className="space-y-2 p-5 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5"><Star className="size-3.5 fill-amber-400 text-amber-500" />Stars</span>
              <span className="tabular-nums font-semibold text-slate-800 dark:text-slate-200">{formatCompactNumber(server.stars)}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5"><Scale className="size-3.5" />License</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{server.license || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>Ngôn ngữ</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{server.language || "—"}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
              <span className="inline-flex items-center gap-1.5"><Calendar className="size-3.5" />Trích xuất</span>
              <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">
                {formatViDate(server.extracted_at, "Chưa trích xuất")}
              </span>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              <Link2 className="size-3.5" />
              Nguồn đối chiếu
            </h3>
            {server.evidence_urls.length > 0 ? (
              <ul className="mt-2 space-y-1 text-xs">
                {server.evidence_urls.map((src) => (
                  <li key={src}>
                    <a href={src} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 break-all text-teal-700 hover:underline dark:text-teal-400">
                      <span>{src}</span>
                      <ArrowUpRight className="mt-0.5 size-3 shrink-0" />
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Chưa có nguồn cấu hình nào được nhận diện.</p>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
