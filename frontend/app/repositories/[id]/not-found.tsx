import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-8 text-center">
        <div className="font-telemetry text-[11px] uppercase tracking-widest text-[var(--v-accent)]">
          404 · Folio Not Found
        </div>
        <h1 className="font-editorial mt-2 text-2xl font-medium text-[var(--v-ink)]">
          Không tìm thấy repository
        </h1>
        <p className="mt-2 text-sm text-[var(--v-muted)]">
          Mục này không tồn tại trong cơ sở dữ liệu hoặc mã định danh không hợp lệ.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-bg)] px-4 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0"
        >
          <ArrowLeft className="size-3.5" />
          Quay lại Thư viện
        </Link>
      </div>
    </div>
  );
}
