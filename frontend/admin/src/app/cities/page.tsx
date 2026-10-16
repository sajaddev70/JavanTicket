'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FilterX, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { RowMenu } from '@/components/ui/RowMenu';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { Thumb } from '@/components/crud/cells';
import { FormModal } from '@/components/crud/FormModal';
import type { Row } from '@/components/crud/CrudPage';
import type { FieldDef } from '@/components/crud/fields';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { CITY_STATUS, HALL_STATUS, options } from '@/lib/labels';
import { faNumber } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Metric } from '@/services/dashboard';

type City = Row & {
  name: string;
  province: string;
  manager_name?: string | null;
  image_url?: string | null;
  status: string;
  halls_count: number;
  active_events: number;
  capacity: number;
};

interface CitiesSummary {
  halls: Metric;
  capacity: Metric;
  activeEvents: Metric;
  activeCities: Metric;
  totalCities: number;
}

const AVATAR = ['bg-brand-500/12 text-brand-600', 'bg-danger/10 text-danger-fg', 'bg-violet-500/12 text-violet-600', 'bg-success/12 text-success-fg', 'bg-warning/15 text-warning-fg'];

/** "علی محمدی" -> "ع م" */
function initials(name?: string | null) {
  return (name ?? '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join(' ') || '؟';
}

const FIELDS: FieldDef[] = [
  { name: 'name', label: 'نام شهر', type: 'text', required: true },
  { name: 'province', label: 'استان', type: 'text', required: true },
  { name: 'manager_name', label: 'مدیر شهر', type: 'text' },
  { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'ACTIVE', options: options(CITY_STATUS) },
  { name: 'latitude', label: 'عرض جغرافیایی', type: 'number', placeholder: '35.6892', hint: 'برای نشانگر روی نقشه داشبورد' },
  { name: 'longitude', label: 'طول جغرافیایی', type: 'number', placeholder: '51.3890' },
  { name: 'image_url', label: 'تصویر شهر', type: 'image', wide: true },
];

export default function AdminCitiesPage() {
  const queryClient = useQueryClient();
  const cities = useQuery({ queryKey: ['admin', 'cities'], queryFn: () => apiGet<City[]>('/admin/cities') });
  const summary = useQuery({ queryKey: ['admin', 'cities', 'summary'], queryFn: () => apiGet<CitiesSummary>('/admin/cities/summary') });

  const [search, setSearch] = useState('');
  const [province, setProvince] = useState('');
  const [manager, setManager] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editing, setEditing] = useState<City | 'new' | null>(null);
  const [details, setDetails] = useState<City | null>(null);
  const [toDelete, setToDelete] = useState<City | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const rows = useMemo(() => cities.data ?? [], [cities.data]);
  const unique = (values: (string | null | undefined)[]) => [...new Set(values.filter(Boolean) as string[])].map((v) => ({ value: v, label: v }));
  const filtered = useMemo(
    () =>
      rows.filter(
        (c) =>
          (!search.trim() || [c.name, c.province, c.manager_name].some((v) => v?.includes(search.trim()))) &&
          (!province || c.province === province) &&
          (!manager || c.manager_name === manager) &&
          (!status || c.status === status),
      ),
    [rows, search, province, manager, status],
  );
  const set = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
    queryClient.invalidateQueries({ queryKey: ['cities'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
  const s = summary.data;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="مدیریت شهرها" crumbs={['شهرها']} />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="تعداد سالن‌ها" value={faNumber(s?.halls.value)} unit="سالن" icon="common/halls" color="blue" changePercent={s?.halls.changePercent} loading={summary.isLoading} />
          <StatTile title="ظرفیت کل سالن‌ها" value={faNumber(s?.capacity.value)} unit="نفر" icon="admin/crm" color="orange" changePercent={s?.capacity.changePercent} loading={summary.isLoading} />
          <StatTile title="رویدادهای فعال" value={faNumber(s?.activeEvents.value)} unit="در همه شهرها" icon="common/location" color="green" changePercent={s?.activeEvents.changePercent} loading={summary.isLoading} />
          <StatTile title="کل شهرها" value={faNumber(s?.totalCities)} unit={`${faNumber(s?.activeCities.value)} شهر فعال`} icon="admin/organizations" color="red" changePercent={s?.activeCities.changePercent} loading={summary.isLoading} />
        </div>

        <Card className="p-3 sm:p-5">
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto_auto]">
            <label className="relative block">
              <span className="sr-only">جستجو</span>
              <Search className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink/70" />
              <input
                type="search"
                value={search}
                onChange={(e) => set(setSearch)(e.target.value)}
                placeholder="جستجو در نام شهر، مدیر یا استان ..."
                className="h-12 w-full rounded-xl border border-line bg-field pr-12 pl-4 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
              />
            </label>
            <FilterSelect value={province} onChange={set(setProvince)} options={unique(rows.map((r) => r.province))} allLabel="همه استان‌ها" />
            <FilterSelect value={manager} onChange={set(setManager)} options={unique(rows.map((r) => r.manager_name))} allLabel="همه مدیران" />
            <FilterSelect value={status} onChange={set(setStatus)} options={options(CITY_STATUS)} allLabel="همه وضعیت‌ها" />
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setProvince('');
                setManager('');
                setStatus('');
                setPage(1);
              }}
              title="پاک کردن فیلترها"
              aria-label="پاک کردن فیلترها"
              className="hidden size-12 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-brand-500/40 xl:flex"
            >
              <FilterX className="size-5" />
            </button>
            <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6')}>
              <Plus className="size-5 rounded-full bg-white p-0.5 text-brand-600" />
              افزودن شهر
            </button>
          </div>

          {cities.isError ? (
            <ErrorState message={errorMessage(cities.error, 'دریافت شهرها با خطا مواجه شد.')} onRetry={() => cities.refetch()} />
          ) : cities.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="شهری مطابق فیلترها پیدا نشد." />
          ) : (
            <>
              <div className="hidden overflow-x-auto rounded-xl border border-line/70 lg:block">
                <table className="w-full min-w-[900px] text-right text-[14px]">
                  <thead className="bg-surface-2 text-[13.5px] text-ink">
                    <tr>
                      {['#', 'نام شهر', 'مدیر شهر', 'تعداد سالن', 'رویدادهای فعال', 'ظرفیت (نفر)', 'وضعیت', 'عملیات'].map((c, i) => (
                        <th key={c} className={cn('h-14 px-4 font-bold', i > 2 && 'text-center')}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70 text-ink">
                    {paginate(filtered, page, pageSize).map((c, i) => {
                      const st = statusOf(CITY_STATUS, c.status);
                      return (
                        <tr key={c.id} className="hover:bg-field/40">
                          <td className="px-4 text-muted">{faNumber((page - 1) * pageSize + i + 1)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Thumb src={c.image_url} className="size-14 rounded-xl object-cover" />
                              <div>
                                <p className="text-[15px] font-extrabold">{c.name}</p>
                                <p className="mt-0.5 text-[12.5px] text-muted">استان {c.province}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4">
                            <div className="flex items-center gap-3">
                              <span className={cn('flex size-11 shrink-0 items-center justify-center rounded-full text-[13px] font-bold', AVATAR[c.id % AVATAR.length])}>
                                {initials(c.manager_name)}
                              </span>
                              <div>
                                <p className="font-bold">{c.manager_name ?? '—'}</p>
                                <p className="text-[12px] text-muted">مدیر شهر</p>
                              </div>
                            </div>
                          </td>
                          <td className="tabular px-4 text-center text-[15px] font-bold">{faNumber(c.halls_count)}</td>
                          <td className="tabular px-4 text-center text-[15px] font-bold text-brand-600">{faNumber(c.active_events)}</td>
                          <td className="tabular px-4 text-center text-[15px] font-bold">{faNumber(c.capacity)}</td>
                          <td className="px-4 text-center">
                            <StatusPill tone={st.tone}>{st.label}</StatusPill>
                          </td>
                          <td className="px-4">
                            <CityActions city={c} onDetails={setDetails} onEdit={setEditing} onDelete={setToDelete} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {paginate(filtered, page, pageSize).map((c) => {
                  const st = statusOf(CITY_STATUS, c.status);
                  return (
                    <li key={c.id} className="rounded-xl border border-line/80 p-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={c.image_url} className="size-14 shrink-0 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-ink">{c.name}</p>
                          <p className="text-[12.5px] text-muted">
                            استان {c.province} · {c.manager_name ?? '—'}
                          </p>
                        </div>
                        <StatusPill tone={st.tone}>{st.label}</StatusPill>
                      </div>
                      <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-[12px]">
                        {[
                          ['سالن', c.halls_count],
                          ['رویداد فعال', c.active_events],
                          ['ظرفیت', c.capacity],
                        ].map(([label, value]) => (
                          <div key={label as string} className="rounded-lg bg-surface-2 py-2">
                            <dt className="text-muted">{label}</dt>
                            <dd className="tabular mt-0.5 text-[14px] font-bold text-ink">{faNumber(value as number)}</dd>
                          </div>
                        ))}
                      </dl>
                      <div className="mt-3">
                        <CityActions city={c} onDetails={setDetails} onEdit={setEditing} onDelete={setToDelete} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={set(setPageSize)} unit="شهر" />
            </>
          )}
        </Card>
      </div>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'افزودن شهر' : `ویرایش ${editing.name}`}
          fields={FIELDS}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/cities', body) : apiPut(`/admin/cities/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal open={!!details} title={`جزئیات ${details?.name ?? ''}`} onClose={() => setDetails(null)} className="sm:max-w-2xl">
        {details && <CityDetails city={details} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="حذف شهر"
        message={deleteError || `آیا از حذف شهر «${toDelete?.name ?? ''}» اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/cities/${toDelete.id}`);
            setToDelete(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف شهر با خطا مواجه شد.'));
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

function CityActions({ city, onDetails, onEdit, onDelete }: { city: City; onDetails: (c: City) => void; onEdit: (c: City) => void; onDelete: (c: City) => void }) {
  return (
    <div className="flex items-center justify-end gap-2 lg:justify-center">
      <RowMenu
        items={[
          { label: 'ویرایش', icon: <Pencil className="size-4" />, onClick: () => onEdit(city) },
          { label: 'حذف', icon: <Trash2 className="size-4" />, onClick: () => onDelete(city), danger: true },
        ]}
      />
      <button
        type="button"
        onClick={() => onDetails(city)}
        className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-4 text-[13.5px] font-bold text-ink hover:border-brand-500/40"
      >
        جزئیات
      </button>
    </div>
  );
}

function CityDetails({ city }: { city: City }) {
  const halls = useQuery({ queryKey: ['admin', 'halls'], queryFn: () => apiGet<Row[]>('/admin/halls') });
  const own = (halls.data ?? []).filter((h) => h.city_id === city.id);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Thumb src={city.image_url} className="size-20 rounded-2xl object-cover" />
        <div>
          <p className="text-lg font-black text-ink">{city.name}</p>
          <p className="text-[13px] text-muted">
            استان {city.province} · مدیر: {city.manager_name ?? '—'}
          </p>
        </div>
      </div>
      <h3 className="text-[15px] font-extrabold text-ink">سالن‌های این شهر</h3>
      {halls.isLoading ? (
        <Skeleton className="h-24 rounded-xl" />
      ) : own.length === 0 ? (
        <EmptyState message="برای این شهر سالنی ثبت نشده است." />
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line">
          {own.map((h) => {
            const st = statusOf(HALL_STATUS, h.status);
            return (
              <li key={h.id} className="flex items-center justify-between gap-3 p-3">
                <div>
                  <p className="font-bold text-ink">{String(h.name)}</p>
                  <p className="text-[12px] text-muted">
                    ظرفیت {faNumber(Number(h.capacity))} نفر · {String(h.venue_name ?? '')}
                  </p>
                </div>
                <StatusPill tone={st.tone}>{st.label}</StatusPill>
              </li>
            );
          })}
        </ul>
      )}
      <Link href="/halls" className="inline-flex text-[14px] font-bold text-brand-600 hover:text-brand-700">
        مدیریت سالن‌ها ←
      </Link>
    </div>
  );
}
