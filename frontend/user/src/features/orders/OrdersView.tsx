"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, Receipt, Ticket } from "lucide-react";
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
import { faDate, faFullDate, faNumber, faPrice, faTime } from "@/lib/format";
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
    <AccountShell title="سفارش‌های من" description="همه خریدهای شما، با وضعیت پرداخت و بلیت‌های هر سفارش.">
      <div className="card p-3 sm:p-4">
        <Tabs idBase="orders" variant="pill" value={status} onChange={(v) => go({ status: v })} items={FILTERS.map((f) => ({ value: f.value, label: f.label }))} />
        <TabPanel idBase="orders" value={status} className="pt-4">
          {orders.isError ? (
            <ErrorState message={errorMessage(orders.error)} onRetry={() => orders.refetch()} />
          ) : orders.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-[76px] rounded-2xl" />
              ))}
            </div>
          ) : !orders.data?.items.length ? (
            <EmptyState icon={Receipt} message="سفارشی برای نمایش وجود ندارد." action={<ButtonLink href="/events">مشاهده رویدادها</ButtonLink>} />
          ) : (
            <>
              {/* Desktop: table */}
              <div className="hidden overflow-x-auto md:block">
                <table className={cn("w-full text-[13.5px]", orders.isPlaceholderData && "opacity-60")}>
                  <caption className="sr-only">فهرست سفارش‌ها</caption>
                  <thead>
                    <tr className="border-b border-line text-right text-[12.5px] text-muted">
                      <th scope="col" className="py-3 pl-3 font-semibold">شماره سفارش</th>
                      <th scope="col" className="py-3 pl-3 font-semibold">رویداد</th>
                      <th scope="col" className="py-3 pl-3 font-semibold">تاریخ سفارش</th>
                      <th scope="col" className="py-3 pl-3 font-semibold">مبلغ</th>
                      <th scope="col" className="py-3 pl-3 font-semibold">پرداخت</th>
                      <th scope="col" className="py-3 pl-3 font-semibold">وضعیت</th>
                      <th scope="col" className="py-3 font-semibold">بلیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {orders.data.items.map((o) => (
                      <tr key={o.id} className="align-middle">
                        <td className="py-3 pl-3">
                          <Link href={`/orders/${encodeURIComponent(o.order_number)}`} className="font-code font-bold text-brand-600 hover:underline" dir="ltr">
                            {o.order_number}
                          </Link>
                        </td>
                        <td className="py-3 pl-3">
                          <div className="flex items-center gap-3">
                            <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-field">
                              <SmartImage src={mediaUrl(o.banner_url)} fallback={null} alt="" fill sizes="44px" className="object-cover" />
                            </span>
                            <span>
                              <span className="block max-w-[260px] truncate font-bold text-ink">{o.event_title}</span>
                              <span className="block text-[12px] text-muted">
                                {faDate(o.start_time)} - {faTime(o.start_time)}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pl-3 text-ink-2">{faDate(o.created_at)}</td>
                        <td className="whitespace-nowrap py-3 pl-3 font-bold text-ink">{faPrice(o.total_amount)}</td>
                        <td className="font-code py-3 pl-3 text-ink-2" dir="ltr">
                          {o.tracking_code ?? "—"}
                        </td>
                        <td className="py-3 pl-3">
                          <OrderStatusBadge status={o.status} />
                        </td>
                        <td className="py-3">
                          {o.first_ticket_id ? (
                            <Link href={`/tickets/${o.first_ticket_id}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-brand-50 px-3 font-bold text-brand-600 hover:bg-brand-100">
                              <Ticket className="size-4" />
                              {faNumber(o.tickets_count)} بلیت
                            </Link>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Phones: cards */}
              <ul className={cn("space-y-3 md:hidden", orders.isPlaceholderData && "opacity-60")}>
                {orders.data.items.map((o) => (
                  <li key={o.id}>
                    <Link href={`/orders/${encodeURIComponent(o.order_number)}`} className="block rounded-2xl border border-line p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-code text-[13px] font-bold text-brand-600" dir="ltr">
                          {o.order_number}
                        </span>
                        <OrderStatusBadge status={o.status} />
                      </div>
                      <p className="mt-2 text-[14.5px] font-black text-ink">{o.event_title}</p>
                      <p className="mt-1 text-[12.5px] text-muted">{faFullDate(o.start_time)}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[14px] font-black text-ink">{faPrice(o.total_amount)}</span>
                        <span className="flex items-center gap-1 text-[12.5px] font-bold text-brand-600">
                          جزئیات
                          <ChevronLeft className="size-4" />
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
      </div>
    </AccountShell>
  );
}
