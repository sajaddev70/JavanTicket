'use client';

import { useDashboardStats } from "@/hooks/useDashboard";
import { faNumber, faPercent } from "@/lib/format";
import { ErrorState } from "@/components/ui/States";
import { StatCard } from "./StatCard";

export function DashboardStats() {
  const { data, isLoading, isError, refetch } = useDashboardStats();

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-4 min-[430px]:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="فروش امروز"
          value={faNumber(data?.todaySales.value)}
          unit="تومان"
          iconSrc="/assets/dashboard/stat-sales.png"
          changePercent={data?.todaySales.changePercent}
          compareLabel="نسبت به دیروز"
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          title="تعداد بلیت فروخته‌شده"
          value={faNumber(data?.ticketsSold.value)}
          unit="بلیت"
          iconSrc="/assets/dashboard/stat-tickets.png"
          changePercent={data?.ticketsSold.changePercent}
          compareLabel="نسبت به دیروز"
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          title="پرشدگی سالن‌ها"
          value={faPercent(data?.hallOccupancy.value)}
          unit="میانگین ظرفیت"
          iconSrc="/assets/dashboard/stat-occupancy.png"
          changePercent={data?.hallOccupancy.changePercent}
          compareLabel="نسبت به هفته قبل"
          isLoading={isLoading}
          isError={isError}
        />
        <StatCard
          title="رزرو مدارس"
          value={faNumber(data?.schoolReservations.value)}
          unit="گروه ثبت شده"
          iconSrc="/assets/dashboard/stat-schools.png"
          changePercent={data?.schoolReservations.changePercent}
          compareLabel="نسبت به ماه قبل"
          isLoading={isLoading}
          isError={isError}
        />
      </div>
      {isError && (
        <div className="rounded-2xl border border-danger/20 bg-danger/5">
          <ErrorState message="دریافت اطلاعات داشبورد با خطا مواجه شد." onRetry={() => refetch()} className="py-4" />
        </div>
      )}
    </div>
  );
}
