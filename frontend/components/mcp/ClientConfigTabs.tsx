"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { CodeBlock } from "@/components/repositories/GuideRenderer";
import { type McpClientConfig } from "@/lib/mcp/types";
import { cn } from "@/lib/utils";

export function ClientConfigTabs({ configs }: { configs: McpClientConfig[] }) {
  const [active, setActive] = useState(configs[0]?.client);
  const current = configs.find((c) => c.client === active) ?? configs[0];
  if (!current) return null;

  return (
    <div className="space-y-3">
      <div role="tablist" aria-label="Chọn MCP client" className="flex flex-wrap gap-1.5">
        {configs.map((cfg) => (
          <button
            key={cfg.client}
            type="button"
            role="tab"
            aria-selected={cfg.client === current.client}
            onClick={() => setActive(cfg.client)}
            className={cn(
              "pressable rounded-lg px-3 py-1.5 text-xs font-medium",
              cfg.client === current.client
                ? "bg-slate-900 text-white dark:bg-teal-600"
                : "bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700/80 dark:hover:text-white"
            )}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        Vị trí: <span className="font-medium text-slate-700 dark:text-slate-300">{current.path_hint}</span>
      </p>

      {current.format === "text" ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm break-all text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
          {current.content}
        </div>
      ) : (
        <CodeBlock lang={current.format === "shell" ? "sh" : "json"} code={current.content} />
      )}

      {current.note && (
        <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="mt-0.5 size-3.5 shrink-0" />
          {current.note}
        </p>
      )}
    </div>
  );
}
