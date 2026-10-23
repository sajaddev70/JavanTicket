"use client";

import { ArrowLeft, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { faNumber } from "@/lib/format";
import { cn } from "@/lib/cn";

/**
 * Selection summary of the seat map (reference 04): the held seats, their total and "ادامه خرید".
 * Fixed to the bottom of the screen on phones (the handle opens the full cart); a sticky card from `lg` up.
 */
export function SeatSummarySheet({
  count,
  description,
  total,
  onContinue,
  onExpand,
  continuing,
  disabled,
  children,
}: {
  count: number;
  description: string;
  total: number;
  onContinue: () => void;
  onExpand: () => void;
  continuing?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <section
      aria-labelledby="seat-summary-title"
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] border-t border-line bg-surface px-4 pb-[calc(12px+env(safe-area-inset-bottom))] pt-1.5 shadow-nav",
        "lg:sticky lg:top-24 lg:rounded-2xl lg:border lg:p-5 lg:shadow-card",
      )}
    >
      <button type="button" onClick={onExpand} aria-haspopup="dialog" aria-label="مشاهده جزئیات صندلی‌های انتخاب‌شده" className="mx-auto flex h-7 w-16 items-center justify-center text-muted lg:hidden">
        <ChevronUp className="size-6" />
      </button>
      <div className="mx-auto flex max-w-[1216px] flex-col gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Icon name="common/seat-map" className="size-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="seat-summary-title" className="text-[14.5px] font-black text-ink">
              صندلی‌های انتخاب‌شده {count > 0 && <span className="whitespace-nowrap">({faNumber(count)} عدد)</span>}
            </h2>
            <p className="mt-0.5 line-clamp-2 text-[12.5px] leading-5 text-ink-2">{count ? description : "برای انتخاب، روی صندلی‌های آزاد در نقشه بزنید."}</p>
          </div>
          <div className="shrink-0 border-r border-line pr-3 text-left">
            <p className="text-[11.5px] text-muted">مجموع مبلغ</p>
            <p className="whitespace-nowrap text-[20px] font-black text-brand-600">
              {faNumber(total)} <span className="text-[13px] font-bold">تومان</span>
            </p>
          </div>
        </div>
        {children && <div className="hidden lg:block">{children}</div>}
        <Button size="xl" block onClick={onContinue} disabled={disabled || !count} loading={continuing}>
          ادامه خرید
          <ArrowLeft className="size-5" />
        </Button>
      </div>
    </section>
  );
}
