"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, CircleHelp, Heart, Images, Info, Mic, Share2, UserRound } from "lucide-react";
import { useEventDetail } from "../hooks";
import { QuantityDialog } from "./QuantityDialog";
import { useFavoriteToggle } from "@/features/profile/queries";
import { PageTopBar, TopBarButton } from "@/components/layout/PageTopBar";
import { SessionCard, sessionAvailability } from "@/components/shared/SessionCard";
import { SectionHeader } from "@/components/shared/SectionCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Icon } from "@/components/ui/Icon";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDateRange, faFullDate, faNumber, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { EventDetail, EventSession } from "@/types/event";

function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** Length of a performance in minutes, from the first session's start and end (backend times). */
function durationMinutes(sessions: EventSession[]): number | null {
  const s = sessions[0];
  if (!s) return null;
  const m = Math.round((new Date(s.end_time).getTime() - new Date(s.start_time).getTime()) / 60000);
  return m > 0 && m < 24 * 60 ? m : null;
}

export function EventDetailView({ slug }: { slug: string }) {
  const { data: event, isLoading, isError, error, refetch } = useEventDetail(slug);
  if (isError) {
    return (
      <>
        <PageTopBar fallbackHref="/events" />
        <ErrorState className="container-page my-6" message={errorMessage(error)} onRetry={() => refetch()} />
      </>
    );
  }
  if (isLoading || !event) return <EventDetailSkeleton />;
  return <EventDetailContent event={event} />;
}

function EventDetailContent({ event }: { event: EventDetail }) {
  const router = useRouter();
  const bookable = event.sessions.filter((s) => sessionAvailability(s).bookable);
  const [selectedId, setSelectedId] = useState<number | null>(bookable.length === 1 ? bookable[0].id : null);
  const [quantityFor, setQuantityFor] = useState<EventSession | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [allSessions, setAllSessions] = useState(false);
  const sessionsRef = useRef<HTMLElement>(null);
  const { isFavorite, toggle } = useFavoriteToggle();
  const selected = event.sessions.find((s) => s.id === selectedId) ?? null;
  const cancelled = event.status === "CANCELLED";
  const minPrice = event.sessions.length ? Math.min(...event.sessions.map((s) => Number(s.from_price))) : Number(event.min_price ?? 0);
  const about = paragraphs(event.description);
  const rules = (event.notice ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const favorite = isFavorite(event.id);
  const minutes = durationMinutes(event.sessions);
  const venue = [event.venue_name, event.hall_name].filter(Boolean).join("، ");
  const mapQuery = [event.hall_address, event.venue_name, event.city_name].filter(Boolean).join("، ");
  const shownSessions = allSessions ? event.sessions : event.sessions.slice(0, 8);
  const sections = [
    about.length > 0 && { id: "about", label: "معرفی" },
    { id: "sessions", label: "سانس‌ها" },
    event.speakers.length > 0 && { id: "speakers", label: "سخنرانان" },
    (venue || event.hall_address) && { id: "venue", label: "نقشه" },
    event.gallery.length > 0 && { id: "gallery", label: "گالری" },
  ].filter(Boolean) as { id: string; label: string }[];
  const [tab, setTab] = useState(sections[0].id);

  /** Sticky CTA: without a chosen session it scrolls to the sessions; with one it continues to seats / quantity. */
  function proceed() {
    if (!selected) {
      sessionsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (selected.has_seat_map) router.push(`/sessions/${selected.id}/seats`);
    else setQuantityFor(selected);
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: event.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("پیوند رویداد کپی شد.");
      }
    } catch {
      // The share sheet was dismissed.
    }
  }

  const quick: { icon: React.ReactNode; tone: string; top?: string; value: string }[] = [
    { icon: <Icon name="common/ticket" className="size-5" />, tone: "bg-blue-bg text-blue", top: "قیمت از", value: minPrice > 0 ? `${faNumber(minPrice)} تومان` : "رایگان" },
    minutes && { icon: <Icon name="common/clock" className="size-5" />, tone: "bg-warning-bg text-warning", value: `حدود ${faNumber(minutes)} دقیقه` },
    event.sessions.length > 0 && { icon: <Icon name="common/sessions" className="size-5" />, tone: "bg-success-bg text-success-fg", value: `${faNumber(event.sessions.length)} سانس` },
    event.category_name && {
      icon: <CategoryIcon slug={event.category_slug} iconUrl={event.category_icon_url} className="size-5" />,
      tone: "bg-purple-bg text-purple",
      value: event.category_name,
    },
  ].filter(Boolean) as { icon: React.ReactNode; tone: string; top?: string; value: string }[];

  const ctaLabel = selected ? (selected.has_seat_map ? "انتخاب صندلی" : "انتخاب تعداد بلیت") : "انتخاب سانس";
  const ctaDisabled = cancelled || !bookable.length;

  return (
    <>
      <PageTopBar
        fallbackHref="/events"
        actions={
          <>
            <TopBarButton label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} pressed={favorite} onClick={() => toggle(event.id)}>
              <Heart className={cn("size-[22px]", favorite && "fill-ticket text-ticket")} />
            </TopBarButton>
            <TopBarButton label="اشتراک‌گذاری" onClick={share}>
              <Icon name="common/share" className="size-[21px]" />
            </TopBarButton>
          </>
        }
      />

      <div className="container-page space-y-3.5 pb-6 pt-1 lg:pt-6">
        {/* Hero on the navy band (reference 03): the photo in a neon frame, then the category, title and when / where in white */}
        <section className="relative text-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
          <div className="relative aspect-[16/10] overflow-hidden rounded-[26px] bg-navy-950 shadow-[0_0_0_1.5px_rgb(110_184_255/0.7),0_16px_40px_rgb(47_128_255/0.3)] lg:order-2">
            <SmartImage src={mediaUrl(event.banner_url)} fallback={mediaUrl(event.category_cover_url)} alt={event.title} fill preload sizes="(min-width: 1024px) 600px, 100vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#16307e] to-transparent lg:hidden" />
            <div className="absolute left-3 top-3 hidden gap-2 lg:flex">
              <TopBarButton label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} pressed={favorite} onClick={() => toggle(event.id)}>
                <Heart className={cn("size-[22px]", favorite && "fill-ticket text-ticket")} />
              </TopBarButton>
              <TopBarButton label="اشتراک‌گذاری" onClick={share}>
                <Share2 className="size-5" />
              </TopBarButton>
            </div>
          </div>
          <div className="relative -mt-5 px-1 [text-shadow:0_1px_12px_rgb(15_20_80/0.35)] sm:px-2 lg:order-1 lg:mt-0 lg:px-0">
            {event.category_name && <span className="inline-block rounded-full bg-grad-primary px-3.5 py-1 text-[13px] font-black shadow-[0_6px_16px_rgb(110_50_245/0.4)]">{event.category_name}</span>}
            <h1 className="mt-3 text-[24px] font-black leading-[1.55] sm:text-[30px] lg:text-[38px]">{event.title}</h1>
            {event.subtitle && <p className="mt-0.5 text-[14px] text-white/80 sm:text-[16px]">{event.subtitle}</p>}
            <ul className="mt-3 space-y-2 text-[14.5px] font-bold text-white/95">
              {event.first_start && (
                <li className="flex items-center gap-2.5">
                  <Icon name="common/calendar-simple" className="size-[22px] shrink-0" />
                  {faDateRange(event.first_start, event.last_end)}
                </li>
              )}
              {event.sessions[0] && (
                <li className="flex items-center gap-2.5">
                  <Icon name="common/clock" className="size-[22px] shrink-0" />
                  <span className="tabular">{faTime(event.sessions[0].start_time)}</span>
                </li>
              )}
              {(venue || event.city_name) && (
                <li className="flex items-center gap-2.5">
                  <Icon name="common/location" className="size-[22px] shrink-0" />
                  {[event.city_name, venue].filter(Boolean).join("، ")}
                </li>
              )}
            </ul>
            {cancelled && <p className="mt-3 inline-block rounded-full bg-danger px-3.5 py-1.5 text-[13px] font-bold">این رویداد لغو شده است.</p>}
          </div>
        </section>

        {/* Section tabs (معرفی، سانس‌ها، سخنرانان، نقشه، گالری) */}
        <nav aria-label="بخش‌های رویداد" className="card no-scrollbar flex gap-1 overflow-x-auto rounded-full p-1.5">
          {sections.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "true" : undefined}
              className={cn(
                "flex min-h-11 flex-1 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-[14px] font-bold transition",
                tab === t.id ? "bg-grad-primary glow-primary text-white" : "text-ink-2 hover:text-ink",
              )}
            >
              {t.label}
            </a>
          ))}
        </nav>

        <div className="grid gap-3.5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start lg:gap-5">
          <div className="min-w-0 space-y-3.5">
            {quick.length > 0 && (
              <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {quick.map((q) => (
                  <li key={q.value} className="card flex min-h-[68px] items-center gap-2.5 px-3 py-2.5">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", q.tone)}>{q.icon}</span>
                    <span className="min-w-0 text-[13px] font-bold leading-5 text-ink">
                      {q.top && <span className="block text-[11.5px] font-medium text-muted">{q.top}</span>}
                      <span className={cn("line-clamp-2", q.top && "text-price")}>{q.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {about.length > 0 && (
              <section id="about" aria-labelledby="about-title" className="card scroll-mt-24 p-4 sm:p-5">
                <h2 id="about-title" className="text-[19px] font-black text-ink">
                  درباره رویداد
                </h2>
                <div className={cn("mt-2.5 space-y-3 text-[14.5px] leading-8 text-ink-2", !aboutOpen && "line-clamp-3")}>
                  {about.map((p, i) => (
                    <p key={i} className="whitespace-pre-line">
                      {p}
                    </p>
                  ))}
                </div>
                {(about.length > 1 || about[0].length > 160) && (
                  <button type="button" onClick={() => setAboutOpen((v) => !v)} aria-expanded={aboutOpen} className="mt-1 flex min-h-11 items-center gap-1.5 text-[13.5px] font-bold text-brand-600">
                    {aboutOpen ? "بستن" : "مشاهده بیشتر"}
                    <ChevronDown className={cn("size-4 transition", aboutOpen && "rotate-180")} />
                  </button>
                )}
                {event.topics.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {event.topics.map((t) => (
                      <li key={t.title} className="flex min-h-9 items-center gap-1.5 rounded-xl bg-surface-2 px-3 text-[12.5px] font-bold text-ink-2">
                        {t.icon_url && <SvgIcon src={t.icon_url} className="size-4" style={{ color: t.color ?? undefined }} />}
                        {t.title}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section id="sessions" ref={sessionsRef} aria-labelledby="sessions-title" className="card scroll-mt-24 p-4 sm:p-5">
              <SectionHeader
                title="سانس‌ها"
                headingId="sessions-title"
                actions={
                  event.sessions.length > 8 && (
                    <button type="button" onClick={() => setAllSessions((v) => !v)} className="min-h-11 text-[13.5px] font-bold text-brand-600">
                      {allSessions ? "نمایش کمتر" : "مشاهده همه"}
                    </button>
                  )
                }
              />
              {event.sessions.length ? (
                <ul className="grid gap-2.5 md:grid-cols-2">
                  {shownSessions.map((s) => (
                    <li key={s.id}>
                      <SessionCard session={s} selected={s.id === selectedId} onSelect={() => setSelectedId(s.id)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState className="border-0 py-6" message="سانسی برای این رویداد ثبت نشده است." description="زمان برگزاری به‌زودی اعلام می‌شود." />
              )}
            </section>

            {(venue || event.hall_address) && (
              <section id="venue" aria-labelledby="venue-title" className="card scroll-mt-24 p-4 sm:p-5">
                <h2 id="venue-title" className="flex items-center gap-2 text-[19px] font-black text-ink">
                  <Icon name="common/location" className="size-[22px] text-purple" />
                  محل برگزاری
                </h2>
                <p className="mt-3 text-[15px] font-black text-ink">{venue || event.city_name}</p>
                {(event.hall_address || event.city_name) && <p className="mt-1 text-[13px] leading-6 text-muted">{[event.city_name, event.hall_address].filter(Boolean).join("، ")}</p>}
                {mapQuery && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 flex min-h-12 items-center gap-2 rounded-xl bg-field px-4 text-[13.5px] font-bold text-brand-600 transition hover:bg-brand-50"
                  >
                    <Icon name="common/map" className="size-5" />
                    <span className="flex-1">مشاهده روی نقشه</span>
                    <ArrowLeft className="size-[18px]" />
                  </a>
                )}
              </section>
            )}

            {rules.length > 0 && (
              <section aria-labelledby="rules-title" className="card p-4 sm:p-5">
                <h2 id="rules-title" className="flex items-center gap-2 text-[19px] font-black text-ink">
                  <Icon name="common/invoice" className="size-[22px] text-brand-600" />
                  قوانین و نکات مهم
                </h2>
                <ul className="mt-3 space-y-2">
                  {rules.map((r) => (
                    <li key={r} className="flex items-start gap-3 rounded-xl bg-surface-2 px-3.5 py-3 text-[13.5px] leading-6 text-ink-2">
                      <Info className="mt-0.5 size-[18px] shrink-0 text-ink" />
                      {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <ExtraSections event={event} />
          </div>

          {/* Desktop: price and the next step stay beside the content */}
          <aside className="card hidden p-5 lg:sticky lg:top-24 lg:block">
            <p className="text-[13.5px] text-muted">قیمت بلیت</p>
            <p className="mt-1 text-[24px] font-black text-price">{minPrice > 0 ? <>از {faNumber(minPrice)} <span className="text-[15px] font-bold">تومان</span></> : "رایگان"}</p>
            {selected && <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-[13px] font-bold text-brand-600">سانس انتخاب‌شده: {faFullDate(selected.start_time)}</p>}
            <Button variant="pink" size="xl" block className="mt-4" disabled={ctaDisabled} onClick={proceed}>
              {ctaLabel}
              <ArrowLeft className="size-5" />
            </Button>
            {!bookable.length && <p className="mt-2 text-center text-[13px] text-muted">{cancelled ? "فروش این رویداد متوقف شده است." : "در حال حاضر سانس فعالی برای خرید وجود ندارد."}</p>}
            {event.organizer_name && (
              <p className="mt-4 border-t border-line pt-4 text-[13px] text-ink-2">
                برگزارکننده: <b className="text-ink">{event.organizer_name}</b>
              </p>
            )}
          </aside>
        </div>
      </div>

      {/* Phones: price and the next step stay on screen, right above the bottom navigation */}
      <div className="h-[84px] lg:hidden" aria-hidden />
      <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface/90 backdrop-blur-xl lg:hidden">
        <div className="container-page flex h-[76px] items-center gap-3">
          <Button variant="pink" size="lg" className="min-h-[54px] flex-1" disabled={ctaDisabled} onClick={proceed}>
            {ctaLabel}
            <ArrowLeft className="size-5" />
          </Button>
          <div className="min-w-0 text-left">
            <p className="text-[12px] text-muted">قیمت بلیت</p>
            <p className="text-[16px] font-black text-price">{minPrice > 0 ? `از ${faNumber(minPrice)} تومان` : "رایگان"}</p>
          </div>
        </div>
      </div>

      {quantityFor && (
        <QuantityDialog
          session={quantityFor}
          open
          onClose={() => setQuantityFor(null)}
          onConfirm={(quantity) => router.push(`/checkout?session=${quantityFor.id}&quantity=${quantity}`)}
        />
      )}
    </>
  );
}

/** Speakers, gallery and FAQ of the event (shown only when the admin filled them). */
function ExtraSections({ event }: { event: EventDetail }) {
  return (
    <>
      {event.speakers.length > 0 && (
        <section id="speakers" aria-labelledby="speakers-title" className="card scroll-mt-24 p-4 sm:p-5">
          <SectionHeader title="سخنرانان" headingId="speakers-title" icon={<Mic className="size-5 text-brand-600" />} />
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {event.speakers.map((s) => (
              <li key={s.full_name} className="text-center">
                <div className="relative mx-auto flex size-20 items-center justify-center overflow-hidden rounded-full bg-field text-muted">
                  <UserRound className="size-9" aria-hidden />
                  <SmartImage src={mediaUrl(s.photo_url)} fallback={null} alt={s.full_name} fill sizes="80px" className="object-cover" />
                </div>
                <p className="mt-2 text-[14px] font-black text-ink">{s.full_name}</p>
                {(s.job_title || s.organization) && <p className="mt-0.5 text-[12px] leading-5 text-muted">{[s.job_title, s.organization].filter(Boolean).join("، ")}</p>}
                {s.keynote && <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-bold text-brand-600">سخنران اصلی</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.gallery.length > 0 && (
        <section id="gallery" aria-labelledby="gallery-title" className="card scroll-mt-24 p-4 sm:p-5">
          <SectionHeader title="گالری رویداد" headingId="gallery-title" icon={<Images className="size-5 text-brand-600" />} />
          <ul className="no-scrollbar -mx-1 flex snap-x gap-2.5 overflow-x-auto px-1 md:grid md:grid-cols-3">
            {event.gallery.map((g) => (
              <li key={g.image_url} className="w-[70%] shrink-0 snap-start md:w-auto">
                <a href={mediaUrl(g.image_url) ?? "#"} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-field">
                  <SmartImage src={mediaUrl(g.image_url)} fallback={null} alt={g.caption ?? `تصویر ${event.title}`} fill sizes="(min-width: 768px) 30vw, 70vw" className="object-cover transition hover:scale-105" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.faqs.length > 0 && (
        <section aria-labelledby="faq-title" className="card p-4 sm:p-5">
          <SectionHeader title="سوالات متداول" headingId="faq-title" icon={<CircleHelp className="size-5 text-brand-600" />} />
          <ul className="space-y-2">
            {event.faqs.map((f) => (
              <li key={f.question}>
                <details className="group rounded-xl bg-surface-2">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-[14px] font-bold text-ink">
                    {f.question}
                    <ChevronDown className="size-5 shrink-0 text-muted transition group-open:rotate-180" />
                  </summary>
                  <p className="px-4 pb-4 text-[13.5px] leading-7 text-ink-2">{f.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}

      {event.stats.length > 0 && (
        <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {event.stats.map((s) => (
            <li key={s.label} className="card p-3 text-center">
              <p className="text-[19px] font-black" style={{ color: s.color ?? "var(--brand-600)" }}>
                {s.value}
              </p>
              <p className="mt-1 text-[12.5px] text-muted">{s.label}</p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function EventDetailSkeleton() {
  return (
    <>
      <PageTopBar fallbackHref="/events" />
      <div className="container-page space-y-3.5 pt-1 lg:pt-6" aria-busy>
        <Skeleton className="aspect-[16/10] rounded-[26px] bg-white/15 lg:aspect-auto lg:h-[380px]" />
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[68px] rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-[160px] rounded-2xl" />
        <Skeleton className="h-[220px] rounded-2xl" />
      </div>
    </>
  );
}

