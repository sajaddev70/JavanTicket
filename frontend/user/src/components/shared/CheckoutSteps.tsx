import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = ["انتخاب صندلی", "اطلاعات خریدار", "پرداخت", "تکمیل خرید"];

/** Purchase progress (reference 07): seats → buyer details → payment → done. [current] is 0-based. */
export function CheckoutSteps({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label="مراحل خرید" className={className}>
      <ol className="grid grid-cols-4">
        {STEPS.map((label, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <li key={label} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span aria-hidden className={cn("absolute right-[calc(-50%+22px)] top-[17px] h-[2px] w-[calc(100%-44px)] rounded-full", i <= current ? "bg-brand-600" : "bg-line-strong")} />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-9 items-center justify-center rounded-full text-[14px] font-black transition",
                  active ? "bg-brand-600 text-white ring-4 ring-brand-500/15" : done ? "bg-brand-100 text-brand-600" : "bg-field text-muted",
                )}
              >
                {done ? <Check className="size-[18px]" strokeWidth={3} /> : (i + 1).toLocaleString("fa-IR")}
              </span>
              <span className={cn("mt-2 text-[12px] font-bold sm:text-[13.5px]", active ? "text-brand-600" : done ? "text-ink-2" : "text-muted")}>{label}</span>
              <span className="sr-only">{done ? " (انجام شد)" : active ? " (مرحله فعلی)" : ""}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
