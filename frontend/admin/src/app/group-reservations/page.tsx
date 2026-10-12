'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CheckCircle2, Flag, FileText, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { InlineAlert, primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { RowMenu, type RowMenuItem } from '@/components/ui/RowMenu';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { FormModal } from '@/components/crud/FormModal';
import type { FieldDef, SelectOption } from '@/components/crud/fields';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Metric } from '@/services/dashboard';
import { ORG_TYPES, RESERVATION_STATUS, options } from '@/lib/labels';
import { faDate, faDateTime, faNumber, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

type Reservation = {
  id: number;
  organization_id: number;
  organization_name: string;
  org_type: string;
  city_name?: string | null;
  session_id?: number | null;
  start_time?: string | null;
  event_title?: string | null;
  hall_name?: string | null;
  session_capacity?: number | null;
  session_reserved?: number | null;
  seats: number;
  unit_price: number;
  discount_percent: number;
  total_amount: number;
  contact_name?: string | null;
  contact_mobile?: string | null;
  status: string;
  created_at: string;
  invoice_id?: number | null;
  invoice_number?: string | null;
  invoice_status?: string | null;
} & Record<string, unknown>;

interface Summary {
  reservations: Metric;
  seats: Metric;
  amount: Metric;
  pending: number;
}

type SessionRow = { id: number; event_title: string; title?: string | null; start_time: string; hall_name: string; city_name: string; status: string; capacity: number; reserved_seats: number; price: number };

export default function AdminGroupReservationsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <ReservationsScreen />
      </Suspense>
    </AdminLayout>
  );
}

function ReservationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const list = useQuery({ queryKey: ['admin', 'group-reservations'], queryFn: () => apiGet<Reservation[]>('/admin/group-reservations') });
  const summary = useQuery({ queryKey: ['admin', 'group-reservations', 'summary'], queryFn: () => apiGet<Summary>('/admin/group-reservations/summary') });
  const orgs = useOptions(['admin', 'organizations'], '/admin/organizations', (r) => String(r.name));
  const sessions = useQuery({ queryKey: ['admin', 'sessions'], queryFn: () => apiGet<SessionRow[]>('/admin/sessions') });

  const [status, setStatus] = useState('');
  const [org, setOrg] = useState(params.get('org') ?? '');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [editing, setEditing] = useState<Reservation | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Reservation | null>(null);
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (r) =>
          (!status || r.status === status) &&
          (!org || String(r.organization_id) === org) &&
          (!q.trim() || [r.organization_name, r.event_title, r.contact_name, r.invoice_number].some((v) => v?.includes(q.trim()))),
      ),
    [rows, status, org, q],
  );
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'group-reservations'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  async function run(action: () => Promise<unknown>, success: string) {
    setActionError('');
    setNotice('');
    try {
      await action();
      setNotice(success);
      refresh();
    } catch (err) {
      setActionError(errorMessage(err, 'عملیات با خطا مواجه شد.'));
    }
  }

  // Upcoming, not cancelled sessions; the reservation's own session stays selectable when editing.
  const sessionOptions = (values: Record<string, unknown>): SelectOption[] => {
    const now = Date.now();
    return (sessions.data ?? [])
      .filter((s) => String(s.id) === values.session_id || (s.status !== 'CANCELLED' && new Date(s.start_time).getTime() > now))
      .map((s) => ({
        value: s.id,
        label: `${s.title || s.event_title} — ${faDateTime(s.start_time)} — ${s.hall_name} (${s.city_name}) — ظرفیت آزاد ${faNumber(s.capacity - s.reserved_seats)}`,
      }));
  };

  const fields: FieldDef[] = [
    { name: 'organization_id', label: 'مدرسه / سازمان', type: 'select', numeric: true, required: true, options: orgs.options, wide: true },
    { name: 'session_id', label: 'سانس', type: 'select', numeric: true, options: sessionOptions, wide: true, emptyLabel: 'هنوز مشخص نشده', hint: 'رزرو تأییدشده از ظرفیت این سانس کم می‌شود.' },
    { name: 'seats', label: 'تعداد صندلی', type: 'number', required: true },
    { name: 'unit_price', label: 'قیمت هر بلیت (تومان)', type: 'number', hint: 'خالی = قیمت پایه سانس' },
    { name: 'discount_percent', label: 'درصد تخفیف گروهی', type: 'number', defaultValue: '0' },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'PENDING', options: options(RESERVATION_STATUS) },
    { name: 'contact_name', label: 'نام رابط', type: 'text' },
    { name: 'contact_mobile', label: 'موبایل رابط', type: 'text', dir: 'ltr', placeholder: '09123456789' },
    { name: 'notes', label: 'توضیحات', type: 'textarea', wide: true },
  ];

  const columns: DataColumn<Reservation>[] = [
    {
      key: 'org',
      label: 'مدرسه / سازمان',
      render: (r) => (
        <div>
          <div className="font-extrabold">{r.organization_name}</div>
          <div className="text-[12px] text-muted">
            {statusOf(ORG_TYPES, r.org_type).label}
            {r.city_name && ` · ${r.city_name}`} · ثبت {faDate(r.created_at)}
          </div>
        </div>
      ),
    },
    {
      key: 'session',
      label: 'رویداد / سانس',
      render: (r) =>
        r.event_title ? (
          <div>
            <div className="font-bold">{r.event_title}</div>
            <div className="text-[12px] text-muted">
              {r.start_time && faDateTime(r.start_time)} · {r.hall_name}
            </div>
          </div>
        ) : (
          <span className="text-muted">سانس تعیین نشده</span>
        ),
    },
    { key: 'seats', label: 'صندلی', center: true, render: (r) => <span className="tabular font-bold">{faNumber(r.seats)}</span> },
    {
      key: 'amount',
      label: 'مبلغ',
      center: true,
      render: (r) => (
        <div className="tabular">
          <div className="font-bold">{faToman(r.total_amount)}</div>
          <div className="text-[12px] text-muted">
            {faToman(r.unit_price)} {Number(r.discount_percent) > 0 && `· ${faNumber(Number(r.discount_percent))}٪ تخفیف`}
          </div>
        </div>
      ),
    },
    {
      key: 'invoice',
      label: 'پیش‌فاکتور',
      center: true,
      render: (r) =>
        r.invoice_number ? (
          <button type="button" onClick={() => router.push(`/invoices?open=${r.invoice_id}`)} className="font-mono text-[13px] font-bold text-brand-600 hover:underline" dir="ltr">
            {r.invoice_number}
          </button>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (r) => {
        const st = statusOf(RESERVATION_STATUS, r.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];

  const menu = (r: Reservation): RowMenuItem[] => {
    const status = (to: string, label: string) => () => run(() => apiPost(`/admin/group-reservations/${r.id}/status`, { status: to }), `وضعیت رزرو «${r.organization_name}» به «${label}» تغییر کرد.`);
    const items: RowMenuItem[] = [];
    if (r.status === 'PENDING') items.push({ label: 'تأیید رزرو', icon: <CheckCircle2 className="size-4" />, onClick: status('CONFIRMED', 'تأیید شده') });
    if (r.status === 'CONFIRMED') items.push({ label: 'ثبت برگزاری', icon: <Flag className="size-4" />, onClick: status('COMPLETED', 'برگزار شده') });
    if (r.status === 'CANCELLED') items.push({ label: 'بازگردانی به انتظار', icon: <CheckCircle2 className="size-4" />, onClick: status('PENDING', 'در انتظار تأیید') });
    if (r.invoice_id) items.push({ label: 'مشاهده پیش‌فاکتور', icon: <FileText className="size-4" />, onClick: () => router.push(`/invoices?open=${r.invoice_id}`) });
    else if (r.status !== 'CANCELLED')
      items.push({
        label: 'صدور پیش‌فاکتور',
        icon: <FileText className="size-4" />,
        onClick: async () => {
          setActionError('');
          try {
            const id = await apiPost<number>(`/admin/group-reservations/${r.id}/invoice`);
            refresh();
            router.push(`/invoices?open=${id}`);
          } catch (err) {
            setActionError(errorMessage(err, 'صدور پیش‌فاکتور با خطا مواجه شد.'));
          }
        },
      });
    if (r.status !== 'CANCELLED' && r.status !== 'COMPLETED') items.push({ label: 'لغو رزرو', icon: <Ban className="size-4" />, onClick: status('CANCELLED', 'لغو شده'), danger: true });
    items.push({ label: 'حذف', icon: <Trash2 className="size-4" />, onClick: () => setToDelete(r), danger: true });
    return items;
  };

  const s = summary.data;
  return (
    <div className="space-y-5">
      <PageHeader
        title="رزروهای گروهی"
        crumbs={['فروش و سفارشات', 'رزروهای گروهی']}
        action={
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
            <Plus className="size-5" />
            ثبت رزرو گروهی
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile title="رزروهای این ماه" value={faNumber(s?.reservations.value)} unit="درخواست رزرو" icon="admin/group-reservations" color="blue" changePercent={s?.reservations.changePercent} loading={summary.isLoading} />
        <StatTile title="صندلی‌های قطعی" value={faNumber(s?.seats.value)} unit="صندلی تأییدشده این ماه" icon="admin/seat-map" color="purple" changePercent={s?.seats.changePercent} loading={summary.isLoading} />
        <StatTile title="مبلغ رزروهای قطعی" value={faNumber(s?.amount.value)} unit="تومان در این ماه" icon="admin/finance" color="green" changePercent={s?.amount.changePercent} loading={summary.isLoading} />
        <StatTile title="در انتظار تأیید" value={faNumber(s?.pending)} unit="رزرو نیازمند بررسی" icon="status/warning" color="orange" changePercent={null} loading={summary.isLoading} />
      </div>

      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips
          value={status}
          onChange={reset(setStatus)}
          total={rows.length}
          allLabel="همه رزروها"
          options={options(RESERVATION_STATUS).map((o) => ({ ...o, count: rows.filter((r) => r.status === o.value).length }))}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="نام مدرسه، رویداد، رابط یا شماره پیش‌فاکتور..." />
          <FilterSelect value={org} onChange={reset(setOrg)} options={orgs.options} allLabel="همه مدارس و سازمان‌ها" />
        </div>
      </Card>

      {actionError && <InlineAlert tone="error">{actionError}</InlineAlert>}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={paginate(filtered, page, size)}
          rowKey={(r) => r.id}
          loading={list.isLoading}
          error={list.isError ? errorMessage(list.error, 'دریافت رزروها با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="رزرو گروهی مطابق فیلترها پیدا نشد."
          minWidth={1000}
          actions={(r) => (
            <>
              <IconButton label="ویرایش" onClick={() => setEditing(r)}>
                <Pencil className="size-5" />
              </IconButton>
              <RowMenu vertical items={menu(r)} />
            </>
          )}
        />
        {filtered.length > 0 && <Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} onPageSize={reset(setSize)} unit="رزرو" sizes={[10, 20, 50]} />}
      </Card>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'ثبت رزرو گروهی' : `ویرایش رزرو «${editing.organization_name}»`}
          fields={fields}
          initial={editing === 'new' ? (org ? { organization_id: org } : null) : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/group-reservations', body) : apiPut(`/admin/group-reservations/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف رزرو گروهی"
        message={`آیا از حذف رزرو «${toDelete?.organization_name}» (${faNumber(toDelete?.seats)} صندلی) اطمینان دارید؟ ظرفیت سانس آزاد می‌شود.`}
        onConfirm={async () => {
          if (!toDelete) return;
          const r = toDelete;
          setToDelete(null);
          await run(() => apiDelete(`/admin/group-reservations/${r.id}`), 'رزرو گروهی حذف شد.');
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
