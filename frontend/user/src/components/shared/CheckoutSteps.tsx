import { faNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

const STEPS = ["انتخاب", "اطلاعات", "پرداخت"];

/** The design's .step row: ۱ انتخاب، ۲ اطلاعات، ۳ پرداخت. [current] is 0-based; it and the steps before it are filled. */
export function CheckoutSteps({ current, className }: { current: number; className?: string }) {
  return (
    <nav aria-label="مراحل خرید" className={className}>
      <ol className="flex gap-1.5">
        {STEPS.map((label, i) => (
          <li
            key={label}
            aria-current={i === current ? "step" : undefined}
            className={cn("flex-1 rounded-[11px] px-1 py-2.5 text-center text-[10px]", i <= current ? "bg-[#7739e9] font-bold text-white" : "bg-field text-ink-2")}
          >
            {faNumber(i + 1)} {label}
            <span className="sr-only">{i < current ? " (انجام شد)" : i === current ? " (مرحله فعلی)" : ""}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** The design's .banner: navy-to-purple strip with a line of text. */
export function InfoBanner({ icon, center, className, children }: { icon?: React.ReactNode; center?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <p className={cn("flex items-center gap-2 rounded-[15px] border border-[#8561fa] bg-banner p-3.5 text-[13px] text-white", center && "justify-center text-center", className)}>
      {icon}
      {children}
    </p>
  );
}
