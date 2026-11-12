"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";

/**
 * Search field of the designs. Without [onSearch] it opens the events page with ?q= (the events page searches
 * title, city, hall and category); with it, the caller handles the query (events page filters).
 */
export function SearchField({
  className,
  defaultValue,
  onSearch,
  placeholder = "جستجو در رویدادها و نمایشگاه‌ها...",
  autoFocus,
  onBand,
}: {
  className?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  /** Translucent field on the navy band (reference 02). */
  onBand?: boolean;
}) {
  const router = useRouter();
  const id = useId();
  return (
    <form
      role="search"
      className={cn("relative", className)}
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        if (onSearch) onSearch(q);
        else router.push(q ? `/events?q=${encodeURIComponent(q)}` : "/events");
      }}
    >
      <label htmlFor={id} className="sr-only">
        جستجو در رویدادها
      </label>
      <input
        key={defaultValue}
        id={id}
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        enterKeyHint="search"
        placeholder={placeholder}
        className={cn(
          "h-12 w-full rounded-full pl-5 pr-12 text-[14px] outline-none transition focus:ring-4",
          onBand
            ? "glass placeholder:text-white/75 focus:bg-white/20 focus:ring-white/15"
            : "border border-transparent bg-field text-ink placeholder:text-muted focus:border-purple/40 focus:bg-surface focus:ring-purple/10",
        )}
      />
      <button
        type="submit"
        aria-label="جستجو"
        className={cn("absolute right-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full", onBand ? "text-white" : "text-ink-2 hover:text-purple")}
      >
        <Icon name="common/search" className="size-[22px]" />
      </button>
    </form>
  );
}
