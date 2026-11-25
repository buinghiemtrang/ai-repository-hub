"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-[6px] border border-[var(--v-rule)] bg-[var(--v-surface)] p-8 text-center">
        <div className="font-telemetry text-[11px] uppercase tracking-widest text-[var(--v-accent)]">
          Folio Error
        </div>
        <h1 className="font-editorial mt-2 text-2xl font-medium text-[var(--v-ink)]">
          Không tải được chi tiết repository
        </h1>
        <p className="mt-2 text-sm text-[var(--v-muted)]">
          Không kết nối được tới API backend. Hãy kiểm tra Docker Compose và thử lại.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-[4px] border border-[var(--v-rule-strong)] bg-[var(--v-bg)] px-4 py-2 text-xs font-medium text-[var(--v-ink)] transition-colors hover:opacity-85 sm:min-h-0"
          >
            <ArrowLeft className="size-3.5" />
            Thư viện
          </Link>
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center gap-2 rounded-[4px] bg-[var(--v-accent)] px-4 py-2 text-xs font-medium text-[var(--v-accent-ink)] transition-opacity hover:opacity-90 sm:min-h-0"
          >
            <RotateCcw className="size-3.5" />
            Thử lại
          </button>
        </div>
      </div>
    </div>
  );
}
