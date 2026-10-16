import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-md bg-skeleton", className)} aria-hidden>
      <div className="absolute inset-0 translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-l from-transparent via-white/60 to-transparent" />
    </div>
  );
}
