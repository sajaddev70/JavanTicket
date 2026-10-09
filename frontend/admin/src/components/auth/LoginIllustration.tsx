import Image from "next/image";
import { asset } from "@/lib/assets";

// RTL order: first item renders on the right.
const TILES = ["/assets/dashboard/stat-schools.png", "/assets/dashboard/stat-tickets.png", "/assets/dashboard/stat-sales.png"];
const LIST_DOTS = ["bg-success", "bg-warning", "bg-success", "bg-danger", "bg-brand-500"];

/**
 * Decorative product preview for the login screen. It intentionally shows placeholder bars
 * instead of numbers: it is an illustration, not data.
 */
export function LoginIllustration() {
  return (
    <div aria-hidden className="relative hidden select-none lg:block">
      <Image
        src={asset("/assets/auth/semicircle.png")}
        alt=""
        width={309}
        height={109}
        className="absolute -top-16 left-[14%] w-[46%] opacity-60 blur-[1px] dark:opacity-25"
      />
      <Image
        src={asset("/assets/auth/dots.png")}
        alt=""
        width={244}
        height={108}
        className="absolute -top-20 right-[18%] w-40 opacity-60 dark:opacity-30"
      />

      <div
        className="relative rounded-[22px] border border-line/60 bg-surface/55 p-4 shadow-[0_30px_80px_rgb(30_70_140_/_0.14)] backdrop-blur-sm"
        style={{ transform: "perspective(1900px) rotateY(-12deg) rotateZ(4deg) translateX(-14%) scale(1.12)", transformOrigin: "right center" }}
      >
        <div className="mb-3 flex gap-2 px-1" dir="ltr">
          <span className="size-3 rounded-full bg-danger/30" />
          <span className="size-3 rounded-full bg-line-strong" />
          <span className="size-3 rounded-full bg-line-strong" />
        </div>
        <div className="mb-3 h-7 rounded-lg bg-surface/80" />

        <div className="grid grid-cols-3 gap-3">
          {TILES.map((tile) => (
            <div key={tile} className="flex items-start justify-between gap-2 rounded-2xl bg-surface p-3.5 shadow-card">
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 w-3/4 rounded-full bg-line" />
                <div className="h-4 w-full rounded-full bg-line-strong" />
                <div className="h-2 w-1/2 rounded-full bg-line" />
                <div className="h-2 w-2/3 rounded-full bg-success/40" />
              </div>
              <Image src={asset(tile)} alt="" width={48} height={48} className="size-12" />
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1.9fr] gap-3">
          <div className="space-y-2 rounded-2xl bg-surface p-3 shadow-card">
            <div className="mb-3 h-3 w-2/3 rounded-full bg-line-strong" />
            {LIST_DOTS.map((dot, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-surface-2 px-3 py-2.5">
                <span className={`size-3 rounded-full ${dot}`} />
                <div className="space-y-1.5">
                  <div className="h-2.5 w-12 rounded-full bg-line-strong" />
                  <div className="h-2 w-8 rounded-full bg-line" />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl bg-surface p-2 shadow-card">
            <Image src={asset("/assets/auth/preview-chart.png")} alt="" width={605} height={384} className="h-auto w-full" />
          </div>
        </div>
      </div>

      <div className="relative mt-14 mr-[30%] w-fit -rotate-3">
        <p className="text-[28px] font-bold leading-[1.9] text-ink/80">
          مدیریت هوشمند
          <br />
          <span className="mr-10">رویدادها و نمایشگاه‌ها</span>
        </p>
        <svg viewBox="0 0 200 14" className="mr-6 mt-1 w-40 text-brand-500/70">
          <path d="M3 10 C 60 2, 140 2, 197 6" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}
