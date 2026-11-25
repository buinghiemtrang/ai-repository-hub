import type { ReactNode } from "react";
import { Bricolage_Grotesque, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";

const bricolage = Bricolage_Grotesque({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-bricolage", display: "swap" });
const ibmSans = IBM_Plex_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-ibm-sans", display: "swap" });
const ibmMono = IBM_Plex_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-ibm-mono", display: "swap" });

export default function PrototypeThreeLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${bricolage.variable} ${ibmSans.variable} ${ibmMono.variable} min-h-screen`}>
      {children}
    </div>
  );
}
