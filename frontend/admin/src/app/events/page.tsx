'use client';

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, CalendarRange, ChevronDown, ExternalLink, FileText, Layers, MapPin, Pencil, Plus, Search, SlidersHorizontal, Clock, Trash2 } from 'lucide-react';
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
import { CrudPage, type Row } from '@/components/crud/CrudPage';
import type { FieldDef } from '@/components/crud/fields';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { EVENT_DISPLAY_STATUS, EVENT_STATUS_OPTIONS, SESSION_DISPLAY_STATUS, SESSION_STATUS_OPTIONS, options } from '@/lib/labels';
import { faDateSpan, faDateTime, faNumber, faPercent, faTimeRange } from '@/lib/format';
import { cn } from '@/lib/cn';

const USER_SITE_URL = process.env.NEXT_PUBLIC_USER_SITE_URL || '';

type EventRow = Row & {
  title: string;
  slug: string;
  banner_url?: string | null;
  city_id?: number | null;
  city_name?: string | null;
  hall_name?: string | null;
  category_id?: number | null;
  category_name?: string | null;
  organizer_name?: string | null;
  display_status: string;
  starts_at?: string | null;
  ends_at?: string | null;
  capacity: number;
  sold: number;
  featured?: boolean;
  popular?: boolean;
  sessions_count: number;
  created_at?: string | null;
};

const SORTS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'oldest', label: 'قدیمی‌ترین' },
  { value: 'date', label: 'تاریخ برگزاری' },
  { value: 'sales', label: 'بیشترین فروش' },
  { value: 'title', label: 'عنوان' },
];

const PERIODS = [
  { value: 'upcoming', label: 'رویدادهای پیش رو' },
  { value: 'today', label: 'امروز' },
  { value: 'week', label: '۷ روز آینده' },
  { value: 'month', label: '۳۰ روز آینده' },
  { value: 'past', label: 'برگزار شده' },
];

const BAR: Record<string, string> = { success: 'bg-success', brand: 'bg-brand-500', warning: 'bg-warning', danger: 'bg-danger', muted: 'bg-brand-500' };

function inPeriod(e: EventRow, period: string): boolean {
  if (!period) return true;
  const now = Date.now();
  const start = e.starts_at ? new Date(e.starts_at).getTime() : null;
  const end = e.ends_at ? new Date(e.ends_at).getTime() : start;
  if (start === null) return period === 'upcoming';
  const day = 86_400_000;
  switch (period) {
    case 'past':
      return (end ?? start) < now;
    case 'upcoming':
      return (end ?? start) >= now;
    case 'today': {
      const midnight = new Date().setHours(0, 0, 0, 0);
      return start < midnight + day && (end ?? start) >= midnight;
    }
    case 'week':
      return start < now + 7 * day && (end ?? start) >= now;
    case 'month':
      return start < now + 30 * day && (end ?? start) >= now;
    default:
      return true;
  }
}

export default function AdminEventsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <EventsScreen />
      </Suspense>
    </AdminLayout>
  );
}

function EventsScreen() {
  const queryClient = useQueryClient();
  const events = useQuery({ queryKey: ['admin', 'events'], queryFn: () => apiGet<EventRow[]>('/admin/events') });
  const categories = useOptions(['admin', 'categories'], '/admin/categories', (r) => String(r.name));
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));
  const halls = useOptions(['admin', 'halls'], '/admin/halls', (r) => `${r.name} (${r.city_name})`);

  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [period, setPeriod] = useState('');
  const [sort, setSort] = useState('newest');
  const [more, setMore] = useState(false);
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [onlyPopular, setOnlyPopular] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [editing, setEditing] = useState<EventRow | 'new' | null>(params.get('new') ? 'new' : null);
  const [sessionsOf, setSessionsOf] = useState<EventRow | null>(null);
  const [contentOf, setContentOf] = useState<EventRow | null>(null);
  const [toDelete, setToDelete] = useState<EventRow | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim();
    const rows = (events.data ?? []).filter(
      (e) =>
        (!q || [e.title, e.city_name, e.hall_name, e.organizer_name, e.category_name].some((v) => v?.includes(q))) &&
        (!city || String(e.city_id) === city) &&
        (!category || String(e.category_id) === category) &&
        (!status || e.display_status === status) &&
        inPeriod(e, period) &&
        (!onlyFeatured || e.featured) &&
        (!onlyPopular || e.popular),
    );
    const time = (v?: string | null) => (v ? new Date(v).getTime() : Number.MAX_SAFE_INTEGER);
    return [...rows].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.id - b.id;
        case 'date':
          return time(a.starts_at) - time(b.starts_at);
        case 'sales':
          return b.sold - a.sold;
        case 'title':
          return a.title.localeCompare(b.title, 'fa');
        default:
          return b.id - a.id;
      }
    });
  }, [events.data, search, city, category, status, period, sort, onlyFeatured, onlyPopular]);

  const visible = paginate(filtered, page, pageSize);
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const fields: FieldDef[] = [
    { name: 'title', label: 'عنوان رویداد', type: 'text', required: true, wide: true },
    { name: 'subtitle', label: 'زیرعنوان', type: 'text', wide: true },
    { name: 'slug', label: 'نامک (آدرس صفحه)', type: 'text', required: true, dir: 'ltr', hint: 'بدون فاصله؛ مثلاً iran-tech-expo' },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'PUBLISHED', options: EVENT_STATUS_OPTIONS },
    { name: 'category_id', label: 'دسته‌بندی', type: 'select', numeric: true, options: categories.options },
    { name: 'organizer_name', label: 'برگزارکننده', type: 'text' },
    { name: 'city_id', label: 'شهر', type: 'select', numeric: true, options: cities.options },
    {
      name: 'hall_id',
      label: 'سالن',
      type: 'select',
      numeric: true,
      options: (v) => halls.rows.filter((h) => !v.city_id || String(h.city_id) === v.city_id).map((h) => ({ value: h.id, label: String(h.name) })),
    },
    { name: 'min_price', label: 'شروع قیمت (تومان)', type: 'number' },
    { name: 'website_url', label: 'وب‌سایت', type: 'text', dir: 'ltr' },
    { name: 'start_date', label: 'تاریخ شروع (رویدادهای چندروزه)', type: 'datetime' },
    { name: 'end_date', label: 'تاریخ پایان', type: 'datetime' },
    { name: 'banner_url', label: 'پوستر / تصویر رویداد', type: 'image', wide: true },
    { name: 'featured', label: 'نمایش در «رویدادهای پیشنهادی»', type: 'switch' },
    { name: 'popular', label: 'رویداد محبوب', type: 'switch' },
    { name: 'description', label: 'درباره رویداد', type: 'textarea', wide: true },
    { name: 'notice', label: 'نکته مهم صفحه رویداد', type: 'textarea', wide: true },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="مدیریت رویدادها" crumbs={['رویدادها']} />

      <Card className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative block w-full sm:max-w-md">
            <span className="sr-only">جستجو</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink/70" />
            <input
              type="search"
              value={search}
              onChange={(e) => resetPage(setSearch)(e.target.value)}
              placeholder="جستجو در نام رویداد، شهر، سالن و ..."
              className="h-12 w-full rounded-xl border border-line bg-surface pr-4 pl-12 text-[14px] text-ink outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/10"
            />
          </label>
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6 text-[15px]')}>
            <Plus className="size-5 rounded-full bg-white p-0.5 text-brand-600" />
            افزودن رویداد
          </button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FilterSelect label="شهر" icon={<MapPin className="size-4" />} value={city} onChange={resetPage(setCity)} options={cities.options} allLabel="همه شهرها" />
          <FilterSelect label="دسته‌بندی" icon={<Layers className="size-4" />} value={category} onChange={resetPage(setCategory)} options={categories.options} allLabel="همه دسته‌ها" />
          <FilterSelect label="وضعیت" icon={<Layers className="size-4" />} value={status} onChange={resetPage(setStatus)} options={options(EVENT_DISPLAY_STATUS)} allLabel="همه وضعیت‌ها" />
          <FilterSelect label="بازه تاریخ برگزاری" icon={<CalendarRange className="size-4" />} value={period} onChange={resetPage(setPeriod)} options={PERIODS} allLabel="همه تاریخ‌ها" />
        </div>
      </Card>

      <Card className="p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[14px] font-semibold text-ink">تعداد {faNumber(filtered.length)} رویداد</span>
            <label className="relative flex h-11 items-center">
              <ArrowUpDown className="pointer-events-none absolute right-3 size-4 text-ink/70" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                aria-label="مرتب‌سازی"
                className="h-full appearance-none rounded-xl border border-line bg-surface pr-9 pl-9 text-[13.5px] font-semibold text-ink outline-none"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    مرتب‌سازی: {s.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute left-3 size-4 text-muted" />
            </label>
          </div>
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            aria-expanded={more}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-[13.5px] font-bold text-brand-600 hover:border-brand-500/40"
          >
            <SlidersHorizontal className="size-4" />
            فیلترهای بیشتر
          </button>
        </div>
        {more && (
          <div className="mb-3 flex flex-wrap gap-2 rounded-xl bg-surface-2 p-3">
            {[
              { label: 'فقط رویدادهای پیشنهادی', on: onlyFeatured, set: setOnlyFeatured },
              { label: 'فقط رویدادهای محبوب', on: onlyPopular, set: setOnlyPopular },
            ].map((f) => (
              <button
                key={f.label}
                type="button"
                aria-pressed={f.on}
                onClick={() => resetPage(f.set)(!f.on)}
                className={cn('h-10 rounded-xl border px-4 text-[13px] font-bold', f.on ? 'border-brand-600 bg-brand-600 text-white' : 'border-line bg-surface text-ink')}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}

        {events.isError ? (
          <ErrorState message={errorMessage(events.error, 'دریافت فهرست رویدادها با خطا مواجه شد.')} onRetry={() => events.refetch()} />
        ) : events.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState message="رویدادی مطابق فیلترها پیدا نشد." />
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[980px] text-right text-[13.5px]">
                <thead>
                  <tr className="bg-surface-2 text-[13px] font-bold text-ink">
                    {['#', 'پوستر', 'نام رویداد', 'شهر', 'تاریخ برگزاری', 'سالن', 'وضعیت', 'فروش', 'عملیات'].map((c, i, all) => (
                      <th key={c} className={cn('h-12 px-3 font-bold', i === 0 && 'rounded-r-xl', i === all.length - 1 && 'rounded-l-xl text-center')}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/70">
                  {visible.map((e, i) => {
                    const st = statusOf(EVENT_DISPLAY_STATUS, e.display_status);
                    const pct = e.capacity > 0 ? Math.round((e.sold * 100) / e.capacity) : 0;
                    return (
                      <tr key={e.id} className="text-ink hover:bg-field/50">
                        <td className="px-3 text-muted">{faNumber((page - 1) * pageSize + i + 1)}</td>
                        <td className="px-3 py-2.5">
                          <Thumb src={e.banner_url} className="size-14 rounded-xl object-cover" />
                        </td>
                        <td className="max-w-[260px] px-3 font-bold leading-6">{e.title}</td>
                        <td className="whitespace-nowrap px-3">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="size-4 text-brand-600" />
                            {e.city_name ?? '—'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 text-center leading-6">
                          <div>{faDateSpan(e.starts_at, e.ends_at && e.ends_at.slice(0, 10) !== e.starts_at?.slice(0, 10) ? e.ends_at : null)}</div>
                          <div className="tabular text-[12px] text-muted" dir="ltr">{faTimeRange(e.starts_at, e.ends_at)}</div>
                        </td>
                        <td className="max-w-[130px] px-3 text-center leading-6">{e.hall_name ?? '—'}</td>
                        <td className="px-3">
                          <StatusPill tone={st.tone}>{st.label}</StatusPill>
                        </td>
                        <td className="min-w-[120px] px-3">
                          <div className="tabular text-center text-[13px] font-semibold" dir="ltr">
                            {faNumber(e.sold)} / {faNumber(e.capacity)}
                          </div>
                          <div className="mt-1.5 flex items-center gap-2" dir="ltr">
                            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-line">
                              <span className={cn('block h-full rounded-full', BAR[st.tone])} style={{ width: `${Math.min(100, pct)}%` }} />
                            </span>
                            <span className={cn('tabular text-[11px] font-bold', st.tone === 'warning' ? 'text-warning-fg' : 'text-success-fg')}>{faPercent(pct)}</span>
                          </div>
                        </td>
                        <td className="px-3">
                          <RowActions
                            onEdit={() => setEditing(e)}
                            onSessions={() => setSessionsOf(e)}
                            onContent={() => setContentOf(e)}
                            onDelete={() => setToDelete(e)}
                            slug={e.slug}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ul className="space-y-3 lg:hidden">
              {visible.map((e) => {
                const st = statusOf(EVENT_DISPLAY_STATUS, e.display_status);
                const pct = e.capacity > 0 ? Math.round((e.sold * 100) / e.capacity) : 0;
                return (
                  <li key={e.id} className="rounded-xl border border-line/80 p-3">
                    <div className="flex gap-3">
                      <Thumb src={e.banner_url} className="size-16 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-bold leading-6 text-ink">{e.title}</p>
                        <p className="mt-1 text-[12.5px] text-muted">
                          {[e.city_name, e.hall_name].filter(Boolean).join(' · ')}
                        </p>
                        <p className="tabular mt-0.5 text-[12.5px] text-muted">{e.starts_at ? faDateSpan(e.starts_at) : '—'}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <StatusPill tone={st.tone}>{st.label}</StatusPill>
                      <div className="flex-1">
                        <div className="tabular text-left text-[12px] text-muted" dir="ltr">
                          {faNumber(e.sold)} / {faNumber(e.capacity)} ({faPercent(pct)})
                        </div>
                        <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-line" dir="ltr">
                          <span className={cn('block h-full rounded-full', BAR[st.tone])} style={{ width: `${Math.min(100, pct)}%` }} />
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 border-t border-line/60 pt-3">
                      <RowActions
                        onEdit={() => setEditing(e)}
                        onSessions={() => setSessionsOf(e)}
                        onContent={() => setContentOf(e)}
                        onDelete={() => setToDelete(e)}
                        slug={e.slug}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>

            <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={resetPage(setPageSize)} unit="رویداد" />
          </>
        )}
      </Card>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'افزودن رویداد' : `ویرایش «${editing.title}»`}
          fields={fields}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/events', body) : apiPut(`/admin/events/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal open={!!sessionsOf} title={`سانس‌های «${sessionsOf?.title ?? ''}»`} onClose={() => setSessionsOf(null)} className="sm:max-w-4xl">
        {sessionsOf && <SessionsManager event={sessionsOf} hallOptions={halls.options} />}
      </Modal>

      <Modal open={!!contentOf} title={`محتوای صفحه «${contentOf?.title ?? ''}»`} onClose={() => setContentOf(null)} className="sm:max-w-4xl">
        {contentOf && <EventContentManager eventId={contentOf.id} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="حذف رویداد"
        message={deleteError || `آیا از حذف «${toDelete?.title ?? ''}» اطمینان دارید؟ این عمل قابل بازگشت نیست.`}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/events/${toDelete.id}`);
            setToDelete(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف رویداد با خطا مواجه شد.'));
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

function RowActions({ onEdit, onSessions, onContent, onDelete, slug }: { onEdit: () => void; onSessions: () => void; onContent: () => void; onDelete: () => void; slug: string }) {
  return (
    <div className="flex items-center justify-end gap-2 lg:justify-center">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-brand-500/10 px-3.5 text-[13px] font-bold text-brand-600 hover:bg-brand-500/15"
      >
        <Pencil className="size-4" />
        ویرایش
      </button>
      <RowMenu
        items={[
          { label: 'سانس‌ها و قیمت‌ها', icon: <Clock className="size-4" />, onClick: onSessions },
          { label: 'محتوای صفحه رویداد', icon: <FileText className="size-4" />, onClick: onContent },
          { label: 'مشاهده در سایت', icon: <ExternalLink className="size-4" />, onClick: () => window.open(`${USER_SITE_URL}/events/${encodeURIComponent(slug)}`, '_blank') },
          { label: 'حذف رویداد', icon: <Trash2 className="size-4" />, onClick: onDelete, danger: true },
        ]}
      />
    </div>
  );
}

function SessionsManager({ event, hallOptions }: { event: EventRow; hallOptions: { value: number | string; label: string }[] }) {
  const fields: FieldDef[] = [
    { name: 'title', label: 'عنوان سانس (اختیاری)', type: 'text', wide: true, hint: 'مثلاً «کارگاه هوش مصنوعی»؛ اگر خالی بماند عنوان رویداد نمایش داده می‌شود.' },
    { name: 'hall_id', label: 'سالن', type: 'select', numeric: true, required: true, options: hallOptions, defaultValue: event.hall_id ? String(event.hall_id) : '' },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'ACTIVE', options: SESSION_STATUS_OPTIONS },
    { name: 'start_time', label: 'زمان شروع', type: 'datetime', required: true },
    { name: 'end_time', label: 'زمان پایان', type: 'datetime', required: true },
    { name: 'capacity', label: 'ظرفیت', type: 'number', required: true, hint: 'در سالن‌های دارای نقشه صندلی، برابر تعداد صندلی‌ها قرار دهید.' },
    { name: 'reserved_seats', label: 'صندلی‌های فروخته‌شده', type: 'number', defaultValue: '0' },
    { name: 'price', label: 'قیمت پایه بلیت (تومان)', type: 'number', required: true, defaultValue: event.min_price ? String(Number(event.min_price)) : '' },
  ];

  return (
    <CrudPage
      embedded
      title="سانس‌ها"
      entity="سانس"
      queryKey={['admin', 'events', event.id, 'sessions']}
      listUrl={`/admin/events/${event.id}/sessions`}
      itemUrl={(id) => `/admin/sessions/${id}`}
      invalidate={[['admin', 'events'], ['admin', 'sessions'], ['dashboard']]}
      fields={fields}
      emptyMessage="برای این رویداد هنوز سانسی تعریف نشده است."
      columns={[
        { key: 'start_time', label: 'زمان شروع', render: (r) => faDateTime(String(r.start_time)) },
        { key: 'title', label: 'عنوان' },
        { key: 'hall_name', label: 'سالن' },
        { key: 'capacity', label: 'فروش / ظرفیت', className: 'tabular', render: (r) => <span dir="ltr">{faNumber(Number(r.reserved_seats ?? 0))} / {faNumber(Number(r.capacity))}</span> },
        { key: 'price', label: 'قیمت پایه', className: 'tabular', render: (r) => `${faNumber(Number(r.price))} تومان` },
        {
          key: 'display_status',
          label: 'وضعیت',
          render: (r) => {
            const s = statusOf(SESSION_DISPLAY_STATUS, r.display_status);
            return <StatusPill tone={s.tone}>{s.label}</StatusPill>;
          },
        },
      ]}
    />
  );
}

const CONTENT_TABS = [
  {
    kind: 'stats',
    label: 'آمار',
    entity: 'آمار',
    fields: [
      { name: 'value', label: 'مقدار', type: 'text', required: true, placeholder: '+۱۵,۰۰۰' },
      { name: 'label', label: 'عنوان', type: 'text', required: true, placeholder: 'بازدیدکننده پیش‌بینی‌شده' },
      { name: 'color', label: 'رنگ', type: 'color' },
      { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
      { name: 'icon_url', label: 'آیکون', type: 'image', wide: true },
    ] as FieldDef[],
    columns: [
      { key: 'value', label: 'مقدار' },
      { key: 'label', label: 'عنوان' },
    ],
  },
  {
    kind: 'topics',
    label: 'محورها',
    entity: 'محور',
    fields: [
      { name: 'title', label: 'عنوان محور', type: 'text', required: true, wide: true },
      { name: 'color', label: 'رنگ', type: 'color' },
      { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
      { name: 'icon_url', label: 'آیکون', type: 'image', wide: true },
    ] as FieldDef[],
    columns: [{ key: 'title', label: 'عنوان' }],
  },
  {
    kind: 'speakers',
    label: 'سخنرانان',
    entity: 'سخنران',
    fields: [
      { name: 'full_name', label: 'نام و نام خانوادگی', type: 'text', required: true },
      { name: 'job_title', label: 'سمت', type: 'text' },
      { name: 'organization', label: 'سازمان / تخصص', type: 'text' },
      { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
      { name: 'photo_url', label: 'تصویر', type: 'image', wide: true },
      { name: 'keynote', label: 'سخنران شاخص', type: 'switch' },
    ] as FieldDef[],
    columns: [
      { key: 'full_name', label: 'نام' },
      { key: 'job_title', label: 'سمت' },
      { key: 'organization', label: 'سازمان' },
    ],
  },
  {
    kind: 'gallery',
    label: 'گالری',
    entity: 'تصویر',
    fields: [
      { name: 'image_url', label: 'تصویر', type: 'image', required: true, wide: true },
      { name: 'caption', label: 'توضیح', type: 'text' },
      { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
    ] as FieldDef[],
    columns: [
      { key: 'caption', label: 'توضیح' },
      { key: 'image_url', label: 'تصویر', render: (r: Row) => <Thumb src={r.image_url} /> },
    ],
  },
  {
    kind: 'faqs',
    label: 'سوالات متداول',
    entity: 'سوال',
    fields: [
      { name: 'question', label: 'سوال', type: 'text', required: true, wide: true },
      { name: 'answer', label: 'پاسخ', type: 'textarea', required: true, wide: true },
      { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
    ] as FieldDef[],
    columns: [{ key: 'question', label: 'سوال' }],
  },
];

/** Stats, topics, speakers, gallery and FAQ shown on the user event page. */
function EventContentManager({ eventId }: { eventId: number }) {
  const [tab, setTab] = useState(CONTENT_TABS[0].kind);
  const active = CONTENT_TABS.find((t) => t.kind === tab)!;
  return (
    <div>
      <div role="tablist" className="no-scrollbar -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-line px-1">
        {CONTENT_TABS.map((t) => (
          <button
            key={t.kind}
            type="button"
            role="tab"
            aria-selected={t.kind === tab}
            onClick={() => setTab(t.kind)}
            className={cn(
              '-mb-px shrink-0 border-b-2 px-4 py-2.5 text-[14px] font-bold',
              t.kind === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CrudPage
        key={active.kind}
        embedded
        title={active.label}
        entity={active.entity}
        queryKey={['admin', 'events', eventId, 'content', active.kind]}
        listUrl={`/admin/events/${eventId}/content/${active.kind}`}
        itemUrl={(id) => `/admin/events/${eventId}/content/${active.kind}/${id}`}
        fields={active.fields}
        columns={active.columns}
      />
    </div>
  );
}
