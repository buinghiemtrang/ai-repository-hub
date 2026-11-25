"use client";

import { useState } from "react";
import { Check, Copy, ShieldAlert } from "lucide-react";

type Block =
  | { type: "heading"; text: string }
  | { type: "callout"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; lang: string; code: string }
  | { type: "paragraph"; text: string };

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
    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim() || "sh";
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("> ")) {
      blocks.push({ type: "callout", text: trimmed.slice(2).trim() });
      i += 1;
      continue;
    }
    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("- ")) {
        items.push(lines[i].trim().slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    blocks.push({ type: "paragraph", text: trimmed });
    i += 1;
  }
  return blocks;
}

function CodeBlock({ lang, code }: { lang: string; code: string }) {
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

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950 text-slate-100">
      <div className="flex items-center justify-between border-b border-slate-800 px-3.5 py-2 text-xs text-slate-400">
        <span className="font-mono uppercase">{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
          <span>{copied ? "Đã sao chép" : "Sao chép"}</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-xs leading-6 font-mono text-emerald-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function GuideRenderer({ content }: { content: string }) {
  const blocks = parseGuideBlocks(content);

  return (
    <div className="space-y-4 text-sm leading-6 text-slate-700">
      {blocks.map((block, idx) => {
        if (block.type === "heading") {
          return (
            <h3 key={idx} className="pt-2 text-base font-semibold text-slate-900">
              {block.text}
            </h3>
          );
        }
        if (block.type === "callout") {
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 text-xs leading-5 text-amber-900"
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-700" />
              <p>{block.text}</p>
            </div>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={idx} className="space-y-1.5 pl-1">
              {block.items.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-teal-600" />
                  <span className="break-words">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (block.type === "code") {
          return <CodeBlock key={idx} lang={block.lang} code={block.code} />;
        }
        return (
          <p key={idx} className="text-slate-700">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
