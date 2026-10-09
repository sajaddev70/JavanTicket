import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/services/dashboard";
import { useAdminFilterStore } from "@/stores/useAdminFilterStore";

export function useDashboardStats() {
  const cityId = useAdminFilterStore((s) => s.cityId);
  return useQuery({ queryKey: ["dashboard", "stats", cityId], queryFn: () => dashboardApi.stats(cityId) });
}

export function useSalesChart(days: number) {
  const cityId = useAdminFilterStore((s) => s.cityId);
  return useQuery({
    queryKey: ["dashboard", "sales-chart", days, cityId],
    queryFn: () => dashboardApi.salesChart(days, cityId),
  });
}

export function useCityStatus() {
  return useQuery({ queryKey: ["dashboard", "cities"], queryFn: dashboardApi.cities });
}

export function useTodaySessions(limit = 5) {
  const cityId = useAdminFilterStore((s) => s.cityId);
  return useQuery({
    queryKey: ["dashboard", "today-sessions", limit, cityId],
    queryFn: () => dashboardApi.todaySessions(limit, cityId),
  });
}

export function useSystemAlerts(limit = 5) {
  return useQuery({
    queryKey: ["dashboard", "alerts", limit],
    queryFn: () => dashboardApi.alerts(limit),
    refetchInterval: 60_000,
  });
}

export function useCityOptions() {
  return useQuery({ queryKey: ["cities", "options"], queryFn: dashboardApi.cityOptions, staleTime: 10 * 60_000 });
}
