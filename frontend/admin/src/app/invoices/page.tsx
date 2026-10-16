'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { InvoiceViewer } from '@/components/sales/InvoiceViewer';
import { InvoiceEditor } from '@/components/sales/InvoiceEditor';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Metric } from '@/services/dashboard';
import { INVOICE_STATUS, ORG_TYPES, options } from '@/lib/labels';
import { faDate, faNumber, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

type Invoice = {
  id: number;
  invoice_number: string;
  organization_id: number;
  organization_name: string;
  org_type: string;
  city_name?: string | null;
  title: string;
  issue_date: string;
  due_date?: string | null;
  status: string;
  total_amount: number;
  items_count: number;
  overdue: boolean;
  paid_at?: string | null;
};

interface Summary {
  issued: Metric;
  paid: Metric;
  outstanding: number;
  outstandingCount: number;
  overdue: number;
  drafts: number;
}

export default function AdminInvoicesPage() {
  return (
    <AdminLayout>
      <Suspense>
        <InvoicesScreen />
      </Suspense>
    </AdminLayout>
  );
}

function InvoicesScreen() {
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'invoices', 'list'], queryFn: () => apiGet<Invoice[]>('/admin/invoices') });
  const summary = useQuery({ queryKey: ['admin', 'invoices', 'summary'], queryFn: () => apiGet<Summary>('/admin/invoices/summary') });
  const orgs = useOptions(['admin', 'organizations'], '/admin/organizations', (r) => String(r.name));

  const [status, setStatus] = useState('');
  const [org, setOrg] = useState(params.get('org') ?? '');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [viewing, setViewing] = useState<number | null>(params.get('open') ? Number(params.get('open')) : null);
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Invoice | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (i) =>
          (!status || (status === 'OVERDUE' ? i.overdue : i.status === status)) &&
          (!org || String(i.organization_id) === org) &&
          (!q.trim() || [i.invoice_number, i.organization_name, i.title].some((v) => v?.includes(q.trim()))),
      ),
    [rows, status, org, q],
  );
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'invoices'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'group-reservations'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });
  };

  const columns: DataColumn<Invoice>[] = [
    {
      key: 'number',
      label: 'شماره / عنوان',
      render: (i) => (
        <div className="min-w-0">
          <span dir="ltr" className="font-mono text-[13px] font-bold">{i.invoice_number}</span>
          <div className="max-w-[260px] truncate text-[12px] text-muted">{i.title}</div>
        </div>
      ),
    },
    {
      key: 'org',
      label: 'خریدار',
      render: (i) => (
        <div>
          <div className="font-bold">{i.organization_name}</div>
          <div className="text-[12px] text-muted">
            {statusOf(ORG_TYPES, i.org_type).label}
            {i.city_name && ` · ${i.city_name}`}
          </div>
        </div>
      ),
    },
    { key: 'issue', label: 'تاریخ صدور', center: true, render: (i) => faDate(i.issue_date) },
    {
      key: 'due',
      label: 'مهلت پرداخت',
      center: true,
      render: (i) => (i.due_date ? <span className={cn(i.overdue && 'font-bold text-danger-fg')}>{faDate(i.due_date)}{i.overdue && ' (معوق)'}</span> : '—'),
    },
    { key: 'items', label: 'ردیف', center: true, render: (i) => faNumber(i.items_count) },
    { key: 'amount', label: 'مبلغ کل', center: true, render: (i) => <span className="tabular font-bold">{faToman(i.total_amount)}</span> },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (i) => {
        const st = statusOf(INVOICE_STATUS, i.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];
  const s = summary.data;

  return (
    <div className="space-y-5">
      <PageHeader
        title="پیش‌فاکتورها"
        crumbs={['فروش و سفارشات', 'پیش‌فاکتورها']}
        action={
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
            <Plus className="size-5" />
            صدور پیش‌فاکتور
          </button>
        }
      />

      <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
        <StatTile title="صادرشده این ماه" value={faNumber(s?.issued.value)} unit="پیش‌فاکتور" icon="admin/invoice" color="blue" changePercent={s?.issued.changePercent} loading={summary.isLoading} />
        <StatTile title="وصول‌شده این ماه" value={faNumber(s?.paid.value)} unit="تومان" icon="admin/finance" color="green" changePercent={s?.paid.changePercent} loading={summary.isLoading} />
        <StatTile title="در انتظار پرداخت" value={faNumber(s?.outstanding)} unit={`تومان در ${faNumber(s?.outstandingCount)} پیش‌فاکتور`} icon="common/calendar-simple" color="orange" changePercent={null} loading={summary.isLoading} />
        <StatTile title="معوق" value={faNumber(s?.overdue)} unit={`پیش‌فاکتور · ${faNumber(s?.drafts)} پیش‌نویس`} icon="status/danger" color="red" changePercent={null} loading={summary.isLoading} />
      </div>

      <Card className="space-y-3 p-3 sm:p-4">
        <FilterChips
          value={status}
          onChange={reset(setStatus)}
          total={rows.length}
          allLabel="همه"
          options={[
            ...options(INVOICE_STATUS).map((o) => ({ ...o, count: rows.filter((r) => r.status === o.value).length })),
            { value: 'OVERDUE', label: 'معوق', count: rows.filter((r) => r.overdue).length },
          ]}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SearchInput value={q} onChange={reset(setQ)} placeholder="شماره، عنوان یا نام خریدار..." />
          <FilterSelect value={org} onChange={reset(setOrg)} options={orgs.options} allLabel="همه مدارس و سازمان‌ها" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <DataTable
          columns={columns}
          rows={paginate(filtered, page, size)}
          rowKey={(i) => i.id}
          loading={list.isLoading}
          error={list.isError ? errorMessage(list.error, 'دریافت پیش‌فاکتورها با خطا مواجه شد.') : null}
          onRetry={() => list.refetch()}
          emptyMessage="پیش‌فاکتوری مطابق فیلترها پیدا نشد."
          onRowClick={(i) => setViewing(i.id)}
          actions={(i) => (
            <>
              <IconButton label="مشاهده و چاپ" onClick={() => setViewing(i.id)}>
                <Eye className="size-5" />
              </IconButton>
              <IconButton label="ویرایش" onClick={() => setEditing(i.id)} disabled={i.status === 'PAID' || i.status === 'CANCELLED'}>
                <Pencil className="size-5" />
              </IconButton>
              <IconButton label="حذف" tone="danger" onClick={() => setToDelete(i)} disabled={i.status !== 'DRAFT' && i.status !== 'CANCELLED'}>
                <Trash2 className="size-5" />
              </IconButton>
            </>
          )}
        />
        {filtered.length > 0 && <Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} onPageSize={reset(setSize)} unit="پیش‌فاکتور" sizes={[10, 20, 50]} />}
      </Card>

      {viewing !== null && (
        <InvoiceViewer
          id={viewing}
          onClose={() => setViewing(null)}
          onEdit={(id) => {
            setViewing(null);
            setEditing(id);
          }}
        />
      )}
      {editing !== null && (
        <InvoiceEditor
          id={editing === 'new' ? null : editing}
          defaultOrg={org}
          onClose={() => setEditing(null)}
          onSaved={(id) => {
            refresh();
            setViewing(id);
          }}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف پیش‌فاکتور"
        message={deleteError || `آیا از حذف پیش‌فاکتور ${toDelete?.invoice_number} اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/invoices/${toDelete.id}`);
            setToDelete(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف با خطا مواجه شد.'));
          }
        }}
        onClose={() => {
          setToDelete(null);
          setDeleteError('');
        }}
      />
    </div>
  );
}
