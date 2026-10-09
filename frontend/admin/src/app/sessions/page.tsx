'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Armchair, CalendarDays, Pencil, Plus, Tag, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { InlineAlert, primaryButton, secondaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { Pagination, paginate } from '@/components/ui/Pagination';
import { RowMenu } from '@/components/ui/RowMenu';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { Thumb } from '@/components/crud/cells';
import { FormModal } from '@/components/crud/FormModal';
import type { Row } from '@/components/crud/CrudPage';
import type { FieldDef } from '@/components/crud/fields';
import { useOptions } from '@/hooks/useOptions';
import { apiDelete, apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { SESSION_DISPLAY_STATUS, SESSION_STATUS_OPTIONS, options } from '@/lib/labels';
import { faDateNumeric, faNumber, faPercent, faTime, faWeekday, toEnDigits } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { Metric } from '@/services/dashboard';

type Session = Row & {
  event_id: number;
  event_title: string;
  event_banner_url?: string | null;
  category_name?: string | null;
  category_color?: string | null;
  hall_id: number;
  hall_name: string;
  city_id: number;
  city_name: string;
  title?: string | null;
  start_time: string;
  end_time: string;
  capacity: number;
  reserved_seats: number;
  price: number;
  display_status: string;
  seats_count: number;
};

interface SessionsSummary {
  sales: Metric;
  activeSessions: Metric;
  ticketsSold: Metric;
  capacity: Metric;
}

const RANGES = [
  { value: 'today', label: 'امروز' },
  { value: 'week', label: '۷ روز آینده' },
  { value: 'month', label: '۳۰ روز آینده' },
  { value: 'upcoming', label: 'همه سانس‌های پیش رو' },
  { value: 'past', label: 'سانس‌های گذشته' },
];

function inRange(s: Session, range: string) {
  if (!range) return true;
  const start = new Date(s.start_time).getTime();
  const now = Date.now();
  const midnight = new Date().setHours(0, 0, 0, 0);
  const day = 86_400_000;
  switch (range) {
    case 'today':
      return start >= midnight && start < midnight + day;
    case 'week':
      return start >= midnight && start < now + 7 * day;
    case 'month':
      return start >= midnight && start < now + 30 * day;
    case 'upcoming':
      return start >= now;
    case 'past':
      return start < now;
    default:
      return true;
  }
}

export default function AdminSessionsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sessions = useQuery({ queryKey: ['admin', 'sessions'], queryFn: () => apiGet<Session[]>('/admin/sessions') });
  const summary = useQuery({ queryKey: ['admin', 'sessions', 'summary'], queryFn: () => apiGet<SessionsSummary>('/admin/sessions/summary') });
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));
  const halls = useOptions(['admin', 'halls'], '/admin/halls', (r) => `${r.name} (${r.city_name})`);
  const events = useOptions(['admin', 'events'], '/admin/events', (r) => String(r.title));

  const [range, setRange] = useState('upcoming');
  const [city, setCity] = useState('');
  const [hall, setHall] = useState('');
  const [event, setEvent] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [editing, setEditing] = useState<Session | 'new' | null>(null);
  const [pricesOf, setPricesOf] = useState<Session | null>(null);
  const [toDelete, setToDelete] = useState<Session | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const filtered = useMemo(
    () =>
      (sessions.data ?? []).filter(
        (s) =>
          inRange(s, range) &&
          (!city || String(s.city_id) === city) &&
          (!hall || String(s.hall_id) === hall) &&
          (!event || String(s.event_id) === event) &&
          (!status || s.display_status === status),
      ),
    [sessions.data, range, city, hall, event, status],
  );
  const set = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
    queryClient.invalidateQueries({ queryKey: ['admin', 'events'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const fields: FieldDef[] = [
    { name: 'event_id', label: 'رویداد', type: 'select', numeric: true, required: true, options: events.options, wide: true },
    { name: 'title', label: 'عنوان سانس (اختیاری)', type: 'text', wide: true },
    { name: 'hall_id', label: 'سالن', type: 'select', numeric: true, required: true, options: halls.options },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, defaultValue: 'ACTIVE', options: SESSION_STATUS_OPTIONS },
    { name: 'start_time', label: 'زمان شروع', type: 'datetime', required: true },
    { name: 'end_time', label: 'زمان پایان', type: 'datetime', required: true },
    { name: 'capacity', label: 'ظرفیت', type: 'number', required: true },
    { name: 'reserved_seats', label: 'فروخته‌شده', type: 'number', defaultValue: '0' },
    { name: 'price', label: 'قیمت پایه (تومان)', type: 'number', required: true },
  ];
  const s = summary.data;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="سانس‌ها" crumbs={['سانس‌ها']} />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="مبلغ فروش" value={faNumber(s?.sales.value)} unit="تومان" icon="admin/finance" color="green" changePercent={s?.sales.changePercent} loading={summary.isLoading} />
          <StatTile title="تعداد سانس‌ها" value={faNumber(s?.activeSessions.value)} unit="سانس فعال" icon="common/calendar-simple" color="blue" changePercent={s?.activeSessions.changePercent} loading={summary.isLoading} />
          <StatTile title="مجموع فروش" value={faNumber(s?.ticketsSold.value)} unit="بلیت" icon="common/ticket" color="orange" changePercent={s?.ticketsSold.changePercent} loading={summary.isLoading} />
          <StatTile title="مجموع ظرفیت" value={faNumber(s?.capacity.value)} unit="صندلی" icon="admin/crm" color="red" changePercent={s?.capacity.changePercent} loading={summary.isLoading} />
        </div>

        <Card className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-[repeat(5,minmax(0,1fr))_auto] xl:items-end">
          <FilterSelect label="بازه تاریخ" icon={<CalendarDays className="size-4" />} value={range} onChange={set(setRange)} options={RANGES} allLabel="همه تاریخ‌ها" />
          <FilterSelect value={city} onChange={set(setCity)} options={cities.options} allLabel="همه شهرها" className="xl:self-end" />
          <FilterSelect value={hall} onChange={set(setHall)} options={halls.options} allLabel="همه سالن‌ها" className="xl:self-end" />
          <FilterSelect value={event} onChange={set(setEvent)} options={events.options} allLabel="همه رویدادها" className="xl:self-end" />
          <FilterSelect value={status} onChange={set(setStatus)} options={options(SESSION_DISPLAY_STATUS)} allLabel="همه وضعیت‌ها" className="xl:self-end" />
          <button type="button" onClick={() => setEditing('new')} className={cn(primaryButton, 'h-12 px-6 text-[15px]')}>
            <Plus className="size-5" />
            افزودن سانس
          </button>
        </Card>

        <Card className="p-3 sm:p-4">
          <p className="mb-3 px-1 text-[13.5px] text-muted">
            نمایش {faNumber(Math.min(pageSize, Math.max(0, filtered.length - (page - 1) * pageSize)))} مورد از {faNumber(filtered.length)} سانس
          </p>
          {sessions.isError ? (
            <ErrorState message={errorMessage(sessions.error, 'دریافت سانس‌ها با خطا مواجه شد.')} onRetry={() => sessions.refetch()} />
          ) : sessions.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-14 rounded-xl" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState message="سانسی مطابق فیلترها پیدا نشد." />
          ) : (
            <>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full min-w-[980px] text-right text-[13.5px]">
                  <thead>
                    <tr className="bg-surface-2 text-[13px] text-ink">
                      {['#', 'نام رویداد', 'شهر', 'سالن', 'تاریخ', 'ساعت', 'ظرفیت', 'فروش', 'وضعیت', 'عملیات'].map((c, i, all) => (
                        <th key={c} className={cn('h-12 px-3 font-bold', i > 1 && 'text-center', i === 0 && 'rounded-r-xl', i === all.length - 1 && 'rounded-l-xl')}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/70 text-ink">
                    {paginate(filtered, page, pageSize).map((row, i) => {
                      const st = statusOf(SESSION_DISPLAY_STATUS, row.display_status);
                      const pct = row.capacity ? Math.round((row.reserved_seats * 100) / row.capacity) : 0;
                      return (
                        <tr key={row.id} className="hover:bg-field/40">
                          <td className="px-3 text-muted">{faNumber((page - 1) * pageSize + i + 1)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-3">
                              <Thumb src={row.event_banner_url} className="size-12 shrink-0 rounded-lg object-cover" />
                              <div className="min-w-0">
                                <p className="truncate font-extrabold">{row.title || row.event_title}</p>
                                {row.category_name && (
                                  <span
                                    className="mt-1 inline-block rounded-md px-2 py-0.5 text-[11px] font-bold"
                                    style={{ color: row.category_color ?? undefined, backgroundColor: `color-mix(in srgb, ${row.category_color ?? '#2f80f5'} 12%, transparent)` }}
                                  >
                                    {row.category_name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 text-center">{row.city_name}</td>
                          <td className="px-3 text-center">{row.hall_name}</td>
                          <td className="tabular px-3 text-center leading-6">
                            <div>{faDateNumeric(row.start_time)}</div>
                            <div className="text-[12px] text-muted">{faWeekday(new Date(row.start_time))}</div>
                          </td>
                          <td className="tabular px-3 text-center">{faTime(row.start_time)}</td>
                          <td className="tabular px-3 text-center">{faNumber(row.capacity)}</td>
                          <td className="tabular px-3 text-center leading-6">
                            <div className="font-bold">{faNumber(row.reserved_seats)}</div>
                            <div className="text-[12px] font-bold text-success-fg">{faPercent(pct)}</div>
                          </td>
                          <td className="px-3 text-center">
                            <StatusPill tone={st.tone}>{st.label}</StatusPill>
                          </td>
                          <td className="px-3">
                            <SessionActions session={row} onEdit={setEditing} onPrices={setPricesOf} onDelete={setToDelete} onSeatMap={() => router.push(`/seat-maps?session=${row.id}`)} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="space-y-3 lg:hidden">
                {paginate(filtered, page, pageSize).map((row) => {
                  const st = statusOf(SESSION_DISPLAY_STATUS, row.display_status);
                  return (
                    <li key={row.id} className="rounded-xl border border-line/80 p-3">
                      <div className="flex gap-3">
                        <Thumb src={row.event_banner_url} className="size-14 shrink-0 rounded-lg object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-ink">{row.title || row.event_title}</p>
                          <p className="text-[12.5px] text-muted">
                            {row.city_name} · {row.hall_name}
                          </p>
                          <p className="tabular text-[12.5px] text-muted">
                            {faWeekday(new Date(row.start_time))} {faDateNumeric(row.start_time)} · ساعت {faTime(row.start_time)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <StatusPill tone={st.tone}>{st.label}</StatusPill>
                        <span className="tabular text-[12.5px] text-muted">
                          فروش {faNumber(row.reserved_seats)} از {faNumber(row.capacity)}
                        </span>
                        <SessionActions session={row} onEdit={setEditing} onPrices={setPricesOf} onDelete={setToDelete} onSeatMap={() => router.push(`/seat-maps?session=${row.id}`)} />
                      </div>
                    </li>
                  );
                })}
              </ul>

              <Pagination page={page} pageSize={pageSize} total={filtered.length} onPage={setPage} onPageSize={set(setPageSize)} unit="سانس" />
            </>
          )}
        </Card>
      </div>

      {editing && (
        <FormModal
          key={editing === 'new' ? 'new' : editing.id}
          title={editing === 'new' ? 'افزودن سانس' : `ویرایش سانس «${editing.title || editing.event_title}»`}
          fields={fields}
          initial={editing === 'new' ? null : editing}
          submit={(body) => (editing === 'new' ? apiPost('/admin/sessions', body) : apiPut(`/admin/sessions/${editing.id}`, body))}
          onSaved={refresh}
          onClose={() => setEditing(null)}
        />
      )}

      <Modal open={!!pricesOf} title="قیمت بلیت بر اساس نوع صندلی" onClose={() => setPricesOf(null)}>
        {pricesOf && <PricesForm session={pricesOf} onDone={() => setPricesOf(null)} />}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="حذف سانس"
        message={deleteError || 'آیا از حذف این سانس اطمینان دارید؟'}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await apiDelete(`/admin/sessions/${toDelete.id}`);
            setToDelete(null);
            refresh();
          } catch (err) {
            setDeleteError(errorMessage(err, 'حذف سانس با خطا مواجه شد.'));
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

function SessionActions({
  session,
  onEdit,
  onPrices,
  onDelete,
  onSeatMap,
}: {
  session: Session;
  onEdit: (s: Session) => void;
  onPrices: (s: Session) => void;
  onDelete: (s: Session) => void;
  onSeatMap: () => void;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        onClick={() => onEdit(session)}
        aria-label="ویرایش سانس"
        className="flex size-10 items-center justify-center rounded-xl text-brand-600 hover:bg-brand-500/10"
      >
        <Pencil className="size-5" />
      </button>
      <RowMenu
        vertical
        items={[
          ...(session.seats_count > 0
            ? [
                { label: 'نقشه صندلی سانس', icon: <Armchair className="size-4" />, onClick: onSeatMap },
                { label: 'قیمت هر نوع صندلی', icon: <Tag className="size-4" />, onClick: () => onPrices(session) },
              ]
            : []),
          { label: 'حذف سانس', icon: <Trash2 className="size-4" />, onClick: () => onDelete(session), danger: true },
        ]}
      />
    </div>
  );
}

interface TierPrice {
  code: string;
  name: string;
  color: string;
  price: number | null;
}

function PricesForm({ session, onDone }: { session: Session; onDone: () => void }) {
  const queryClient = useQueryClient();
  const prices = useQuery({ queryKey: ['admin', 'sessions', session.id, 'prices'], queryFn: () => apiGet<TierPrice[]>(`/admin/sessions/${session.id}/prices`) });
  const [values, setValues] = useState<Record<string, string> | null>(null);
  const current = values ?? Object.fromEntries((prices.data ?? []).map((p) => [p.code, p.price === null ? '' : String(Number(p.price))]));
  const save = useMutation({
    mutationFn: () =>
      apiPut(
        `/admin/sessions/${session.id}/prices`,
        Object.fromEntries(Object.entries(current).map(([k, v]) => [k, v.trim() ? Number(toEnDigits(v).replace(/[^\d.]/g, '')) : null])),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions', session.id, 'prices'] });
      onDone();
    },
  });

  if (prices.isLoading) return <Skeleton className="h-48 rounded-xl" />;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4"
    >
      <p className="text-[13.5px] leading-7 text-muted">
        قیمت هر نوع صندلی برای «{session.title || session.event_title}». نوعی که قیمت ندارد، قیمت پایه سانس ({faNumber(session.price)} تومان) را می‌گیرد.
      </p>
      {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره قیمت‌ها با خطا مواجه شد.')}</InlineAlert>}
      {(prices.data ?? []).map((p) => (
        <label key={p.code} className="flex items-center gap-3">
          <span className="flex w-28 shrink-0 items-center gap-2 text-[14px] font-bold text-ink">
            <span className="size-3.5 rounded-full" style={{ background: p.color }} />
            {p.name}
          </span>
          <input
            inputMode="numeric"
            dir="ltr"
            value={current[p.code] ?? ''}
            onChange={(e) => setValues({ ...current, [p.code]: e.target.value })}
            placeholder="قیمت پایه"
            className="h-12 w-full rounded-xl border border-line bg-field px-3.5 text-left text-[15px] text-ink outline-none focus:border-brand-500/50 focus:bg-surface"
          />
          <span className="shrink-0 text-[13px] text-muted">تومان</span>
        </label>
      ))}
      <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onDone} className={secondaryButton}>
          انصراف
        </button>
        <button type="submit" disabled={save.isPending} className={primaryButton}>
          {save.isPending ? 'در حال ذخیره...' : 'ذخیره قیمت‌ها'}
        </button>
      </div>
    </form>
  );
}
