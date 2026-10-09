'use client';

import Link from "next/link";
import { ArrowLeft, Bell, CircleCheck, FileText, Info, TriangleAlert } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useSystemAlerts } from "@/hooks/useDashboard";
import { cn } from "@/lib/cn";
import { faTimeAgo } from "@/lib/format";
import type { AlertType } from "@/services/dashboard";

const ALERT_STYLE: Record<AlertType, { icon: LucideIcon; box: string; icon_: string; time: string }> = {
  DANGER: { icon: TriangleAlert, box: "bg-danger/8 border-danger/20", icon_: "text-danger-fg", time: "text-danger-fg/80" },
  WARNING: { icon: TriangleAlert, box: "bg-warning/10 border-warning/25", icon_: "text-warning-fg", time: "text-warning-fg/90" },
  INFO: { icon: FileText, box: "bg-brand-500/8 border-brand-500/20", icon_: "text-brand-600", time: "text-brand-600/80" },
  SUCCESS: { icon: CircleCheck, box: "bg-success/8 border-success/20", icon_: "text-success-fg", time: "text-success-fg/80" },
};
const FALLBACK = { icon: Info, box: "bg-surface-2 border-line", icon_: "text-muted", time: "text-muted" };

export function SystemAlerts() {
  const { data, isLoading, isError, refetch } = useSystemAlerts(5);
  const alerts = data?.items ?? [];

  return (
    <Card className="p-5" >
      <div id="alerts" className="scroll-mt-24" />
      <CardHeader
        title="هشدارهای سیستم"
        icon={<Bell className="size-5 fill-danger text-danger" />}
        action={
          <Link href="/notifications" className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            مشاهده همه
            <ArrowLeft className="size-4" />
          </Link>
        }
      />

      {isError ? (
        <ErrorState message="دریافت هشدارها با خطا مواجه شد." onRetry={() => refetch()} />
      ) : !isLoading && alerts.length === 0 ? (
        <EmptyState message="هشدار فعالی وجود ندارد." />
      ) : (
        <ul className="mt-4 space-y-2.5">
          {isLoading
            ? Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-[46px] rounded-xl" />)
            : alerts.map((alert) => {
                const s = ALERT_STYLE[alert.type] ?? FALLBACK;
                const Icon = s.icon;
                return (
                  <li
                    key={alert.id}
                    className={cn("flex min-h-[46px] items-center gap-3 rounded-xl border px-3.5 py-2.5", s.box)}
                    title={alert.title}
                  >
                    <Icon className={cn("size-5 shrink-0", s.icon_)} strokeWidth={2} />
                    <p className="min-w-0 flex-1 text-[13px] font-medium leading-6 text-ink">{alert.message}</p>
                    {alert.createdAt && (
                      <time dateTime={alert.createdAt} className={cn("shrink-0 text-[12px]", s.time)}>
                        {faTimeAgo(alert.createdAt)}
                      </time>
                    )}
                  </li>
                );
              })}
        </ul>
      )}
    </Card>
  );
}
