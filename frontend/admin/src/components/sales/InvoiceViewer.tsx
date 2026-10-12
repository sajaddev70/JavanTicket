'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Pencil, Printer, Send, Undo2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { InlineAlert, secondaryButton } from '@/components/ui/Field';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { apiGet, apiPost } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { mediaUrl } from '@/lib/media';
import { INVOICE_STATUS, ORG_TYPES } from '@/lib/labels';
import { faDate, faNumber, faToman } from '@/lib/format';
import { numberToPersianWords } from '@/lib/numberToWords';
import { cn } from '@/lib/cn';

export interface InvoiceDetail {
  id: number;
  invoice_number: string;
  organization_id: number;
  group_reservation_id?: number | null;
  title: string;
  issue_date: string;
  due_date?: string | null;
  status: string;
  subtotal: number;
  discount_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  notes?: string | null;
  paid_at?: string | null;
  organization_name: string;
  org_type: string;
  contact_name?: string | null;
  contact_mobile?: string | null;
  organization_phone?: string | null;
  organization_address?: string | null;
  economic_code?: string | null;
  city_name?: string | null;
  items: { id: number; description: string; quantity: number; unit_price: number }[];
  seller?: { site_name?: string; logo_url?: string | null; contact_phone?: string | null; contact_email?: string | null; address?: string | null } | null;
}

/** A pro-forma invoice laid out as a printable A4 document, with the status workflow underneath. */
export function InvoiceViewer({ id, onClose, onEdit }: { id: number; onClose: () => void; onEdit: (id: number) => void }) {
  const queryClient = useQueryClient();
  const invoice = useQuery({ queryKey: ['admin', 'invoices', id], queryFn: () => apiGet<InvoiceDetail>(`/admin/invoices/${id}`) });
  const [notice, setNotice] = useState('');
  const change = useMutation({
    mutationFn: (status: string) => apiPost(`/admin/invoices/${id}/status`, { status }),
    onSuccess: (_, status) => {
      setNotice(`وضعیت به «${statusOf(INVOICE_STATUS, status).label}» تغییر کرد.`);
      queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'group-reservations'] });
    },
  });
  const inv = invoice.data;

  return (
    <Modal open title={inv ? `پیش‌فاکتور ${inv.invoice_number}` : 'پیش‌فاکتور'} onClose={onClose} className="sm:max-w-4xl">
      {invoice.isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : invoice.isError || !inv ? (
        <ErrorState message={errorMessage(invoice.error, 'دریافت پیش‌فاکتور با خطا مواجه شد.')} onRetry={() => invoice.refetch()} />
      ) : (
        <>
          {notice && !change.isError && (
            <div className="no-print mb-3">
              <InlineAlert tone="success">{notice}</InlineAlert>
            </div>
          )}
          {change.isError && (
            <div className="no-print mb-3">
              <InlineAlert tone="error">{errorMessage(change.error, 'تغییر وضعیت با خطا مواجه شد.')}</InlineAlert>
            </div>
          )}
          <div className="no-print mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={statusOf(INVOICE_STATUS, inv.status).tone}>{statusOf(INVOICE_STATUS, inv.status).label}</StatusPill>
            <div className="flex-1" />
            {(inv.status === 'DRAFT' || inv.status === 'ISSUED') && (
              <button type="button" onClick={() => onEdit(inv.id)} className={secondaryButton}>
                <Pencil className="size-4" />
                ویرایش
              </button>
            )}
            {inv.status === 'DRAFT' && (
              <ActionButton onClick={() => change.mutate('ISSUED')} busy={change.isPending} icon={<Send className="size-4" />} label="صدور نهایی" />
            )}
            {inv.status === 'ISSUED' && (
              <>
                <ActionButton onClick={() => change.mutate('PAID')} busy={change.isPending} icon={<CheckCircle2 className="size-4" />} label="ثبت پرداخت" tone="success" />
                <button type="button" onClick={() => change.mutate('DRAFT')} disabled={change.isPending} className={secondaryButton}>
                  <Undo2 className="size-4" />
                  بازگشت به پیش‌نویس
                </button>
              </>
            )}
            {inv.status !== 'CANCELLED' && (
              <button type="button" onClick={() => change.mutate('CANCELLED')} disabled={change.isPending} className={cn(secondaryButton, 'text-danger-fg')}>
                <Ban className="size-4" />
                ابطال
              </button>
            )}
            <button type="button" onClick={() => window.print()} className={secondaryButton}>
              <Printer className="size-4" />
              چاپ / PDF
            </button>
          </div>
          <InvoiceDocument inv={inv} />
        </>
      )}
    </Modal>
  );
}

function ActionButton({ onClick, busy, icon, label, tone = 'brand' }: { onClick: () => void; busy: boolean; icon: React.ReactNode; label: string; tone?: 'brand' | 'success' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={cn(
        'inline-flex min-h-11 items-center gap-2 rounded-xl px-5 text-sm font-bold text-white transition disabled:opacity-60',
        tone === 'success' ? 'bg-success-fg hover:opacity-90' : 'bg-brand-600 hover:bg-brand-700',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

/** The paper itself: always dark text on white, in screen and print. */
function InvoiceDocument({ inv }: { inv: InvoiceDetail }) {
  const seller = inv.seller ?? {};
  const logo = mediaUrl(seller.logo_url);
  const cell = 'border border-slate-300 px-2.5 py-2';
  return (
    <article className="print-area overflow-x-auto rounded-2xl border border-line bg-white p-5 text-[13px] leading-6 text-slate-900 sm:p-8">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- logo comes from the site settings */}
          {logo && <img src={logo} alt={seller.site_name ?? ''} className="h-16 w-auto object-contain" />}
          <div>
            <h2 className="text-[17px] font-black">{seller.site_name}</h2>
            {seller.address && <p className="text-[12px] text-slate-600">{seller.address}</p>}
            <p className="text-[12px] text-slate-600">
              {seller.contact_phone && <span dir="ltr">{seller.contact_phone}</span>}
              {seller.contact_email && <span className="mr-2">{seller.contact_email}</span>}
            </p>
          </div>
        </div>
        <div className="text-left">
          <h1 className="text-xl font-black">پیش‌فاکتور فروش</h1>
          <p>
            شماره: <span className="font-mono font-bold" dir="ltr">{inv.invoice_number}</span>
          </p>
          <p>تاریخ صدور: {faDate(inv.issue_date)}</p>
          {inv.due_date && <p>مهلت پرداخت: {faDate(inv.due_date)}</p>}
        </div>
      </header>

      <section className="mt-4 rounded-xl border border-slate-300 p-3">
        <h3 className="mb-1 font-extrabold">مشخصات خریدار</h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
          <p>
            نام: <b>{inv.organization_name}</b> ({statusOf(ORG_TYPES, inv.org_type).label})
          </p>
          <p>کد اقتصادی / شناسه ملی: {inv.economic_code ?? '—'}</p>
          <p>
            رابط: {inv.contact_name ?? '—'} {inv.contact_mobile && <span dir="ltr">({inv.contact_mobile})</span>}
          </p>
          <p>
            تلفن: <span dir="ltr">{inv.organization_phone ?? '—'}</span>
          </p>
          <p className="sm:col-span-2">
            نشانی: {[inv.city_name, inv.organization_address].filter(Boolean).join('، ') || '—'}
          </p>
        </div>
      </section>

      <h3 className="mt-4 font-extrabold">{inv.title}</h3>
      <table className="mt-2 w-full min-w-[560px] border-collapse text-right">
        <thead className="bg-slate-100">
          <tr>
            {['ردیف', 'شرح', 'تعداد', 'مبلغ واحد (تومان)', 'مبلغ کل (تومان)'].map((h) => (
              <th key={h} className={cn(cell, 'font-bold')}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {inv.items.map((it, i) => (
            <tr key={it.id}>
              <td className={cn(cell, 'w-12 text-center')}>{faNumber(i + 1)}</td>
              <td className={cell}>{it.description}</td>
              <td className={cn(cell, 'tabular w-20 text-center')}>{faNumber(it.quantity)}</td>
              <td className={cn(cell, 'tabular w-36')}>{faNumber(Number(it.unit_price))}</td>
              <td className={cn(cell, 'tabular w-40 font-bold')}>{faNumber(Number(it.unit_price) * it.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {[
            ['جمع کل', inv.subtotal],
            ['تخفیف', inv.discount_amount],
            [`مالیات بر ارزش افزوده (${faNumber(Number(inv.tax_percent))}٪)`, inv.tax_amount],
          ].map(([k, v]) => (
            <tr key={String(k)}>
              <td colSpan={4} className={cn(cell, 'text-left font-bold')}>
                {k}
              </td>
              <td className={cn(cell, 'tabular font-bold')}>{faNumber(Number(v))}</td>
            </tr>
          ))}
          <tr className="bg-slate-100">
            <td colSpan={4} className={cn(cell, 'text-left font-black')}>
              مبلغ قابل پرداخت
            </td>
            <td className={cn(cell, 'tabular font-black')}>{faNumber(Number(inv.total_amount))}</td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 font-bold">مبلغ به حروف: {numberToPersianWords(Number(inv.total_amount))} تومان</p>
      {inv.notes && <p className="mt-2 text-slate-700">توضیحات: {inv.notes}</p>}
      {inv.status === 'PAID' && inv.paid_at && <p className="mt-2 font-bold text-green-700">پرداخت شده در {faDate(inv.paid_at)} — {faToman(inv.total_amount)}</p>}
      {inv.status === 'CANCELLED' && <p className="mt-2 font-black text-red-700">این پیش‌فاکتور باطل شده است.</p>}

      <footer className="mt-10 grid grid-cols-2 gap-6 text-center text-[12px] text-slate-600">
        <div className="border-t border-slate-400 pt-2">مهر و امضای فروشنده</div>
        <div className="border-t border-slate-400 pt-2">مهر و امضای خریدار</div>
      </footer>
      <p className="mt-6 text-center text-[11px] text-slate-500">این پیش‌فاکتور تا تاریخ مهلت پرداخت معتبر است و پس از پرداخت، صورتحساب رسمی صادر می‌شود.</p>
    </article>
  );
}
