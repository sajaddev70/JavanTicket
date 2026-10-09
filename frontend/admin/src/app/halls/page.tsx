'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Armchair, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
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
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { Thumb } from '@/components/crud/cells';
import { FormModal } from '@/components/crud/FormModal';
import type { Row } from '@/components/crud/CrudPage';
import type { FieldDef } from '@/components/crud/fields';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { HALL_STATUS, HALL_TYPES, options } from '@/lib/labels';
import { faNumber } from '@/lib/format';
import { cn } from '@/lib/cn';

type Hall = Row & {
  name: string;
  venue_name?: string | null;
  city_id: number;
  city_name: string;
  capacity: number;
  gates_count: number;
  status: string;
  hall_type: string;
  image_url?: string | null;
  address?: string | null;
  sessions_count: number;
  seats_count: number;
};

export default function AdminHallsPage() {
  const queryClient = useQueryClient();
  const halls = useQuery({ queryKey: ['admin', 'halls'], queryFn: () => apiGet<Hall[]>('/admin/halls') });
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));

  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [type, setType] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [editing, setEditing] = useState<Hall | 'new' | null>(null);
  const [details, setDetails] = useState<Hall | null>(null);
  const [toDelete, setToDelete] = useState<Hall | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(
    () =>
      (halls.data ?? []).filter(
        (h) =>
          (!status || h.status === status) &&
          (!city || String(h.city_id) === city) &&
          (!type || h.hall_type === type) &&
          (!search.trim() || [h.name, h.venue_name, h.city_name].some((v) => v?.includes(search.trim()))),
      ),
    [halls.data, status, city, type, search],
  );
  const set = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'halls'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'cities'] });
  };

  const fields: FieldDef[] = [
    { name: 'name', label: 'نام سالن', type: 'text', required: true },
    { name: 'venue_name', label: 'مجموعه / مرکز', type: 'text', placeholder: 'مرکز همایش جوان' },
    { name: 'city_id', label: 'شهر', type: 'select', numeric: true, required: true, options: cities.options },
    { name: 'hall_type', label: 'نوع نمایش', type: 'select', required: true, defaultValue: 'CONFERENCE', options: options(HALL_TYPES) },
    { name: 'capacity', label: 'ظرفیت', type: 'number', required: true },
    { name: 'gates_count', label: 'تعداد گیت', type: 'number', defaultValue: '1' },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'ACTIVE', options: options(HALL_STATUS) },
    { name: 'image_url', label: 'تصویر سالن', type: 'image', wide: true },
    { name: 'address', label: 'نشانی', type: 'textarea', wide: true },
  ];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="سالن‌ها" crumbs={['سالن‌ها']} />

        <Card className="p-3 sm:p-5">
          <div className="mb-4">
            <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-7 text-[15px]')}>
              <Plus className="size-5" />
              افزودن سالن
            </button>
          </div>
          <div className="mb-5 grid grid-cols-1 gap-3 rounded-2xl border border-line/70 p-3 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.1fr)]">
            <FilterSelect label="وضعیت" value={status} onChange={set(setStatus)} options={options(HALL_STATUS)} allLabel="همه وضعیت‌ها" />
            <FilterSelect label="شهر" value={city} onChange={set(setCity)} options={cities.options} allLabel="همه شهرها" />
            <FilterSelect label="نوع نمایش" value={type} onChange={set(setType)} options={options(HALL_TYPES)} allLabel="همه انواع" />
            <label className="relative block self-end">
              <span className="sr-only">جستجو</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/70" />
              <input
                type="search"
                value={search}
                onChange={(e) => set(setSearch)(e.target.value)}
                placeholder="جستجو در نام سالن، شهر و ..."
                className="h-12 w-full rounded-xl border border-line bg-field pr-4 pl-12 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10"
              />
            </label>
          </div>

          {halls.isError ? (
            <ErrorState message={errorMessage(halls.error, 'دریافت سالن‌ها با خطا مواجه شد.')} onRetry={() => halls.refetch()} />
          ) : halls.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="سالنی مطابق فیلترها پیدا نشد." />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[960px] text-right text-[14px]">
                  <thead className="bg-surface-2 text-[13.5px] text-ink">
                    <tr>
                      {['#', 'نام سالن', 'شهر', 'ظرفیت', 'تعداد گیت', 'وضعیت', 'نوع نمایش', 'تصویر', 'عملیات'].map((c, i, all) => (
                        <th key={c} className={cn('h-12 px-3 font-bold', i > 1 && 'text-center', i === 0 && 'rounded-r-xl', i === all.length - 1 && 'rounded-l-xl')}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70 text-ink">
                    {paginate(filtered, page, pageSize).map((h, i) => {
                      const st = statusOf(HALL_STATUS, h.status);
                      const tp = statusOf(HALL_TYPES, h.hall_type);
                      return (
                        <tr key={h.id} className="hover:bg-field/40">
                          <td className="px-3 text-muted">{faNumber((page - 1) * pageSize + i + 1)}</td>
                          <td className="px-3 py-3">
                            <p className="text-[15px] font-extrabold">{h.name}</p>
                            <p className="mt-0.5 text-[12.5px] text-muted">{h.venue_name ?? '—'}</p>
                          </td>
                          <td className="px-3 text-center">{h.city_name}</td>
                          <td className="tabular px-3 text-center">{faNumber(h.capacity)}</td>
                          <td className="tabular px-3 text-center">{faNumber(h.gates_count)}</td>
                          <td className="px-3 text-center">
                            <StatusPill tone={st.tone}>{st.label}</StatusPill>
                          </td>
                          <td className="px-3 text-center">
                            <StatusPill tone={tp.tone} dot={false} className="px-4">
                              {tp.label}
                            </StatusPill>
                          </td>
                          <td className="px-3 py-2">
                            <Thumb src={h.image_url} className="mx-auto h-[58px] w-[104px] rounded-lg object-cover" />
                          </td>
                          <td className="px-3">
                            <HallActions hall={h} onDetails={setDetails} onEdit={setEditing} onDelete={setToDelete} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {paginate(filtered, page, pageSize).map((h) => {
                  const st = statusOf(HALL_STATUS, h.status);
                  const tp = statusOf(HALL_TYPES, h.hall_type);
                  return (
                    <li key={h.id} className="rounded-xl border border-line/80 p-3">
                      <div className="flex gap-3">
                        <Thumb src={h.image_url} className="h-16 w-24 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-ink">{h.name}</p>
                          <p className="text-[12.5px] text-muted">
                            {h.venue_name} · {h.city_name}
                          </p>
                          <p className="tabular mt-1 text-[12.5px] text-muted">
                            ظرفیت {faNumber(h.capacity)} · {faNumber(h.gates_count)} گیت
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <StatusPill tone={st.tone}>{st.label}</StatusPill>
                        <StatusPill tone={tp.tone} dot={false}>
                          {tp.label}
                        </StatusPill>
                        <div className="mr-auto">
                          <HallActions hall={h} onDetails={setDetails} onEdit={setEditing} onDelete={setToDelete} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={set(setPageSize)} unit="سالن" />
            </>
          )}
        </Card>
      </div>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'افزودن سالن' : `ویرایش ${editing.name}`}
          fields={fields}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/halls', body) : apiPut(`/admin/halls/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal open={!!details} title={details?.name ?? ''} onClose={() => setDetails(null)} className="sm:max-w-xl">
        {details && (
          <div className="space-y-4">
            <Thumb src={details.image_url} className="h-48 w-full rounded-2xl object-cover" />
            <dl className="grid grid-cols-2 gap-3 text-[14px]">
              {[
                ['مجموعه', details.venue_name ?? '—'],
                ['شهر', details.city_name],
                ['ظرفیت', `${faNumber(details.capacity)} نفر`],
                ['تعداد گیت', faNumber(details.gates_count)],
                ['نوع نمایش', statusOf(HALL_TYPES, details.hall_type).label],
                ['وضعیت', statusOf(HALL_STATUS, details.status).label],
                ['صندلی‌های نقشه', faNumber(details.seats_count)],
                ['سانس‌های ثبت‌شده', faNumber(details.sessions_count)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-surface-2 p-3">
                  <dt className="text-[12px] text-muted">{k}</dt>
                  <dd className="mt-1 font-bold text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            {details.address && <p className="text-[14px] leading-7 text-muted">{details.address}</p>}
            <Link href={`/seat-maps?hall=${details.id}`} className={cn(primaryButton, 'w-full')}>
              <Armchair className="size-4" />
              مدیریت نقشه صندلی این سالن
            </Link>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="حذف سالن"
        message={deleteError || `آیا از حذف «${toDelete?.name ?? ''}» اطمینان دارید؟`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/halls/${toDelete.id}`);
            setToDelete(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف سالن با خطا مواجه شد.'));
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

function HallActions({ hall, onDetails, onEdit, onDelete }: { hall: Hall; onDetails: (h: Hall) => void; onEdit: (h: Hall) => void; onDelete: (h: Hall) => void }) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onDetails(hall)}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-brand-500/40 bg-surface px-3 text-[13px] font-bold text-brand-600 hover:bg-brand-500/5"
      >
        <Eye className="size-4" />
        جزئیات
      </button>
      <button
        type="button"
        onClick={() => onEdit(hall)}
        aria-label={`ویرایش ${hall.name}`}
        className="flex size-10 items-center justify-center rounded-xl border border-line bg-surface text-ink hover:border-brand-500/40"
      >
        <Pencil className="size-4" />
      </button>
      <RowMenu
        vertical
        items={[
          { label: 'نقشه صندلی', icon: <Armchair className="size-4" />, onClick: () => router.push(`/seat-maps?hall=${hall.id}`) },
          { label: 'حذف سالن', icon: <Trash2 className="size-4" />, onClick: () => onDelete(hall), danger: true },
        ]}
      />
    </div>
  );
}
