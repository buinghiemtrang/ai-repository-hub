import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

const DIRECTIONS = [
  {
    id: "2-2-1",
    name: "Phương án P2.2.1 · Release Candidate",
    subtitle: "Sửa React #310 triệt để, nhãn kết quả tin tức rõ ràng, Touch Targets 44px mobile, Markdown Folio an toàn & Dark Contrast AA",
    href: "/prototypes/2-2-1",
    typography: "Newsreader Serif + Hanken Grotesk + JetBrains Mono",
    palette: "Warm Paper #F5F2EB / Obsidian #131110 · Dark Muted #B8B0A4 (AA Verified)",
    layout: "Giữ nguyên bố cục Vellum P2.2 đã chốt — tinh chỉnh độ ổn định & UX",
    bestFor: "Ứng viên Release Candidate sẵn sàng nghiệm thu Vellum Design System 1.0.",
    bg: "#f5f2eb",
    ink: "#171614",
    accent: "#c03a17",
    recommended: true,
  },
  {
    id: "2-2",
    name: "Phương án P2.2 · Vellum Digital Polish",
    subtitle: "Giữ nguyên bản P2.2 để đối chiếu trực tiếp Before / After với P2.2.1",
    href: "/prototypes/2-2",
    typography: "Newsreader Serif + Hanken Grotesk + JetBrains Mono",
    palette: "Warm Paper #F7F4ED (Light) / Obsidian #131110 (Dark) · Accent: Vermilion #C84B24",
    layout: "Compact Spotlight + Top 5 Stars + Inline Collections + Grid/List + Folio & Article Drawers",
    bestFor: "Mốc trước sửa lỗi để đối chiếu trực tiếp với bản P2.2.1 RC.",
    bg: "#f7f4ed",
    ink: "#1b1917",
    accent: "#c84b24",
    recommended: false,
  },
  {
    id: "2-1",
    name: "Phương án P2.1 · Vellum Digital Editorial",
    subtitle: "Giữ nguyên bản trước đó để đối chiếu trực tiếp Before / After với P2.2",
    href: "/prototypes/2-1",
    typography: "Newsreader Serif + Hanken Grotesk + JetBrains Mono",
    palette: "Warm Paper #F7F4ED (Light) / Obsidian #131110 (Dark) · Accent: Vermilion #C84B24",
    layout: "Press Masthead + Spotlight + Editorial Collections + Visual Grid / List + Quick-Peek Folio",
    bestFor: "Mốc nền được bạn đồng ý tiếp tục phát triển; dùng để đối chiếu trước khi tinh chỉnh P2.2.",
    bg: "#f5f2eb",
    ink: "#171614",
    accent: "#c03a17",
    recommended: false,
  },
  {
    id: "2",
    name: "Phương án 2 · Vellum Editorial (Gốc)",
    subtitle: "Curated Technology Magazine (bản đầu để đối chiếu)",
    href: "/prototypes/2",
    typography: "Newsreader Serif + Hanken Grotesk + JetBrains Mono",
    palette: "Warm Newsprint #F4F1EA (Light) / Espresso #141210 (Dark) · Accent: Vermilion #B93815",
    layout: "Editorial Masthead + Asymmetric 7/5 Spotlight + Ranked Index",
    bestFor: "Giữ nguyên để so sánh trực tiếp trước/sau với P2.1.",
    bg: "#f4f1ea",
    ink: "#181715",
    accent: "#b93815",
    recommended: false,
  },
  {
    id: "1",
    name: "Phương án 1 · Obsidian Ledger",
    subtitle: "Precision Engineering Workspace (cảm hứng Linear / Vercel)",
    href: "/prototypes/1",
    typography: "Geist + Geist Mono",
    palette: "Carbon #0C0C0D (Dark) / Cool Sheet #FAFAFA (Light) · Accent: Cobalt #3B82F6",
    layout: "Slim Icon Rail (52px) + Command Topbar + Split-pane Ledger & Live Inspector",
    bestFor: "Tra cứu hàng trăm repo tốc độ cao, phím tắt, thao tác bàn phím.",
    bg: "#0c0c0d",
    ink: "#ededec",
    accent: "#3b82f6",
    recommended: false,
  },
  {
    id: "3",
    name: "Phương án 3 · Atelier Canvas",
    subtitle: "Modular Tactile Studio (cảm hứng Raycast / Teenage Engineering)",
    href: "/prototypes/3",
    typography: "Bricolage Grotesque + IBM Plex Sans + IBM Plex Mono",
    palette: "Cool Stone #EEEFF1 (Light) / Graphite #18191B (Dark) · Accent: Safety Orange #E8481C",
    layout: "44px Workspace Ribbon + Contextual Filter Rail (228px) + Architectural 1px Bento Grid",
    bestFor: "Cấu trúc module kỹ thuật 1px sắc cạnh.",
    bg: "#eeeff1",
    ink: "#111317",
    accent: "#e8481c",
    recommended: false,
  },
];

export default function PrototypesIndexPage() {
  return (
    <div className="min-h-screen bg-[#f5f4f0] px-6 py-12 text-[#181715]">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-widest text-black/50">
              Phase 2 → P2.1 → P2.2 · Art Direction Comparison
            </div>
            <h1 className="text-3xl font-medium tracking-tight">
              AI Repo Hub — So sánh P2.2 &amp; các Phương án P1 / P2 / P2.1 / P3
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-black/65">
              Bản <strong>P2.2 (Vellum Digital Polish)</strong> giữ nguyên bản sắc P2.1 và hoàn thiện trải nghiệm: đếm số lượng tin theo từng chuyên mục chuẩn xác, thay đúng logo thương hiệu/icon chuyên mục, đưa lưới Repo lên sớm hơn trên màn hình, bổ sung Folio Reader cho Tin tức và Workflow Diagram trong Xưởng AI.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-3.5 py-2 text-xs font-medium text-black hover:bg-black/5"
          >
            <ArrowLeft className="size-3.5" />
            Quay về bản chính thức
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DIRECTIONS.map((d) => (
            <div
              key={d.id}
              className={`flex flex-col justify-between rounded-lg border bg-white p-5 ${
                d.recommended ? "border-[#c03a17] ring-2 ring-[#c03a17]/20" : "border-black/12"
              }`}
            >
              <div className="space-y-4">
                <div
                  className="flex h-24 items-end justify-between rounded border border-black/10 p-4"
                  style={{ backgroundColor: d.bg, color: d.ink }}
                >
                  <span className="text-sm font-medium">{d.name}</span>
                  <span
                    className="size-4 shrink-0 rounded-sm"
                    style={{ backgroundColor: d.accent }}
                    title={`Accent ${d.accent}`}
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-base font-medium">{d.name}</h2>
                    {d.recommended && (
                      <span className="shrink-0 rounded bg-[#c03a17] px-2 py-0.5 text-[10px] font-medium text-white">
                        Mới
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-black/60">{d.subtitle}</p>
                </div>
                <dl className="space-y-2 border-t border-black/10 pt-3 text-xs">
                  <div>
                    <dt className="font-medium text-black/50">Bố cục &amp; Điều hướng</dt>
                    <dd className="mt-0.5 text-black/85">{d.layout}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Typography (Full TV)</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-black/85">{d.typography}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Bảng màu</dt>
                    <dd className="mt-0.5 text-black/85">{d.palette}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Ghi chú</dt>
                    <dd className="mt-0.5 text-black/85">{d.bestFor}</dd>
                  </div>
                </dl>
              </div>

              <Link
                href={d.href}
                className="mt-5 inline-flex items-center justify-between rounded border px-4 py-2.5 text-xs font-medium text-white transition-colors hover:opacity-90"
                style={{
                  backgroundColor: d.recommended ? "#c03a17" : "#181715",
                  borderColor: d.recommended ? "#c03a17" : "#181715",
                }}
              >
                <span>
                  Mở {d.id === "2-2-1" ? "P2.2.1 RC" : d.id === "2-2" ? "P2.2" : d.id === "2-1" ? "P2.1" : `P${d.id}`} trực tiếp
                </span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
