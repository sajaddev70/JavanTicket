"use client";

import { MapPin } from "lucide-react";
import { useCities } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { Select } from "@/components/ui/Field";
import { cn } from "@/lib/cn";

/** City of the header; every event list on the site follows it. */
export function CitySelect({ className }: { className?: string }) {
  const { data: cities } = useCities();
  const { cityId, setCityId } = useCity();
  return (
    <Select
      aria-label="انتخاب شهر"
      icon={<MapPin className="size-[18px]" />}
      value={cityId ?? ""}
      onChange={(e) => setCityId(e.target.value ? Number(e.target.value) : null)}
      className={cn("shrink-0", className)}
      selectClassName="min-h-11 rounded-xl border-line bg-surface pl-8 text-[13.5px]"
    >
      <option value="">همه شهرها</option>
      {cities?.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}
