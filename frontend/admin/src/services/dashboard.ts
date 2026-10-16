import { apiGet } from "./api";

export interface Metric {
  value: number | null;
  previous: number | null;
  /** Relative change in percent (percentage points for occupancy); null when there is no baseline. */
  changePercent: number | null;
}

export interface DashboardStats {
  todaySales: Metric;
  ticketsSold: Metric;
  hallOccupancy: Metric;
  schoolReservations: Metric;
}

export interface SalesPoint {
  date: string;
  amount: number;
  movingAverage: number;
}

export interface CityStatus {
  id: number;
  name: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
  activeEvents: number;
  capacity: number;
  reserved: number;
  occupancyPercent: number | null;
}

export type SessionSaleStatus = "RUNNING" | "ON_SALE" | "LIMITED" | "ALMOST_FULL" | "SOLD_OUT" | "FINISHED";

export interface TodaySession {
  id: number;
  eventTitle: string;
  cityName: string;
  hallName: string;
  startTime: string;
  capacity: number;
  soldTickets: number;
  status: SessionSaleStatus;
}

export type AlertType = "DANGER" | "WARNING" | "INFO" | "SUCCESS";

export interface SystemAlert {
  id: number;
  title: string;
  message: string;
  type: AlertType;
  createdAt: string | null;
}

export interface Paged<T> {
  items: T[];
  total: number;
}

export interface City {
  id: number;
  name: string;
  province: string;
}

export const dashboardApi = {
  stats: (cityId?: number | null) => apiGet<DashboardStats>("/admin/dashboard/stats", { cityId: cityId ?? undefined }),
  salesChart: (days: number, cityId?: number | null) =>
    apiGet<SalesPoint[]>("/admin/dashboard/sales-chart", { days, cityId: cityId ?? undefined }),
  cities: () => apiGet<CityStatus[]>("/admin/dashboard/cities"),
  todaySessions: (limit: number, cityId?: number | null) =>
    apiGet<Paged<TodaySession>>("/admin/dashboard/today-sessions", { limit, cityId: cityId ?? undefined }),
  alerts: (limit: number) => apiGet<Paged<SystemAlert>>("/admin/dashboard/alerts", { limit }),
  cityOptions: () => apiGet<City[]>("/public/cities"),
};
