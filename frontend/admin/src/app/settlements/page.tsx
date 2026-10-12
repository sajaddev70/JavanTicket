'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, Calculator, CheckCircle2, Pencil, Plus, RotateCcw, Trash2, Wallet } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { InlineAlert, TextField, primaryButton, secondaryButton } from '@/components/ui/Field';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { RowMenu, type RowMenuItem } from '@/components/ui/RowMenu';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Metric } from '@/services/dashboard';
import { SETTLEMENT_STATUS, options } from '@/lib/labels';
import { faDate, faNumber, faToman, toEnDigits } from '@/lib/format';
import { cn } from '@/lib/cn';

type Settlement = {
  id: number;
  settlement_number: string;
  payee_name: string;
  event_id?: number | null;
  event_title?: string | null;
  period_from?: string | null;
  period_to?: string | null;
  gross_amount: number;
  commission_percent: number;
  commission_amount: number;
  net_amount: number;
  iban?: string | null;
  status: string;
  reference_code?: string | null;
  paid_at?: string | null;
  notes?: string | null;
  created_at: string;
};

interface Summary {
  paid: Metric;
  commission: Metric;
  pendingAmount: number;
  pendingCount: number;
  approvedAmount: number;
  approvedCount: number;
}

export default function AdminSettlementsPage() {
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'settlements'], queryFn: () => apiGet<Settlement[]>('/admin/settlements') });
  const summary = useQuery({ queryKey: ['admin', 'settlements', 'summary'], queryFn: () => apiGet<Summary>('/admin/settlements/summary') });

  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [editing, setEditing] = useState<Settlement | 'new' | null>(null);
  const [paying, setPaying] = useState<Settlement | null>(null);
  const [toDelete, setToDelete] = useState<Settlement | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(
    () => rows.filter((r) => (!status || r.status === status) && (!q.trim() || [r.settlement_number, r.payee_name, r.event_title].some((v) => v?.includes(q.trim())))),
    [rows, status, q],
  );
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'settlements'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
  };
  async function changeStatus(r: Settlement, to: string) {
    setError('');
    setNotice('');
    try {
      await apiPost(`/admin/settlements/${r.id}/status`, { status: to });
      setNotice(`وضعیت تسویه ${r.settlement_number} به «${statusOf(SETTLEMENT_STATUS, to).label}» تغییر کرد.`);
      refresh();
    } catch (err) {
      setError(errorMessage(err, 'تغییر وضعیت با خطا مواجه شد.'));
    }
  }

  const menu = (r: Settlement): RowMenuItem[] => {
    const items: RowMenuItem[] = [];
    if (r.status === 'PENDING') items.push({ label: 'تأیید تسویه', icon: <CheckCircle2 className="size-4" />, onClick: () => changeStatus(r, 'APPROVED') });
    if (r.status === 'APPROVED') items.push({ label: 'ثبت پرداخت', icon: <Wallet className="size-4" />, onClick: () => setPaying(r) });
    if (r.status === 'REJECTED') items.push({ label: 'بازگشت به بررسی', icon: <RotateCcw className="size-4" />, onClick: () => changeStatus(r, 'PENDING') });
    if (r.status === 'PENDING' || r.status === 'APPROVED') items.push({ label: 'رد تسویه', icon: <Ban className="size-4" />, onClick: () => changeStatus(r, 'REJECTED'), danger: true });
    if (r.status === 'PENDING' || r.status === 'REJECTED') items.push({ label: 'حذف', icon: <Trash2 className="size-4" />, onClick: () => setToDelete(r), danger: true });
    return items;
  };

  const columns: DataColumn<Settlement>[] = [
    {
      key: 'number',
      label: 'شماره / طرف حساب',
      render: (r) => (
        <div>
          <div className="font-extrabold">{r.payee_name}</div>
          <span dir="ltr" className="font-mono text-[12px] text-muted">{r.settlement_number}</span>
        </div>
      ),
    },
    { key: 'event', label: 'رویداد', render: (r) => r.event_title ?? <span className="text-muted">عمومی</span> },
    {
      key: 'period',
      label: 'دوره',
      center: true,
      render: (r) => (r.period_from ? <span className="text-[13px]">{faDate(r.period_from)} تا {r.period_to ? faDate(r.period_to) : '—'}</span> : '—'),
    },
    { key: 'gross', label: 'فروش', center: true, render: (r) => <span className="tabular">{faToman(r.gross_amount)}</span> },
    {
      key: 'commission',
      label: 'کارمزد',
      center: true,
      render: (r) => (
        <span className="tabular">
          {faToman(r.commission_amount)} <span className="text-[12px] text-muted">({faNumber(Number(r.commission_percent))}٪)</span>
        </span>
      ),
    },
    { key: 'net', label: 'قابل پرداخت', center: true, render: (r) => <span className="tabular font-extrabold">{faToman(r.net_amount)}</span> },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (r) => {
        const st = statusOf(SETTLEMENT_STATUS, r.status);
        return (
          <div>
            <StatusPill tone={st.tone}>{st.label}</StatusPill>
            {r.status === 'PAID' && r.reference_code && <div className="mt-1 text-[11.5px] text-muted">پیگیری: <span dir="ltr">{r.reference_code}</span></div>}
          </div>
        );
      },
    },
  ];
  const s = summary.data;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="تسویه حساب‌ها"
          crumbs={['امور مالی', 'تسویه حساب‌ها']}
          action={
            <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
              <Plus className="size-5" />
              درخواست تسویه جدید
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="پرداخت‌شده این ماه" value={faNumber(s?.paid.value)} unit="تومان به برگزارکنندگان" icon="admin/settlements" color="green" changePercent={s?.paid.changePercent} loading={summary.isLoading} />
          <StatTile title="کارمزد این ماه" value={faNumber(s?.commission.value)} unit="تومان درآمد سامانه" icon="admin/finance" color="blue" changePercent={s?.commission.changePercent} loading={summary.isLoading} />
          <StatTile title="در انتظار بررسی" value={faNumber(s?.pendingAmount)} unit={`تومان در ${faNumber(s?.pendingCount)} درخواست`} icon="status/warning" color="orange" changePercent={null} loading={summary.isLoading} />
          <StatTile title="تأییدشده، آماده پرداخت" value={faNumber(s?.approvedAmount)} unit={`تومان در ${faNumber(s?.approvedCount)} تسویه`} icon="status/info" color="purple" changePercent={null} loading={summary.isLoading} />
        </div>

        <Card className="space-y-3 p-3 sm:p-4">
          <FilterChips
            value={status}
            onChange={reset(setStatus)}
            total={rows.length}
            options={options(SETTLEMENT_STATUS).map((o) => ({ ...o, count: rows.filter((r) => r.status === o.value).length }))}
          />
          <SearchInput value={q} onChange={reset(setQ)} placeholder="شماره تسویه، طرف حساب یا رویداد..." className="sm:max-w-md" />
        </Card>

        {error && <InlineAlert tone="error">{error}</InlineAlert>}
        {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

        <Card className="p-3 sm:p-4">
          <DataTable
            columns={columns}
            rows={paginate(filtered, page, size)}
            rowKey={(r) => r.id}
            loading={list.isLoading}
            error={list.isError ? errorMessage(list.error, 'دریافت تسویه‌ها با خطا مواجه شد.') : null}
            onRetry={() => list.refetch()}
            emptyMessage="تسویه‌ای مطابق فیلترها پیدا نشد."
            minWidth={1050}
            actions={(r) => (
              <>
                <IconButton label="ویرایش" onClick={() => setEditing(r)} disabled={r.status === 'APPROVED' || r.status === 'PAID'}>
                  <Pencil className="size-5" />
                </IconButton>
                {menu(r).length > 0 && <RowMenu vertical items={menu(r)} />}
              </>
            )}
          />
          {filtered.length > 0 && <Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} onPageSize={reset(setSize)} unit="تسویه" sizes={[10, 20, 50]} />}
        </Card>
      </div>

      {editing && <SettlementForm key={editing === 'new' ? 'new' : editing.id} settlement={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={refresh} />}
      {paying && <PayForm settlement={paying} onClose={() => setPaying(null)} onSaved={refresh} />}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف تسویه"
        message={`آیا از حذف تسویه ${toDelete?.settlement_number} اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          const r = toDelete;
          setToDelete(null);
          try {
            await apiDelete(`/admin/settlements/${r.id}`);
            refresh();
          } catch (err) {
            setError(errorMessage(err, 'حذف با خطا مواجه شد.'));
          }
        }}
        onClose={() => setToDelete(null)}
      />
    </AdminLayout>
  );
}

const num = (v: string) => Number(toEnDigits(v).replace(/[,٬\s]/g, '')) || 0;

/** Create / edit a settlement; the gross amount can be computed from the event's paid sales in the period. */
function SettlementForm({ settlement, onClose, onSaved }: { settlement: Settlement | null; onClose: () => void; onSaved: () => void }) {
  const events = useOptions(['admin', 'events'], '/admin/events', (r) => String(r.title));
  const [eventId, setEventId] = useState(settlement?.event_id ? String(settlement.event_id) : '');
  const [payee, setPayee] = useState(settlement?.payee_name ?? '');
  const [from, setFrom] = useState(settlement?.period_from ?? '');
  const [to, setTo] = useState(settlement?.period_to ?? '');
  const [gross, setGross] = useState(settlement ? String(Number(settlement.gross_amount)) : '');
  const [percent, setPercent] = useState(settlement ? String(Number(settlement.commission_percent)) : '10');
  const [iban, setIban] = useState(settlement?.iban ?? '');
  const [notes, setNotes] = useState(settlement?.notes ?? '');
  const [calcInfo, setCalcInfo] = useState('');

  const calc = useMutation({
    mutationFn: () => apiGet<{ gross_amount: number; payee_name?: string | null; already_settled: number }>('/admin/settlements/calculate', { eventId, ...(from ? { from } : {}), ...(to ? { to } : {}) }),
    onSuccess: (r) => {
      setGross(String(Math.round(r.gross_amount)));
      if (!payee && r.payee_name) setPayee(r.payee_name);
      setCalcInfo(`فروش پرداخت‌شده: ${faToman(r.gross_amount)} — پیش‌تر برای این رویداد ${faToman(r.already_settled)} تسویه ثبت شده است.`);
    },
  });
  const save = useMutation({
    mutationFn: () => {
      const body = {
        payee_name: payee,
        event_id: eventId ? Number(eventId) : null,
        period_from: from || null,
        period_to: to || null,
        gross_amount: num(gross),
        commission_percent: num(percent),
        iban: iban.replace(/\s/g, '') || null,
        notes,
      };
      return settlement ? apiPut(`/admin/settlements/${settlement.id}`, body) : apiPost('/admin/settlements', body);
    },
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  const commission = Math.round((num(gross) * num(percent)) / 100);
  const control = 'h-12 w-full rounded-xl border border-line bg-field px-3.5 text-[15px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10';
  const label = 'mb-1.5 block text-[13px] font-semibold text-ink/80';

  return (
    <Modal open title={settlement ? `ویرایش تسویه ${settlement.settlement_number}` : 'درخواست تسویه جدید'} onClose={onClose} className="sm:max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره تسویه با خطا مواجه شد.')}</InlineAlert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className={label}>رویداد</span>
            <select value={eventId} onChange={(e) => setEventId(e.target.value)} className={control}>
              <option value="">تسویه عمومی (بدون رویداد)</option>
              {events.options.map((o) => (
                <option key={o.value} value={String(o.value)}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={label}>شروع دوره</span>
            <input type="date" dir="ltr" value={from} onChange={(e) => setFrom(e.target.value)} className={control} />
          </label>
          <label className="block">
            <span className={label}>پایان دوره</span>
            <input type="date" dir="ltr" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={control} />
          </label>
          {eventId && (
            <div className="md:col-span-2">
              <button type="button" onClick={() => calc.mutate()} disabled={calc.isPending} className={secondaryButton}>
                <Calculator className="size-4" />
                {calc.isPending ? 'در حال محاسبه...' : 'محاسبه فروش رویداد در این دوره'}
              </button>
              {calcInfo && <p className="mt-2 text-[13px] text-muted">{calcInfo}</p>}
              {calc.isError && <p className="mt-2 text-[13px] text-danger-fg">{errorMessage(calc.error, 'محاسبه با خطا مواجه شد.')}</p>}
            </div>
          )}
          <label className="block md:col-span-2">
            <span className={label}>
              طرف حساب (برگزارکننده) <span className="text-danger">*</span>
            </span>
            <input value={payee} onChange={(e) => setPayee(e.target.value)} required maxLength={150} className={control} />
          </label>
          <label className="block">
            <span className={label}>
              مبلغ فروش (تومان) <span className="text-danger">*</span>
            </span>
            <input value={gross} onChange={(e) => setGross(e.target.value)} required inputMode="numeric" dir="ltr" className={cn(control, 'text-left')} />
          </label>
          <label className="block">
            <span className={label}>درصد کارمزد سامانه</span>
            <input value={percent} onChange={(e) => setPercent(e.target.value)} inputMode="decimal" dir="ltr" className={cn(control, 'text-left')} />
          </label>
          <label className="block md:col-span-2">
            <span className={label}>شماره شبا</span>
            <input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} dir="ltr" placeholder="IR000000000000000000000000" maxLength={34} className={cn(control, 'text-left font-mono')} />
          </label>
          <label className="block md:col-span-2">
            <span className={label}>توضیحات</span>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cn(control, 'h-auto min-h-20 py-3 leading-7')} />
          </label>
        </div>
        <div className="flex flex-wrap justify-between gap-3 rounded-2xl bg-surface-2 p-4 text-[13.5px]">
          <span className="text-muted">
            کارمزد: <b className="tabular text-ink">{faToman(commission)}</b>
          </span>
          <span className="text-muted">
            قابل پرداخت: <b className="tabular text-brand-600">{faToman(num(gross) - commission)}</b>
          </span>
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>
            انصراف
          </button>
          <button type="submit" disabled={save.isPending} className={primaryButton}>
            {save.isPending ? 'در حال ذخیره...' : 'ذخیره'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PayForm({ settlement, onClose, onSaved }: { settlement: Settlement; onClose: () => void; onSaved: () => void }) {
  const [ref, setRef] = useState('');
  const pay = useMutation({
    mutationFn: () => apiPost(`/admin/settlements/${settlement.id}/status`, { status: 'PAID', reference_code: ref }),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });
  return (
    <Modal open title="ثبت پرداخت تسویه" onClose={onClose} className="sm:max-w-md">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          pay.mutate();
        }}
        className="space-y-4"
      >
        {pay.isError && <InlineAlert tone="error">{errorMessage(pay.error, 'ثبت پرداخت با خطا مواجه شد.')}</InlineAlert>}
        <p className="text-[14px] leading-7 text-muted">
          پرداخت <b className="text-ink">{faToman(settlement.net_amount)}</b> به «{settlement.payee_name}»
          {settlement.iban && (
            <>
              {' '}
              به شبای <span dir="ltr" className="font-mono">{settlement.iban}</span>
            </>
          )}
          .
        </p>
        <TextField label="کد پیگیری واریز" value={ref} onChange={(e) => setRef(e.target.value)} required dir="ltr" maxLength={60} />
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className={secondaryButton}>
            انصراف
          </button>
          <button type="submit" disabled={pay.isPending || !ref.trim()} className={primaryButton}>
            {pay.isPending ? 'در حال ثبت...' : 'ثبت پرداخت'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
