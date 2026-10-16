import AdminLayout from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CityStatusCard } from "@/components/dashboard/CityStatusCard";
import { TodaySessionsTable } from "@/components/dashboard/TodaySessionsTable";
import { SystemAlerts } from "@/components/dashboard/SystemAlerts";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <PageHeader title="داشبورد مدیریت" crumbs={["داشبورد"]} />
      <div className="space-y-5">
        <DashboardStats />
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,5fr)_minmax(0,6.4fr)]">
          <SalesChart />
          <CityStatusCard />
        </div>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,4.3fr)_minmax(0,7.6fr)]">
          <SystemAlerts />
          <TodaySessionsTable />
        </div>
      </div>
    </AdminLayout>
  );
}
