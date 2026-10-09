import { CalendarX2, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";

export function ErrorState({ message, onRetry, className }: { message: string; onRetry?: () => void; className?: string }) {
  return (
    <div role="alert" className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-line bg-field/60 px-4 py-10 text-center", className)}>
      <TriangleAlert className="size-7 text-ticket" />
      <p className="text-sm font-medium text-ink">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-sm font-bold text-brand-600 hover:border-brand-500/40"
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
    <div className={cn("flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-field/50 px-4 py-10 text-center", className)}>
      <CalendarX2 className="size-7 text-muted" />
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
