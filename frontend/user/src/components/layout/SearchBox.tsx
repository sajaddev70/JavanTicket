"use client";

import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

/** Site search: opens the events page with ?q= (the events page searches title, city, hall and category). */
export function SearchBox({ className, onDone, autoFocus }: { className?: string; onDone?: () => void; autoFocus?: boolean }) {
  const router = useRouter();
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
        onDone?.();
      }}
    >
      <label htmlFor="site-search" className="sr-only">
        جستجو در رویدادها
      </label>
      <input
        id="site-search"
        name="q"
        type="search"
        autoFocus={autoFocus}
        enterKeyHint="search"
        placeholder="جستجو در رویدادها، هنرمندان، سالن‌ها و ..."
        className="min-h-11 w-full rounded-xl border border-transparent bg-field pl-11 pr-4 text-[13.5px] text-ink outline-none transition placeholder:text-muted focus:border-brand-500/40 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
      />
      <button type="submit" aria-label="جستجو" className="absolute left-1 top-1/2 flex size-10 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2 hover:text-brand-600">
        <Search className="size-5" />
      </button>
    </form>
  );
}
