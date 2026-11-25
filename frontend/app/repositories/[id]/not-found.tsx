import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Không tìm thấy repository
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Mục này không tồn tại trong cơ sở dữ liệu hoặc mã định danh không hợp lệ.
        </p>
        <Button asChild variant="outline" className="mt-5">
          <Link href="/">
            <ArrowLeft className="size-4" />
            Quay lại Thư viện
          </Link>
        </Button>
      </Card>
    </div>
  );
}
