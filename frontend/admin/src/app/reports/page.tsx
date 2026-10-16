'use client';

import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { StatTile } from '@/components/ui/StatTile';
import { Thumb } from '@/components/crud/cells';
import { TrendChart } from '@/components/charts/TrendChart';
import { BarList } from '@/components/charts/BarList';
import { DataTable, type DataColumn } from '@/components/data/DataTable';
import { DateRangePicker, lastDays, type DateRange } from '@/components/data/Filters';
import { useOptions } from '@/hooks/useOptions';
import { apiGet } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Metric } from '@/services/dashboard';
import { cleanParams, downloadCsv } from '@/lib/download';
import { faCompact, faNumber, faPercent, faToman } from '@/lib/format';

interface Report {
  from: string;
  to: string;
  totals: { sales: Metric; orders: Metric; tickets: Metric; averageTicket: Metric; occupancy: Metric; sessions: Metric };
  daily: { date: string; amount: number; tickets: number }[];
  byCity: { id: number; name: string; amount: number; orders: number }[];
  byCategory: { name: string; color?: string | null; amount: number; orders: number }[];
  topEvents: { id: number; title: string; banner_url?: string | null; city_name?: string | null; orders: number; amount: number; tickets: number; occupancy: number }[];
  halls: { id: number; name: string; city_name: string; sessions: number; capacity: number; sold: number; occupancy: number }[];
  byWeekday: { day: number; amount: number; orders: number }[];
  byHour: { hour: number; orders: number }[];
}

// ISODOW (1 = Monday) -> Persian weekday, listed from Saturday
const WEEKDAYS: [number, string][] = [
  [6, 'شنبه'],
  [7, 'یکشنبه'],
  [1, 'دوشنبه'],
  [2, 'سه‌شنبه'],
  [3, 'چهارشنبه'],
  [4, 'پنجشنبه'],
  [5, 'جمعه'],
];
const TICK = { fill: 'var(--muted)', fontSize: 11, fontFamily: 'var(--font-iransans)' };

export default function AdminReportsPage() {
  const [range, setRange] = useState<DateRange>(lastDays(30));
  const [city, setCity] = useState('');
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));
  const report = useQuery({
    queryKey: ['admin', 'reports', range, city],
    queryFn: () => apiGet<Report>('/admin/reports/overview', cleanParams({ ...range, cityId: city })),
    placeholderData: keepPreviousData,
  });
  const r = report.data;
  const t = r?.totals;
  const compare = 'نسبت به دوره قبل';
  const suffix = r ? `${r.from}_${r.to}` : 'report';

  const eventColumns: DataColumn<Report['topEvents'][number]>[] = [
    { key: 'rank', label: '#', hideOnMobile: true, render: (_, i) => <span className="text-muted">{faNumber(i + 1)}</span> },
    {
      key: 'title',
      label: 'رویداد',
      render: (e) => (
        <div className="flex items-center gap-2.5">
          <Thumb src={e.banner_url} className="hidden size-10 shrink-0 rounded-lg object-cover lg:block" />
          <div>
            <div className="font-extrabold">{e.title}</div>
            <div className="text-[12px] text-muted">{e.city_name}</div>
          </div>
        </div>
      ),
    },
    { key: 'orders', label: 'سفارش', center: true, render: (e) => faNumber(e.orders) },
    { key: 'tickets', label: 'بلیت', center: true, render: (e) => faNumber(e.tickets) },
    { key: 'occ', label: 'اشغال ظرفیت', center: true, render: (e) => <Occupancy value={Number(e.occupancy)} /> },
    { key: 'amount', label: 'فروش', center: true, render: (e) => <span className="tabular font-bold">{faToman(e.amount)}</span> },
  ];
  const hallColumns: DataColumn<Report['halls'][number]>[] = [
    { key: 'name', label: 'سالن', render: (h) => <div><div className="font-extrabold">{h.name}</div><div className="text-[12px] text-muted">{h.city_name}</div></div> },
    { key: 'sessions', label: 'سانس', center: true, render: (h) => faNumber(h.sessions) },
    { key: 'capacity', label: 'ظرفیت کل', center: true, render: (h) => faNumber(Number(h.capacity)) },
    { key: 'sold', label: 'فروخته‌شده', center: true, render: (h) => faNumber(Number(h.sold)) },
    { key: 'occ', label: 'اشغال', center: true, render: (h) => <Occupancy value={Number(h.occupancy)} /> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="گزارش‌ها" crumbs={['گزارش‌ها']} />

        <Card className="flex flex-col gap-3 p-3 sm:p-4 xl:flex-row xl:items-center xl:justify-between">
          <DateRangePicker value={range} onChange={setRange} />
          <FilterSelect value={city} onChange={setCity} options={cities.options} allLabel="همه شهرها" className="xl:w-56" />
        </Card>

        {report.isError ? (
          <ErrorState message={errorMessage(report.error, 'دریافت گزارش با خطا مواجه شد.')} onRetry={() => report.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-3">
              <StatTile title="مبلغ فروش" value={faNumber(t?.sales.value)} unit="تومان" icon="admin/finance" color="green" changePercent={t?.sales.changePercent} compareLabel={compare} loading={report.isLoading} />
              <StatTile title="سفارش‌ها" value={faNumber(t?.orders.value)} unit="سفارش پرداخت‌شده" icon="admin/orders" color="blue" changePercent={t?.orders.changePercent} compareLabel={compare} loading={report.isLoading} />
              <StatTile title="بلیت‌ها" value={faNumber(t?.tickets.value)} unit="بلیت صادرشده" icon="common/ticket" color="orange" changePercent={t?.tickets.changePercent} compareLabel={compare} loading={report.isLoading} />
              <StatTile title="میانگین قیمت بلیت" value={faNumber(Math.round(t?.averageTicket.value ?? 0))} unit="تومان" icon="admin/discount" color="purple" changePercent={t?.averageTicket.changePercent} compareLabel={compare} loading={report.isLoading} />
              <StatTile title="اشغال ظرفیت سانس‌ها" value={faPercent(t?.occupancy.value)} unit="سانس‌های این بازه" icon="admin/halls" color="red" changePercent={t?.occupancy.changePercent} compareLabel={compare} loading={report.isLoading} />
              <StatTile title="سانس‌های برگزارشده" value={faNumber(t?.sessions.value)} unit="سانس" icon="admin/sessions" color="blue" changePercent={t?.sessions.changePercent} compareLabel={compare} loading={report.isLoading} />
            </div>

            <Card className="p-4 sm:p-5">
              <CardHeader
                title="فروش روزانه (تومان)"
                action={
                  <CsvButton
                    onClick={() => downloadCsv(`daily-sales-${suffix}.csv`, ['تاریخ', 'مبلغ فروش', 'تعداد بلیت'], (r?.daily ?? []).map((d) => [d.date, d.amount, d.tickets]))}
                  />
                }
              />
              <div className="mt-4">
                <TrendChart data={r?.daily} loading={report.isLoading} unit="تومان" series={[{ key: 'amount', label: 'فروش', color: 'var(--series-1)' }]} />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="p-4 sm:p-5">
                <CardHeader
                  title="فروش به تفکیک شهر"
                  action={<CsvButton onClick={() => downloadCsv(`sales-by-city-${suffix}.csv`, ['شهر', 'سفارش', 'مبلغ'], (r?.byCity ?? []).map((c) => [c.name, c.orders, c.amount]))} />}
                />
                <div className="mt-4">
                  <BarList loading={report.isLoading} format={faCompactToman} items={r?.byCity.map((c) => ({ key: c.id, label: c.name, value: Number(c.amount), hint: `${faNumber(c.orders)} سفارش` }))} />
                </div>
              </Card>
              <Card className="p-4 sm:p-5">
                <CardHeader
                  title="فروش به تفکیک دسته‌بندی"
                  action={<CsvButton onClick={() => downloadCsv(`sales-by-category-${suffix}.csv`, ['دسته‌بندی', 'سفارش', 'مبلغ'], (r?.byCategory ?? []).map((c) => [c.name, c.orders, c.amount]))} />}
                />
                <div className="mt-4">
                  <BarList loading={report.isLoading} format={faCompactToman} items={r?.byCategory.map((c) => ({ key: c.name, label: c.name, value: Number(c.amount), hint: `${faNumber(c.orders)} سفارش`, dot: c.color }))} />
                </div>
              </Card>
            </div>

            <Card className="p-4 sm:p-5">
              <CardHeader
                title="پرفروش‌ترین رویدادها"
                subtitle="۱۰ رویداد برتر بر اساس مبلغ فروش"
                action={
                  <CsvButton
                    onClick={() =>
                      downloadCsv(`top-events-${suffix}.csv`, ['رویداد', 'شهر', 'سفارش', 'بلیت', 'درصد اشغال', 'مبلغ'], (r?.topEvents ?? []).map((e) => [e.title, e.city_name, e.orders, e.tickets, Math.round(Number(e.occupancy)), e.amount]))
                    }
                  />
                }
              />
              <div className="mt-4">
                <DataTable columns={eventColumns} rows={r?.topEvents} rowKey={(e) => e.id} loading={report.isLoading} emptyMessage="در این بازه فروشی ثبت نشده است." minWidth={760} />
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              <Card className="p-4 sm:p-5">
                <CardHeader title="فروش بر اساس روز هفته" subtitle="مجموع مبلغ سفارش‌های ثبت‌شده در هر روز" />
                <div className="mt-4">
                  <BarList
                    loading={report.isLoading}
                    format={faCompactToman}
                    items={WEEKDAYS.map(([d, label]) => {
                      const row = r?.byWeekday.find((w) => w.day === d);
                      return { key: d, label, value: Number(row?.amount ?? 0), hint: `${faNumber(row?.orders ?? 0)} سفارش` };
                    }).filter(() => !!r)}
                  />
                </div>
              </Card>
              <Card className="p-4 sm:p-5">
                <CardHeader title="ساعات اوج خرید" subtitle="تعداد سفارش در هر ساعت از شبانه‌روز" />
                <div className="mt-4 h-[300px]" dir="ltr">
                  {report.isLoading ? (
                    <Skeleton className="h-full rounded-xl" />
                  ) : !r?.byHour.length ? (
                    <EmptyState message="داده‌ای برای نمایش نیست." className="h-full" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: r.byHour.find((x) => x.hour === h)?.orders ?? 0 }))} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--line)" vertical={false} />
                        <XAxis dataKey="hour" tickFormatter={(h: number) => faNumber(h)} tick={TICK} tickLine={false} axisLine={{ stroke: 'var(--line)' }} interval={1} />
                        <YAxis tickFormatter={(v: number) => faNumber(v)} tick={TICK} tickLine={false} axisLine={false} width={44} />
                        <Tooltip
                          cursor={{ fill: 'var(--field)' }}
                          content={({ active, payload }) =>
                            active && payload?.length ? (
                              <div dir="rtl" className="rounded-xl border border-line bg-surface px-3 py-2 text-[12px] shadow-float">
                                <div className="font-bold text-ink">ساعت {faNumber(Number(payload[0].payload.hour))}</div>
                                <div className="text-muted">
                                  <span className="tabular font-semibold text-ink">{faNumber(Number(payload[0].value))}</span> سفارش
                                </div>
                              </div>
                            ) : null
                          }
                        />
                        <Bar dataKey="orders" fill="var(--series-1)" radius={[4, 4, 0, 0]} maxBarSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </Card>
            </div>

            <Card className="p-4 sm:p-5">
              <CardHeader
                title="اشغال ظرفیت سالن‌ها"
                subtitle="سانس‌های لغونشده در بازه انتخابی"
                action={
                  <CsvButton
                    onClick={() =>
                      downloadCsv(`hall-occupancy-${suffix}.csv`, ['سالن', 'شهر', 'سانس', 'ظرفیت', 'فروخته‌شده', 'درصد اشغال'], (r?.halls ?? []).map((h) => [h.name, h.city_name, h.sessions, h.capacity, h.sold, Math.round(Number(h.occupancy))]))
                    }
                  />
                }
              />
              <div className="mt-4">
                <DataTable columns={hallColumns} rows={r?.halls} rowKey={(h) => h.id} loading={report.isLoading} emptyMessage="در این بازه سانسی برگزار نشده است." minWidth={640} />
              </div>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function faCompactToman(v: number) {
  return `${faCompact(v)} تومان`;
}

function Occupancy({ value }: { value: number }) {
  return (
    <div className="mx-auto flex w-36 items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-field">
        <div className="h-full rounded-full bg-[var(--series-1)]" style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span className="tabular w-12 text-left text-[12.5px] font-bold">{faPercent(Math.round(value))}</span>
    </div>
  );
}

function CsvButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-[12.5px] font-bold text-ink hover:border-brand-500/40" title="دانلود جدول به صورت CSV">
      <Download className="size-4" />
      CSV
    </button>
  );
}
