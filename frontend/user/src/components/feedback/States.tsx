import { CalendarX2, RefreshCw, TriangleAlert, WifiOff, type LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

/** API failure: Persian message and a retry button (never raw error text). Offline gets its own hint. */
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
  const Icon = offline ? WifiOff : TriangleAlert;
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-5 py-10 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
        <Icon className="size-6" />
      </span>
      <p className="max-w-md text-[14.5px] font-bold leading-7 text-ink">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-50 px-5 text-[14px] font-bold text-brand-600 transition hover:bg-brand-100"
        >
          <RefreshCw className="size-4" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  message,
  description,
  icon: Icon = CalendarX2,
  action,
  className,
}: {
  message: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-5 py-12 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-7" />
      </span>
      <p className="text-[15.5px] font-black text-ink">{message}</p>
      {description && <p className="max-w-md text-[13.5px] leading-7 text-muted">{description}</p>}
      {action}
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
      <div className={cn("grid gap-4 sm:grid-cols-2 lg:grid-cols-3", className)} aria-busy>
        {Array.from({ length: count }, (_, i) => (
          <Skeleton key={i} className="h-[260px] rounded-[18px]" />
        ))}
      </div>
    );
  }
  return (
    <div className={cn("space-y-4", className)} aria-busy>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-[160px] rounded-2xl" />
      ))}
    </div>
  );
}
