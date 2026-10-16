'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarDays, CalendarRange, ChevronLeft, ChevronRight, LayoutGrid, MapPin, Plus, UsersRound } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/States';
import { primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { FormModal } from '@/components/crud/FormModal';
import type { FieldDef } from '@/components/crud/fields';
import { useOptions } from '@/hooks/useOptions';
import { apiGet, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { SESSION_STATUS_OPTIONS } from '@/lib/labels';
import { faDayMonth, faFullDate, faNumber, faTime, faWeekday } from '@/lib/format';
import { cn } from '@/lib/cn';

type View = 'week' | 'day' | 'month';

interface CalSession {
  id: number;
  event_title: string;
  title?: string | null;
  category_id?: number | null;
  category_color?: string | null;
  city_id: number;
  city_name: string;
  hall_id: number;
  hall_name: string;
  start_time: string;
  end_time: string;
  capacity: number;
  reserved_seats: number;
  status: string;
  price: number;
  [key: string]: unknown;
}

const FIRST_HOUR = 8;
const LAST_HOUR = 22;
const HOUR_PX = 64;

/** Saturday (start of the Persian week) at 00:00 of the week containing `d`. */
function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 1) % 7));
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** Range shown by the view: [from, to). Month view covers whole weeks around the Persian month. */
function rangeOf(view: View, anchor: Date): { from: Date; to: Date } {
  if (view === 'day') {
    const from = new Date(anchor);
    from.setHours(0, 0, 0, 0);
    return { from, to: addDays(from, 1) };
  }
  if (view === 'week') {
    const from = weekStart(anchor);
    return { from, to: addDays(from, 7) };
  }
  const dayOfMonth = Number(new Intl.DateTimeFormat('en-US-u-ca-persian', { day: 'numeric' }).format(anchor));
  const monthStart = addDays(anchor, 1 - dayOfMonth);
  monthStart.setHours(0, 0, 0, 0);
  const from = weekStart(monthStart);
  return { from, to: addDays(from, 42) };
}

/** Puts overlapping sessions of one day side by side. */
function lanes(items: CalSession[]) {
  const sorted = [...items].sort((a, b) => a.start_time.localeCompare(b.start_time));
  const ends: number[] = [];
  const placed = sorted.map((s) => {
    const start = new Date(s.start_time).getTime();
    let lane = ends.findIndex((end) => end <= start);
    if (lane === -1) lane = ends.push(0) - 1;
    ends[lane] = new Date(s.end_time).getTime();
    return { s, lane };
  });
  return { placed, count: Math.max(1, ends.length) };
}

export default function RotationCalendarPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>('week');
  const [anchor, setAnchor] = useState(() => new Date());
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [hall, setHall] = useState('');
  const [editing, setEditing] = useState<CalSession | null>(null);

  const categories = useOptions(['admin', 'categories'], '/admin/categories', (r) => String(r.name));
  const cities = useOptions(['admin', 'cities'], '/admin/cities', (r) => String(r.name));
  const halls = useOptions(['admin', 'halls'], '/admin/halls', (r) => `${r.name} (${r.city_name})`);

  const { from, to } = rangeOf(view, anchor);
  const sessions = useQuery({
    queryKey: ['admin', 'sessions', 'calendar', from.toISOString(), to.toISOString()],
    queryFn: () => apiGet<CalSession[]>('/admin/sessions', { from: from.toISOString(), to: to.toISOString() }),
  });
  const visible = useMemo(
    () =>
      (sessions.data ?? []).filter(
        (s) =>
          s.status !== 'CANCELLED' &&
          (!category || String(s.category_id) === category) &&
          (!city || String(s.city_id) === city) &&
          (!hall || String(s.hall_id) === hall),
      ),
    [sessions.data, category, city, hall],
  );

  const days = view === 'day' ? [from] : Array.from({ length: view === 'week' ? 7 : 42 }, (_, i) => addDays(from, i));
  const step = (dir: 1 | -1) => setAnchor((a) => (view === 'day' ? addDays(a, dir) : view === 'week' ? addDays(a, 7 * dir) : addDays(a, 30 * dir)));
  const rangeLabel =
    view === 'day'
      ? `${faWeekday(from)} ${faFullDate(from)}`
      : view === 'week'
        ? `${faDayMonth(from)} تا ${faFullDate(addDays(to, -1))}`
        : new Intl.DateTimeFormat('fa-IR', { month: 'long', year: 'numeric' }).format(anchor);

  const editFields: FieldDef[] = [
    { name: 'title', label: 'عنوان سانس (اختیاری)', type: 'text', wide: true },
    { name: 'hall_id', label: 'سالن', type: 'select', numeric: true, required: true, options: halls.options },
    { name: 'status', label: 'وضعیت', type: 'select', required: true, options: SESSION_STATUS_OPTIONS },
    { name: 'start_time', label: 'زمان شروع', type: 'datetime', required: true },
    { name: 'end_time', label: 'زمان پایان', type: 'datetime', required: true },
    { name: 'capacity', label: 'ظرفیت', type: 'number', required: true },
    { name: 'reserved_seats', label: 'فروخته‌شده', type: 'number' },
    { name: 'price', label: 'قیمت پایه (تومان)', type: 'number', required: true },
  ];

  const viewButton = (v: View, label: string, Icon: typeof CalendarDays) => (
    <button
      type="button"
      onClick={() => setView(v)}
      aria-pressed={view === v}
      className={cn('inline-flex h-10 items-center gap-2 rounded-lg px-4 text-[13.5px] font-bold transition', view === v ? 'bg-brand-600 text-white shadow-cta' : 'text-ink hover:bg-field')}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="تقویم چرخشی" crumbs={['تقویم چرخشی']} />

        <Card className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
          <div className="flex rounded-xl border border-line bg-surface p-1">
            {viewButton('week', 'هفتگی', CalendarRange)}
            {viewButton('day', 'روزانه', CalendarDays)}
            {viewButton('month', 'ماهانه', LayoutGrid)}
          </div>
          <div className="flex h-12 items-center rounded-xl border border-line bg-surface">
            <button type="button" onClick={() => step(-1)} className="flex size-11 items-center justify-center text-ink hover:text-brand-600" aria-label="بازه قبل">
              <ChevronRight className="size-5" />
            </button>
            <button type="button" onClick={() => setAnchor(new Date())} className="flex items-center gap-2 px-2 text-[13.5px] font-bold text-ink" title="برو به امروز">
              <CalendarDays className="size-4 text-muted" />
              {rangeLabel}
            </button>
            <button type="button" onClick={() => step(1)} className="flex size-11 items-center justify-center text-ink hover:text-brand-600" aria-label="بازه بعد">
              <ChevronLeft className="size-5" />
            </button>
          </div>
          <FilterSelect value={category} onChange={setCategory} options={categories.options} allLabel="همه دسته‌بندی‌ها" className="w-full sm:w-44" />
          <FilterSelect value={city} onChange={setCity} options={cities.options} allLabel="همه شهرها" className="w-full sm:w-40" />
          <FilterSelect value={hall} onChange={setHall} options={halls.options} allLabel="همه سالن‌ها" className="w-full sm:w-48" />
          <Link href="/events?new=1" className={cn(primaryButton, 'h-12 px-6 sm:mr-auto')}>
            <Plus className="size-5" />
            افزودن رویداد
          </Link>
        </Card>

        <Card className="overflow-hidden p-2 sm:p-3">
          {sessions.isError ? (
            <ErrorState message={errorMessage(sessions.error, 'دریافت سانس‌ها با خطا مواجه شد.')} onRetry={() => sessions.refetch()} />
          ) : sessions.isLoading ? (
            <Skeleton className="h-[640px] rounded-xl" />
          ) : view === 'month' ? (
            <MonthGrid days={days} anchor={anchor} sessions={visible} onOpen={setEditing} onDay={(d) => {
              setAnchor(d);
              setView('day');
            }} />
          ) : (
            <TimeGrid days={days} sessions={visible} onOpen={setEditing} />
          )}
        </Card>

        <Card className="flex flex-wrap items-center gap-x-8 gap-y-3 px-5 py-4">
          {categories.rows.map((c) => (
            <span key={c.id} className="flex items-center gap-2 text-[13.5px] text-ink">
              <span className="size-4 rounded-full" style={{ background: String(c.color ?? '#94a3b8') }} />
              {String(c.name)}
            </span>
          ))}
        </Card>
      </div>

      {editing && (
        <FormModal
          key={editing.id}
          title={`ویرایش سانس «${editing.title || editing.event_title}»`}
          fields={editFields}
          initial={editing}
          submit={(body) => apiPut(`/admin/sessions/${editing.id}`, body)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard'] });
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </AdminLayout>
  );
}

function TimeGrid({ days, sessions, onOpen }: { days: Date[]; sessions: CalSession[]; onOpen: (s: CalSession) => void }) {
  const hours = Array.from({ length: LAST_HOUR - FIRST_HOUR + 1 }, (_, i) => FIRST_HOUR + i);
  const height = (LAST_HOUR - FIRST_HOUR + 1) * HOUR_PX;
  const today = new Date();

  return (
    <div className="overflow-x-auto">
      <div className={cn('grid', days.length === 1 ? 'min-w-[360px]' : 'min-w-[980px]')} style={{ gridTemplateColumns: `64px repeat(${days.length}, minmax(0, 1fr))` }}>
        <div className="flex h-16 items-center justify-center border-b border-line text-[13px] font-bold text-muted">ساعت</div>
        {days.map((d) => (
          <div key={d.toISOString()} className={cn('flex h-16 flex-col items-center justify-center border-b border-r border-line', sameDay(d, today) && 'bg-brand-500/10')}>
            <span className={cn('text-[14px] font-extrabold', sameDay(d, today) ? 'text-brand-600' : 'text-ink')}>{faWeekday(d)}</span>
            <span className={cn('text-[12px]', sameDay(d, today) ? 'text-brand-600' : 'text-muted')}>{faDayMonth(d)}</span>
          </div>
        ))}

        <div className="relative" style={{ height }}>
          {hours.map((h) => (
            <span key={h} className="tabular absolute inset-x-0 text-center text-[12px] text-muted" style={{ top: (h - FIRST_HOUR) * HOUR_PX - 8 }} dir="ltr">
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>
        {days.map((d) => {
          const dayStart = new Date(d).setHours(0, 0, 0, 0);
          const { placed, count } = lanes(sessions.filter((s) => sameDay(new Date(s.start_time), d)));
          return (
            <div key={d.toISOString()} className={cn('relative border-r border-line', sameDay(d, today) && 'bg-brand-500/[0.04]')} style={{ height }}>
              {hours.map((h) => (
                <span key={h} className="absolute inset-x-0 border-t border-dashed border-line/70" style={{ top: (h - FIRST_HOUR) * HOUR_PX }} />
              ))}
              {placed.map(({ s, lane }) => {
                const start = (new Date(s.start_time).getTime() - dayStart) / 3_600_000;
                const end = (new Date(s.end_time).getTime() - dayStart) / 3_600_000;
                const top = Math.max(0, (start - FIRST_HOUR) * HOUR_PX);
                const h = Math.max(56, (Math.min(end, LAST_HOUR + 1) - Math.max(start, FIRST_HOUR)) * HOUR_PX - 4);
                return (
                  <SessionCard
                    key={s.id}
                    s={s}
                    onOpen={onOpen}
                    style={{ top: top + 2, height: h, right: `calc(${(lane * 100) / count}% + 4px)`, width: `calc(${100 / count}% - 8px)` }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionCard({ s, onOpen, style }: { s: CalSession; onOpen: (s: CalSession) => void; style: React.CSSProperties }) {
  const color = s.category_color || '#94a3b8';
  return (
    <button
      type="button"
      onClick={() => onOpen(s)}
      className="absolute overflow-hidden rounded-lg border-l-4 p-2 text-right shadow-sm transition hover:shadow-md"
      style={{ ...style, borderLeftColor: color, backgroundColor: `color-mix(in srgb, ${color} 14%, var(--surface))` }}
      title={s.title || s.event_title}
    >
      <p className="line-clamp-2 text-[12.5px] font-extrabold leading-5 text-ink">{s.title || s.event_title}</p>
      <p className="tabular mt-1 text-[11.5px] text-ink/75" dir="ltr">
        {faTime(s.start_time)} - {faTime(s.end_time)}
      </p>
      <p className="mt-1 flex items-center gap-1 text-[11.5px] text-ink/75">
        <MapPin className="size-3" />
        {s.city_name}
      </p>
      <p className="tabular mt-0.5 flex items-center gap-1 text-[11.5px] text-ink/75">
        <UsersRound className="size-3" />
        <span dir="ltr">
          {faNumber(s.reserved_seats)} / {faNumber(s.capacity)}
        </span>
      </p>
      <span className="sr-only">{s.hall_name}</span>
    </button>
  );
}

function MonthGrid({ days, anchor, sessions, onOpen, onDay }: { days: Date[]; anchor: Date; sessions: CalSession[]; onOpen: (s: CalSession) => void; onDay: (d: Date) => void }) {
  const month = new Intl.DateTimeFormat('en-US-u-ca-persian', { month: 'numeric' });
  const current = month.format(anchor);
  const today = new Date();
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[760px] grid-cols-7 gap-px overflow-hidden rounded-xl bg-line">
        {days.slice(0, 7).map((d) => (
          <div key={d.toISOString()} className="bg-surface-2 py-2.5 text-center text-[13px] font-bold text-ink">
            {faWeekday(d)}
          </div>
        ))}
        {days.map((d) => {
          const items = sessions.filter((s) => sameDay(new Date(s.start_time), d));
          const out = month.format(d) !== current;
          return (
            <div key={d.toISOString()} className={cn('min-h-[118px] bg-surface p-2', out && 'bg-surface-2/60')}>
              <button
                type="button"
                onClick={() => onDay(d)}
                className={cn(
                  'flex size-7 items-center justify-center rounded-full text-[12.5px] font-bold',
                  sameDay(d, today) ? 'bg-brand-600 text-white' : out ? 'text-muted' : 'text-ink hover:bg-field',
                )}
              >
                {new Intl.DateTimeFormat('fa-IR', { day: 'numeric' }).format(d)}
              </button>
              <ul className="mt-1 space-y-1">
                {items.slice(0, 3).map((s) => (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => onOpen(s)}
                      className="flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1 text-right text-[11.5px] font-semibold text-ink"
                      style={{ backgroundColor: `color-mix(in srgb, ${s.category_color || '#94a3b8'} 14%, transparent)` }}
                    >
                      <span className="size-2 shrink-0 rounded-full" style={{ background: s.category_color || '#94a3b8' }} />
                      <span className="truncate">
                        {faTime(s.start_time)} {s.title || s.event_title}
                      </span>
                    </button>
                  </li>
                ))}
                {items.length > 3 && (
                  <li>
                    <button type="button" onClick={() => onDay(d)} className="px-1.5 text-[11.5px] font-bold text-brand-600">
                      {faNumber(items.length - 3)} مورد دیگر
                    </button>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
