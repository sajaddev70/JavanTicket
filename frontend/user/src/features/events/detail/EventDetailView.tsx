"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Armchair, BarChart3, Building2, CalendarDays, ChevronDown, CircleHelp, Clock, Heart, Images, Info, Mic, Share2, Sparkles, Tag, Ticket, UserRound, Users, MapPin,
} from "lucide-react";
import { useEventDetail } from "../hooks";
import { SessionPicker, sessionAvailability } from "./SessionPicker";
import { QuantityDialog } from "./QuantityDialog";
import { useFavoriteToggle } from "@/features/profile/queries";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { SmartImage } from "@/components/ui/SmartImage";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDateRange, faNumber, faTimeRange } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { EventDetail, EventSession } from "@/types/event";

function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

export function EventDetailView({ slug }: { slug: string }) {
  const { data: event, isLoading, isError, error, refetch } = useEventDetail(slug);
  if (isError) return <ErrorState className="container-page my-6" message={errorMessage(error)} onRetry={() => refetch()} />;
  if (isLoading || !event) return <EventDetailSkeleton />;
  return <EventDetailContent event={event} />;
}

function EventDetailContent({ event }: { event: EventDetail }) {
  const router = useRouter();
  const bookable = event.sessions.filter((s) => sessionAvailability(s).bookable);
  const [selectedId, setSelectedId] = useState<number | null>(bookable[0]?.id ?? null);
  const [quantityFor, setQuantityFor] = useState<EventSession | null>(null);
  const { isFavorite, toggle } = useFavoriteToggle();
  const selected = event.sessions.find((s) => s.id === selectedId) ?? null;
  const cancelled = event.status === "CANCELLED";
  const minPrice = event.sessions.length ? Math.min(...event.sessions.map((s) => Number(s.from_price))) : Number(event.min_price ?? 0);
  const about = paragraphs(event.description);
  const favorite = isFavorite(event.id);

  function buy() {
    if (!selected) return;
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

  const sections = [
    { id: "about", label: "درباره رویداد", show: about.length > 0 },
    { id: "features", label: "ویژگی‌ها", show: event.topics.length > 0 || event.stats.length > 0 },
    { id: "speakers", label: "سخنرانان", show: event.speakers.length > 0 },
    { id: "gallery", label: "گالری", show: event.gallery.length > 0 },
    { id: "faq", label: "سوالات متداول", show: event.faqs.length > 0 },
  ].filter((s) => s.show);

  const info = [
    { icon: MapPin, label: "شهر", value: event.city_name },
    { icon: Building2, label: "مکان برگزاری", value: [event.venue_name, event.hall_name].filter(Boolean).join(" - ") },
    event.first_start && { icon: CalendarDays, label: "تاریخ برگزاری", value: faDateRange(event.first_start, event.last_end) },
    selected && { icon: Clock, label: "ساعت برگزاری", value: faTimeRange(selected.start_time, selected.end_time) },
    { icon: Tag, label: "دسته‌بندی", value: event.category_name },
    event.sold_count > 0 && { icon: BarChart3, label: "تعداد فروش رفته", value: `${faNumber(event.sold_count)} بلیت` },
  ].filter((x): x is { icon: typeof MapPin; label: string; value: string } => !!x && !!x.value);

  return (
    <div className="container-page space-y-5 pb-28 pt-4 lg:pb-10">
      {/* Header: poster on the end side, title and actions on the start side */}
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.55fr)] lg:items-center">
        <div className="order-2 lg:order-1">
          <Breadcrumb items={[{ label: "صفحه اصلی", href: "/" }, { label: "رویدادها", href: "/events" }, { label: event.title }]} />
          {event.category_name && (
            <Link
              href={`/events?category=${encodeURIComponent(event.category_slug ?? "")}`}
              className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold"
              style={{ color: event.category_color ?? "#7c3aed", backgroundColor: `color-mix(in srgb, ${event.category_color ?? "#7c3aed"} 12%, var(--surface))` }}
            >
              <CategoryIcon slug={event.category_slug} iconUrl={event.category_icon_url} className="size-4" />
              {event.category_name}
            </Link>
          )}
          <h1 className="mt-2.5 text-[24px] font-black leading-[1.5] text-ink sm:text-[30px]">{event.title}</h1>
          {event.subtitle && <p className="mt-1 text-[15px] text-ink-2">{event.subtitle}</p>}
          {cancelled && <p className="mt-3 inline-block rounded-xl bg-danger-bg px-3 py-2 text-[13.5px] font-bold text-danger-fg">این رویداد لغو شده است.</p>}
          <div className="mt-4 flex flex-wrap gap-2.5">
            <Button variant="outline" onClick={() => toggle(event.id)} aria-pressed={favorite}>
              <Heart className={cn("size-5", favorite ? "fill-ticket text-ticket" : "text-ticket")} />
              {favorite ? "در علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی"}
            </Button>
            <Button variant="outline" onClick={share}>
              <Share2 className="size-5 text-brand-600" />
              اشتراک‌گذاری
            </Button>
          </div>
          {about[0] && <p className="mt-4 line-clamp-3 text-[14.5px] leading-8 text-ink-2">{about[0]}</p>}
          {event.notice && (
            <p className="mt-4 flex items-start gap-2 rounded-xl bg-warning-bg px-4 py-3 text-[13.5px] leading-7 text-ink">
              <Info className="mt-1 size-4 shrink-0 text-warning" />
              {event.notice}
            </p>
          )}
        </div>
        <div className="relative order-1 aspect-[16/9] overflow-hidden rounded-[20px] bg-navy-950 shadow-card lg:order-2 lg:aspect-[920/345]">
          <SmartImage src={mediaUrl(event.banner_url)} fallback={mediaUrl(event.category_cover_url)} alt={event.title} fill preload sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start">
        <aside className="order-2 space-y-4 lg:sticky lg:top-24 lg:order-1">
          <div className="card p-4">
            <div className="rounded-2xl bg-surface-2 p-4">
              <p className="text-[14px] text-ink-2">قیمت بلیت از</p>
              <p className="mt-1 text-left text-[28px] font-black text-brand-600">
                {minPrice > 0 ? faNumber(minPrice) : "رایگان"} {minPrice > 0 && <span className="text-[16px] font-bold">تومان</span>}
              </p>
            </div>
            <Button size="xl" block className="mt-3" disabled={!selected || cancelled} onClick={buy}>
              {selected?.has_seat_map === false ? <Ticket className="size-5" /> : <Armchair className="size-5" />}
              {selected?.has_seat_map === false ? "انتخاب تعداد و خرید بلیت" : "انتخاب صندلی و خرید بلیت"}
            </Button>
            {!bookable.length && <p className="mt-2 text-center text-[13px] text-muted">{cancelled ? "فروش این رویداد متوقف شده است." : "در حال حاضر سانس فعالی برای خرید وجود ندارد."}</p>}
            <dl className="mt-3 divide-y divide-line">
              {info.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 py-3">
                  <Icon className="size-5 shrink-0 text-brand-600" />
                  <dt className="shrink-0 whitespace-nowrap text-[13.5px] font-bold text-ink">{label}</dt>
                  <dd className="mr-auto text-left text-[13px] text-ink-2">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          {event.organizer_name && (
            <div className="card p-4">
              <h2 className="flex items-center gap-2 text-[16px] font-black text-ink">
                <Users className="size-5 text-brand-600" />
                برگزارکنندگان
              </h2>
              <p className="mt-3 text-[14px] font-bold text-ink">{event.organizer_name}</p>
              <p className="mt-0.5 text-[12.5px] text-muted">برگزارکننده رویداد</p>
              {event.website_url && (
                <a href={event.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-10 items-center text-[13px] font-bold text-brand-600" dir="ltr">
                  {event.website_url.replace(/^https?:\/\//, "")}
                </a>
              )}
            </div>
          )}
        </aside>

        <div className="order-1 min-w-0 space-y-5 lg:order-2">
          <section aria-labelledby="sessions-title" className="card p-4 sm:p-5">
            <h2 id="sessions-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
              <CalendarDays className="size-6 text-brand-600" />
              انتخاب سانس و خرید بلیت
            </h2>
            {event.sessions.length ? (
              <SessionPicker sessions={event.sessions} selectedId={selectedId} onSelect={setSelectedId} />
            ) : (
              <EmptyState message="سانسی برای این رویداد ثبت نشده است." description="زمان برگزاری به‌زودی اعلام می‌شود." />
            )}
          </section>

          {sections.length > 0 && (
            <nav aria-label="بخش‌های رویداد" className="card no-scrollbar sticky top-[64px] z-20 flex gap-1 overflow-x-auto px-2 lg:top-[72px]">
              {sections.map((s) => (
                <a key={s.id} href={`#${s.id}`} className="flex min-h-12 shrink-0 items-center border-b-[3px] border-transparent px-4 text-[14px] font-bold text-ink-2 hover:border-brand-600 hover:text-brand-600">
                  {s.label}
                </a>
              ))}
            </nav>
          )}

          {(about.length > 0 || event.topics.length > 0) && (
            <section id="about" aria-labelledby="about-title" className="card scroll-mt-40 p-4 sm:p-5">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                <div>
                  <h2 id="about-title" className="flex items-center gap-2 text-[18px] font-black text-ink">
                    <Info className="size-5 text-brand-600" />
                    درباره رویداد
                  </h2>
                  <div className="mt-3 space-y-3 text-[14.5px] leading-8 text-ink-2">
                    {about.map((p, i) => (
                      <p key={i} className="whitespace-pre-line">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
                {event.topics.length > 0 && (
                  <ul id="features" className="grid scroll-mt-40 grid-cols-2 content-start gap-3 rounded-2xl bg-surface-2 p-4 sm:grid-cols-3">
                    {event.topics.map((t) => (
                      <li key={t.title} className="flex flex-col items-center gap-2 py-2 text-center">
                        <span style={{ color: t.color ?? "var(--brand-600)" }}>{t.icon_url ? <SvgIcon src={t.icon_url} className="size-8" /> : <Sparkles className="size-8" />}</span>
                        <span className="text-[13px] font-bold text-ink">{t.title}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {event.stats.length > 0 && (
                <ul id={event.topics.length ? undefined : "features"} className="mt-5 grid scroll-mt-40 grid-cols-2 gap-3 sm:grid-cols-4">
                  {event.stats.map((s) => (
                    <li key={s.label} className="rounded-2xl border border-line p-3 text-center">
                      <p className="text-[20px] font-black" style={{ color: s.color ?? "var(--brand-600)" }}>
                        {s.value}
                      </p>
                      <p className="mt-1 text-[12.5px] text-muted">{s.label}</p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {event.speakers.length > 0 && (
            <section id="speakers" aria-labelledby="speakers-title" className="card scroll-mt-40 p-4 sm:p-5">
              <h2 id="speakers-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
                <Mic className="size-5 text-brand-600" />
                سخنرانان
              </h2>
              <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
                {event.speakers.map((s) => (
                  <li key={s.full_name} className="text-center">
                    <div className="relative mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full bg-field text-muted ring-4 ring-brand-50">
                      <UserRound className="size-10" aria-hidden />
                      <SmartImage src={mediaUrl(s.photo_url)} fallback={null} alt={s.full_name} fill sizes="96px" className="object-cover" />
                    </div>
                    <p className="mt-2.5 text-[14px] font-black text-ink">{s.full_name}</p>
                    {(s.job_title || s.organization) && <p className="mt-0.5 text-[12px] leading-5 text-muted">{[s.job_title, s.organization].filter(Boolean).join("، ")}</p>}
                    {s.keynote && <span className="mt-1.5 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-bold text-brand-600">سخنران اصلی</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.gallery.length > 0 && (
            <section id="gallery" aria-labelledby="gallery-title" className="card scroll-mt-40 p-4 sm:p-5">
              <h2 id="gallery-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
                <Images className="size-5 text-brand-600" />
                گالری رویداد
              </h2>
              <ul className="no-scrollbar -mx-1 flex snap-x gap-3 overflow-x-auto px-1 md:grid md:grid-cols-3 xl:grid-cols-6">
                {event.gallery.map((g) => (
                  <li key={g.image_url} className="w-[70%] shrink-0 snap-start md:w-auto">
                    <a href={mediaUrl(g.image_url) ?? "#"} target="_blank" rel="noreferrer" className="relative block aspect-[4/3] overflow-hidden rounded-xl bg-field">
                      <SmartImage src={mediaUrl(g.image_url)} fallback={null} alt={g.caption ?? `تصویر ${event.title}`} fill sizes="(min-width: 1280px) 16vw, (min-width: 768px) 30vw, 70vw" className="object-cover transition hover:scale-105" />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {event.faqs.length > 0 && (
            <section id="faq" aria-labelledby="faq-title" className="card scroll-mt-40 p-4 sm:p-5">
              <h2 id="faq-title" className="mb-4 flex items-center gap-2 text-[18px] font-black text-ink">
                <CircleHelp className="size-5 text-brand-600" />
                سوالات متداول
              </h2>
              <ul className="grid gap-3 md:grid-cols-2">
                {event.faqs.map((f) => (
                  <li key={f.question}>
                    <details className="group rounded-xl border border-line bg-surface open:bg-surface-2">
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
        </div>
      </div>

      {/* Phones: price and buy button stay on screen */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 px-4 py-3 pb-safe backdrop-blur lg:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[12px] text-muted">قیمت از</p>
            <p className="text-[16px] font-black text-brand-600">{minPrice > 0 ? `${faNumber(minPrice)} تومان` : "رایگان"}</p>
          </div>
          <Button size="lg" className="flex-1" disabled={!selected || cancelled} onClick={buy}>
            {selected?.has_seat_map === false ? "خرید بلیت" : "انتخاب صندلی"}
          </Button>
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
    </div>
  );
}

function EventDetailSkeleton() {
  return (
    <div className="container-page space-y-5 pt-4" aria-busy>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.55fr]">
        <div className="space-y-3">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-11 w-60 rounded-xl" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="aspect-[920/345] rounded-[20px]" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
        <Skeleton className="h-[260px] rounded-[18px]" />
        <Skeleton className="h-[480px] rounded-[18px]" />
      </div>
    </div>
  );
}

