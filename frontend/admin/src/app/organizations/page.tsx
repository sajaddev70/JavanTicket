'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/Modal';
import { primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { RowMenu } from '@/components/ui/RowMenu';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { FormModal } from '@/components/crud/FormModal';
import type { FieldDef } from '@/components/crud/fields';
import { DataTable, IconButton, type DataColumn } from '@/components/data/DataTable';
import { FilterChips, SearchInput } from '@/components/data/Filters';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import type { Metric } from '@/services/dashboard';
import { ACTIVE_STATUS, ORG_TYPES, options } from '@/lib/labels';
import { faDate, faNumber, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

type Organization = {
  id: number;
  name: string;
  org_type: string;
  city_id?: number | null;
  city_name?: string | null;
  contact_name?: string | null;
  contact_mobile?: string | null;
  phone?: string | null;
  email?: string | null;
  members_count?: number | null;
  status: string;
  reservations_count: number;
  confirmed_seats: number;
  last_reservation_at?: string | null;
  invoiced_amount: number;
  paid_amount: number;
} & Record<string, unknown>;

interface Summary {
  total: Metric;
  schools: Metric;
  activeThisMonth: Metric;
  paidAmount: Metric;
}

export default function AdminOrganizationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const list = useQuery({ queryKey: ['admin', 'organizations'], queryFn: () => apiGet<Organization[]>('/admin/organizations') });
  const summary = useQuery({ queryKey: ['admin', 'organizations', 'summary'], queryFn: () => apiGet<Summary>('/admin/organizations/summary') });
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));

  const [type, setType] = useState('');
  const [city, setCity] = useState('');
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(10);
  const [editing, setEditing] = useState<Organization | 'new' | null>(null);
  const [toDelete, setToDelete] = useState<Organization | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const rows = useMemo(() => list.data ?? [], [list.data]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (o) =>
          (!type || o.org_type === type) &&
          (!city || String(o.city_id) === city) &&
          (!status || o.status === status) &&
          (!q.trim() || [o.name, o.contact_name, o.contact_mobile, o.email].some((v) => v?.includes(q.trim()))),
      ),
    [rows, type, city, status, q],
  );
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin', 'organizations'] });

  const fields: FieldDef[] = [
    { name: 'name', label: 'نام مدرسه / سازمان', type: 'text', required: true, wide: true },
    { name: 'org_type', label: 'نوع', type: 'select', required: true, defaultValue: 'SCHOOL', options: options(ORG_TYPES) },
    { name: 'city_id', label: 'شهر', type: 'select', numeric: true, options: cities.options },
    { name: 'contact_name', label: 'نام رابط', type: 'text' },
    { name: 'contact_mobile', label: 'موبایل رابط', type: 'text', dir: 'ltr', placeholder: '09123456789' },
    { name: 'phone', label: 'تلفن ثابت', type: 'text', dir: 'ltr' },
    { name: 'email', label: 'ایمیل', type: 'text', dir: 'ltr' },
    { name: 'members_count', label: 'تعداد دانش‌آموز / اعضا', type: 'number' },
    { name: 'economic_code', label: 'کد اقتصادی / شناسه ملی', type: 'text', dir: 'ltr', hint: 'برای درج در پیش‌فاکتور' },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'ACTIVE', options: options(ACTIVE_STATUS) },
    { name: 'address', label: 'نشانی', type: 'textarea', wide: true },
    { name: 'notes', label: 'یادداشت داخلی', type: 'textarea', wide: true },
  ];

  const columns: DataColumn<Organization>[] = [
    {
      key: 'name',
      label: 'نام',
      render: (o) => {
        const t = statusOf(ORG_TYPES, o.org_type);
        return (
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Users className="size-5" />
            </span>
            <div className="min-w-0">
              <div className="truncate font-extrabold">{o.name}</div>
              <span className="text-[12px] text-muted">{t.label}</span>
            </div>
          </div>
        );
      },
    },
    { key: 'city', label: 'شهر', center: true, render: (o) => o.city_name ?? '—' },
    {
      key: 'contact',
      label: 'رابط',
      render: (o) => (
        <div>
          <div>{o.contact_name ?? '—'}</div>
          {o.contact_mobile && <div dir="ltr" className="text-right text-[12px] text-muted">{o.contact_mobile}</div>}
        </div>
      ),
    },
    {
      key: 'reservations',
      label: 'رزروها',
      center: true,
      render: (o) => (
        <div className="tabular">
          <div className="font-bold">{faNumber(o.reservations_count)} رزرو</div>
          <div className="text-[12px] text-muted">{faNumber(o.confirmed_seats)} صندلی قطعی</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'پرداختی / صورتحساب',
      center: true,
      render: (o) => (
        <div className="tabular">
          <div className="font-bold text-success-fg">{faToman(o.paid_amount)}</div>
          <div className="text-[12px] text-muted">از {faToman(o.invoiced_amount)}</div>
        </div>
      ),
    },
    { key: 'last', label: 'آخرین رزرو', center: true, render: (o) => (o.last_reservation_at ? faDate(o.last_reservation_at) : '—') },
    {
      key: 'status',
      label: 'وضعیت',
      center: true,
      render: (o) => {
        const st = statusOf(ACTIVE_STATUS, o.status);
        return <StatusPill tone={st.tone}>{st.label}</StatusPill>;
      },
    },
  ];
  const s = summary.data;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader
          title="مدارس و سازمان‌ها"
          crumbs={['فروش و سفارشات', 'مدارس و سازمان‌ها']}
          action={
            <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
              <Plus className="size-5" />
              افزودن مدرسه / سازمان
            </button>
          }
        />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="کل مشتریان سازمانی" value={faNumber(s?.total.value)} unit="مدرسه و سازمان" icon="admin/organizations" color="blue" changePercent={s?.total.changePercent} loading={summary.isLoading} />
          <StatTile title="مدارس" value={faNumber(s?.schools.value)} unit="مدرسه ثبت‌شده" icon="admin/group-reservations" color="purple" changePercent={s?.schools.changePercent} loading={summary.isLoading} />
          <StatTile title="فعال در این ماه" value={faNumber(s?.activeThisMonth.value)} unit="دارای رزرو گروهی" icon="common/calendar-simple" color="orange" changePercent={s?.activeThisMonth.changePercent} loading={summary.isLoading} />
          <StatTile title="دریافتی این ماه" value={faNumber(s?.paidAmount.value)} unit="تومان از پیش‌فاکتورها" icon="admin/finance" color="green" changePercent={s?.paidAmount.changePercent} loading={summary.isLoading} />
        </div>

        <Card className="space-y-3 p-3 sm:p-4">
          <FilterChips
            value={type}
            onChange={reset(setType)}
            total={rows.length}
            allLabel="همه انواع"
            options={options(ORG_TYPES).map((o) => ({ ...o, count: rows.filter((r) => r.org_type === o.value).length }))}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SearchInput value={q} onChange={reset(setQ)} placeholder="نام، رابط، موبایل یا ایمیل..." />
            <FilterSelect value={city} onChange={reset(setCity)} options={cities.options} allLabel="همه شهرها" />
            <FilterSelect value={status} onChange={reset(setStatus)} options={options(ACTIVE_STATUS)} allLabel="همه وضعیت‌ها" />
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <DataTable
            columns={columns}
            rows={paginate(filtered, page, size)}
            rowKey={(o) => o.id}
            loading={list.isLoading}
            error={list.isError ? errorMessage(list.error, 'دریافت فهرست با خطا مواجه شد.') : null}
            onRetry={() => list.refetch()}
            emptyMessage="مدرسه یا سازمانی مطابق فیلترها پیدا نشد."
            actions={(o) => (
              <>
                <IconButton label="ویرایش" onClick={() => setEditing(o)}>
                  <Pencil className="size-5" />
                </IconButton>
                <RowMenu
                  vertical
                  items={[
                    { label: 'رزروهای گروهی', icon: <CalendarPlus className="size-4" />, onClick: () => router.push(`/group-reservations?org=${o.id}`) },
                    { label: 'پیش‌فاکتورها', icon: <FileText className="size-4" />, onClick: () => router.push(`/invoices?org=${o.id}`) },
                    { label: 'حذف', icon: <Trash2 className="size-4" />, onClick: () => setToDelete(o), danger: true },
                  ]}
                />
              </>
            )}
          />
          {filtered.length > 0 && <Pagination page={page} pageSize={size} total={filtered.length} onPage={setPage} onPageSize={reset(setSize)} unit="مورد" sizes={[10, 20, 50]} />}
        </Card>
      </div>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'افزودن مدرسه / سازمان' : `ویرایش «${editing.name}»`}
          fields={fields}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/organizations', body) : apiPut(`/admin/organizations/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="حذف مدرسه / سازمان"
        message={deleteError || `آیا از حذف «${toDelete?.name}» اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/organizations/${toDelete.id}`);
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
    </AdminLayout>
  );
}
