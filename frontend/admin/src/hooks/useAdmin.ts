import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/services/admin";
import { useAdminAuthStore } from "@/stores/useAdminAuthStore";

export function useAdminMenu() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({ queryKey: ["admin", "menu"], queryFn: adminApi.menu, enabled: !!token, staleTime: 10 * 60_000 });
}

export function useAdminProfile() {
  const token = useAdminAuthStore((s) => s.token);
  return useQuery({ queryKey: ["admin", "me"], queryFn: adminApi.me, enabled: !!token, staleTime: 5 * 60_000 });
}
