import { Suspense } from "react";
import { NewsFeedWorkspace } from "@/components/news/NewsFeedWorkspace";

export const metadata = {
  title: "Tin tức AI & Repo — AI Repository Hub",
  description:
    "Bản tin AI, bảo mật và mục Repo nổi bật tổng hợp độc lập theo ngày và tuần, hỗ trợ tìm kiếm tiếng Việt không dấu và trình đọc Podcast.",
};

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">Đang tải bản tin…</div>}>
      <NewsFeedWorkspace />
    </Suspense>
  );
}
