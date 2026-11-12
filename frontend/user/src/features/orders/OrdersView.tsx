"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Receipt } from "lucide-react";
import { useOrders } from "@/features/checkout/queries";
import { OrderStatusBadge } from "./OrderStatusBadge";
import { AccountShell } from "@/features/account/AccountShell";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { faFullDate, faPrice } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { OrderStatus } from "@/types/order";

const FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "همه سفارش‌ها" },
  { value: "PAID", label: "پرداخت شده" },
  { value: "PENDING", label: "در انتظار پرداخت" },
  { value: "CANCELLED", label: "لغو شده" },
];

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
    <AccountShell title="سفارش‌های من">
      <Tabs idBase="orders" variant="band" value={status} onChange={(v) => go({ status: v })} items={FILTERS.map((f) => ({ value: f.value, label: f.label }))} />
      <TabPanel idBase="orders" value={status} className="pt-1">
        {orders.isError ? (
          <ErrorState message={errorMessage(orders.error)} onRetry={() => orders.refetch()} />
        ) : orders.isLoading ? (
          <div className="grid gap-3 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-[150px] rounded-[22px]" />
            ))}
          </div>
        ) : !orders.data?.items.length ? (
          <EmptyState icon={Receipt} message="سفارشی برای نمایش وجود ندارد." action={<ButtonLink href="/events">مشاهده رویدادها</ButtonLink>} />
        ) : (
          <>
            {/* Reference 10: poster, order number, event, amount and the status pill, with a chevron to the details */}
            <ul className={cn("grid gap-3 md:grid-cols-2", orders.isPlaceholderData && "opacity-60")}>
              {orders.data.items.map((o) => (
                <li key={o.id} className="min-w-0">
                  <Link
                    href={`/orders/${encodeURIComponent(o.order_number)}`}
                    className="group flex items-center gap-3.5 rounded-[22px] border border-line bg-surface p-3 shadow-card transition hover:-translate-y-0.5 hover:shadow-float"
                  >
                    <span className="relative aspect-[3/4] w-[84px] shrink-0 overflow-hidden rounded-[16px] bg-field sm:w-[96px]">
                      <SmartImage src={mediaUrl(o.banner_url)} fallback={null} alt="" fill sizes="96px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="font-code block text-right text-[16px] font-black text-ink" dir="ltr">
                        {o.order_number}
                      </span>
                      <span className="mt-1 block truncate text-[13.5px] text-ink-2">{o.event_title}</span>
                      <span className="mt-0.5 block text-[12px] text-muted">{faFullDate(o.start_time)}</span>
                      <span className="mt-1 block text-[15px] font-black text-ink">{faPrice(o.total_amount)}</span>
                      <OrderStatusBadge status={o.status} className="mt-2" />
                    </span>
                    <ChevronLeft className="size-6 shrink-0 text-ink-2 transition group-hover:-translate-x-0.5" />
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
