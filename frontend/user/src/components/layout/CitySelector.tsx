"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { useCities } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { Dialog } from "@/components/ui/Dialog";
import { Icon } from "@/components/ui/Icon";
import { faNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/** City of the header (a pill opening a sheet of the cities from the API); every event list on the site follows it. */
export function CitySelector({ className }: { className?: string }) {
  const { data: cities, isLoading } = useCities();
  const { cityId, setCityId } = useCity();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const current = cities?.find((c) => c.id === cityId);
  const list = (cities ?? []).filter((c) => !q.trim() || c.name.includes(q.trim()) || c.province?.includes(q.trim()));

  const choose = (id: number | null) => {
    setCityId(id);
    setOpen(false);
    setQ("");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`شهر: ${current?.name ?? "همه شهرها"} (تغییر شهر)`}
        className={cn(
          "flex h-11 min-w-0 shrink-0 items-center gap-1.5 rounded-[14px] bg-field px-3 min-[400px]:gap-2 min-[400px]:px-3.5 text-[14px] font-bold text-ink transition hover:bg-brand-50",
          className,
        )}
      >
        <Icon name="common/location" className="size-[18px] text-ink" />
        <span className="max-w-[88px] truncate min-[400px]:max-w-[110px]">{isLoading ? "..." : (current?.name ?? "همه شهرها")}</span>
        <Icon name="common/chevron-down" className="size-4 text-ink-2" />
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title="انتخاب شهر" description="رویدادهای شهر انتخاب‌شده در همه صفحات نمایش داده می‌شود.">
        {(cities?.length ?? 0) > 8 && (
          <div className="relative mb-3">
            <label htmlFor="city-q" className="sr-only">
              جستجوی شهر
            </label>
            <input
              id="city-q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="جستجوی شهر ..."
              className="h-12 w-full rounded-xl border border-line bg-field pl-4 pr-11 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface"
            />
            <Icon name="common/search" className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted" />
          </div>
        )}
        <ul role="listbox" aria-label="شهرها" className="space-y-1">
          {!q && <CityOption label="همه شهرها" selected={cityId === null} onClick={() => choose(null)} />}
          {list.map((c) => (
            <CityOption
              key={c.id}
              label={c.name}
              hint={c.events_count > 0 ? `${faNumber(c.events_count)} رویداد` : undefined}
              selected={c.id === cityId}
              onClick={() => choose(c.id)}
            />
          ))}
          {!list.length && q && <li className="py-6 text-center text-[13.5px] text-muted">شهری با این نام پیدا نشد.</li>}
        </ul>
      </Dialog>
    </>
  );
}

function CityOption({ label, hint, selected, onClick }: { label: string; hint?: string; selected: boolean; onClick: () => void }) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-right text-[14.5px] font-bold transition",
          selected ? "bg-brand-50 text-brand-600" : "text-ink hover:bg-field",
        )}
      >
        <Icon name="common/location" className="size-[18px] shrink-0 opacity-70" />
        <span className="flex-1">{label}</span>
        {hint && <span className="text-[12px] font-medium text-muted">{hint}</span>}
        {selected && <Check className="size-5 shrink-0" />}
      </button>
    </li>
  );
}
