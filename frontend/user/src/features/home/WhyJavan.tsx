"use client";

import { useCities, useFeatures, useSiteSettings } from "@/hooks/useContent";
import { useCity } from "@/providers/CityProvider";
import { SmartImage } from "@/components/ui/SmartImage";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { mediaUrl } from "@/lib/media";

/**
 * "چرا جوان؟" trust strip: the site features of the admin panel (/public/features) beside a photo of the visitor's
 * city (its image from /public/cities; any city with a photo when "همه شهرها" is selected).
 */
export function WhyJavan() {
  const features = useFeatures().data ?? [];
  const settings = useSiteSettings().data;
  const { cityId } = useCity();
  const cities = useCities().data ?? [];
  const photo = (cities.find((c) => c.id === cityId) ?? cities.find((c) => c.image_url))?.image_url;
  if (!features.length) return null;
  const name = settings?.short_name ?? settings?.site_name;

  return (
    <section aria-labelledby="why-title" className="card flex overflow-hidden">
      <div className="min-w-0 flex-1 p-4 sm:p-5">
        <h2 id="why-title" className="text-[19px] font-black text-ink sm:text-[21px]">
          {name ? `چرا ${name}؟` : "چرا ما؟"}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-y-4 sm:grid-cols-4 sm:divide-x sm:divide-line">
          {features.slice(0, 4).map((f) => (
            <li key={f.id} className="flex flex-col items-center gap-1.5 px-2 text-center">
              <span className="flex size-11 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                <SvgIcon src={f.icon_url} className="size-6" />
              </span>
              <p className="text-[13px] font-bold leading-5 text-ink">{f.title}</p>
              {f.description && <p className="hidden text-[12px] leading-5 text-muted sm:block">{f.description}</p>}
            </li>
          ))}
        </ul>
      </div>
      {photo && (
        <div className="relative w-[28%] max-w-[320px] shrink-0">
          <SmartImage src={mediaUrl(photo)} fallback={null} alt="" fill sizes="(min-width: 1024px) 320px, 30vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-l from-surface via-surface/10 to-transparent" />
        </div>
      )}
    </section>
  );
}
