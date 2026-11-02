import { RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { SYMBOL } from "./StateDialog";

/** API failure: Persian message and a retry button (never raw error text). Offline uses the design's wording. */
export function ErrorState({
  message = "دریافت اطلاعات با خطا مواجه شد.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const offline = /اتصال اینترنت|ارتباط با سرور/.test(message);
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-3 py-10 text-center", className)}>
      <span aria-hidden className="text-[52px] leading-[1.25]">
        {SYMBOL.warning}
      </span>
      <p className="max-w-md text-[15px] font-black leading-7 text-ink">{offline ? "ارتباط برقرار نشد" : message}</p>
      {offline && <p className="max-w-md text-[13px] leading-7 text-muted">اتصال اینترنت را بررسی و دوباره تلاش کنید.</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="mt-1 inline-flex min-h-[52px] w-full max-w-[360px] items-center justify-center gap-2 rounded-[15px] bg-cta px-5 text-[15px] font-black text-white">
          <RefreshCw className="size-4" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

/** The design's .empty: a large symbol, title, description and an action. */
export function EmptyState({
  message,
  description,
  symbol = SYMBOL.calendar,
  action,
  className,
}: {
  message: string;
  description?: string;
  symbol?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-3 pb-7 pt-11 text-center", className)}>
      <span aria-hidden className="mb-[15px] block text-[68px] leading-[1.25] text-ink">
        {symbol}
      </span>
      <h2 className="text-[19px] font-black text-ink">{message}</h2>
      {description && <p className="mt-2 max-w-md text-[13px] leading-[2] text-muted">{description}</p>}
      {action && <div className="mt-4 flex w-full max-w-[360px] flex-col gap-2 [&>*]:w-full">{action}</div>}
    </div>
  );
}

/** Generic placeholder blocks while a screen loads: `rows` lines in a card, or a grid of cards. */
export function LoadingSkeleton({ variant = "card", count = 3, className }: { variant?: "card" | "rows" | "grid"; count?: number; className?: string }) {
  if (variant === "rows") {
    return (
      <div className={cn("card space-y-3 p-5", className)} aria-busy>
        <Skeleton className="h-5 w-1/3" />
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-4" />
        ))}
      </div>
    );
  }
  if (variant === "grid") {
    return (
      <div className={cn("grid gap-3 lg:grid-cols-2", className)} aria-busy>
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-[113px] rounded-[17px]" />
        ))}
      </div>
    );
  }
  return (
    <div className={cn("space-y-3", className)} aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[113px] rounded-[20px]" />
      ))}
    </div>
  );
}
