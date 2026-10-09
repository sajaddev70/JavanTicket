'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, CalendarDays, ChevronUp, Clock, Crown, Download, Expand, MapPin, Minus, MousePointerClick, Pencil, Plus, Trash2, Unlock, UsersRound, Wrench } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { InlineAlert, primaryButton } from '@/components/ui/Field';
import { FilterSelect } from '@/components/ui/FilterSelect';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { Thumb } from '@/components/crud/cells';
import { CrudPage, type Row } from '@/components/crud/CrudPage';
import { FieldInput, toFormValues, toRequestBody, type FieldDef, type FormValues } from '@/components/crud/fields';
import { SeatMap, exportSeatMap, type Seat } from '@/components/seatmap/SeatMap';
import { useTheme } from '@/components/ui/ThemeToggle';
import { useOptions } from '@/hooks/useOptions';
import { apiGet, apiPost, apiPut } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { HALL_STATUS, HALL_TYPES, SESSION_DISPLAY_STATUS, options } from '@/lib/labels';
import { faDate, faNumber, faTimeRange, faWeekday } from '@/lib/format';
import { cn } from '@/lib/cn';

interface SessionInfo {
  id: number;
  hall_id: number;
  event_title: string;
  event_subtitle?: string | null;
  title?: string | null;
  banner_url?: string | null;
  start_time: string;
  end_time: string;
  hall_name: string;
  venue_name?: string | null;
  city_name: string;
  status: string;
  capacity: number;
  reserved_seats: number;
}

interface SeatMapData {
  session?: SessionInfo;
  seats: Seat[];
  sections: Row[];
}

type Tab = 'map' | 'sections' | 'hall' | 'report';

const COLORS = {
  available: '#22c55e',
  vip: '#f5a524',
  sold: '#ef4454',
  reserved: '#64748b',
  disabled: '#cbd5e1',
  disabledDark: '#334155',
};

const TABS: { key: Tab; label: string }[] = [
  { key: 'map', label: 'نقشه صندلی‌ها' },
  { key: 'sections', label: 'مدیریت بخش‌ها' },
  { key: 'hall', label: 'تنظیمات سالن' },
  { key: 'report', label: 'گزارش فروش' },
];

export default function AdminSeatMapsPage() {
  return (
    <AdminLayout>
      <Suspense>
        <SeatMapsScreen />
      </Suspense>
    </AdminLayout>
  );
}

function SeatMapsScreen() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const halls = useOptions(['admin', 'halls'], '/admin/halls', (r) => `${r.name} (${r.city_name})`);
  const sessions = useQuery({ queryKey: ['admin', 'sessions'], queryFn: () => apiGet<(Row & { hall_id: number; event_title: string; title?: string; start_time: string })[]>('/admin/sessions') });

  const sessionParam = params.get('session');
  const session = sessions.data?.find((s) => String(s.id) === sessionParam);
  const hallParam = params.get('hall') ?? (session ? String(session.hall_id) : null);
  const mappedHalls = halls.rows.filter((h) => Number(h.seats_count) > 0);
  const hallId = hallParam ?? (mappedHalls[0] ? String(mappedHalls[0].id) : '');
  const hallSessions = (sessions.data ?? []).filter((s) => String(s.hall_id) === hallId && s.status !== 'CANCELLED');
  const [tab, setTab] = useState<Tab>('map');

  const navigate = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
    router.replace(`${pathname}?${q}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="نقشه صندلی‌ها" crumbs={['نقشه صندلی‌ها']} />

      <Card className="px-3 sm:px-5">
        <div role="tablist" className="no-scrollbar flex gap-2 overflow-x-auto sm:gap-8">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 border-b-[3px] px-3 py-5 text-[15px] font-bold transition',
                tab === t.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-ink/80 hover:text-ink',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      <Card className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 sm:p-4">
        <FilterSelect
          label="سالن"
          value={hallId}
          onChange={(v) => navigate({ hall: v, session: null })}
          options={halls.rows.map((h) => ({ value: h.id, label: `${h.name} (${h.city_name})${Number(h.seats_count) ? '' : ' - بدون نقشه'}` }))}
          allLabel="انتخاب سالن"
        />
        <FilterSelect
          label="سانس"
          value={session && String(session.hall_id) === hallId ? String(session.id) : ''}
          onChange={(v) => navigate({ hall: hallId, session: v || null })}
          options={hallSessions.map((s) => ({ value: s.id, label: `${s.title || s.event_title} - ${faWeekday(new Date(s.start_time))} ${faDate(s.start_time)}` }))}
          allLabel="بدون سانس (فقط چیدمان سالن)"
        />
      </Card>

      {!hallId ? (
        <Card>
          <EmptyState message="ابتدا یک سالن انتخاب کنید." />
        </Card>
      ) : tab === 'map' ? (
        <MapTab hallId={Number(hallId)} sessionId={session && String(session.hall_id) === hallId ? Number(session.id) : null} onEditLayout={() => setTab('sections')} />
      ) : tab === 'sections' ? (
        <SectionsTab hallId={Number(hallId)} />
      ) : tab === 'hall' ? (
        <HallTab hallId={Number(hallId)} />
      ) : (
        <ReportTab sessionId={session && String(session.hall_id) === hallId ? Number(session.id) : null} />
      )}
    </div>
  );
}

function MapTab({ hallId, sessionId, onEditLayout }: { hallId: number; sessionId: number | null; onEditLayout: () => void }) {
  const queryClient = useQueryClient();
  const dark = useTheme() === 'dark';
  const svgRef = useRef<SVGSVGElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selecting, setSelecting] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [actionsOpen, setActionsOpen] = useState(true);
  const key = ['admin', 'seat-map', hallId, sessionId];
  const map = useQuery({
    queryKey: key,
    queryFn: () => apiGet<SeatMapData>(sessionId ? `/admin/sessions/${sessionId}/seat-map` : `/admin/halls/${hallId}/seat-map`),
  });

  const action = useMutation({
    mutationFn: (kind: 'BLOCK' | 'GROUP' | 'RELEASE' | 'DISABLE' | 'ENABLE') =>
      kind === 'DISABLE' || kind === 'ENABLE'
        ? apiPut('/admin/seats/disabled', { seat_ids: [...selected], disabled: kind === 'DISABLE' })
        : apiPost(`/admin/sessions/${sessionId}/seats`, { seat_ids: [...selected], action: kind }),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ['admin', 'seat-map'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'sessions'] });
    },
  });

  const seats = useMemo(() => map.data?.seats ?? [], [map.data]);
  // On narrow screens the map scrolls sideways: start centred on the stage instead of at one edge.
  const hasSeats = seats.length > 0;
  useEffect(() => {
    const box = boxRef.current;
    if (hasSeats && box && box.scrollWidth > box.clientWidth) box.scrollLeft = -(box.scrollWidth - box.clientWidth) / 2;
  }, [hasSeats]);
  const counts = useMemo(() => {
    const c = { available: 0, vip: 0, sold: 0, disabled: 0, reserved: 0 };
    for (const s of seats) {
      if (s.status === 'DISABLED') c.disabled++;
      else if (s.status === 'SOLD') c.sold++;
      else if (s.status === 'AVAILABLE' && s.tier_code === 'VIP') c.vip++;
      else if (s.status === 'AVAILABLE') c.available++;
      else c.reserved++;
    }
    return c;
  }, [seats]);

  const colorOf = (s: Seat) => {
    if (s.status === 'DISABLED') return dark ? COLORS.disabledDark : COLORS.disabled;
    if (s.status === 'SOLD') return COLORS.sold;
    if (s.status !== 'AVAILABLE') return COLORS.reserved;
    return s.tier_code === 'VIP' ? COLORS.vip : COLORS.available;
  };
  const toggle = (s: Seat) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(s.id)) next.delete(s.id);
      else next.add(s.id);
      return next;
    });

  const info = map.data?.session;
  const st = info ? statusOf(SESSION_DISPLAY_STATUS, new Date(info.end_time) < new Date() ? 'FINISHED' : info.status === 'SCHEDULED' ? 'SCHEDULED' : 'ON_SALE') : null;

  const legend = [
    { label: 'موجود', color: COLORS.available },
    { label: 'فروخته‌شده', color: COLORS.sold },
    { label: 'انتخاب‌شده', color: '#2563eb' },
    { label: 'VIP', color: COLORS.vip },
    { label: 'رزرو / مسدود', color: COLORS.reserved },
    { label: 'غیرفعال', color: COLORS.disabled },
  ];

  const quick = sessionId
    ? [
        { label: 'انتخاب دستی صندلی', hint: 'برای رزرو یا تخصیص دستی', icon: MousePointerClick, onClick: () => setSelecting((v) => !v), active: selecting },
        { label: 'رزرو گروهی', hint: 'ثبت صندلی‌های انتخاب‌شده برای گروه‌ها', icon: UsersRound, onClick: () => action.mutate('GROUP'), needs: true },
        { label: 'مسدود کردن صندلی‌ها', hint: 'برای مهمانان، اسپانسرها و ...', icon: Ban, onClick: () => action.mutate('BLOCK'), needs: true, danger: true },
        { label: 'آزادسازی صندلی‌ها', hint: 'لغو رزرو گروهی یا مسدودی انتخاب‌شده‌ها', icon: Unlock, onClick: () => action.mutate('RELEASE'), needs: true },
        { label: 'پاکسازی انتخاب', hint: 'حذف انتخاب‌های فعلی', icon: Trash2, onClick: () => setSelected(new Set()), danger: true },
      ]
    : [
        { label: 'انتخاب دستی صندلی', hint: 'برای تغییر وضعیت فنی صندلی‌ها', icon: MousePointerClick, onClick: () => setSelecting((v) => !v), active: selecting },
        { label: 'غیرفعال کردن صندلی‌ها', hint: 'خارج از سرویس در همه سانس‌ها', icon: Wrench, onClick: () => action.mutate('DISABLE'), needs: true, danger: true },
        { label: 'فعال کردن صندلی‌ها', hint: 'بازگرداندن به چرخه فروش', icon: Unlock, onClick: () => action.mutate('ENABLE'), needs: true },
        { label: 'پاکسازی انتخاب', hint: 'حذف انتخاب‌های فعلی', icon: Trash2, onClick: () => setSelected(new Set()), danger: true },
      ];

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="order-2 min-w-0 p-3 sm:p-4 xl:order-none">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-ink">
            {legend.map((l) => (
              <li key={l.label} className="flex items-center gap-1.5">
                <span className="size-3.5 rounded-full" style={{ background: l.color }} />
                {l.label}
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-2 sm:mr-auto">
            <div className="flex h-10 items-center rounded-xl border border-line">
              <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} className="flex size-10 items-center justify-center" aria-label="بزرگ‌نمایی">
                <Plus className="size-4" />
              </button>
              <span className="tabular w-12 text-center text-[13px] font-bold" dir="ltr">
                {faNumber(Math.round(zoom * 100))}%
              </span>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} className="flex size-10 items-center justify-center" aria-label="کوچک‌نمایی">
                <Minus className="size-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => boxRef.current?.requestFullscreen?.()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line px-3 text-[13px] font-bold text-ink"
            >
              <Expand className="size-4" />
              نمای تمام صفحه
            </button>
            <button type="button" onClick={onEditLayout} className={cn(primaryButton, 'h-10 px-4')}>
              <Pencil className="size-4" />
              ویرایش نقشه صندلی
            </button>
          </div>
        </div>

        {action.isError && <InlineAlert tone="error">{errorMessage(action.error, 'انجام عملیات با خطا مواجه شد.')}</InlineAlert>}

        <div ref={boxRef} className="overflow-auto rounded-2xl border border-line/70 bg-surface p-3" style={{ maxHeight: 720 }}>
          {map.isError ? (
            <ErrorState message={errorMessage(map.error, 'دریافت نقشه با خطا مواجه شد.')} onRetry={() => map.refetch()} />
          ) : map.isLoading ? (
            <Skeleton className="h-[560px] rounded-xl" />
          ) : seats.length === 0 ? (
            <EmptyState message="برای این سالن هنوز نقشه صندلی تعریف نشده است. از تب «مدیریت بخش‌ها» بخش‌ها را بسازید." />
          ) : (
            <SeatMap
              ref={svgRef}
              seats={seats}
              colorOf={colorOf}
              selected={selected}
              onSeat={selecting ? toggle : undefined}
              isSelectable={(s) => s.status !== 'SOLD'}
              zoom={zoom}
              dark={dark}
              entranceLabel="ورودی سالن"
            />
          )}
        </div>
        {selected.size > 0 && <p className="mt-2 text-[13px] font-semibold text-brand-600">{faNumber(selected.size)} صندلی انتخاب شده است.</p>}
      </Card>

      <div className="order-1 space-y-4 xl:order-none">
        {info && st && (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-extrabold text-ink">اطلاعات سانس و سالن</h2>
              <StatusPill tone={st.tone} dot={false}>
                {st.label}
              </StatusPill>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-2.5">
              <div className="min-w-0 flex-1">
                <p className="font-extrabold leading-6 text-ink">{info.title || info.event_title}</p>
                {info.event_subtitle && <p className="mt-0.5 text-[12.5px] text-muted">{info.event_subtitle}</p>}
              </div>
              <Thumb src={info.banner_url} className="size-20 shrink-0 rounded-xl object-cover" />
            </div>
            <ul className="mt-3 space-y-2.5 text-[13.5px] text-ink">
              <li className="flex items-center gap-2">
                <CalendarDays className="size-4 text-muted" />
                {faWeekday(new Date(info.start_time))} {faDate(info.start_time)}
              </li>
              <li className="tabular flex items-center gap-2">
                <Clock className="size-4 text-muted" />
                <span dir="ltr">{faTimeRange(info.start_time, info.end_time)}</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-muted" />
                {info.hall_name} - {info.venue_name ?? info.city_name}
              </li>
            </ul>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="mb-3 text-[16px] font-extrabold text-ink">خلاصه وضعیت صندلی‌ها</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <SummaryBox tone="success" value={counts.available} label="موجود" icon={<span className="size-5 rounded-full bg-success" />} />
            <SummaryBox tone="warning" value={counts.vip} label="VIP" icon={<Crown className="size-5 text-warning" />} />
            <SummaryBox tone="muted" value={counts.disabled} label="غیرفعال" icon={<Ban className="size-5 text-ink/70" />} />
            <SummaryBox tone="danger" value={counts.sold} label="فروخته‌شده" icon={<span className="size-5 rounded-full bg-danger" />} />
          </div>
          {counts.reserved > 0 && <p className="mt-2 text-[12.5px] text-muted">{faNumber(counts.reserved)} صندلی رزرو گروهی یا مسدود است.</p>}
          <div className="mt-2.5 flex items-center justify-center gap-2 rounded-xl bg-surface-2 py-3 text-[14px] text-ink">
            مجموع صندلی‌ها: <b className="tabular text-[16px]">{faNumber(seats.length)}</b>
          </div>
        </Card>

        <Card className="p-4">
          <button type="button" onClick={() => setActionsOpen((v) => !v)} className="mb-2 flex w-full items-center justify-between" aria-expanded={actionsOpen}>
            <h2 className="text-[16px] font-extrabold text-ink">عملیات سریع</h2>
            <ChevronUp className={cn('size-5 text-muted transition', !actionsOpen && 'rotate-180')} />
          </button>
          {actionsOpen && (
            <div className="space-y-2">
              {quick.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={q.onClick}
                  disabled={(q.needs && selected.size === 0) || action.isPending}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-right transition disabled:opacity-50',
                    'active' in q && q.active ? 'border-brand-500/50 bg-brand-500/8' : 'border-line hover:border-brand-500/40',
                  )}
                >
                  <q.icon className={cn('size-5 shrink-0', q.danger ? 'text-danger' : 'text-ink/80')} />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-ink">{q.label}</span>
                    <span className="block truncate text-[11.5px] text-muted">{q.hint}</span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                disabled={!seats.length}
                onClick={() => svgRef.current && exportSeatMap(svgRef.current, `seat-map-${sessionId ?? hallId}.png`)}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500/10 py-3 text-[14px] font-bold text-brand-600 hover:bg-brand-500/15 disabled:opacity-50"
              >
                <Download className="size-4" />
                خروجی نقشه (تصویر)
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function SummaryBox({ tone, value, label, icon }: { tone: 'success' | 'warning' | 'muted' | 'danger'; value: number; label: string; icon: React.ReactNode }) {
  const bg = { success: 'bg-success/10', warning: 'bg-warning/12', muted: 'bg-surface-2', danger: 'bg-danger/10' }[tone];
  return (
    <div className={cn('flex items-center justify-between rounded-xl p-3', bg)}>
      <div>
        <p className="tabular text-[20px] font-black text-ink">{faNumber(value)}</p>
        <p className="text-[12px] text-muted">{label}</p>
      </div>
      {icon}
    </div>
  );
}

function SectionsTab({ hallId }: { hallId: number }) {
  const dark = useTheme() === 'dark';
  const tiers = useOptions(['admin', 'seat-tiers'], '/admin/seat-tiers', (r) => String(r.name));
  const preview = useQuery({ queryKey: ['admin', 'seat-map', hallId, null], queryFn: () => apiGet<SeatMapData>(`/admin/halls/${hallId}/seat-map`) });
  const tierColor = new Map(tiers.rows.map((t) => [String(t.code), String(t.color)]));

  return (
    <div className="space-y-5">
      <p className="text-[13.5px] leading-7 text-muted">
        هر بخش از ردیف‌ها و صندلی‌های یک بلوک سالن ساخته می‌شود. موقعیت (x، y) بر حسب «عرض یک صندلی» است و «انحنا» لبه‌های ردیف را به سمت صحنه خم می‌کند.
        با هر تغییر، صندلی‌های سالن از نو ساخته می‌شوند؛ این کار تنها تا پیش از اولین فروش یا رزرو امکان‌پذیر است.
      </p>
      <CrudPage
        embedded
        title="بخش‌ها"
        entity="بخش"
        queryKey={['admin', 'halls', hallId, 'sections']}
        listUrl={`/admin/halls/${hallId}/sections`}
        itemUrl={(id) => `/admin/sections/${id}`}
        invalidate={[['admin', 'seat-map'], ['admin', 'halls']]}
        fields={[
          { name: 'name', label: 'نام بخش', type: 'text', required: true, wide: true },
          { name: 'tier_code', label: 'نوع صندلی', type: 'select', required: true, options: tiers.rows.map((t) => ({ value: String(t.code), label: String(t.name) })) },
          { name: 'sort_order', label: 'ترتیب', type: 'number', defaultValue: '0' },
          { name: 'first_row', label: 'شماره ردیف شروع', type: 'number', defaultValue: '1', hint: '۱ = الف، ۲ = ب ...' },
          { name: 'rows_count', label: 'تعداد ردیف', type: 'number', required: true },
          { name: 'seats_per_row', label: 'صندلی در هر ردیف', type: 'number', required: true },
          { name: 'curve', label: 'انحنا', type: 'number', defaultValue: '2' },
          { name: 'pos_x', label: 'موقعیت افقی (x)', type: 'number', defaultValue: '0' },
          { name: 'pos_y', label: 'موقعیت عمودی (y)', type: 'number', defaultValue: '0' },
        ]}
        columns={[
          { key: 'name', label: 'بخش' },
          {
            key: 'tier_name',
            label: 'نوع صندلی',
            render: (r) => (
              <span className="inline-flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: String(r.tier_color ?? '#94a3b8') }} />
                {String(r.tier_name ?? '—')}
              </span>
            ),
          },
          { key: 'rows_count', label: 'ردیف × صندلی', className: 'tabular', render: (r) => `${faNumber(Number(r.rows_count))} × ${faNumber(Number(r.seats_per_row))}` },
          { key: 'seats_count', label: 'تعداد صندلی', className: 'tabular', render: (r) => faNumber(Number(r.seats_count)) },
        ]}
      />
      <Card className="overflow-auto p-4">
        <h2 className="mb-3 text-[16px] font-extrabold text-ink">پیش‌نمایش چیدمان</h2>
        {preview.isLoading ? (
          <Skeleton className="h-80 rounded-xl" />
        ) : (preview.data?.seats.length ?? 0) === 0 ? (
          <EmptyState message="هنوز بخشی تعریف نشده است." />
        ) : (
          <SeatMap seats={preview.data!.seats} colorOf={(s) => tierColor.get(String(s.tier_code)) ?? '#94a3b8'} zoom={0.8} dark={dark} entranceLabel="ورودی سالن" />
        )}
        <ul className="mt-3 flex flex-wrap gap-4 text-[12.5px] text-ink">
          {tiers.rows.map((t) => (
            <li key={String(t.code)} className="flex items-center gap-1.5">
              <span className="size-3 rounded-full" style={{ background: String(t.color) }} />
              {String(t.name)}
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

const HALL_FIELDS: FieldDef[] = [
  { name: 'name', label: 'نام سالن', type: 'text', required: true },
  { name: 'venue_name', label: 'مجموعه / مرکز', type: 'text' },
  { name: 'hall_type', label: 'نوع نمایش', type: 'select', required: true, options: options(HALL_TYPES) },
  { name: 'status', label: 'وضعیت', type: 'select', required: true, options: options(HALL_STATUS) },
  { name: 'capacity', label: 'ظرفیت', type: 'number', required: true },
  { name: 'gates_count', label: 'تعداد گیت', type: 'number' },
  { name: 'image_url', label: 'تصویر سالن', type: 'image', wide: true },
  { name: 'address', label: 'نشانی', type: 'textarea', wide: true },
];

function HallTab({ hallId }: { hallId: number }) {
  const halls = useQuery({ queryKey: ['admin', 'halls'], queryFn: () => apiGet<Row[]>('/admin/halls') });
  const hall = halls.data?.find((h) => h.id === hallId);
  if (halls.isLoading) return <Skeleton className="h-96 rounded-2xl" />;
  if (!hall) return <EmptyState message="سالن پیدا نشد." />;
  return <HallForm key={hallId} hall={hall} />;
}

function HallForm({ hall }: { hall: Row }) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<FormValues>(() => toFormValues(HALL_FIELDS, hall));
  const save = useMutation({
    mutationFn: () => apiPut(`/admin/halls/${hall.id}`, { ...toRequestBody(HALL_FIELDS, values), city_id: hall.city_id }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'halls'] }),
  });
  return (
    <Card className="p-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="space-y-4"
      >
        {save.isSuccess && <InlineAlert tone="success">تنظیمات سالن ذخیره شد.</InlineAlert>}
        {save.isError && <InlineAlert tone="error">{errorMessage(save.error, 'ذخیره با خطا مواجه شد.')}</InlineAlert>}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {HALL_FIELDS.map((f) => (
            <FieldInput key={f.name} field={f} values={values} onChange={(n, v) => setValues((s) => ({ ...s, [n]: v }))} />
          ))}
        </div>
        <div className="flex justify-end border-t border-line pt-4">
          <button type="submit" disabled={save.isPending} className={cn(primaryButton, 'w-full sm:w-auto')}>
            {save.isPending ? 'در حال ذخیره...' : 'ذخیره تنظیمات سالن'}
          </button>
        </div>
      </form>
    </Card>
  );
}

interface TierReport {
  code: string;
  name: string;
  color: string;
  seats: number;
  sold: number;
  reserved: number;
  revenue: number;
  price: number | null;
}

function ReportTab({ sessionId }: { sessionId: number | null }) {
  const report = useQuery({
    queryKey: ['admin', 'sessions', sessionId, 'sales-report'],
    queryFn: () => apiGet<TierReport[]>(`/admin/sessions/${sessionId}/sales-report`),
    enabled: !!sessionId,
  });
  if (!sessionId) return <Card><EmptyState message="برای مشاهده گزارش فروش، یک سانس انتخاب کنید." /></Card>;
  if (report.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (report.isError) return <ErrorState message={errorMessage(report.error, 'دریافت گزارش با خطا مواجه شد.')} onRetry={() => report.refetch()} />;
  const rows = report.data ?? [];
  const total = rows.reduce((a, r) => ({ seats: a.seats + Number(r.seats), sold: a.sold + Number(r.sold), revenue: a.revenue + Number(r.revenue) }), { seats: 0, sold: 0, revenue: 0 });
  return (
    <Card className="overflow-x-auto p-4">
      <table className="w-full min-w-[620px] text-right text-[14px]">
        <thead className="bg-surface-2 text-[13px] text-ink">
          <tr>
            {['نوع صندلی', 'قیمت', 'تعداد صندلی', 'فروخته‌شده', 'رزرو / مسدود', 'درصد فروش', 'درآمد بلیت'].map((c) => (
              <th key={c} className="h-12 px-3 font-bold">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line text-ink">
          {rows.map((r) => (
            <tr key={r.code}>
              <td className="px-3 py-3">
                <span className="inline-flex items-center gap-2 font-bold">
                  <span className="size-3 rounded-full" style={{ background: r.color }} />
                  {r.name}
                </span>
              </td>
              <td className="tabular px-3">{r.price === null ? '—' : `${faNumber(Number(r.price))} تومان`}</td>
              <td className="tabular px-3">{faNumber(Number(r.seats))}</td>
              <td className="tabular px-3">{faNumber(Number(r.sold))}</td>
              <td className="tabular px-3">{faNumber(Number(r.reserved))}</td>
              <td className="tabular px-3">{faNumber(Number(r.seats) ? Math.round((Number(r.sold) * 100) / Number(r.seats)) : 0)}٪</td>
              <td className="tabular px-3 font-bold text-success-fg">{faNumber(Number(r.revenue))} تومان</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-line font-extrabold text-ink">
          <tr>
            <td className="px-3 py-3">مجموع</td>
            <td />
            <td className="tabular px-3">{faNumber(total.seats)}</td>
            <td className="tabular px-3">{faNumber(total.sold)}</td>
            <td />
            <td className="tabular px-3">{faNumber(total.seats ? Math.round((total.sold * 100) / total.seats) : 0)}٪</td>
            <td className="tabular px-3 text-success-fg">{faNumber(total.revenue)} تومان</td>
          </tr>
        </tfoot>
      </table>
    </Card>
  );
}
