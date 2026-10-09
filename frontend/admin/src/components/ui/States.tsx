import { RefreshCw, TriangleAlert, Inbox } from "lucide-react";
import { cn } from "@/lib/cn";

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
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 px-4 py-8 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="size-5" />
      </span>
      <p className="text-sm font-medium text-ink">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-brand-600 transition hover:border-brand-500/40 hover:bg-brand-50"
        >
          <RefreshCw className="size-4" />
          تلاش مجدد
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2 px-4 py-8 text-center", className)}>
      <span className="flex size-11 items-center justify-center rounded-full bg-field text-muted">
        <Inbox className="size-5" />
      </span>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
