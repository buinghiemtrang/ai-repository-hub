import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";

const DIRECTIONS = [
  {
    id: "1",
    name: "Phương án 1 · Obsidian Ledger",
    subtitle: "Precision Engineering Workspace (cảm hứng Linear / Vercel)",
    href: "/prototypes/1",
    typography: "Geist + Geist Mono",
    palette: "Carbon #0C0C0D (Dark) / Cool Sheet #FAFAFA (Light) · Accent: Cobalt #3B82F6",
    layout: "Slim Icon Rail (56px) + Command Topbar + Split-pane Ledger & Live Inspector",
    bestFor: "Tra cứu hàng trăm repo tốc độ cao, phím tắt, thao tác bàn phím & inspector liền mạch.",
    bg: "#0c0c0d",
    ink: "#ededec",
    accent: "#3b82f6",
  },
  {
    id: "2",
    name: "Phương án 2 · Vellum Editorial",
    subtitle: "Curated Technology Magazine (cảm hứng The Verge / Are.na)",
    href: "/prototypes/2",
    typography: "Newsreader Serif + Hanken Grotesk + JetBrains Mono",
    palette: "Warm Newsprint #F4F1EA (Light) / Espresso #141210 (Dark) · Accent: Vermilion #C2410C",
    layout: "Editorial Masthead (không sidebar trái) + Asymmetric 7/5 Spotlight + Ranked Index",
    bestFor: "Trải nghiệm đọc tạp chí, làm nổi bật tin tức AI & tuyển chọn repo có chiều sâu biên tập.",
    bg: "#f4f1ea",
    ink: "#181715",
    accent: "#c2410c",
  },
  {
    id: "3",
    name: "Phương án 3 · Atelier Canvas",
    subtitle: "Modular Tactile Studio (cảm hứng Raycast / Teenage Engineering)",
    href: "/prototypes/3",
    typography: "Bricolage Grotesque + IBM Plex Sans + IBM Plex Mono",
    palette: "Cool Stone #EEEFF1 (Light) / Graphite #18191B (Dark) · Accent: Safety Orange #E8481C",
    layout: "44px Workspace Ribbon + Contextual Filter Rail (220px) + Architectural 1px Bento Grid",
    bestFor: "Cân bằng giữa tra cứu Repo, đọc Tin tức và mở rộng tự nhiên các công cụ AI Studio (Video/Ảnh/Flows).",
    bg: "#eeeff1",
    ink: "#111317",
    accent: "#e8481c",
  },
];

export default function PrototypesIndexPage() {
  return (
    <div className="min-h-screen bg-[#f5f4f0] px-6 py-12 text-[#181715]">
      <div className="mx-auto max-w-6xl space-y-10">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div className="space-y-2">
            <div className="text-xs font-medium uppercase tracking-widest text-black/50">
              Phase 2 · Art Direction Comparison
            </div>
            <h1 className="text-3xl font-medium tracking-tight">
              AI Repo Hub — 3 Hướng Thiết Kế Độc Lập
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-black/65">
              Cả 3 bản prototype dưới đây đều dùng dữ liệu repository và tin tức thật từ PostgreSQL, cho phép bạn chuyển Dark/Light, thử tìm kiếm, lọc và chuyển tab giữa Repo, Tin tức và AI Studio.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-black/15 bg-white px-3.5 py-2 text-xs font-medium text-black hover:bg-black/5"
          >
            <ArrowLeft className="size-3.5" />
            Quay về bản hiện tại
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {DIRECTIONS.map((d) => (
            <div
              key={d.id}
              className="flex flex-col justify-between rounded-lg border border-black/12 bg-white p-6"
            >
              <div className="space-y-4">
                <div
                  className="flex h-24 items-end justify-between rounded border border-black/10 p-4"
                  style={{ backgroundColor: d.bg, color: d.ink }}
                >
                  <span className="text-sm font-medium">{d.name}</span>
                  <span
                    className="size-4 rounded-sm"
                    style={{ backgroundColor: d.accent }}
                    title={`Accent ${d.accent}`}
                  />
                </div>
                <div>
                  <h2 className="text-lg font-medium">{d.name}</h2>
                  <p className="mt-0.5 text-xs text-black/60">{d.subtitle}</p>
                </div>
                <dl className="space-y-2.5 border-t border-black/10 pt-4 text-xs">
                  <div>
                    <dt className="font-medium text-black/50">Bố cục & Điều hướng</dt>
                    <dd className="mt-0.5 text-black/85">{d.layout}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Typography (Full Tiếng Việt)</dt>
                    <dd className="mt-0.5 font-mono text-[11px] text-black/85">{d.typography}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Bảng màu</dt>
                    <dd className="mt-0.5 text-black/85">{d.palette}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-black/50">Điểm mạnh</dt>
                    <dd className="mt-0.5 text-black/85">{d.bestFor}</dd>
                  </div>
                </dl>
              </div>

              <Link
                href={d.href}
                className="mt-6 inline-flex items-center justify-between rounded border border-black bg-[#181715] px-4 py-2.5 text-xs font-medium text-white transition-colors hover:bg-black/85"
              >
                <span>Mở Prototype {d.id} trực tiếp</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
