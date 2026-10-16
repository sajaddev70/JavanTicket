'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { InlineAlert, TextAreaField, secondaryButton } from '@/components/ui/Field';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { DetailGrid, SectionTitle } from '@/components/data/Detail';
import { apiGet, apiPost } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { ORDER_STATUS, TICKET_STATUS } from '@/lib/labels';
import { faDateTime, faNumber, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

export interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  discount_code?: string | null;
  discount_amount: number;
  payment_method?: string | null;
  created_at: string;
  paid_at?: string | null;
  refunded_at?: string | null;
  user_id: number;
  customer_name?: string | null;
  customer_mobile: string;
  session_id?: number | null;
  start_time?: string | null;
  event_id?: number | null;
  event_title?: string | null;
  event_banner_url?: string | null;
  hall_name?: string | null;
  city_name?: string | null;
  tickets_count: number;
}

interface OrderDetail extends Order {
  refund_reason?: string | null;
  customer_email?: string | null;
  tickets: { id: number; ticket_code: string; seat_label?: string | null; price: number; status: string; used_at?: string | null; tier_name?: string | null }[];
  held_seats: { row_label: string; seat_number: number; held_until: string }[];
}

/** Order details with its tickets; paid orders can be refunded and pending ones cancelled. */
export function OrderDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const order = useQuery({ queryKey: ['admin', 'orders', id], queryFn: () => apiGet<OrderDetail>(`/admin/orders/${id}`) });
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const cancel = useMutation({
    mutationFn: () => apiPost(`/admin/orders/${id}/cancel`, { reason }),
    onSuccess: () => {
      setConfirming(false);
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  const o = order.data;
  const st = o ? statusOf(ORDER_STATUS, o.status) : null;
  const canCancel = o && (o.status === 'PAID' || o.status === 'PENDING');

  return (
    <Modal open title={o ? `سفارش ${o.order_number}` : 'جزئیات سفارش'} onClose={onClose} className="sm:max-w-3xl">
      {order.isLoading ? (
        <Skeleton className="h-72 rounded-2xl" />
      ) : order.isError || !o ? (
        <ErrorState message={errorMessage(order.error, 'دریافت سفارش با خطا مواجه شد.')} onRetry={() => order.refetch()} />
      ) : (
        <div>
          {cancel.isSuccess && <InlineAlert tone="success">{o.status === 'REFUNDED' ? 'سفارش مسترد شد و بلیت‌ها باطل شدند.' : 'سفارش لغو شد.'}</InlineAlert>}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {st && <StatusPill tone={st.tone}>{st.label}</StatusPill>}
            <span className="tabular text-2xl font-black text-ink">{faToman(o.total_amount)}</span>
          </div>
          <DetailGrid
            items={[
              ['مشتری', o.customer_name || 'بدون نام'],
              ['موبایل', <span key="m" dir="ltr">{o.customer_mobile}</span>],
              ['رویداد', o.event_title],
              ['سانس', o.start_time ? `${faDateTime(o.start_time)} · ${o.hall_name ?? ''} (${o.city_name ?? ''})` : '—'],
              ['تاریخ ثبت', faDateTime(o.created_at)],
              ['تاریخ پرداخت', o.paid_at ? faDateTime(o.paid_at) : '—'],
              ['کد تخفیف', o.discount_code ? `${o.discount_code} (${faToman(o.discount_amount)})` : '—'],
              ['روش پرداخت', o.payment_method === 'ONLINE' ? 'درگاه اینترنتی' : (o.payment_method ?? '—')],
              ...(o.refunded_at ? ([['تاریخ استرداد', faDateTime(o.refunded_at)]] as [string, React.ReactNode][]) : []),
              ...(o.refund_reason ? ([['علت لغو / استرداد', o.refund_reason]] as [string, React.ReactNode][]) : []),
            ]}
          />

          <SectionTitle>بلیت‌ها ({faNumber(o.tickets.length || o.held_seats.length)})</SectionTitle>
          {o.tickets.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-4 text-[13.5px] text-muted">
              {o.held_seats.length
                ? `صندلی‌های نگه‌داشته: ${o.held_seats.map((h) => `ردیف ${h.row_label} صندلی ${h.seat_number}`).join('، ')}`
                : 'برای این سفارش هنوز بلیتی صادر نشده است.'}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line/70">
              <table className="w-full min-w-[520px] text-right text-[13px]">
                <thead className="bg-surface-2 text-muted">
                  <tr>
                    {['کد بلیت', 'صندلی', 'قیمت', 'وضعیت'].map((h) => (
                      <th key={h} className="px-3 py-2.5 font-bold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70 text-ink">
                  {o.tickets.map((t) => {
                    const ts = statusOf(TICKET_STATUS, t.status);
                    return (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-mono" dir="ltr">{t.ticket_code}</td>
                        <td className="px-3 py-2">{[t.tier_name, t.seat_label].filter(Boolean).join(' · ') || '—'}</td>
                        <td className="tabular px-3 py-2">{faToman(t.price)}</td>
                        <td className="px-3 py-2">
                          <StatusPill tone={ts.tone}>{ts.label}</StatusPill>
                          {t.used_at && <span className="mr-2 text-[12px] text-muted">{faDateTime(t.used_at)}</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {canCancel && (
            <div className="mt-5 border-t border-line pt-4">
              {!confirming ? (
                <button type="button" onClick={() => setConfirming(true)} className={cn(secondaryButton, 'border-danger/40 text-danger-fg hover:border-danger')}>
                  <RotateCcw className="size-4" />
                  {o.status === 'PAID' ? 'استرداد وجه و ابطال بلیت‌ها' : 'لغو سفارش'}
                </button>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    cancel.mutate();
                  }}
                  className="space-y-3"
                >
                  {cancel.isError && <InlineAlert tone="error">{errorMessage(cancel.error, 'لغو سفارش با خطا مواجه شد.')}</InlineAlert>}
                  <p className="text-[13.5px] leading-7 text-muted">
                    {o.status === 'PAID'
                      ? 'با استرداد، همه بلیت‌های این سفارش باطل می‌شوند و صندلی‌ها دوباره قابل فروش خواهند بود. این عملیات برگشت‌پذیر نیست.'
                      : 'سفارش لغو و صندلی‌های نگه‌داشته آزاد می‌شوند.'}
                  </p>
                  <TextAreaField label="علت (اختیاری)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={255} />
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setConfirming(false)} className={secondaryButton}>
                      انصراف
                    </button>
                    <button type="submit" disabled={cancel.isPending} className="min-h-11 rounded-xl bg-danger px-5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-60">
                      {cancel.isPending ? 'در حال انجام...' : o.status === 'PAID' ? 'تأیید استرداد' : 'تأیید لغو'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
