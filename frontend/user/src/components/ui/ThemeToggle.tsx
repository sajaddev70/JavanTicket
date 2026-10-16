'use client';

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";
import { currentTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

export function useTheme(): Theme {
  return useSyncExternalStore(subscribeTheme, currentTheme, () => "light");
}

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme();
  const dark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      aria-label={dark ? "تغییر به تم روشن" : "تغییر به تم تیره"}
      title={dark ? "تم روشن" : "تم تیره"}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl text-ink/80 transition hover:bg-field hover:text-ink",
        className,
      )}
    >
      {dark ? <Sun className="size-[21px]" strokeWidth={1.8} /> : <Moon className="size-[21px]" strokeWidth={1.8} />}
    </button>
  );
}
