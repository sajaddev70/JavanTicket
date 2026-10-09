'use client';

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { useTodaySessions } from "@/hooks/useDashboard";
import { cn } from "@/lib/cn";
import { faNumber, faTime } from "@/lib/format";
import type { SessionSaleStatus, TodaySession } from "@/services/dashboard";

const STATUS: Record<SessionSaleStatus, { label: string; className: string }> = {
  RUNNING: { label: "در حال اجرا", className: "bg-success/10 text-success-fg border-success/25" },
  ON_SALE: { label: "در حال فروش", className: "bg-brand-50 text-brand-600 border-brand-500/25" },
  LIMITED: { label: "تعداد محدود", className: "bg-warning/10 text-warning-fg border-warning/30" },
  ALMOST_FULL: { label: "در آستانه تکمیل", className: "bg-danger/10 text-danger border-danger/25" },
  SOLD_OUT: { label: "تکمیل ظرفیت", className: "bg-danger/10 text-danger border-danger/25" },
  FINISHED: { label: "پایان یافته", className: "bg-surface-2 text-muted border-line" },
};

const COLUMNS = ["#", "نام رویداد", "شهر", "سالن", "زمان شروع", "ظرفیت", "فروخته‌شده", "وضعیت", "عملیات"];
// The hall column is dropped below 2xl so the table fits its card without horizontal scrolling.
const HALL_COLUMN = 3;
const hallCell = "hidden 2xl:table-cell";

function StatusPill({ status }: { status: SessionSaleStatus }) {
  const s = STATUS[status] ?? STATUS.ON_SALE;
  return (
    <span className={cn("inline-flex h-7 items-center whitespace-nowrap rounded-lg border px-2.5 text-[12px] font-bold", s.className)}>
      {s.label}
    </span>
  );
}

function DetailsLink({ session }: { session: TodaySession }) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="inline-flex h-8 items-center rounded-lg border border-line bg-surface px-3 text-[12px] font-semibold text-ink hover:border-brand-500/40 hover:text-brand-600"
    >
      جزئیات
    </Link>
  );
}

export function TodaySessionsTable() {
  const { data, isLoading, isError, refetch } = useTodaySessions(5);
  const sessions = data?.items ?? [];

  return (
    <Card className="p-5">
      <CardHeader
        title="سانس‌های امروز"
        action={
          <Link href="/sessions" className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-600 hover:text-brand-700">
            مشاهده همه
            <ArrowLeft className="size-4" />
          </Link>
        }
      />

      {isError ? (
        <ErrorState message="دریافت سانس‌های امروز با خطا مواجه شد." onRetry={() => refetch()} />
      ) : !isLoading && sessions.length === 0 ? (
        <EmptyState message="برای امروز سانسی ثبت نشده است." />
      ) : (
        <>
          {/* Desktop / tablet table */}
          <div className="mt-4 hidden overflow-x-auto md:block">
            <table className="w-full min-w-[600px] text-right text-[13px] [&_td]:whitespace-nowrap">
              <thead>
                <tr className="bg-surface-2 text-[12px] font-bold text-ink">
                  {COLUMNS.map((c, i) => (
                    <th
                      key={c}
                      className={cn("h-10 whitespace-nowrap px-2 font-bold", i === 0 && "rounded-r-xl", i === COLUMNS.length - 1 && "rounded-l-xl text-center", i === HALL_COLUMN && hallCell)}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/70">
                {isLoading
                  ? Array.from({ length: 5 }, (_, r) => (
                      <tr key={r}>
                        {COLUMNS.map((c, i) => (
                          <td key={c} className={cn("h-[52px] px-2", i === HALL_COLUMN && hallCell)}>
                            <Skeleton className="h-3.5 w-full max-w-24" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : sessions.map((s, i) => (
                      <tr key={s.id} className="text-ink transition-colors hover:bg-field/60">
                        <td className="h-[52px] px-2 text-muted">{faNumber(i + 1)}</td>
                        <td className="max-w-[170px] truncate px-2 font-bold" title={s.eventTitle}>{s.eventTitle}</td>
                        <td className="px-2">{s.cityName}</td>
                        <td className={cn("max-w-[140px] truncate px-2", hallCell)} title={s.hallName}>{s.hallName}</td>
                        <td className="tabular px-3">{faTime(s.startTime)}</td>
                        <td className="tabular px-3">{faNumber(s.capacity)}</td>
                        <td className="tabular px-3">{faNumber(s.soldTickets)}</td>
                        <td className="px-2">
                          <StatusPill status={s.status} />
                        </td>
                        <td className="px-2 text-center">
                          <DetailsLink session={s} />
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="mt-4 space-y-3 md:hidden">
            {isLoading
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-[112px] rounded-xl" />)
              : sessions.map((s) => (
                  <li key={s.id} className="rounded-xl border border-line/70 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-bold text-ink">{s.eventTitle}</p>
                        <p className="mt-1 text-[12px] text-muted">
                          {s.cityName} · {s.hallName}
                        </p>
                      </div>
                      <StatusPill status={s.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[12px] text-muted">
                      <span>
                        ساعت <b className="text-ink">{faTime(s.startTime)}</b>
                      </span>
                      <span>
                        فروش <b className="text-ink">{faNumber(s.soldTickets)}</b> از {faNumber(s.capacity)}
                      </span>
                      <DetailsLink session={s} />
                    </div>
                  </li>
                ))}
          </ul>
        </>
      )}
    </Card>
  );
}
