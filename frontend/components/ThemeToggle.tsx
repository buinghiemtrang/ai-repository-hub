"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

function subscribeTheme(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  window.addEventListener("storage", cb);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", cb);
  };
}

function getIsDarkSnapshot(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, getIsDarkSnapshot, () => false);

  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // Ignore storage errors.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      title={dark ? "Giao diện sáng" : "Giao diện tối"}
      className="pressable inline-flex size-11 items-center justify-center rounded-[4px] border border-[var(--v-rule)] bg-[var(--v-surface)] text-[var(--v-ink)] transition-colors hover:border-[var(--v-rule-strong)] sm:size-8"
    >
      {dark ? <Sun className="size-4 text-[var(--v-accent)]" /> : <Moon className="size-4" />}
    </button>
  );
}
