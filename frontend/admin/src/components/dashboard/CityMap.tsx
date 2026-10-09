import Image from "next/image";
import { asset } from "@/lib/assets";
import { cn } from "@/lib/cn";
import { faPercent } from "@/lib/format";
import { occupancyLevel, occupancyStyles } from "@/lib/occupancy";
import type { CityStatus } from "@/services/dashboard";

/**
 * Linear lat/lng -> image-fraction projection, calibrated against the iran-map.png asset
 * (fitted on five reference cities; error ≈ 2–4% of the map size).
 */
const PROJECTION = { xPerLng: 0.0464, xOffset: -1.99913, yPerLat: -0.06184, yOffset: 2.52826 };

function project(lat: number, lng: number) {
  const x = PROJECTION.xPerLng * lng + PROJECTION.xOffset;
  const y = PROJECTION.yPerLat * lat + PROJECTION.yOffset;
  return { left: `${(x * 100).toFixed(2)}%`, top: `${(y * 100).toFixed(2)}%` };
}

export function CityMap({ cities }: { cities: CityStatus[] }) {
  return (
    <div className="relative mx-auto aspect-[430/427] w-full max-w-[380px]">
      <Image
        src={asset("/assets/dashboard/iran-map.png")}
        alt="نقشه ایران"
        fill
        sizes="(min-width: 1280px) 340px, (min-width: 640px) 45vw, 90vw"
        className="object-contain dark:brightness-[0.92]"
      />
      {cities
        .filter((c) => c.latitude !== null && c.longitude !== null)
        .map((city) => {
          const style = occupancyStyles[occupancyLevel(city.occupancyPercent)];
          return (
            <div
              key={city.id}
              className="group absolute flex -translate-x-1/2 -translate-y-[9px] flex-col items-center"
              style={project(Number(city.latitude), Number(city.longitude))}
            >
              <span className={cn("size-[18px] rounded-full border-[3px] border-white shadow-[0_2px_6px_rgb(15_27_51_/_0.25)]", style.dot)} />
              {/* The map artwork is light in both themes, so its labels keep a fixed dark color. */}
              <span className="mt-0.5 whitespace-nowrap text-[12px] font-extrabold text-[#0f1b33] [text-shadow:0_0_3px_#fff,0_0_3px_#fff]">
                {city.name}
              </span>
              <span className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-lg bg-navy-900 px-2 py-1 text-[11px] text-white shadow-float group-hover:block">
                ظرفیت {faPercent(city.occupancyPercent)}
              </span>
            </div>
          );
        })}
    </div>
  );
}
