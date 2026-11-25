"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Không tải được chi tiết repository</h1>
        <p className="mt-2 text-sm text-slate-600">
          Không kết nối được tới API backend. Hãy kiểm tra Docker Compose và thử lại.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeft className="size-4" />
              Thư viện
            </Link>
          </Button>
          <Button type="button" variant="primary" onClick={reset}>
            <RotateCcw className="size-4" />
            Thử lại
          </Button>
        </div>
      </Card>
    </div>
  );
}
