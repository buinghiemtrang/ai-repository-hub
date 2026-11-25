import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";

const geist = Geist({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-geist-mono", display: "swap" });

export default function PrototypeOneLayout({ children }: { children: ReactNode }) {
  return <div className={`${geist.variable} ${geistMono.variable} min-h-screen`}>{children}</div>;
}
