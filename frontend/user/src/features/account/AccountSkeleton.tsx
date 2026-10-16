import { Skeleton } from "@/components/ui/Skeleton";

export function AccountSkeleton() {
  return (
    <div className="container-page grid gap-5 pt-5 lg:grid-cols-[280px_1fr]" aria-busy>
      <Skeleton className="hidden h-[360px] rounded-[18px] lg:block" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-60" />
        <Skeleton className="h-[420px] rounded-[18px]" />
      </div>
    </div>
  );
}
