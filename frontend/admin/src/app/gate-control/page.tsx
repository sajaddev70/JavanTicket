'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, CameraOff, CheckCircle2, CircleAlert, Loader2, RotateCcw, ScanLine, XCircle } from 'lucide-react';
import AdminLayout from '@/components/layout/AdminLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { InlineAlert, primaryButton } from '@/components/ui/Field';
import { StatTile } from '@/components/ui/StatTile';
import { StatusPill, statusOf } from '@/components/ui/StatusPill';
import { api, apiGet, apiPost } from '@/services/api';
import { errorMessage } from '@/services/cms';
import { GATE_RESULT } from '@/lib/labels';
import { faDateTime, faNumber, faPercent, faTime, faTimeAgo, faToman } from '@/lib/format';
import { cn } from '@/lib/cn';

interface GateSession {
  id: number;
  title?: string | null;
  event_title: string;
  start_time: string;
  end_time: string;
  hall_name: string;
  city_name: string;
  gates_count: number;
  capacity: number;
  tickets_count: number;
  checked_in: number;
}

interface ScanTicket {
  ticket_code: string;
  seat_label?: string | null;
  event_title: string;
  hall_name: string;
  start_time: string;
  customer_name?: string | null;
  customer_mobile: string;
  order_number: string;
  used_at?: string | null;
  price: number;
}

interface ScanResult {
  result: keyof typeof RESULT_STYLE;
  ticket: ScanTicket | null;
}

interface GateSummary {
  scans: number;
  accepted: number;
  rejected: number;
  expected: number;
  checkedIn: number;
}

interface ScanRow {
  id: number;
  ticket_code: string;
  result: string;
  gate_name?: string | null;
  scanned_at: string;
  event_title?: string | null;
  seat_label?: string | null;
  customer_name?: string | null;
  operator_name?: string | null;
}

const RESULT_STYLE = {
  ACCEPTED: { box: 'border-success/40 bg-success/10', icon: <CheckCircle2 className="size-12 text-success" />, title: 'ورود مجاز است' },
  ALREADY_USED: { box: 'border-warning/50 bg-warning/12', icon: <CircleAlert className="size-12 text-warning" />, title: 'این بلیت قبلاً استفاده شده' },
  CANCELLED: { box: 'border-danger/40 bg-danger/10', icon: <XCircle className="size-12 text-danger" />, title: 'بلیت باطل شده است' },
  WRONG_SESSION: { box: 'border-violet-500/40 bg-violet-500/10', icon: <CircleAlert className="size-12 text-violet-500" />, title: 'بلیت مربوط به سانس دیگری است' },
  INVALID: { box: 'border-danger/40 bg-danger/10', icon: <XCircle className="size-12 text-danger" />, title: 'بلیت نامعتبر است' },
} as const;

const GATE_KEY = 'gate-name';

/** Short beep: high for an admitted ticket, low for a rejected one. */
function beep(ok: boolean) {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 220;
    gain.gain.value = 0.08;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + (ok ? 0.15 : 0.4));
    osc.onended = () => ctx.close();
  } catch {
    // Audio not available; the colored result is enough.
  }
}

export default function AdminGateControlPage() {
  const queryClient = useQueryClient();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [gate, setGate] = useState('');
  const [code, setCode] = useState('');
  const [last, setLast] = useState<(ScanResult & { message: string }) | null>(null);
  const [camera, setCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restore the operator's gate after mount (storage is client-only)
      setGate(localStorage.getItem(GATE_KEY) ?? '');
    } catch {
      // Storage unavailable.
    }
  }, []);

  const sessions = useQuery({ queryKey: ['admin', 'gate', 'sessions'], queryFn: () => apiGet<GateSession[]>('/admin/gate/sessions'), refetchInterval: 30_000 });
  const summary = useQuery({
    queryKey: ['admin', 'gate', 'summary', sessionId],
    queryFn: () => apiGet<GateSummary>('/admin/gate/summary', sessionId ? { sessionId } : undefined),
    refetchInterval: 15_000,
  });
  const scans = useQuery({
    queryKey: ['admin', 'gate', 'scans', sessionId],
    queryFn: () => apiGet<ScanRow[]>('/admin/gate/scans', { limit: 25, ...(sessionId ? { sessionId } : {}) }),
    refetchInterval: 15_000,
  });

  const refreshCounters = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'gate'] });
  }, [queryClient]);

  const scan = useMutation({
    mutationFn: async (ticketCode: string) => {
      const envelope = (await apiPostEnvelope('/admin/gate/scan', { code: ticketCode, session_id: sessionId, gate_name: gate || null })) as {
        message: string;
        data: ScanResult;
      };
      return { ...envelope.data, message: envelope.message };
    },
    onSuccess: (res) => {
      setLast(res);
      beep(res.result === 'ACCEPTED');
      setCode('');
      refreshCounters();
      inputRef.current?.focus();
    },
  });
  const undo = useMutation({
    mutationFn: (ticketCode: string) => apiPost('/admin/gate/reset', { code: ticketCode }),
    onSuccess: () => {
      setLast(null);
      refreshCounters();
    },
  });

  const submit = useCallback(
    (value: string) => {
      const v = value.trim();
      if (v && !scan.isPending) scan.mutate(v);
    },
    [scan],
  );

  const s = summary.data;
  const selected = sessions.data?.find((x) => x.id === sessionId);
  const style = last ? RESULT_STYLE[last.result] : null;

  return (
    <AdminLayout>
      <div className="space-y-5">
        <PageHeader title="کنترل گیت" crumbs={['فروش و سفارشات', 'کنترل گیت']} />

        <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
          <StatTile title="بلیت‌های امروز" value={faNumber(s?.expected)} unit={selected ? 'بلیت این سانس' : 'بلیت سانس‌های امروز'} icon="common/ticket" color="blue" changePercent={null} loading={summary.isLoading} />
          <StatTile
            title="ورود ثبت‌شده"
            value={faNumber(s?.checkedIn)}
            unit={s && s.expected ? `${faPercent((s.checkedIn * 100) / s.expected)} حاضرین` : 'نفر'}
            icon="admin/gate"
            color="green"
            changePercent={null}
            loading={summary.isLoading}
          />
          <StatTile title="اسکن‌های امروز" value={faNumber(s?.scans)} unit="بار اسکن" icon="common/qr" color="purple" changePercent={null} loading={summary.isLoading} />
          <StatTile title="ردشده" value={faNumber(s?.rejected)} unit="اسکن ناموفق" icon="status/danger" color="red" changePercent={null} loading={summary.isLoading} />
        </div>

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <Card className="p-4 sm:p-5">
            <CardHeader title="اسکن بلیت" subtitle="کد QR یا بارکد بلیت را با دستگاه اسکنر بخوانید یا کد را تایپ کنید." icon={<ScanLine className="size-5 text-brand-600" />} />
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">سانس</span>
                <select
                  value={sessionId ?? ''}
                  onChange={(e) => setSessionId(e.target.value ? Number(e.target.value) : null)}
                  className="h-12 w-full rounded-xl border border-line bg-field px-3.5 text-[14px] font-semibold text-ink outline-none focus:border-brand-500/50"
                >
                  <option value="">همه سانس‌ها (بدون کنترل سانس)</option>
                  {sessions.data?.map((x) => (
                    <option key={x.id} value={x.id}>
                      {faTime(x.start_time)} — {x.title || x.event_title} ({x.hall_name})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">نام گیت</span>
                <input
                  value={gate}
                  onChange={(e) => {
                    setGate(e.target.value);
                    try {
                      localStorage.setItem(GATE_KEY, e.target.value);
                    } catch {
                      // Storage unavailable.
                    }
                  }}
                  placeholder="مثلاً گیت ۱"
                  maxLength={50}
                  className="h-12 w-full rounded-xl border border-line bg-field px-3.5 text-[14px] text-ink outline-none focus:border-brand-500/50"
                />
              </label>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit(code);
              }}
              className="mt-4 flex gap-2"
            >
              <input
                ref={inputRef}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                dir="ltr"
                placeholder="JT-100245-1"
                aria-label="کد بلیت"
                className="h-14 min-w-0 flex-1 rounded-2xl border-2 border-brand-500/40 bg-surface px-4 text-center font-mono text-xl font-bold tracking-wider text-ink outline-none focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15"
              />
              <button type="submit" disabled={scan.isPending || !code.trim()} className={cn(primaryButton, 'h-14 px-6')}>
                {scan.isPending ? <Loader2 className="size-5 animate-spin" /> : <ScanLine className="size-5" />}
                بررسی
              </button>
              <button
                type="button"
                onClick={() => setCamera((v) => !v)}
                aria-pressed={camera}
                aria-label={camera ? 'خاموش کردن دوربین' : 'اسکن با دوربین'}
                title={camera ? 'خاموش کردن دوربین' : 'اسکن با دوربین'}
                className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-line-strong bg-surface text-ink hover:border-brand-500/40"
              >
                {camera ? <CameraOff className="size-6" /> : <Camera className="size-6" />}
              </button>
            </form>
            {scan.isError && (
              <div className="mt-3">
                <InlineAlert tone="error">{errorMessage(scan.error, 'بررسی بلیت با خطا مواجه شد.')}</InlineAlert>
              </div>
            )}
            {camera && <CameraScanner onCode={submit} paused={scan.isPending} />}

            {last && style && (
              <div className={cn('mt-5 rounded-2xl border-2 p-5', style.box)} role="status" aria-live="assertive">
                <div className="flex items-start gap-4">
                  {style.icon}
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-black text-ink">{style.title}</h3>
                    <p className="mt-1 text-[14px] text-muted">{last.message}</p>
                    {last.ticket && (
                      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-[13.5px] sm:grid-cols-2">
                        <Info label="کد بلیت" value={<span dir="ltr" className="font-mono">{last.ticket.ticket_code}</span>} />
                        <Info label="صندلی" value={last.ticket.seat_label ?? '—'} />
                        <Info label="رویداد" value={last.ticket.event_title} />
                        <Info label="سانس" value={`${faDateTime(last.ticket.start_time)} · ${last.ticket.hall_name}`} />
                        <Info label="خریدار" value={`${last.ticket.customer_name ?? ''} (${last.ticket.customer_mobile})`} />
                        <Info label="سفارش" value={<span dir="ltr">{last.ticket.order_number}</span>} />
                        {last.ticket.used_at && last.result === 'ALREADY_USED' && <Info label="زمان ورود قبلی" value={faDateTime(last.ticket.used_at)} />}
                        <Info label="قیمت" value={faToman(last.ticket.price)} />
                      </dl>
                    )}
                    {last.ticket && (last.result === 'ACCEPTED' || last.result === 'ALREADY_USED') && (
                      <button
                        type="button"
                        onClick={() => undo.mutate(last.ticket!.ticket_code)}
                        disabled={undo.isPending}
                        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[13px] font-bold text-ink hover:border-brand-500/40"
                      >
                        <RotateCcw className="size-4" />
                        لغو ثبت ورود این بلیت
                      </button>
                    )}
                    {undo.isError && <p className="mt-2 text-[13px] text-danger-fg">{errorMessage(undo.error, 'لغو ورود با خطا مواجه شد.')}</p>}
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <CardHeader title="سانس‌های امروز" subtitle="روی یک سانس بزنید تا کنترل گیت برای آن انجام شود." />
            <div className="mt-4 space-y-2.5">
              {sessions.isLoading ? (
                Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
              ) : sessions.isError ? (
                <ErrorState message={errorMessage(sessions.error, 'دریافت سانس‌ها با خطا مواجه شد.')} onRetry={() => sessions.refetch()} />
              ) : !sessions.data?.length ? (
                <EmptyState message="امروز سانسی برگزار نمی‌شود." />
              ) : (
                sessions.data.map((x) => {
                  const pct = x.tickets_count ? Math.round((x.checked_in * 100) / x.tickets_count) : 0;
                  const active = x.id === sessionId;
                  return (
                    <button
                      key={x.id}
                      type="button"
                      onClick={() => setSessionId(active ? null : x.id)}
                      aria-pressed={active}
                      className={cn('w-full rounded-xl border p-3 text-right transition', active ? 'border-brand-600 bg-brand-50' : 'border-line hover:border-brand-500/40')}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate font-extrabold text-ink">{x.title || x.event_title}</span>
                        <span className="tabular shrink-0 text-[13px] font-bold text-brand-600">{faTime(x.start_time)}</span>
                      </div>
                      <div className="mt-0.5 text-[12px] text-muted">
                        {x.hall_name} · {x.city_name} · {faNumber(x.gates_count)} گیت
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-field" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                          <div className="h-full rounded-full bg-success" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="tabular shrink-0 text-[12px] font-bold text-ink">
                          {faNumber(x.checked_in)} / {faNumber(x.tickets_count)}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </Card>
        </div>

        <Card className="p-4 sm:p-5">
          <CardHeader title="آخرین اسکن‌ها" subtitle="هر ۱۵ ثانیه به‌روز می‌شود." />
          <div className="mt-4">
            {scans.isLoading ? (
              <Skeleton className="h-40 rounded-xl" />
            ) : !scans.data?.length ? (
              <EmptyState message="هنوز اسکنی ثبت نشده است." />
            ) : (
              <ul className="divide-y divide-line/70">
                {scans.data.map((r) => {
                  const st = statusOf(GATE_RESULT, r.result);
                  return (
                    <li key={r.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5 text-[13.5px]">
                      <StatusPill tone={st.tone}>{st.label}</StatusPill>
                      <span dir="ltr" className="font-mono font-bold text-ink">{r.ticket_code}</span>
                      {/* Own line on phones; the details would otherwise be squeezed to a few letters. */}
                      <span className="order-last w-full truncate text-muted sm:order-none sm:w-auto sm:min-w-0 sm:flex-1">
                        {[r.event_title, r.seat_label, r.customer_name].filter(Boolean).join(' · ') || '—'}
                      </span>
                      <span className="text-[12px] text-muted">
                        {[r.gate_name, r.operator_name].filter(Boolean).join(' · ')}
                      </span>
                      <span className="text-[12px] text-muted">{faTimeAgo(r.scanned_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2">
      <dt className="shrink-0 text-muted">{label}:</dt>
      <dd className="min-w-0 truncate font-bold text-ink">{value}</dd>
    </div>
  );
}

/** POST returning the whole { message, data } envelope (the scan result message is shown to the operator). */
async function apiPostEnvelope(url: string, body: unknown): Promise<unknown> {
  return api.post(url, body);
}

type Detector = { detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]> };

/** Reads QR codes from the device camera (browsers with the BarcodeDetector API, e.g. Chrome on Android). */
function CameraScanner({ onCode, paused }: { onCode: (code: string) => void; paused: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const lastCode = useRef<{ code: string; at: number }>({ code: '', at: 0 });
  const pausedRef = useRef(paused);
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (!Ctor) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- feature detection only possible in the browser
      setError('مرورگر شما از اسکن با دوربین پشتیبانی نمی‌کند؛ از دستگاه اسکنر یا ورود دستی کد استفاده کنید.');
      return;
    }
    const detector = new Ctor({ formats: ['qr_code', 'code_128', 'ean_13'] });
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        void video.play();
        timer = setInterval(async () => {
          if (pausedRef.current || video.readyState < 2) return;
          try {
            const codes = await detector.detect(video);
            const value = codes[0]?.rawValue?.trim();
            // The same code stays in view for a while; scan it once every few seconds at most.
            if (value && (value !== lastCode.current.code || Date.now() - lastCode.current.at > 4000)) {
              lastCode.current = { code: value, at: Date.now() };
              onCode(value);
            }
          } catch {
            // Frame not readable; try the next one.
          }
        }, 350);
      })
      .catch(() => setError('دسترسی به دوربین ممکن نشد. اجازه دسترسی مرورگر را بررسی کنید.'));

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [onCode]);

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-black">
      {error ? (
        <p className="bg-surface p-4 text-[13.5px] text-danger-fg">{error}</p>
      ) : (
        <video ref={videoRef} muted playsInline className="mx-auto aspect-video w-full max-w-xl object-cover" aria-label="تصویر دوربین برای اسکن بلیت" />
      )}
    </div>
  );
}
