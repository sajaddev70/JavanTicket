'use client';

import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { InlineAlert, primaryButton, secondaryButton } from '@/components/ui/Field';
import { useOptions } from '@/hooks/useOptions';
import { apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { faToman, isoDay, toEnDigits } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { InvoiceDetail } from './InvoiceViewer';

interface ItemDraft {
  description: string;
  quantity: string;
  unit_price: string;
}

const control =
  'h-11 w-full rounded-xl border border-line bg-field px-3 text-[14px] text-ink outline-none transition focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10';

const num = (v: string) => {
  const n = Number(toEnDigits(v).replace(/[,٬\s]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

/** Create / edit a pro-forma invoice: customer, dates, rows and live totals (the server recalculates them). */
export function InvoiceEditor({ id, defaultOrg, onClose, onSaved }: { id: number | null; defaultOrg?: string; onClose: () => void; onSaved: (id: number) => void }) {
  const existing = useQuery({ queryKey: ['admin', 'invoices', id], queryFn: () => apiGet<InvoiceDetail>(`/admin/invoices/${id}`), enabled: id !== null });
  return (
    <Modal open title={id === null ? 'صدور پیش‌فاکتور' : 'ویرایش پیش‌فاکتور'} onClose={onClose} className="sm:max-w-4xl">
      {id !== null && existing.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : (
        <EditorForm key={existing.data?.id ?? 'new'} invoice={existing.data ?? null} defaultOrg={defaultOrg} onClose={onClose} onSaved={onSaved} />
      )}
    </Modal>
  );
}

function EditorForm({ invoice, defaultOrg, onClose, onSaved }: { invoice: InvoiceDetail | null; defaultOrg?: string; onClose: () => void; onSaved: (id: number) => void }) {
  const orgs = useOptions(['admin', 'organizations'], '/admin/organizations', (r) => String(r.name));
  const today = new Date();
  const due = new Date();
  due.setDate(due.getDate() + 14);

  const [org, setOrg] = useState(invoice ? String(invoice.organization_id) : (defaultOrg ?? ''));
  const [title, setTitle] = useState(invoice?.title ?? '');
  const [issueDate, setIssueDate] = useState(invoice?.issue_date ?? isoDay(today));
  const [dueDate, setDueDate] = useState(invoice?.due_date ?? isoDay(due));
  const [tax, setTax] = useState(invoice ? String(Number(invoice.tax_percent)) : '10');
  const [discount, setDiscount] = useState(invoice ? String(Number(invoice.discount_amount)) : '0');
  const [notes, setNotes] = useState(invoice?.notes ?? '');
  const [issue, setIssue] = useState(false);
  const [items, setItems] = useState<ItemDraft[]>(
    invoice?.items.map((i) => ({ description: i.description, quantity: String(i.quantity), unit_price: String(Number(i.unit_price)) })) ?? [
      { description: '', quantity: '1', unit_price: '' },
    ],
  );

  const subtotal = items.reduce((sum, i) => sum + num(i.quantity) * num(i.unit_price), 0);
  const discountValue = Math.min(num(discount), subtotal);
  const taxValue = Math.round(((subtotal - discountValue) * num(tax)) / 100);
  const total = subtotal - discountValue + taxValue;

  const save = useMutation({
    mutationFn: async () => {
      const body = {
        organization_id: org ? Number(org) : null,
        group_reservation_id: invoice?.group_reservation_id ?? null,
        title,
        issue_date: issueDate || null,
        due_date: dueDate || null,
        tax_percent: num(tax),
        discount_amount: num(discount),
        notes,
        status: issue ? 'ISSUED' : 'DRAFT',
        items: items.filter((i) => i.description.trim()).map((i) => ({ description: i.description, quantity: num(i.quantity), unit_price: num(i.unit_price) })),
      };
      if (invoice) {
        await apiPut(`/admin/invoices/${invoice.id}`, body);
        return invoice.id;
      }
      return apiPost<number>('/admin/invoices', body);
    },
    onSuccess: (id) => {
      onSaved(id);
      onClose();
    },
  });

  const setItem = (i: number, patch: Partial<ItemDraft>) => setItems((list) => list.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const label = 'mb-1.5 block text-[13px] font-semibold text-ink/80';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4"
    >
      {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره پیش‌فاکتور با خطا مواجه شد.')}</InlineAlert>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className={label}>
            مدرسه / سازمان <span className="text-danger">*</span>
          </span>
          <select value={org} onChange={(e) => setOrg(e.target.value)} required className={cn(control, 'h-12')}>
            <option value="">انتخاب کنید</option>
            {orgs.options.map((o) => (
              <option key={o.value} value={String(o.value)}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className={label}>
            عنوان پیش‌فاکتور <span className="text-danger">*</span>
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={200} className={cn(control, 'h-12')} placeholder="مثلاً: بلیت گروهی نمایش ..." />
        </label>
        <label className="block">
          <span className={label}>تاریخ صدور</span>
          <input type="date" dir="ltr" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} className={cn(control, 'h-12')} />
        </label>
        <label className="block">
          <span className={label}>مهلت پرداخت</span>
          <input type="date" dir="ltr" value={dueDate} min={issueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(control, 'h-12')} />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[14px] font-extrabold text-ink">ردیف‌ها</span>
          <button
            type="button"
            onClick={() => setItems((l) => [...l, { description: '', quantity: '1', unit_price: '' }])}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line-strong px-3 text-[13px] font-bold text-brand-600 hover:border-brand-500/40"
          >
            <Plus className="size-4" />
            افزودن ردیف
          </button>
        </div>
        <div className="space-y-2">
          <div className="hidden grid-cols-[minmax(0,1fr)_90px_150px_130px_40px] gap-2 px-1 text-[12px] font-bold text-muted md:grid">
            <span>شرح</span>
            <span>تعداد</span>
            <span>مبلغ واحد (تومان)</span>
            <span>جمع</span>
            <span />
          </div>
          {items.map((it, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-line/70 p-2 md:grid-cols-[minmax(0,1fr)_90px_150px_130px_40px] md:items-center md:border-0 md:p-0">
              <input
                value={it.description}
                onChange={(e) => setItem(i, { description: e.target.value })}
                placeholder="شرح کالا / خدمت"
                aria-label="شرح"
                required={i === 0}
                className={cn(control, 'col-span-2 md:col-span-1')}
              />
              <input value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} inputMode="numeric" dir="ltr" aria-label="تعداد" className={cn(control, 'text-left')} />
              <input value={it.unit_price} onChange={(e) => setItem(i, { unit_price: e.target.value })} inputMode="numeric" dir="ltr" aria-label="مبلغ واحد" placeholder="0" className={cn(control, 'text-left')} />
              <span className="tabular flex items-center text-[13px] font-bold text-ink">{faToman(num(it.quantity) * num(it.unit_price))}</span>
              <button
                type="button"
                onClick={() => setItems((l) => (l.length > 1 ? l.filter((_, k) => k !== i) : l))}
                disabled={items.length === 1}
                aria-label="حذف ردیف"
                className="flex size-10 items-center justify-center justify-self-end rounded-xl text-danger-fg hover:bg-danger/10 disabled:opacity-30"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={label}>تخفیف (تومان)</span>
              <input value={discount} onChange={(e) => setDiscount(e.target.value)} inputMode="numeric" dir="ltr" className={cn(control, 'h-12 text-left')} />
            </label>
            <label className="block">
              <span className={label}>مالیات بر ارزش افزوده (٪)</span>
              <input value={tax} onChange={(e) => setTax(e.target.value)} inputMode="decimal" dir="ltr" className={cn(control, 'h-12 text-left')} />
            </label>
          </div>
          <label className="block">
            <span className={label}>توضیحات</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(control, 'min-h-20 py-3 leading-7')} />
          </label>
        </div>
        <dl className="space-y-2 self-start rounded-2xl border border-line/70 bg-surface-2/60 p-4 text-[13.5px]">
          {[
            ['جمع ردیف‌ها', faToman(subtotal)],
            ['تخفیف', faToman(discountValue)],
            ['مالیات', faToman(taxValue)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-muted">{k}</dt>
              <dd className="tabular font-bold text-ink">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-3 border-t border-line pt-2 text-[15px]">
            <dt className="font-extrabold text-ink">مبلغ قابل پرداخت</dt>
            <dd className="tabular font-black text-brand-600">{faToman(total)}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        {!invoice ? (
          <label className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
            <input type="checkbox" checked={issue} onChange={(e) => setIssue(e.target.checked)} className="size-4 accent-[var(--brand-600)]" />
            صدور نهایی (به‌جای ذخیره پیش‌نویس)
          </label>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <button type="button" onClick={onClose} className={secondaryButton}>
            انصراف
          </button>
          <button type="submit" disabled={save.isPending} className={primaryButton}>
            {save.isPending ? 'در حال ذخیره...' : 'ذخیره پیش‌فاکتور'}
          </button>
        </div>
      </div>
    </form>
  );
}
