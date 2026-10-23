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
  placeholder = "جستجو در رویدادها، هنرمندان، سالن‌ها و ...",
  autoFocus,
}: {
  className?: string;
  defaultValue?: string;
  onSearch?: (q: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
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
        className="h-12 w-full rounded-2xl border border-transparent bg-field pl-12 pr-5 text-[14px] text-ink outline-none transition placeholder:text-muted focus:border-brand-500/40 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
      />
      <button type="submit" aria-label="جستجو" className="absolute left-1 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-ink-2 hover:text-brand-600">
        <Icon name="common/search" className="size-[22px]" />
      </button>
    </form>
  );
}
