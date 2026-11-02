"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { useOrders } from "@/features/checkout/queries";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";
import { faNumber, faPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/types/order";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "همه سفارش‌ها" },
  { value: "PAID", label: "پرداخت‌شده" },
  { value: "PENDING", label: "در انتظار" },
  { value: "CANCELLED", label: "لغوشده" },
];

/** 15 سفارش‌های من: عادی، بدون سفارش. (سفارش لغوشده's box appears when such an order is opened.) */
export function OrdersView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const status = (FILTERS.find((f) => f.value === params.get("status"))?.value ?? "all") as OrderStatus | "all";
  const page = Math.max(1, Number(params.get("page")) || 1);
  const orders = useOrders({ status: status === "all" ? "" : status, page });
  const go = (next: { status?: string; page?: number }) => {
    const p = new URLSearchParams();
    const s = next.status ?? status;
    if (s !== "all") p.set("status", s);
    if (next.page && next.page > 1) p.set("page", String(next.page));
    router.push(`${pathname}${p.size ? `?${p}` : ""}`, { scroll: false });
  };

  return (
    <AccountShell title="سفارش‌های من" fallbackHref="/profile">
      <Tabs idBase="orders" value={status} onChange={(v) => go({ status: v })} items={FILTERS.map((f) => ({ value: f.value, label: f.label }))} />
      <TabPanel idBase="orders" value={status} className="pt-3">
        {orders.isError ? (
          <ErrorState message={errorMessage(orders.error)} onRetry={() => orders.refetch()} />
        ) : orders.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[130px] rounded-[20px]" />
            ))}
          </div>
        ) : !orders.data?.items.length ? (
          <EmptyState symbol={SYMBOL.receipt} message="هنوز سفارشی ثبت نکرده‌اید" description="با انتخاب یک رویداد، خرید را آغاز کنید." action={<ButtonLink href="/events" size="xl">مشاهده رویدادها</ButtonLink>} />
        ) : (
          <>
            <ul className={cn("grid gap-3 md:grid-cols-2", orders.isPlaceholderData && "opacity-60")}>
              {orders.data.items.map((o) => (
                <li key={o.id}>
                  <Link href={`/orders/${encodeURIComponent(o.order_number)}`} className="card block p-4">
                    <b dir="ltr" className="font-code block text-right text-[14px] text-ink">
                      {o.order_number}
                    </b>
                    <p className="truncate text-[12px] leading-[2] text-muted">{o.event_title}</p>
                    <OrderStatusBadge status={o.status} />
                    <div className="mt-2 flex items-center justify-between text-[13px] text-ink">
                      <span>{faPrice(o.total_amount)}</span>
                      <span className="flex items-center gap-3">
                        {o.first_ticket_id && <span className="text-[12px] text-muted">{faNumber(o.tickets_count)} بلیت</span>}
                        <span className="flex items-center gap-0.5 text-[12px]">
                          جزئیات
                          <ChevronLeft className="size-3.5" />
                        </span>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination className="mt-4" page={page} pages={Math.ceil(orders.data.total / orders.data.size)} onChange={(p) => go({ page: p })} />
          </>
        )}
      </TabPanel>
    </AccountShell>
  );
}
