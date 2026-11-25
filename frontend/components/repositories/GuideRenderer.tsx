"use client";

import { useState, type ReactNode } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";

export type GuideVariant = "default" | "vellum" | "vellum-light" | "vellum-dark";

type Block =
  | { type: "heading"; level: 1 | 2 | 3; text: string }
  | { type: "callout"; text: string }
  | { type: "list"; ordered: boolean; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "code"; lang: string; code: string }
  | { type: "paragraph"; text: string };

const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

export function toSafeExternalUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw.trim());
    if (SAFE_URL_PROTOCOLS.has(parsed.protocol)) {
      return parsed.href;
    }
  } catch {
    return null;
  }
  return null;
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => cell.trim());
}

function isTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes("|") || !trimmed.includes("-")) return false;
  return /^\|?(\s*:?-+:?\s*\|)+\s*:?-+:?\s*\|?$/.test(trimmed);
}

function parseGuideBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split(/\r?\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i += 1;
      continue;
    }

    // Fenced code block (``` or ~~~)
    if (trimmed.startsWith("```") || trimmed.startsWith("~~~")) {
      const fence = trimmed.startsWith("~~~") ? "~~~" : "```";
      const lang = trimmed.slice(fence.length).trim() || "sh";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith(fence)) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // Headings (# / ## / ###)
    const headingMatch = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (headingMatch) {
      const level = headingMatch[1].length as 1 | 2 | 3;
      blocks.push({ type: "heading", level, text: headingMatch[2].trim() });
      i += 1;
      continue;
    }

    // Blockquote / safety callout (> )
    if (trimmed.startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "callout", text: quoteLines.join(" ") });
      continue;
    }

    // Markdown pipe table (header + separator + rows)
    if (trimmed.includes("|") && i + 1 < lines.length && isTableSeparator(lines[i + 1])) {
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 2;
      while (i < lines.length && lines[i].trim().includes("|") && lines[i].trim() !== "") {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    // Unordered list (- or * )
    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "list", ordered: false, items });
      continue;
    }

    // Ordered list (1. )
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, "").trim());
        i += 1;
      }
      blocks.push({ type: "list", ordered: true, items });
      continue;
    }

    // Paragraph (coalesce contiguous plain lines until blank/block syntax)
    const paraLines = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        next.startsWith("```") ||
        next.startsWith("~~~") ||
        /^#{1,3}\s+/.test(next) ||
        next.startsWith("> ") ||
        /^[-*]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paraLines.push(next);
      i += 1;
    }
    blocks.push({ type: "paragraph", text: paraLines.join(" ") });
  }
  return blocks;
}

/** Render inline Markdown (`code`, **bold**, *italic*, [label](url), bare https:// URLs) with React nodes only (zero innerHTML). */
function renderInline(
  text: string,
  linkClass: string,
  inlineCodeClass: string
): ReactNode[] {
  const nodes: ReactNode[] = [];
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>"')\]]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let k = 0;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      nodes.push(
        <code key={`ic-${k++}`} className={inlineCodeClass}>
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      nodes.push(<strong key={`b-${k++}`}>{token.slice(2, -2)}</strong>);
    } else if (token.startsWith("*") && token.endsWith("*")) {
      nodes.push(<em key={`em-${k++}`}>{token.slice(1, -1)}</em>);
    } else if (token.startsWith("[")) {
      const inner = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      const safe = inner ? toSafeExternalUrl(inner[2]) : null;
      if (inner && safe) {
        nodes.push(
          <a
            key={`lnk-${k++}`}
            href={safe}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {inner[1]}
          </a>
        );
      } else {
        nodes.push(inner ? inner[1] : token);
      }
    } else if (token.startsWith("http")) {
      const cleaned = token.replace(/[.,;:!?]+$/, "");
      const trailing = token.slice(cleaned.length);
      const safe = toSafeExternalUrl(cleaned);
      if (safe) {
        nodes.push(
          <a
            key={`auto-${k++}`}
            href={safe}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
          >
            {cleaned}
          </a>
        );
        if (trailing) nodes.push(trailing);
      } else {
        nodes.push(token);
      }
    }
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }
  return nodes;
}

function CodeBlock({
  lang,
  code,
  variant,
}: {
  lang: string;
  code: string;
  variant: GuideVariant;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in insecure context.
    }
  }

  const isVellumVar = variant === "vellum";
  const isVellumLight = variant === "vellum-light";
  const isVellumDark = variant === "vellum-dark";

  const wrapClass = isVellumVar
    ? "overflow-hidden rounded-[5px] border border-[var(--v-rule-strong)] bg-[var(--v-bg)] text-[var(--v-ink)]"
    : isVellumLight
      ? "overflow-hidden rounded-[5px] border border-[#171614]/20 bg-[#F5F2EB] text-[#171614]"
      : isVellumDark
        ? "overflow-hidden rounded-[5px] border border-[#EFEBE3]/22 bg-[#131110] text-[#F4F0E8]"
        : "overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100";

  const barClass = isVellumVar
    ? "flex items-center justify-between border-b border-[var(--v-rule)] bg-[var(--v-surface-alt)] px-3 py-1.5 text-[11px] text-[var(--v-muted)]"
    : isVellumLight
      ? "flex items-center justify-between border-b border-[#171614]/15 bg-[#EAE5D9] px-3 py-1.5 text-[11px] text-[#57534B]"
      : isVellumDark
        ? "flex items-center justify-between border-b border-[#EFEBE3]/18 bg-[#25221F] px-3 py-1.5 text-[11px] text-[#B8B0A4]"
        : "flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400";

  const btnClass = isVellumVar
    ? "inline-flex min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 sm:px-2 sm:py-1 text-[11px] font-medium text-[var(--v-ink)] hover:bg-black/5 dark:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[var(--v-accent)]"
    : isVellumLight
      ? "inline-flex min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 sm:px-2 sm:py-1 text-[11px] font-medium text-[#171614] hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-[#C03A17]"
      : isVellumDark
        ? "inline-flex min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0 items-center gap-1.5 rounded-[4px] px-3 py-1.5 sm:px-2 sm:py-1 text-[11px] font-medium text-[#F4F0E8] hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#EC7650]"
        : "inline-flex min-h-11 min-w-11 justify-center sm:min-h-0 sm:min-w-0 items-center gap-1.5 rounded-md px-3 py-1.5 sm:px-2 sm:py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white";

  const codeClass = isVellumVar
    ? "overflow-x-auto p-3.5 text-xs leading-5 font-mono text-[var(--v-ink)]"
    : isVellumLight
      ? "overflow-x-auto p-3.5 text-xs leading-5 font-mono text-[#171614]"
      : isVellumDark
        ? "overflow-x-auto p-3.5 text-xs leading-5 font-mono text-[#F4F0E8]"
        : "overflow-x-auto p-4 text-xs leading-6 font-mono text-emerald-100";

  return (
    <div className={wrapClass}>
      <div className={barClass}>
        <span className="font-mono uppercase">{lang}</span>
        <button type="button" onClick={handleCopy} className={btnClass} aria-label={`Sao chép lệnh ${lang}`}>
          {copied ? (
            <Check className={isVellumVar ? "size-3.5 text-[var(--v-accent)]" : isVellumLight ? "size-3.5 text-[#C03A17]" : "size-3.5 text-[#EC7650]"} />
          ) : (
            <Copy className="size-3.5" />
          )}
          <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
        </button>
      </div>
      <pre className={codeClass}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function GuideRenderer({
  content,
  variant = "default",
}: {
  content: string;
  variant?: GuideVariant;
}) {
  const blocks = parseGuideBlocks(content);
  const isVellumVar = variant === "vellum";
  const isVellumLight = variant === "vellum-light";
  const isVellumDark = variant === "vellum-dark";

  const rootClass = isVellumVar
    ? "space-y-3.5 text-[13.5px] leading-6 text-[var(--v-ink)]"
    : isVellumLight
      ? "space-y-3.5 text-[13px] leading-6 text-[#35322D]"
      : isVellumDark
        ? "space-y-3.5 text-[13px] leading-6 text-[#D8D2C8]"
        : "space-y-4 text-sm leading-6 text-slate-700 dark:text-slate-300";

  const headingClass = isVellumVar
    ? "pt-2 text-base font-semibold text-[var(--v-ink)] font-editorial"
    : isVellumLight
      ? "pt-2 text-sm font-semibold text-[#171614]"
      : isVellumDark
        ? "pt-2 text-sm font-semibold text-[#F4F0E8]"
        : "pt-2 text-base font-semibold text-slate-900 dark:text-slate-100";

  const linkClass = isVellumVar
    ? "break-all font-medium text-[var(--v-accent)] underline underline-offset-2 hover:opacity-85"
    : isVellumLight
      ? "break-all font-medium text-[#C03A17] underline underline-offset-2 hover:opacity-80"
      : isVellumDark
        ? "break-all font-medium text-[#F08A68] underline underline-offset-2 hover:opacity-90"
        : "break-all font-medium text-teal-700 underline underline-offset-2 dark:text-teal-400";

  const inlineCodeClass = isVellumVar
    ? "rounded-[3px] border border-[var(--v-rule)] bg-[var(--v-surface-alt)] px-1.5 py-0.5 font-mono text-[12px] text-[var(--v-ink)]"
    : isVellumLight
      ? "rounded-[3px] border border-[#171614]/15 bg-[#EAE5D9] px-1.5 py-0.5 font-mono text-[11.5px] text-[#171614]"
      : isVellumDark
        ? "rounded-[3px] border border-[#EFEBE3]/20 bg-[#25221F] px-1.5 py-0.5 font-mono text-[11.5px] text-[#F4F0E8]"
        : "rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200";

  const calloutClass = isVellumVar
    ? "flex items-start gap-2.5 rounded-[5px] border border-[var(--v-accent)]/35 bg-[var(--v-accent-soft)] p-3 text-xs leading-5 text-[var(--v-ink)]"
    : isVellumLight
      ? "flex items-start gap-2.5 rounded-[5px] border border-[#C03A17]/30 bg-[#C03A17]/8 p-3 text-xs leading-5 text-[#5E2111]"
      : isVellumDark
        ? "flex items-start gap-2.5 rounded-[5px] border border-[#EC7650]/40 bg-[#EC7650]/12 p-3 text-xs leading-5 text-[#F6D7CB]"
        : "flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs leading-5 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200";

  const bulletClass = isVellumVar
    ? "mt-2 size-1.5 shrink-0 rounded-full bg-[var(--v-accent)]"
    : isVellumLight
      ? "mt-2 size-1.5 shrink-0 rounded-full bg-[#C03A17]"
      : isVellumDark
        ? "mt-2 size-1.5 shrink-0 rounded-full bg-[#EC7650]"
        : "mt-2 size-1.5 shrink-0 rounded-full bg-teal-600 dark:bg-teal-400";

  return (
    <div className={rootClass}>
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h3 key={idx} className={headingClass}>
              {renderInline(block.text, linkClass, inlineCodeClass)}
            </h3>
          );
        }
        if (block.type === "callout") {
          return (
            <div key={idx} className={calloutClass}>
              <ShieldAlert
                className={
                  isVellumLight
                    ? "mt-0.5 size-4 shrink-0 text-[#C03A17]"
                    : isVellumDark
                      ? "mt-0.5 size-4 shrink-0 text-[#EC7650]"
                      : "mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400"
                }
              />
              <p className="min-w-0">{renderInline(block.text, linkClass, inlineCodeClass)}</p>
            </div>
          );
        }
        if (block.type === "list") {
          if (block.ordered) {
            return (
              <ol key={idx} className="list-decimal space-y-1.5 pl-5">
                {block.items.map((item, itemIdx) => (
                  <li key={itemIdx} className="break-words pl-1">
                    {renderInline(item, linkClass, inlineCodeClass)}
                  </li>
                ))}
              </ol>
            );
          }
          return (
            <ul key={idx} className="space-y-1.5 pl-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className={bulletClass} />
                  <span className="min-w-0 break-words">
                    {renderInline(item, linkClass, inlineCodeClass)}
                  </span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "table") {
          return (
            <div
              key={idx}
              className={
                isVellumDark
                  ? "overflow-x-auto rounded-[5px] border border-[#EFEBE3]/20"
                  : "overflow-x-auto rounded-[5px] border border-black/15"
              }
            >
              <table className="w-full border-collapse text-left text-xs">
                <thead
                  className={
                    isVellumDark
                      ? "bg-[#25221F] text-[#F4F0E8]"
                      : "bg-[#EAE5D9] text-[#171614]"
                  }
                >
                  <tr>
                    {block.headers.map((h, hi) => (
                      <th key={hi} className="px-3 py-2 font-semibold">
                        {renderInline(h, linkClass, inlineCodeClass)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className={isVellumDark ? "divide-y divide-[#EFEBE3]/15" : "divide-y divide-black/10"}>
                  {block.rows.map((row, ri) => (
                    <tr key={ri}>
                      {row.map((cell, ci) => (
                        <td key={ci} className="px-3 py-2">
                          {renderInline(cell, linkClass, inlineCodeClass)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        if (block.type === "code") {
          return <CodeBlock key={idx} lang={block.lang} code={block.code} variant={variant} />;
        }
        return (
          <p key={idx} className="break-words">
            {renderInline(block.text, linkClass, inlineCodeClass)}
          </p>
        );
      })}
    </div>
  );
}
