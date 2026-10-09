'use client';

import { use, useRef, useState } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Building2, CalendarDays, ChevronDown, ChevronLeft, Clock, ExternalLink, Globe, Headset, Heart, Info, Loader2, MapPin, Minus, Plus,
  Share2, Tag, Ticket, UserRound,
} from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SmartImage } from "@/components/ui/SmartImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/States";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { useEventDetail } from "@/hooks/usePublicData";
import { useFavoritesStore } from "@/stores/useFavoritesStore";
import { useUserAuthStore } from "@/stores/useUserAuthStore";
import { ordersApi } from "@/services/orders";
import type { EventDetail, EventSession } from "@/services/public";
import { faDateRange, faDayMonth, faNumber, faPrice, faTimeRange, faWeekday } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";

type Tab = "about" | "sessions" | "speakers" | "gallery" | "faq";

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-3 pt-4 sm:px-4 lg:px-6">
        <EventView slug={decodeURIComponent(slug)} />
      </main>
      <SiteFooter />
    </div>
  );
}

function EventView({ slug }: { slug: string }) {
  const { data: event, isLoading, isError, error, refetch } = useEventDetail(slug);
  const [tab, setTab] = useState<Tab>("about");
  const tabsRef = useRef<HTMLDivElement>(null);

  if ((error as { status?: number } | null)?.status === 404) notFound();
  if (isError) return <ErrorState message="دریافت اطلاعات رویداد با خطا مواجه شد." onRetry={() => refetch()} />;
  if (isLoading || !event) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-[320px] rounded-[22px]" />
        <Skeleton className="h-[420px] rounded-[22px]" />
      </div>
    );
  }

  const openSessions = () => {
    setTab("sessions");
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const tabs: { key: Tab; label: string; show: boolean }[] = [
    { key: "about", label: "درباره رویداد", show: true },
    { key: "sessions", label: "دوره‌ها و نشست‌ها", show: true },
    { key: "speakers", label: "سخنرانان", show: event.speakers.length > 0 },
    { key: "gallery", label: "گالری", show: event.gallery.length > 0 },
    { key: "faq", label: "سوالات متداول", show: event.faqs.length > 0 },
  ];

  return (
    <article>
      <nav aria-label="مسیر صفحه" className="mb-3 flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
        <Link href="/" className="hover:text-brand-600">
          خانه
        </Link>
        <span>/</span>
        <Link href="/events" className="hover:text-brand-600">
          رویدادها
        </Link>
        <span>/</span>
        <span className="text-ink/80">{event.title}</span>
      </nav>

      <EventHero event={event} />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div ref={tabsRef} className="min-w-0 scroll-mt-28 rounded-[20px] border border-line bg-surface shadow-card">
          <div role="tablist" className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line px-3 sm:px-5">
            {tabs
              .filter((t) => t.show)
              .map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={cn(
                    "-mb-px shrink-0 border-b-[3px] px-4 py-4 text-[14.5px] font-bold transition",
                    tab === t.key ? "border-brand-600 text-brand-600" : "border-transparent text-ink/75 hover:text-ink",
                  )}
                >
                  {t.label}
                </button>
              ))}
          </div>
          <div className="p-4 sm:p-6">
            {tab === "about" && <AboutTab event={event} onSpeakers={() => setTab("speakers")} />}
            {tab === "sessions" && <SessionsTab event={event} />}
            {tab === "speakers" && <SpeakerGrid speakers={event.speakers} />}
            {tab === "gallery" && (
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {event.gallery.map((g) => (
                  <li key={g.image_url} className="overflow-hidden rounded-xl border border-line">
                    <div className="relative aspect-[4/3] bg-field">
                      <SmartImage src={mediaUrl(g.image_url)} fallback={null} alt={g.caption ?? ""} fill sizes="(min-width: 768px) 30vw, 50vw" className="object-cover" />
                    </div>
                    {g.caption && <p className="px-3 py-2 text-[12.5px] text-muted">{g.caption}</p>}
                  </li>
                ))}
              </ul>
            )}
            {tab === "faq" && (
              <ul className="space-y-2.5">
                {event.faqs.map((f) => (
                  <li key={f.question}>
                    <details className="group rounded-xl border border-line bg-surface-2 px-4 py-3 open:bg-surface">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-bold text-ink">
                        {f.question}
                        <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" />
                      </summary>
                      <p className="mt-2 text-[14px] leading-7 text-muted">{f.answer}</p>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-[20px] bg-navy-900 p-5 text-white shadow-float">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-[18px] font-black">انتخاب نشست و خرید بلیت</h2>
                <p className="mt-2 text-[13.5px] leading-7 text-white/80">برای حضور در این رویداد، یکی از نشست‌ها یا بلیت بازدید را انتخاب کنید.</p>
              </div>
              <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-brand-600">
                <Ticket className="size-7 -rotate-45" />
              </span>
            </div>
            <button
              type="button"
              onClick={openSessions}
              disabled={event.status === "CANCELLED"}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[15px] font-bold hover:bg-brand-500 disabled:opacity-60"
            >
              {event.status === "CANCELLED" ? "این رویداد لغو شده است" : "مشاهده نشست‌ها و انتخاب بلیت"}
              <ChevronLeft className="size-5" />
            </button>
          </div>

          <div className="rounded-[20px] border border-line bg-surface p-5 shadow-card">
            <h2 className="text-[18px] font-black text-ink">اطلاعات رویداد</h2>
            <dl className="mt-3 divide-y divide-line text-[13.5px]">
              <InfoRow icon={<CalendarDays className="size-5" />} label="تاریخ برگزاری">
                <span className="block font-bold text-ink">{dateLabel(event)}</span>
                {event.first_start && (
                  <span className="tabular block text-[12.5px] text-muted" dir="ltr">
                    {faTimeRange(event.first_start, event.last_end?.slice(0, 10) === event.first_start.slice(0, 10) ? event.last_end : null)}
                  </span>
                )}
              </InfoRow>
              <InfoRow icon={<MapPin className="size-5" />} label="محل برگزاری">
                <span className="block font-bold text-ink">{[event.city_name, event.venue_name].filter(Boolean).join("، ") || "—"}</span>
                {event.hall_name && <span className="block text-[12.5px] text-muted">{event.hall_name}</span>}
              </InfoRow>
              {event.category_name && (
                <InfoRow icon={<Tag className="size-5" />} label="دسته‌بندی">
                  <Link href={`/events?category=${encodeURIComponent(event.category_slug ?? "")}`} className="font-bold text-ink hover:text-brand-600">
                    {event.category_name}
                  </Link>
                </InfoRow>
              )}
              {event.organizer_name && (
                <InfoRow icon={<Building2 className="size-5" />} label="برگزارکننده">
                  <span className="font-bold text-ink">{event.organizer_name}</span>
                </InfoRow>
              )}
              {event.website_url && (
                <InfoRow icon={<Globe className="size-5" />} label="وب‌سایت">
                  <a href={event.website_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-brand-600" dir="ltr">
                    {event.website_url.replace(/^https?:\/\//, "")}
                    <ExternalLink className="size-4" />
                  </a>
                </InfoRow>
              )}
            </dl>
          </div>

          <div className="relative overflow-hidden rounded-[20px] border border-line bg-surface-2 p-5 shadow-card">
            <h2 className="text-[16px] font-black text-ink">سوالی دارید؟</h2>
            <p className="mt-1.5 text-[13px] text-muted">تیم پشتیبانی ما آماده پاسخگویی به سوالات شماست.</p>
            <Link href="/contact" className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl border border-brand-500/50 bg-surface px-5 text-[14px] font-bold text-brand-600 hover:bg-brand-50">
              <Headset className="size-5" />
              تماس با ما
            </Link>
            <Headset className="absolute -left-2 bottom-2 size-24 text-brand-500/15" />
          </div>
        </aside>
      </div>
    </article>
  );
}

function dateLabel(e: EventDetail): string {
  const start = e.start_date ?? e.first_start;
  const end = e.end_date ?? e.last_end;
  return start ? faDateRange(start, end) : "به‌زودی اعلام می‌شود";
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span className="mt-0.5 text-ink/70">{icon}</span>
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 break-words">{children}</dd>
    </div>
  );
}

function EventHero({ event }: { event: EventDetail }) {
  const favorite = useFavoritesStore((s) => s.ids.includes(event.id));
  const toggle = useFavoritesStore((s) => s.toggle);
  const [shared, setShared] = useState(false);
  const color = event.category_color ?? "#2f80f5";
  const start = event.start_date ?? event.first_start;
  const end = event.end_date ?? event.last_end;

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch {
      // The user closed the share sheet.
    }
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-line bg-surface shadow-card lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="order-2 p-5 sm:p-6 lg:order-none">
        <div className="flex items-start justify-between gap-3">
          {event.category_name ? (
            <span className="rounded-lg px-3 py-1.5 text-[12.5px] font-bold text-white" style={{ backgroundColor: color }}>
              {event.category_name}
            </span>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={share}
              aria-label="اشتراک‌گذاری"
              title={shared ? "پیوند کپی شد" : "اشتراک‌گذاری"}
              className="flex size-11 items-center justify-center rounded-xl border border-line text-ink hover:border-brand-500/40"
            >
              <Share2 className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => toggle(event.id)}
              aria-pressed={favorite}
              aria-label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
              className="flex size-11 items-center justify-center rounded-xl border border-line text-ticket hover:border-ticket/40"
            >
              <Heart className={cn("size-5", favorite && "fill-ticket")} />
            </button>
          </div>
        </div>
        <h1 className="mt-4 text-[24px] font-black leading-[1.5] text-ink sm:text-[30px]">{event.title}</h1>
        {event.subtitle && <p className="mt-2 text-[15px] leading-7 text-muted sm:text-[16px]">{event.subtitle}</p>}
        {shared && <p className="mt-2 text-[12.5px] text-success-fg">پیوند صفحه کپی شد.</p>}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
              <CalendarDays className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-ink">{start ? faDayMonth(start) + (end && end.slice(0, 10) !== start.slice(0, 10) ? ` تا ${faDayMonth(end)}` : "") : "به‌زودی"}</p>
              {start && (
                <p className="truncate text-[12.5px] text-muted">
                  {faWeekday(start)}
                  {end && end.slice(0, 10) !== start.slice(0, 10) ? ` تا ${faWeekday(end)}` : ""} {new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(new Date(start))}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-line p-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
              <MapPin className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="font-extrabold text-ink">{event.city_name ?? "—"}</p>
              <p className="truncate text-[12.5px] text-muted">{event.venue_name ?? event.hall_name ?? ""}</p>
            </div>
          </div>
        </div>

        {event.stats.length > 0 && (
          <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {event.stats.map((s) => {
              const c = s.color ?? "#2f80f5";
              return (
                <li key={s.label} className="flex items-center gap-2.5 rounded-2xl border border-line p-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full" style={{ color: c, backgroundColor: `color-mix(in srgb, ${c} 13%, var(--surface))` }}>
                    <SvgIcon src={s.icon_url} className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="tabular text-[15px] font-black text-ink" dir="ltr">
                      {s.value}
                    </p>
                    <p className="text-[11.5px] leading-5 text-muted">{s.label}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="relative order-1 aspect-[16/9] bg-field lg:order-none lg:aspect-auto lg:min-h-[340px]">
        <SmartImage src={mediaUrl(event.banner_url)} fallback={mediaUrl(event.category_cover_url)} alt="" fill preload sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
      </div>
    </section>
  );
}

function AboutTab({ event, onSpeakers }: { event: EventDetail; onSpeakers: () => void }) {
  const keynotes = event.speakers.filter((s) => s.keynote).slice(0, 3);
  return (
    <div className="space-y-7">
      <section>
        <h2 className="text-[20px] font-black text-ink">درباره رویداد</h2>
        {event.description && <p className="mt-3 whitespace-pre-line text-[15px] leading-8 text-ink/85">{event.description}</p>}
        {event.notice && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/8 p-4 text-[14px] leading-7 text-ink/85">
            <Info className="mt-1 size-5 shrink-0 text-brand-600" />
            <p>{event.notice}</p>
          </div>
        )}
      </section>

      {event.topics.length > 0 && (
        <section>
          <h2 className="text-[18px] font-black text-ink">محورهای اصلی رویداد</h2>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {event.topics.map((t) => (
              <li key={t.title} className="flex flex-col items-center gap-2.5 rounded-2xl border border-line px-3 py-4 text-center">
                <SvgIcon src={t.icon_url} className="size-8" style={{ color: t.color ?? "#2f80f5" }} />
                <span className="text-[13px] font-semibold leading-6 text-ink">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {keynotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-black text-ink">سخنرانان شاخص</h2>
            {event.speakers.length > keynotes.length && (
              <button type="button" onClick={onSpeakers} className="flex items-center gap-1 text-[13.5px] font-bold text-brand-600">
                مشاهده همه
                <ArrowLeft className="size-4" />
              </button>
            )}
          </div>
          <SpeakerGrid speakers={keynotes} />
        </section>
      )}
    </div>
  );
}

function SpeakerGrid({ speakers }: { speakers: EventDetail["speakers"] }) {
  if (!speakers.length) return <EmptyState message="سخنرانی معرفی نشده است." />;
  return (
    <ul className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {speakers.map((s) => (
        <li key={s.full_name} className="flex items-center gap-3 rounded-2xl border border-line p-3">
          <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-field">
            {s.photo_url ? (
              <SmartImage src={mediaUrl(s.photo_url)} fallback={null} alt="" fill sizes="64px" className="object-cover" />
            ) : (
              <UserRound className="absolute inset-0 m-auto size-7 text-muted" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-extrabold text-ink">{s.full_name}</p>
            {s.job_title && <p className="text-[12.5px] text-muted">{s.job_title}</p>}
            {s.organization && <p className="text-[12.5px] text-muted">{s.organization}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function SessionsTab({ event }: { event: EventDetail }) {
  if (!event.sessions.length) return <EmptyState message="فعلاً نشستی برای این رویداد ثبت نشده است." />;
  return (
    <ul className="space-y-3">
      {event.sessions.map((s) => (
        <SessionRow key={s.id} event={event} session={s} />
      ))}
    </ul>
  );
}

function SessionRow({ event, session: s }: { event: EventDetail; session: EventSession }) {
  const router = useRouter();
  const token = useUserAuthStore((st) => st.token);
  const [qty, setQty] = useState(1);
  const remaining = Math.max(0, s.capacity - (s.reserved_seats ?? 0));
  const onSale = s.status === "ACTIVE" && remaining > 0 && new Date(s.start_time) > new Date();
  const buy = useMutation({
    mutationFn: () => ordersApi.checkout({ session_id: s.id, quantity: qty }),
    onSuccess: (data) => router.push(`/orders/${data.order_number}`),
  });

  function generalAdmission() {
    if (!token) {
      router.push(`/login?next=${encodeURIComponent(`/events/${event.slug}`)}`);
      return;
    }
    buy.mutate();
  }

  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[15.5px] font-extrabold text-ink">{s.title || event.title}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-4" />
              {faWeekday(s.start_time)} {faDayMonth(s.start_time)}
            </span>
            <span className="tabular flex items-center gap-1.5">
              <Clock className="size-4" />
              <span dir="ltr">{faTimeRange(s.start_time, s.end_time)}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="size-4" />
              {s.hall_name}، {s.city_name}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <p className="text-[13px] text-muted">
            از <b className="text-[15px] text-ink">{faNumber(Number(s.from_price))}</b> تومان
          </p>
          <span className={cn("rounded-lg px-2 py-0.5 text-[12px] font-bold", onSale ? "bg-success/10 text-success-fg" : "bg-surface-2 text-muted")}>
            {s.status === "SCHEDULED" ? "به‌زودی" : remaining === 0 ? "تکمیل ظرفیت" : `${faNumber(remaining)} جای خالی`}
          </span>
        </div>
      </div>
      {onSale && (
        <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-line pt-3">
          {buy.isError && <p className="ml-auto text-[13px] text-danger-fg">{(buy.error as { message?: string })?.message}</p>}
          {s.has_seat_map ? (
            <Link
              href={`/events/${encodeURIComponent(event.slug)}/sessions/${s.id}`}
              className="flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 text-[14px] font-bold text-white hover:bg-brand-700"
            >
              <Ticket className="size-[18px] -rotate-45" />
              انتخاب صندلی
            </Link>
          ) : (
            <>
              <div className="flex h-11 items-center rounded-xl border border-line">
                <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="flex size-11 items-center justify-center" aria-label="افزایش تعداد">
                  <Plus className="size-4" />
                </button>
                <span className="tabular w-8 text-center font-bold">{faNumber(qty)}</span>
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex size-11 items-center justify-center" aria-label="کاهش تعداد">
                  <Minus className="size-4" />
                </button>
              </div>
              <button
                type="button"
                onClick={generalAdmission}
                disabled={buy.isPending}
                className="flex h-11 items-center gap-2 rounded-xl bg-brand-600 px-6 text-[14px] font-bold text-white hover:bg-brand-700 disabled:opacity-70"
              >
                {buy.isPending ? <Loader2 className="size-4 animate-spin" /> : <Ticket className="size-[18px] -rotate-45" />}
                خرید {faNumber(qty)} بلیت · {faPrice(Number(s.price) * qty)}
              </button>
            </>
          )}
        </div>
      )}
    </li>
  );
}
