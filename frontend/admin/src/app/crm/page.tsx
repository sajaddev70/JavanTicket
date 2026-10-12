'use client';

import { useMemo, useState } from 'react';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Eye, MessageSquarePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { InlineAlert, primaryButton, secondaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { FormModal } from '@/components/crud/FormModal';
import type { FieldDef } from '@/components/crud/fields';
import { BarList } from '@/components/charts/BarList';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { DetailGrid, SectionTitle } from '@/components/data/Detail';
import { OrderDetailModal } from '@/components/sales/OrderDetailModal';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Page } from '@/services/admin';
import type { Metric } from '@/services/dashboard';
import { cleanParams } from '@/lib/download';
import { CRM_CHANNEL, CRM_SEGMENT, CRM_STATUS, ORDER_STATUS, USER_STATUS, options } from '@/lib/labels';
import { faDate, faDateTime, faNumber, faPercent, faTimeAgo, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Customer {
  id: number;
  full_name?: string | null;
  mobile: string;
  email?: string | null;
  status: string;
  created_at: string;
  notes?: string | null;
  orders_count: number;
  total_spent: number;
  last_order_at?: string | null;
  tickets_count: number;
  interactions_count: number;
  segment: string;
}

interface CustomerDetail extends Customer {
  orders: { id: number; order_number: string; status: string; total_amount: number; created_at: string; event_title?: string | null; tickets_count: number }[];
  categories: { name: string; color?: string | null; orders: number; amount: number }[];
  interactions: Interaction[];
}

type Interaction = {
  id: number;
  user_id?: number | null;
  organization_id?: number | null;
  customer_name?: string | null;
  customer_mobile?: string | null;
  organization_name?: string | null;
  channel: string;
  subject: string;
  notes?: string | null;
  status: string;
  follow_up_at?: string | null;
  created_by_name?: string | null;
  created_at: string;
  overdue: boolean;
} & Record<string, unknown>;

interface Summary {
  customers: Metric;
  newCustomers: Metric;
  activeBuyers: Metric;
  repeatRate: number;
  openFollowUps: number;
  dueFollowUps: number;
}

const SORTS = [
  { value: 'spent', label: 'بیشترین خرید' },
  { value: 'orders', label: 'بیشترین سفارش' },
  { value: 'recent', label: 'آخرین خرید' },
  { value: 'joined', label: 'جدیدترین عضو' },
];

export default function AdminCrmPage() {
  const [tab, setTab] = useState<'customers' | 'followups'>('customers');
  const summary = useQuery({ queryKey: ['admin', 'crm', 'summary'], queryFn: () => apiGet<Summary>('/admin/crm/summary') });
  const s = summary.data;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="مدیریت ارتباط با مشتریان (CRM)" crumbs={['CRM']} />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="مشتریان" value={faNumber(s?.customers.value)} unit="کاربر ثبت‌نام‌شده" icon="admin/crm" color="blue" changePercent={s?.customers.changePercent} loading={summary.isLoading} />
          <StatTile title="مشتریان جدید" value={faNumber(s?.newCustomers.value)} unit="عضو جدید این ماه" icon="common/profile" color="purple" changePercent={s?.newCustomers.changePercent} loading={summary.isLoading} />
          <StatTile
            title="خریداران فعال"
            value={faNumber(s?.activeBuyers.value)}
            unit={`در ۳۰ روز اخیر · نرخ خرید مجدد ${faPercent(s?.repeatRate)}`}
            icon="common/ticket"
            color="green"
            changePercent={s?.activeBuyers.changePercent}
            compareLabel="نسبت به ۳۰ روز قبل"
            loading={summary.isLoading}
          />
          <StatTile title="پیگیری‌های باز" value={faNumber(s?.openFollowUps)} unit={`${faNumber(s?.dueFollowUps)} مورد سررسید شده`} icon="common/chat" color="orange" changePercent={null} loading={summary.isLoading} />
        </div>

        <div className="flex gap-2 border-b border-line" role="tablist">
          {(
            [
              ['customers', 'مشتریان'],
              ['followups', 'پیگیری‌ها و تعاملات'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={cn('-mb-px border-b-2 px-4 py-3 text-[14.5px] font-bold transition', tab === key ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink')}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'customers' ? <CustomersTab /> : <FollowUpsTab />}
      </div>
    </AdminLayout>
  );
}

function CustomersTab() {
  const [segment, setSegment] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('spent');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [openId, setOpenId] = useState<number | null>(null);

  const segments = useQuery({ queryKey: ['admin', 'crm', 'segments'], queryFn: () => apiGet<Record<string, number>>('/admin/crm/segments') });
  const filters = { segment, status, sort, q };
  const list = useQuery({
    queryKey: ['admin', 'crm', 'customers', filters, page, size],
    queryFn: () => apiGet<Page<Customer>>('/admin/crm/customers', cleanParams({ ...filters, page, size })),
    placeholderData: keepPreviousData,
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const counts = segments.data ?? {};

  const columns: DataColumn<Customer>[] = [
    {
      key: 'name',
      label: 'مشتری',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[14px] font-extrabold text-brand-600">
            {(c.full_name ?? '؟').trim().slice(0, 1)}
          </span>
          <div className="min-w-0">
            <div className="truncate font-extrabold">{c.full_name || 'بدون نام'}</div>
            <div dir="ltr" className="text-right text-[12px] text-muted">{c.mobile}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'segment',
      label: 'بخش',
      center: true,
      render: (c) => {
        const st = statusOf(CRM_SEGMENT, c.segment);
        return <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>;
      },
    },
    { key: 'orders', label: 'سفارش / بلیت', center: true, render: (c) => <span className="tabular">{faNumber(c.orders_count)} / {faNumber(c.tickets_count)}</span> },
    { key: 'spent', label: 'مجموع خرید', center: true, render: (c) => <span className="tabular font-bold">{faToman(c.total_spent)}</span> },
    { key: 'last', label: 'آخرین خرید', center: true, render: (c) => (c.last_order_at ? faTimeAgo(c.last_order_at) : '—') },
    { key: 'joined', label: 'عضویت', center: true, render: (c) => faDate(c.created_at) },
    {
      key: 'status',
      label: 'حساب',
      center: true,
      render: (c) => {
        const st = statusOf(USER_STATUS, c.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];

  return (
    <>
      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips
          value={segment}
          onChange={reset(setSegment)}
          total={Object.values(counts).reduce((a, b) => a + b, 0)}
          allLabel="همه مشتریان"
          options={options(CRM_SEGMENT).map((o) => ({ ...o, count: counts[o.value] ?? 0 }))}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="نام، موبایل یا ایمیل..." />
          <FilterSelect value={status} onChange={reset(setStatus)} options={options(USER_STATUS)} allLabel="همه حساب‌ها" />
          <FilterSelect value={sort === 'spent' ? '' : sort} onChange={reset((v: string) => setSort(v || 'spent'))} options={SORTS.slice(1)} allLabel={`مرتب‌سازی: ${SORTS[0].label}`} />
        </div>
      </Card>
      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={list.data?.items}
          rowKey={(c) => c.id}
          loading={list.isFetching}
          error={list.isError ? errorMessage(list.error, 'دریافت مشتریان با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="مشتری‌ای مطابق فیلترها پیدا نشد."
          onRowClick={(c) => setOpenId(c.id)}
          actions={(c) => (
            <IconButton label="پرونده مشتری" onClick={() => setOpenId(c.id)}>
              <Eye className="size-5" />
            </IconButton>
          )}
        />
        {!!list.data?.total && <Pagination page={page} pageSize={size} total={list.data.total} onPage={setPage} onPageSize={reset(setSize)} unit="مشتری" sizes={[10, 20, 50]} />}
      </Card>
      {openId !== null && <CustomerModal id={openId} onClose={() => setOpenId(null)} />}
    </>
  );
}

/** Customer file: profile (editable), purchase stats, favorite categories, orders and follow-ups. */
function CustomerModal({ id, onClose }: { id: number; onClose: () => void }) {
  const queryClient = useQueryClient();
  const customer = useQuery({ queryKey: ['admin', 'crm', 'customer', id], queryFn: () => apiGet<CustomerDetail>(`/admin/crm/customers/${id}`) });
  const [editing, setEditing] = useState(false);
  const [newInteraction, setNewInteraction] = useState(false);
  const [order, setOrder] = useState<number | null>(null);
  const c = customer.data;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'crm'] });

  return (
    <Modal open title={c ? `پرونده ${c.full_name || c.mobile}` : 'پرونده مشتری'} onClose={onClose} className="sm:max-w-4xl">
      {customer.isLoading ? (
        <Skeleton className="h-96 rounded-2xl" />
      ) : customer.isError || !c ? (
        <ErrorState message={errorMessage(customer.error, 'دریافت اطلاعات مشتری با خطا مواجه شد.')} onRetry={() => customer.refetch()} />
      ) : (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <StatusPill tone={statusOf(CRM_SEGMENT, c.segment).tone} dot={false}>{statusOf(CRM_SEGMENT, c.segment).label}</StatusPill>
            <StatusPill tone={statusOf(USER_STATUS, c.status).tone}>{statusOf(USER_STATUS, c.status).label}</StatusPill>
            <div className="flex-1" />
            <button type="button" onClick={() => setEditing(true)} className={secondaryButton}>
              <Pencil className="size-4" />
              ویرایش اطلاعات
            </button>
            <button type="button" onClick={() => setNewInteraction(true)} className={primaryButton}>
              <MessageSquarePlus className="size-4" />
              ثبت پیگیری
            </button>
          </div>
          <DetailGrid
            items={[
              ['موبایل', <span key="m" dir="ltr">{c.mobile}</span>],
              ['ایمیل', c.email ?? '—'],
              ['تاریخ عضویت', faDate(c.created_at)],
              ['آخرین خرید', c.last_order_at ? faDateTime(c.last_order_at) : '—'],
              ['تعداد سفارش / بلیت', `${faNumber(c.orders_count)} سفارش · ${faNumber(c.tickets_count)} بلیت`],
              ['مجموع خرید', faToman(c.total_spent)],
              ...(c.notes ? ([['یادداشت', c.notes]] as [string, React.ReactNode][]) : []),
            ]}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div>
              <SectionTitle>علاقه‌مندی‌ها (دسته‌بندی خریدها)</SectionTitle>
              <BarList
                items={c.categories.map((k) => ({ key: k.name, label: k.name, value: Number(k.orders), dot: k.color, hint: faToman(k.amount) }))}
                format={(v) => `${faNumber(v)} سفارش`}
                emptyMessage="هنوز خریدی ثبت نشده است."
              />
            </div>
            <div>
              <SectionTitle>پیگیری‌ها ({faNumber(c.interactions.length)})</SectionTitle>
              {c.interactions.length === 0 ? (
                <EmptyState message="پیگیری‌ای ثبت نشده است." />
              ) : (
                <ul className="space-y-2">
                  {c.interactions.map((i) => (
                    <li key={i.id} className="rounded-xl border border-line/70 p-3 text-[13px]">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">{i.subject}</span>
                        <StatusPill tone={statusOf(CRM_STATUS, i.status).tone}>{statusOf(CRM_STATUS, i.status).label}</StatusPill>
                      </div>
                      <p className="mt-1 text-muted">
                        {statusOf(CRM_CHANNEL, i.channel).label} · {faDateTime(i.created_at)}
                        {i.created_by_name && ` · ${i.created_by_name}`}
                      </p>
                      {i.notes && <p className="mt-1 leading-6 text-ink/90">{i.notes}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <SectionTitle>آخرین سفارش‌ها</SectionTitle>
          {c.orders.length === 0 ? (
            <EmptyState message="سفارشی ثبت نشده است." />
          ) : (
            <ul className="divide-y divide-line/70 rounded-xl border border-line/70">
              {c.orders.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => setOrder(o.id)} className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2.5 text-right text-[13px] hover:bg-field/50">
                    <span dir="ltr" className="font-mono font-bold text-ink">{o.order_number}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{o.event_title ?? '—'}</span>
                    <span className="text-muted">{faDate(o.created_at)}</span>
                    <span className="tabular font-bold text-ink">{faToman(o.total_amount)}</span>
                    <StatusPill tone={statusOf(ORDER_STATUS, o.status).tone}>{statusOf(ORDER_STATUS, o.status).label}</StatusPill>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {editing && c && (
        <FormModal
          title="ویرایش اطلاعات مشتری"
          fields={[
            { name: 'full_name', label: 'نام و نام خانوادگی', type: 'text' },
            { name: 'email', label: 'ایمیل', type: 'text', dir: 'ltr' },
            { name: 'status', label: 'وضعیت حساب', type: 'select', required: true, options: options(USER_STATUS), hint: 'حساب غیرفعال نمی‌تواند وارد سایت شود.' },
            { name: 'notes', label: 'یادداشت داخلی', type: 'textarea', wide: true },
          ]}
          initial={c as unknown as Record<string, unknown>}
          submit={(body) => apiPut(`/admin/crm/customers/${c.id}`, body)}
          onSaved={refresh}
          onClose={() => setEditing(false)}
        />
      )}
      {newInteraction && c && (
        <FormModal
          title={`ثبت پیگیری برای ${c.full_name || c.mobile}`}
          fields={interactionFields(false)}
          initial={{ user_id: c.id, channel: 'CALL', status: 'OPEN' }}
          submit={(body) => apiPost('/admin/crm/interactions', { ...body, user_id: c.id })}
          onSaved={refresh}
          onClose={() => setNewInteraction(false)}
        />
      )}
      {order !== null && <OrderDetailModal id={order} onClose={() => setOrder(null)} />}
    </Modal>
  );
}

function interactionFields(withTarget: boolean, orgOptions: { value: number; label: string }[] = [], customerOptions: { value: number; label: string }[] = []): FieldDef[] {
  return [
    ...(withTarget
      ? ([
          { name: 'user_id', label: 'مشتری', type: 'select', numeric: true, options: customerOptions, emptyLabel: '—', hint: 'یا مشتری یا مدرسه / سازمان را انتخاب کنید.' },
          { name: 'organization_id', label: 'مدرسه / سازمان', type: 'select', numeric: true, options: orgOptions, emptyLabel: '—' },
        ] as FieldDef[])
      : []),
    { name: 'subject', label: 'موضوع', type: 'text', required: true, wide: true },
    { name: 'channel', label: 'کانال ارتباط', type: 'select', required: true, defaultValue: 'CALL', options: options(CRM_CHANNEL) },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'OPEN', options: options(CRM_STATUS) },
    { name: 'follow_up_at', label: 'زمان پیگیری بعدی', type: 'datetime' },
    { name: 'notes', label: 'شرح', type: 'textarea', wide: true },
  ];
}

function FollowUpsTab() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Interaction | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Interaction | null>(null);
  const list = useQuery({ queryKey: ['admin', 'crm', 'interactions'], queryFn: () => apiGet<Interaction[]>('/admin/crm/interactions') });
  const orgs = useOptions(['admin', 'organizations'], '/admin/organizations', (r) => String(r.name));
  const customers = useQuery({
    queryKey: ['admin', 'crm', 'customers', 'options'],
    queryFn: () => apiGet<Page<Customer>>('/admin/crm/customers', { sort: 'recent', size: 200 }),
    enabled: editing !== null,
  });
  const close = useMutation({
    mutationFn: (i: Interaction) =>
      apiPut(`/admin/crm/interactions/${i.id}`, { user_id: i.user_id, organization_id: i.organization_id, channel: i.channel, subject: i.subject, notes: i.notes, status: 'CLOSED', follow_up_at: null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'crm'] }),
  });

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (i) =>
          (!status || (status === 'OVERDUE' ? i.overdue : i.status === status)) &&
          (!q.trim() || [i.subject, i.customer_name, i.customer_mobile, i.organization_name].some((v) => v?.includes(q.trim()))),
      ),
    [rows, status, q],
  );
  const size = 10;
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'crm'] });
  const customerOptions = (customers.data?.items ?? []).map((c) => ({ value: c.id, label: `${c.full_name ?? ''} (${c.mobile})` }));
  if (editing && editing !== 'new' && editing.user_id && !customerOptions.some((o) => o.value === editing.user_id)) {
    customerOptions.unshift({ value: editing.user_id, label: `${editing.customer_name ?? ''} (${editing.customer_mobile ?? ''})` });
  }

  const columns: DataColumn<Interaction>[] = [
    {
      key: 'subject',
      label: 'موضوع',
      render: (i) => (
        <div className="min-w-0">
          <div className="font-extrabold">{i.subject}</div>
          {i.notes && <div className="line-clamp-1 max-w-[320px] text-[12px] text-muted">{i.notes}</div>}
        </div>
      ),
    },
    {
      key: 'who',
      label: 'مخاطب',
      render: (i) => (
        <div>
          <div className="font-bold">{i.customer_name ?? i.organization_name ?? '—'}</div>
          {i.customer_mobile && <div dir="ltr" className="text-right text-[12px] text-muted">{i.customer_mobile}</div>}
          {i.organization_name && !i.customer_name && <div className="text-[12px] text-muted">مدرسه / سازمان</div>}
        </div>
      ),
    },
    { key: 'channel', label: 'کانال', center: true, render: (i) => statusOf(CRM_CHANNEL, i.channel).label },
    {
      key: 'follow',
      label: 'پیگیری بعدی',
      center: true,
      render: (i) => (i.follow_up_at ? <span className={cn('text-[13px]', i.overdue && 'font-bold text-danger-fg')}>{faDateTime(i.follow_up_at)}</span> : '—'),
    },
    { key: 'by', label: 'ثبت‌کننده', center: true, render: (i) => <span className="text-[13px]">{i.created_by_name ?? '—'}<div className="text-[12px] text-muted">{faTimeAgo(i.created_at)}</div></span> },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (i) => {
        const st = statusOf(CRM_STATUS, i.status);
        return <StatusPill tone={i.overdue ? 'danger' : st.tone}>{i.overdue ? 'سررسید گذشته' : st.label}</StatusPill>;
      },
    },
  ];

  return (
    <>
      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          total={rows.length}
          options={[
            ...options(CRM_STATUS).map((o) => ({ ...o, count: rows.filter((r) => r.status === o.value).length })),
            { value: 'OVERDUE', label: 'سررسید گذشته', count: rows.filter((r) => r.overdue).length },
          ]}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="موضوع، نام یا موبایل..."
            className="flex-1"
          />
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12')}>
            <Plus className="size-5" />
            ثبت پیگیری
          </button>
        </div>
      </Card>
      {close.isError && <InlineAlert tone="error">{errorMessage(close.error, 'بستن پیگیری با خطا مواجه شد.')}</InlineAlert>}
      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={filtered.slice((page - 1) * size, page * size)}
          rowKey={(i) => i.id}
          loading={list.isLoading}
          error={list.isError ? errorMessage(list.error, 'دریافت پیگیری‌ها با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="پیگیری‌ای مطابق فیلترها پیدا نشد."
          actions={(i) => (
            <>
              {i.status !== 'CLOSED' && (
                <IconButton label="بستن پیگیری" tone="success" onClick={() => close.mutate(i)}>
                  <CheckCircle2 className="size-5" />
                </IconButton>
              )}
              <IconButton label="ویرایش" onClick={() => setEditing(i)}>
                <Pencil className="size-5" />
              </IconButton>
              <IconButton label="حذف" tone="danger" onClick={() => setToDelete(i)}>
                <Trash2 className="size-5" />
              </IconButton>
            </>
          )}
        />
        {filtered.length > 0 && <Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} unit="پیگیری" />}
      </Card>

      {editing && (
        <FormModal
          key={editing === 'new' ? `new-${customerOptions.length}` : `${editing.id}-${customerOptions.length}`}
          title={editing === 'new' ? 'ثبت پیگیری' : 'ویرایش پیگیری'}
          fields={interactionFields(true, orgs.options as { value: number; label: string }[], customerOptions)}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/crm/interactions', body) : apiPut(`/admin/crm/interactions/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={!!toDelete}
        title="حذف پیگیری"
        message={`آیا از حذف پیگیری «${toDelete?.subject}» اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          await apiDelete(`/admin/crm/interactions/${toDelete.id}`).catch(() => undefined);
          setToDelete(null);
          refresh();
        }}
        onClose={() => setToDelete(null)}
      />
    </>
  );
}
