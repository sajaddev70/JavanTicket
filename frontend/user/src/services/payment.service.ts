import { http } from "./api";
import type { PaymentMethod, PaymentResult } from "@/types/order";

/** Online payment: the backend registers the payment with the gateway and verifies the bank's callback. */
export const paymentService = {
  methods: () => http.get<PaymentMethod[]>("/user/payment-methods"),
  start: (orderNumber: string, gateway: string) =>
    http.post<{ payment_id: number; redirect_url: string }>(`/user/orders/${encodeURIComponent(orderNumber)}/payments`, { gateway }),
  result: (paymentId: number) => http.get<PaymentResult>(`/user/payments/${paymentId}`),
};
