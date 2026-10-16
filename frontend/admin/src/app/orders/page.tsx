'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { Thumb } from '@/components/crud/cells';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { DateRangePicker, ExportButton, FilterChips, SearchInput, type DateRange } from '@/components/data/Filters';
import { OrderDetailModal, type Order } from '@/components/sales/OrderDetailModal';
import { useOptions } from '@/hooks/useOptions';
import { apiGet } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Page } from '@/services/admin';
import type { Metric } from '@/services/dashboard';
import { downloadFile, cleanParams } from '@/lib/download';
import { ORDER_STATUS, options } from '@/lib/labels';
import { faDateTime, faNumber, faToman } from '@/lib/format';

interface OrdersSummary {
  sales: Metric;
  paidOrders: Metric;
  tickets: Metric;
  cancelled: Metric;
  averageOrder: number;
  statusCounts: Record<string, number>;
}

export default function AdminOrdersPage() {
  return (
    <AdminLayout>
      <Suspense>
        <OrdersScreen />
      </Suspense>
    </AdminLayout>
  );
}

function OrdersScreen() {
  const params = useSearchParams();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [city, setCity] = useState('');
  const [event, setEvent] = useState('');
  const [range, setRange] = useState<DateRange>({ from: '', to: '' });
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [openId, setOpenId] = useState<number | null>(null);

  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));
  const events = useOptions(['admin', 'events'], '/admin/events', (r) => String(r.title));
  const summary = useQuery({ queryKey: ['admin', 'orders', 'summary'], queryFn: () => apiGet<OrdersSummary>('/admin/orders/summary') });
  const filters = { status, q, cityId: city, eventId: event, from: range.from, to: range.to };
  const list = useQuery({
    queryKey: ['admin', 'orders', 'list', filters, page, size],
    queryFn: () => apiGet<Page<Order>>('/admin/orders', cleanParams({ ...filters, page, size })),
    placeholderData: keepPreviousData,
  });

  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const s = summary.data;
  const counts = s?.statusCounts ?? {};

  const columns: DataColumn<Order>[] = [
    {
      key: 'number',
      label: 'شماره سفارش',
      render: (o) => (
        <div>
          <span dir="ltr" className="font-mono text-[13px] font-bold text-ink">{o.order_number}</span>
          <div className="text-[12px] text-muted">{faDateTime(o.created_at)}</div>
        </div>
      ),
    },
    {
      key: 'customer',
      label: 'مشتری',
      render: (o) => (
        <div>
          <div className="font-bold">{o.customer_name || 'بدون نام'}</div>
          <div dir="ltr" className="text-right text-[12px] text-muted">{o.customer_mobile}</div>
        </div>
      ),
    },
    {
      key: 'event',
      label: 'رویداد / سانس',
      render: (o) => (
        <div className="flex items-center gap-2.5">
          <Thumb src={o.event_banner_url} className="hidden size-10 shrink-0 rounded-lg object-cover lg:block" />
          <div className="min-w-0">
            <div className="truncate font-bold">{o.event_title ?? '—'}</div>
            <div className="text-[12px] text-muted">
              {[o.city_name, o.hall_name].filter(Boolean).join(' · ')}
              {o.start_time && ` · ${faDateTime(o.start_time)}`}
            </div>
          </div>
        </div>
      ),
    },
    { key: 'tickets', label: 'بلیت', center: true, render: (o) => <span className="tabular">{faNumber(o.tickets_count)}</span> },
    {
      key: 'amount',
      label: 'مبلغ',
      center: true,
      render: (o) => (
        <div className="tabular">
          <div className="font-bold">{faToman(o.total_amount)}</div>
          {Number(o.discount_amount) > 0 && <div className="text-[12px] text-success-fg">تخفیف {faToman(o.discount_amount)}</div>}
        </div>
      ),
    },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (o) => {
        const st = statusOf(ORDER_STATUS, o.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="فروش و سفارشات"
        crumbs={['فروش و سفارشات']}
        action={<ExportButton onExport={() => downloadFile('/admin/orders/export', filters, 'orders.csv')} />}
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile title="فروش این ماه" value={faNumber(s?.sales.value)} unit="تومان" icon="admin/finance" color="green" changePercent={s?.sales.changePercent} loading={summary.isLoading} />
        <StatTile title="سفارش‌های پرداخت‌شده" value={faNumber(s?.paidOrders.value)} unit={`میانگین هر سفارش ${faToman(s?.averageOrder)}`} icon="admin/orders" color="blue" changePercent={s?.paidOrders.changePercent} loading={summary.isLoading} />
        <StatTile title="بلیت‌های فروخته‌شده" value={faNumber(s?.tickets.value)} unit="بلیت در این ماه" icon="common/ticket" color="orange" changePercent={s?.tickets.changePercent} loading={summary.isLoading} />
        <StatTile title="لغو و استرداد" value={faNumber(s?.cancelled.value)} unit="سفارش در این ماه" icon="admin/invoice" color="red" changePercent={s?.cancelled.changePercent} loading={summary.isLoading} />
      </div>

      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips
          value={status}
          onChange={reset(setStatus)}
          total={Object.values(counts).reduce((a, b) => a + b, 0)}
          allLabel="همه سفارش‌ها"
          options={options(ORDER_STATUS).map((o) => ({ ...o, count: counts[o.value] ?? 0 }))}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="شماره سفارش، نام یا موبایل مشتری، رویداد..." />
          <FilterSelect value={city} onChange={reset(setCity)} options={cities.options} allLabel="همه شهرها" />
          <FilterSelect value={event} onChange={reset(setEvent)} options={events.options} allLabel="همه رویدادها" />
        </div>
        <DateRangePicker value={range} onChange={reset(setRange)} allowAll />
      </Card>

      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={list.data?.items}
          rowKey={(o) => o.id}
          loading={list.isFetching}
          error={list.isError ? errorMessage(list.error, 'دریافت سفارش‌ها با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="سفارشی مطابق فیلترها پیدا نشد."
          onRowClick={(o) => setOpenId(o.id)}
          actions={(o) => (
            <IconButton label="جزئیات سفارش" onClick={() => setOpenId(o.id)}>
              <Eye className="size-5" />
            </IconButton>
          )}
        />
        {!!list.data?.total && (
          <Pagination page={page} pageSize={size} total={list.data.total} onPage={setPage} onPageSize={reset(setSize)} unit="سفارش" sizes={[10, 20, 50, 100]} />
        )}
      </Card>

      {openId !== null && <OrderDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}

