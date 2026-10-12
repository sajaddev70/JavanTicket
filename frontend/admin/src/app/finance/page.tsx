'use client';

import { useState } from 'react';
import Link from 'next/link';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/States';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { TrendChart } from '@/components/charts/TrendChart';
import { BarList } from '@/components/charts/BarList';
import { DataTable, type DataColumn } from '@/components/data/DataTable';
import { DateRangePicker, ExportButton, SearchInput, lastDays, type DateRange } from '@/components/data/Filters';
import { apiGet } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Page } from '@/services/admin';
import type { Metric } from '@/services/dashboard';
import { cleanParams, downloadFile } from '@/lib/download';
import { TRANSACTION_TYPE, options } from '@/lib/labels';
import { faCompact, faDateTime, faNumber, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

interface Overview {
  from: string;
  to: string;
  revenue: Metric;
  online: Metric;
  group: Metric;
  refunds: Metric;
  discounts: Metric;
  settled: Metric;
  commission: Metric;
  balance: Metric;
  pendingSettlements: number;
  outstandingInvoices: number;
  daily: { date: string; income: number; expense: number }[];
  byCategory: { name: string; color?: string | null; amount: number; orders: number }[];
}

interface Transaction {
  type: string;
  direction: 'IN' | 'OUT';
  reference: string;
  at: string;
  amount: number;
  party?: string | null;
  description?: string | null;
}

export default function AdminFinancePage() {
  const [range, setRange] = useState<DateRange>(lastDays(30));
  const [type, setType] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);

  const overview = useQuery({
    queryKey: ['admin', 'finance', 'overview', range],
    queryFn: () => apiGet<Overview>('/admin/finance/overview', cleanParams({ ...range })),
    placeholderData: keepPreviousData,
  });
  const txFilters = { type, q, from: range.from, to: range.to };
  const tx = useQuery({
    queryKey: ['admin', 'finance', 'tx', txFilters, page, size],
    queryFn: () => apiGet<Page<Transaction>>('/admin/finance/transactions', cleanParams({ ...txFilters, page, size })),
    placeholderData: keepPreviousData,
  });
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const o = overview.data;
  const compare = 'نسبت به دوره قبل';

  const columns: DataColumn<Transaction>[] = [
    {
      key: 'type',
      label: 'نوع',
      render: (t) => {
        const st = statusOf(TRANSACTION_TYPE, t.type);
        return (
          <div className="flex items-center gap-2.5">
            <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-xl', t.direction === 'IN' ? 'bg-success/10 text-success-fg' : 'bg-danger/10 text-danger-fg')}>
              {t.direction === 'IN' ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
            </span>
            <StatusPill tone={st.tone} dot={false}>{st.label}</StatusPill>
          </div>
        );
      },
    },
    { key: 'ref', label: 'شماره مرجع', render: (t) => <span dir="ltr" className="font-mono text-[13px] font-bold">{t.reference}</span> },
    { key: 'party', label: 'طرف حساب', render: (t) => t.party ?? '—' },
    { key: 'desc', label: 'شرح', render: (t) => <span className="line-clamp-1 max-w-[260px] text-muted">{t.description ?? '—'}</span> },
    { key: 'at', label: 'تاریخ', center: true, render: (t) => <span className="text-[13px]">{faDateTime(t.at)}</span> },
    {
      key: 'amount',
      label: 'مبلغ',
      center: true,
      render: (t) => (
        <span className={cn('tabular font-bold', t.direction === 'IN' ? 'text-success-fg' : 'text-danger-fg')}>
          {t.direction === 'IN' ? '+' : '−'}
          {faToman(t.amount)}
        </span>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="امور مالی" crumbs={['امور مالی']} action={<ExportButton label="خروجی تراکنش‌ها" onExport={() => downloadFile('/admin/finance/transactions/export', txFilters, 'transactions.csv')} />} />

        <Card className="p-3 sm:p-4">
          <DateRangePicker value={range} onChange={reset(setRange)} />
        </Card>

        {overview.isError ? (
          <ErrorState message={errorMessage(overview.error, 'دریافت گزارش مالی با خطا مواجه شد.')} onRetry={() => overview.refetch()} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
              <StatTile title="درآمد خالص" value={faNumber(o?.revenue.value)} unit="تومان (فروش منهای استرداد)" icon="admin/finance" color="green" changePercent={o?.revenue.changePercent} compareLabel={compare} loading={overview.isLoading} />
              <StatTile title="فروش آنلاین بلیت" value={faNumber(o?.online.value)} unit="تومان" icon="common/ticket" color="blue" changePercent={o?.online.changePercent} compareLabel={compare} loading={overview.isLoading} />
              <StatTile title="فروش سازمانی" value={faNumber(o?.group.value)} unit="تومان از پیش‌فاکتورها" icon="admin/organizations" color="purple" changePercent={o?.group.changePercent} compareLabel={compare} loading={overview.isLoading} />
              <StatTile title="استرداد وجه" value={faNumber(o?.refunds.value)} unit="تومان" icon="admin/invoice" color="red" changePercent={o?.refunds.changePercent} compareLabel={compare} loading={overview.isLoading} />
            </div>

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
              <Card className="p-4 sm:p-5">
                <CardHeader title="ورودی و خروجی روزانه" subtitle="ورودی: فروش بلیت و پیش‌فاکتورهای پرداخت‌شده · خروجی: استرداد و تسویه (تومان)" />
                <div className="mt-4">
                  <TrendChart
                    data={o?.daily}
                    loading={overview.isLoading}
                    unit="تومان"
                    series={[
                      { key: 'income', label: 'ورودی', color: 'var(--series-1)' },
                      { key: 'expense', label: 'خروجی', color: 'var(--series-2)' },
                    ]}
                  />
                </div>
              </Card>

              <Card className="p-4 sm:p-5">
                <CardHeader title="تراز دوره" subtitle={o ? `مانده پس از تسویه با برگزارکنندگان` : undefined} />
                <dl className="mt-4 space-y-3 text-[13.5px]">
                  {(
                    [
                      ['فروش آنلاین', o?.online.value, 'in'],
                      ['فروش سازمانی', o?.group.value, 'in'],
                      ['استرداد', o?.refunds.value, 'out'],
                      ['تسویه پرداخت‌شده', o?.settled.value, 'out'],
                    ] as [string, number | null | undefined, string][]
                  ).map(([k, v, d]) => (
                    <div key={k} className="flex items-center justify-between gap-3">
                      <dt className="text-muted">{k}</dt>
                      <dd className={cn('tabular font-bold', d === 'in' ? 'text-ink' : 'text-danger-fg')}>
                        {d === 'out' && v ? '−' : ''}
                        {faToman(v)}
                      </dd>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-[15px]">
                    <dt className="font-extrabold text-ink">مانده</dt>
                    <dd className="tabular font-black text-brand-600">{faToman(o?.balance.value)}</dd>
                  </div>
                </dl>
                <div className="mt-5 grid grid-cols-1 gap-2 text-[13px] sm:grid-cols-2 xl:grid-cols-1">
                  <Link href="/settlements" className="rounded-xl border border-line p-3 hover:border-brand-500/40">
                    <div className="text-muted">تسویه‌های در جریان</div>
                    <div className="tabular mt-1 font-extrabold text-ink">{faToman(o?.pendingSettlements)}</div>
                  </Link>
                  <Link href="/invoices" className="rounded-xl border border-line p-3 hover:border-brand-500/40">
                    <div className="text-muted">مطالبات پیش‌فاکتورها</div>
                    <div className="tabular mt-1 font-extrabold text-ink">{faToman(o?.outstandingInvoices)}</div>
                  </Link>
                  <div className="rounded-xl border border-line p-3">
                    <div className="text-muted">تخفیف‌های اعمال‌شده / کارمزد تسویه‌ها</div>
                    <div className="tabular mt-1 font-extrabold text-ink">
                      {faCompact(o?.discounts.value)} / {faCompact(o?.commission.value)} تومان
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="p-4 sm:p-5">
              <CardHeader title="فروش آنلاین به تفکیک دسته‌بندی" subtitle="سفارش‌های پرداخت‌شده در بازه انتخابی" />
              <div className="mt-4">
                <BarList
                  loading={overview.isLoading}
                  format={faToman}
                  items={o?.byCategory.map((c) => ({ key: c.name, label: c.name, value: Number(c.amount), hint: `${faNumber(c.orders)} سفارش`, dot: c.color }))}
                />
              </div>
            </Card>
          </>
        )}

        <Card className="p-3 sm:p-4">
          <CardHeader title="دفتر تراکنش‌ها" subtitle="همه ورودی‌ها و خروجی‌های مالی بازه انتخابی" className="mb-3 px-1" />
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SearchInput value={q} onChange={reset(setQ)} placeholder="شماره مرجع، طرف حساب یا شرح..." />
            <FilterSelect value={type} onChange={reset(setType)} options={options(TRANSACTION_TYPE)} allLabel="همه انواع تراکنش" />
          </div>
          <DataTable
            columns={columns}
            rows={tx.data?.items}
            rowKey={(t) => `${t.type}-${t.reference}`}
            loading={tx.isFetching}
            error={tx.isError ? errorMessage(tx.error, 'دریافت تراکنش‌ها با خطا مواجه شد.') : null}
            onRetry={() => tx.refetch()}
            emptyMessage="تراکنشی در این بازه پیدا نشد."
          />
          {!!tx.data?.total && <Pagination page={page} pageSize={size} total={tx.data.total} onPage={setPage} onPageSize={reset(setSize)} unit="تراکنش" sizes={[10, 20, 50, 100]} />}
        </Card>
      </div>
    </AdminLayout>
  );
}
