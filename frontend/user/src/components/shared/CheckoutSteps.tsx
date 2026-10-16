import { Armchair, Check, CreditCard, Ticket, UserRound } from "lucide-react";
import { cn } from "@/lib/cn";

const STEPS = [
  { label: "انتخاب صندلی", hint: "انتخاب رویداد و صندلی‌ها", icon: Armchair },
  { label: "اطلاعات خریدار", hint: "تکمیل اطلاعات و بررسی سفارش", icon: UserRound },
  { label: "پرداخت", hint: "پرداخت هزینه و دریافت بلیت", icon: CreditCard },
  { label: "بلیت", hint: "دریافت و مشاهده بلیت‌ها", icon: Ticket },
];

/** Purchase progress: seat selection → buyer details → payment → ticket. [current] is 0-based. */
export function CheckoutSteps({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label="مراحل خرید" className={className}>
      <ol className="grid grid-cols-4">
        {STEPS.map((step, i) => {
          const done = i < current;
          const active = i === current;
          const Icon = done ? Check : step.icon;
          return (
            <li key={step.label} aria-current={active ? "step" : undefined} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span aria-hidden className={cn("absolute right-[calc(-50%+26px)] top-[19px] h-[3px] w-[calc(100%-52px)] rounded-full", i <= current ? "bg-brand-600" : "bg-line-strong")} />
              )}
              <span
                className={cn(
                  "relative z-10 flex size-10 items-center justify-center rounded-full border-[3px] transition",
                  done || active ? "border-brand-600 bg-brand-600 text-white" : "border-line-strong bg-surface text-muted",
                  active && "ring-4 ring-brand-500/15",
                )}
              >
                <Icon className="size-5" strokeWidth={done ? 3 : 2} />
              </span>
              <span className={cn("mt-2 text-[12.5px] font-black sm:text-[15px]", active || done ? "text-brand-600" : "text-ink-2")}>
                <span className="hidden sm:inline">{(i + 1).toLocaleString("fa-IR")}. </span>
                {step.label}
              </span>
              <span className="mt-0.5 hidden text-[12px] text-muted md:block">{step.hint}</span>
              <span className="sr-only">{done ? " (انجام شد)" : active ? " (مرحله فعلی)" : ""}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
