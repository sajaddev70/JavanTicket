import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/stores/useAuthStore";
import { queryKeys } from "@/constants/queryKeys";
import { isStatus } from "@/services/api";
import type { BuyerInput, Order, OrderStatus } from "@/types/order";

export const orderQuery = (number: string) =>
  queryOptions({
    queryKey: queryKeys.order(number),
    queryFn: () => orderService.get(number),
    // Amounts and the hold time come from the server: always re-read on mount.
    staleTime: 0,
    retry: (n, err) => !isStatus(err, 404) && n < 2,
  });

export const useOrder = (number: string | null) => useQuery({ ...orderQuery(number ?? ""), enabled: !!number });

export const useOrders = (params: { status?: OrderStatus | ""; page?: number }) =>
  useQuery({ queryKey: queryKeys.orders(params), queryFn: () => orderService.list({ ...params, size: 10 }) });

export const usePaymentMethods = () => useQuery({ queryKey: queryKeys.paymentMethods, queryFn: paymentService.methods, staleTime: 5 * 60_000 });

/** Mutations of a pending order; each answer is the recalculated order from the backend. */
export function useOrderMutations(number: string) {
  const qc = useQueryClient();
  const store = (order: Order) => qc.setQueryData(queryKeys.order(number), order);
  return {
    buyer: useMutation({
      mutationFn: (buyer: BuyerInput) => orderService.updateBuyer(number, buyer),
      onSuccess: (order) => {
        store(order);
        // The first purchase also fills the profile name: refresh it (and the name in the header).
        qc.invalidateQueries({ queryKey: queryKeys.profile });
        profileService
          .get()
          .then((p) => {
            const { user, updateUser } = useAuthStore.getState();
            if (user) updateUser({ ...user, fullName: p.full_name, email: p.email });
          })
          .catch(() => {});
      },
    }),
    applyDiscount: useMutation({ mutationFn: (code: string) => orderService.applyDiscount(number, code), onSuccess: store }),
    removeDiscount: useMutation({ mutationFn: () => orderService.removeDiscount(number), onSuccess: store }),
  };
}
