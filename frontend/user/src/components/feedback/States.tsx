import { CalendarX2, RefreshCw, TriangleAlert, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

/** API failure: Persian message and a retry button (never raw error text). */
export function ErrorState({
  message = "دریافت اطلاعات با خطا مواجه شد.",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-surface px-4 py-10 text-center", className)}>
      <span className="flex size-12 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
        <TriangleAlert className="size-6" />
      </span>
      <p className="max-w-md text-[14.5px] font-semibold leading-7 text-ink">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-[14px] font-bold text-brand-600 hover:border-brand-500/50"
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
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface/60 px-4 py-12 text-center", className)}>
      <span className="flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        <Icon className="size-7" />
      </span>
      <p className="text-[15px] font-bold text-ink">{message}</p>
      {description && <p className="max-w-md text-[13.5px] leading-7 text-muted">{description}</p>}
      {action}
    </div>
  );
}
