"use client";

import { useState } from "react";
import {
  BookMarked,
  FolderGit2,
  Newspaper,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import {
  BrandLogoBadge,
  CategoryIcon,
  LanguageLogo,
  type LocalSvgIcon,
  resolveBrandIcon,
  resolveLanguageIcon,
} from "@/components/prototypes/vellum/VellumIcons";
import type { NewsItem } from "@/lib/news/types";

export {
  BrandLogoBadge,
  CategoryIcon,
  LanguageLogo,
  resolveBrandIcon,
  resolveLanguageIcon,
  type LocalSvgIcon,
};

const NEWS_BRAND_SECTIONS: Record<string, LocalSvgIcon> = {
  Claude: { src: "/icons/claude.svg", label: "Claude" },
  Grok: { src: "/icons/grok.svg", label: "Grok", inkInvertDark: true },
  "ChatGPT / OpenAI": { src: "/icons/openai.svg", label: "ChatGPT / OpenAI", inkInvertDark: true },
  Gemini: { src: "/icons/gemini.svg", label: "Gemini" },
};

/**
 * Icon for News categories: uses exact brand SVGs for Claude, Grok, ChatGPT/OpenAI, Gemini
 * and semantic Lucide icons for Repo, Bảo mật, Cộng đồng, Bài hay, Ứng dụng thực tế.
 */
export function NewsCategoryIcon({
  section,
  invertOnAccent = false,
  dark,
  size = 14,
}: {
  section: string;
  invertOnAccent?: boolean;
  dark: boolean;
  size?: number;
}) {
  const brandSvg = NEWS_BRAND_SECTIONS[section];
  const [failed, setFailed] = useState(false);

  if (brandSvg && !failed) {
    const shouldInvert = brandSvg.inkInvertDark ? invertOnAccent || dark : false;
    const needsLightBacking = invertOnAccent && !brandSvg.inkInvertDark;
    return (
      <span
        className={
          needsLightBacking
            ? "inline-flex shrink-0 items-center justify-center rounded-[3px] bg-white/95 p-[1.5px]"
            : "inline-flex shrink-0 items-center justify-center"
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={brandSvg.src}
          alt={brandSvg.label}
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="shrink-0 object-contain"
          style={{
            width: size,
            height: size,
            filter: shouldInvert ? "invert(1) brightness(1.1)" : undefined,
          }}
        />
      </span>
    );
  }

  const s = section.toLowerCase();
  const style = { width: size, height: size };
  if (s === "repo") return <FolderGit2 style={style} className="shrink-0" />;
  if (s.includes("bảo mật") || s.includes("an ninh")) return <ShieldAlert style={style} className="shrink-0" />;
  if (s.includes("cộng đồng")) return <Users style={style} className="shrink-0" />;
  if (s.includes("bài hay")) return <BookMarked style={style} className="shrink-0" />;
  if (s.includes("ứng dụng")) return <Sparkles style={style} className="shrink-0" />;
  return <Newspaper style={style} className="shrink-0" />;
}

/** Resolve primary news source icon without wrongly falling back non-GitHub articles to GitHub. */
export function resolveNewsSourceBrand(item: NewsItem): LocalSvgIcon | null {
  if (NEWS_BRAND_SECTIONS[item.section]) {
    return NEWS_BRAND_SECTIONS[item.section];
  }
  const hay = `${item.title} ${item.source} ${item.url || ""}`;
  if (/github\.com|github\.blog/i.test(hay) || item.section === "Repo") {
    return resolveBrandIcon(hay, item.section, item.tags);
  }
  if (/anthropic|claude/i.test(hay)) return NEWS_BRAND_SECTIONS.Claude;
  if (/openai|chatgpt|codex|sora/i.test(hay)) return NEWS_BRAND_SECTIONS["ChatGPT / OpenAI"];
  if (/gemini|deepmind|google/i.test(hay)) return NEWS_BRAND_SECTIONS.Gemini;
  if (/grok|x\.ai|xai/i.test(hay)) return NEWS_BRAND_SECTIONS.Grok;
  if (/huggingface/i.test(hay)) return { src: "/icons/hugging-face.svg", label: "Hugging Face" };
  if (/ollama/i.test(hay)) return { src: "/icons/ollama.svg", label: "Ollama", inkInvertDark: true };
  if (/perplexity/i.test(hay)) return { src: "/icons/perplexity.svg", label: "Perplexity" };
  if (/mistral/i.test(hay)) return { src: "/icons/mistral.svg", label: "Mistral" };
  if (/deepseek/i.test(hay)) return { src: "/icons/deepseek.svg", label: "DeepSeek" };
  return null;
}
