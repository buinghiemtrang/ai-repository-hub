import "./globals.css";
import type { ReactNode } from "react";
export const metadata = {title:"AI Repository Hub",description:"Thư viện dự án AI"};
export default function Layout({children}:{children:ReactNode}) {
  return <html lang="vi"><body><header className="border-b border-neutral-200 bg-white"><div className="mx-auto max-w-6xl px-5 py-4 font-semibold"><a href="/">AI Hub</a><span className="ml-4 text-sm font-normal text-neutral-500">Repository Library</span></div></header>{children}</body></html>;
}
