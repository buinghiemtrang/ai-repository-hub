import type { ReactNode } from "react";
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  Hanken_Grotesk,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  JetBrains_Mono,
  Newsreader,
} from "next/font/google";

const geist = Geist({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-geist-mono" });
const newsreader = Newsreader({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-newsreader" });
const hanken = Hanken_Grotesk({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-hanken" });
const bricolage = Bricolage_Grotesque({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-bricolage" });
const ibmSans = IBM_Plex_Sans({ subsets: ["latin", "vietnamese"], weight: ["400", "500", "600"], variable: "--font-ibm-sans" });
const ibmMono = IBM_Plex_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-ibm-mono" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin", "vietnamese"], weight: ["400", "500"], variable: "--font-jetbrains" });

export default function PrototypesLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${geist.variable} ${geistMono.variable} ${newsreader.variable} ${hanken.variable} ${bricolage.variable} ${ibmSans.variable} ${ibmMono.variable} ${jetbrainsMono.variable} min-h-screen`}
    >
      {children}
    </div>
  );
}
