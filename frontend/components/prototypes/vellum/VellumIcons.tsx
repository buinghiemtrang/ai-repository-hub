"use client";

import { useState } from "react";
import {
  Bot,
  Code2,
  Cpu,
  Database,
  FileCode2,
  FolderGit2,
  GraduationCap,
  Layers,
  Palette,
  PlugZap,
  Sparkles,
  Terminal,
  Workflow,
} from "lucide-react";

export interface LocalSvgIcon {
  src: string;
  label: string;
  inkInvertDark?: boolean;
}

const BRAND_RULES: { match: RegExp; src: string; label: string; inkInvertDark?: boolean }[] = [
  { match: /anthropic|claude-code/i, src: "/icons/claude-code.svg", label: "Claude Code" },
  { match: /claude/i, src: "/icons/claude.svg", label: "Claude" },
  { match: /openai|codex|chatgpt/i, src: "/icons/openai.svg", label: "OpenAI", inkInvertDark: true },
  { match: /gemini|google-ai|deepmind/i, src: "/icons/gemini.svg", label: "Gemini" },
  { match: /deepseek/i, src: "/icons/deepseek.svg", label: "DeepSeek" },
  { match: /ollama/i, src: "/icons/ollama.svg", label: "Ollama", inkInvertDark: true },
  { match: /hugging[-_]?face|transformers/i, src: "/icons/hugging-face.svg", label: "Hugging Face" },
  { match: /\bmcp\b|model-context-protocol/i, src: "/icons/mcp.svg", label: "MCP", inkInvertDark: true },
  { match: /langchain|langgraph/i, src: "/icons/langchain.svg", label: "LangChain", inkInvertDark: true },
  { match: /langfuse/i, src: "/icons/langfuse.svg", label: "Langfuse" },
  { match: /crewai/i, src: "/icons/crewai.svg", label: "CrewAI" },
  { match: /\bdify\b/i, src: "/icons/dify.svg", label: "Dify" },
  { match: /pytorch/i, src: "/icons/pytorch.svg", label: "PyTorch" },
  { match: /tensorflow/i, src: "/icons/tensorflow.svg", label: "TensorFlow" },
  { match: /jupyter/i, src: "/icons/jupyter.svg", label: "Jupyter" },
  { match: /cursor/i, src: "/icons/cursor.svg", label: "Cursor", inkInvertDark: true },
  { match: /copilot/i, src: "/icons/github-copilot.svg", label: "GitHub Copilot", inkInvertDark: true },
  { match: /elevenlabs/i, src: "/icons/elevenlabs.svg", label: "ElevenLabs", inkInvertDark: true },
  { match: /mistral/i, src: "/icons/mistral.svg", label: "Mistral AI" },
  { match: /perplexity/i, src: "/icons/perplexity.svg", label: "Perplexity" },
  { match: /mem0/i, src: "/icons/mem0.svg", label: "Mem0", inkInvertDark: true },
  { match: /livekit/i, src: "/icons/livekit.svg", label: "LiveKit" },
  { match: /grok|xai/i, src: "/icons/grok.svg", label: "Grok", inkInvertDark: true },
  { match: /next\.?js/i, src: "/icons/nextjs.svg", label: "Next.js" },
  { match: /vercel/i, src: "/icons/vercel.svg", label: "Vercel", inkInvertDark: true },
  { match: /docker/i, src: "/icons/docker.svg", label: "Docker" },
  { match: /postgres/i, src: "/icons/postgres.svg", label: "PostgreSQL" },
];

const LANGUAGE_ICONS: Record<string, LocalSvgIcon> = {
  TypeScript: { src: "/icons/typescript.svg", label: "TypeScript" },
  JavaScript: { src: "/icons/javascript.svg", label: "JavaScript" },
  Python: { src: "/icons/python.svg", label: "Python" },
  Rust: { src: "/icons/rust.svg", label: "Rust", inkInvertDark: true },
  Go: { src: "/icons/go.svg", label: "Go" },
  Java: { src: "/icons/java.svg", label: "Java" },
  "C++": { src: "/icons/c-plusplus.svg", label: "C++" },
  "C#": { src: "/icons/c-sharp.svg", label: "C#" },
  Kotlin: { src: "/icons/kotlin.svg", label: "Kotlin" },
  Swift: { src: "/icons/swift.svg", label: "Swift" },
  Ruby: { src: "/icons/ruby.svg", label: "Ruby" },
  PHP: { src: "/icons/php.svg", label: "PHP" },
  "Jupyter Notebook": { src: "/icons/jupyter.svg", label: "Jupyter" },
};

export function resolveBrandIcon(
  fullName: string,
  category?: string,
  topics?: string[] | null
): LocalSvgIcon {
  const hay = `${fullName} ${category || ""} ${(topics || []).join(" ")}`;
  for (const rule of BRAND_RULES) {
    if (rule.match.test(hay)) {
      return { src: rule.src, label: rule.label, inkInvertDark: rule.inkInvertDark };
    }
  }
  return { src: "/icons/github.svg", label: "GitHub", inkInvertDark: true };
}

export function resolveLanguageIcon(language: string | null | undefined): LocalSvgIcon | null {
  if (!language) return null;
  return LANGUAGE_ICONS[language] || null;
}

export function CategoryIcon({ category, className = "size-3.5" }: { category: string; className?: string }) {
  const c = category.toLowerCase();
  if (c.includes("agent")) return <Bot className={className} />;
  if (c.includes("claude")) return <Sparkles className={className} />;
  if (c.includes("mcp")) return <PlugZap className={className} />;
  if (c.includes("workflow")) return <Workflow className={className} />;
  if (c.includes("cục bộ") || c.includes("local")) return <Cpu className={className} />;
  if (c.includes("lập trình")) return <Terminal className={className} />;
  if (c.includes("dữ liệu")) return <Database className={className} />;
  if (c.includes("thiết kế")) return <Palette className={className} />;
  if (c.includes("giáo dục")) return <GraduationCap className={className} />;
  if (c.includes("học ai")) return <Layers className={className} />;
  return <FolderGit2 className={className} />;
}

export function BrandLogoBadge({
  icon,
  dark,
  size = 24,
}: {
  icon: LocalSvgIcon;
  dark?: boolean;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <Code2 style={{ width: size * 0.7, height: size * 0.7 }} />;
  }
  const useCssInvert = dark === undefined && Boolean(icon.inkInvertDark);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={icon.src}
      alt={icon.label}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className={`object-contain ${useCssInvert ? "vellum-invert-dark" : ""}`}
      style={{
        width: size,
        height: size,
        filter: !useCssInvert && dark && icon.inkInvertDark ? "invert(1) brightness(1.1)" : undefined,
      }}
    />
  );
}

export function LanguageLogo({
  language,
  dark,
}: {
  language: string | null | undefined;
  dark?: boolean;
}) {
  const icon = resolveLanguageIcon(language);
  const [failed, setFailed] = useState(false);
  if (!language) return null;
  if (!icon || failed) {
    return (
      <span className="inline-flex items-center gap-1">
        <FileCode2 className="size-3" />
        <span>{language}</span>
      </span>
    );
  }
  const useCssInvert = dark === undefined && Boolean(icon.inkInvertDark);
  return (
    <span className="inline-flex items-center gap-1.5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={icon.src}
        alt={icon.label}
        width={13}
        height={13}
        onError={() => setFailed(true)}
        className={`size-3.5 object-contain ${useCssInvert ? "vellum-invert-dark" : ""}`}
        style={{
          filter: !useCssInvert && dark && icon.inkInvertDark ? "invert(1) brightness(1.1)" : undefined,
        }}
      />
      <span>{language}</span>
    </span>
  );
}
