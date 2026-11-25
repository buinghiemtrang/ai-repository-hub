import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white dark:bg-teal-600",
        accent:
          "border-teal-200/80 bg-teal-50/90 text-teal-800 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300",
        secondary:
          "border-slate-200/80 bg-slate-100/90 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800 dark:text-slate-300",
        outline:
          "border-slate-200 bg-white text-slate-600 dark:border-slate-700/80 dark:bg-slate-900 dark:text-slate-300",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
      },
    },
    defaultVariants: {
      variant: "secondary",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
