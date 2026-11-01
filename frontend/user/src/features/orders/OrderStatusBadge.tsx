import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/types/order";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: string }> = {
  PENDING: { label: "در انتظار پرداخت", tone: "bg-warning-bg text-warning-fg" },
  PAID: { label: "پرداخت‌شده", tone: "bg-success-bg text-success-fg" },
  CANCELLED: { label: "لغوشده", tone: "bg-danger-bg text-danger-fg" },
  REFUNDED: { label: "مسترد شده", tone: "bg-danger-bg text-danger-fg" },
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "bg-field text-ink-2" };
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-[11px] py-[5px] text-[10px]", s.tone, className)}>{s.label}</span>;
}
