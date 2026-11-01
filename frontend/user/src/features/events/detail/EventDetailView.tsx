"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronDown, Heart, Info, Share2, UserRound } from "lucide-react";
import { useEventDetail } from "../hooks";
import { useFavoriteToggle } from "@/features/profile/queries";
import { PageTopBar, TopBarButton } from "@/components/layout/PageTopBar";
import { sessionAvailability } from "@/components/shared/SessionCard";
import { SectionHeader } from "@/components/shared/SectionCard";
import { SmartImage } from "@/components/ui/SmartImage";
import { Icon } from "@/components/ui/Icon";
import { SvgIcon } from "@/components/ui/SvgIcon";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { StateDialog, SYMBOL } from "@/components/feedback/StateDialog";
import { errorMessage } from "@/services/api";
import { toast } from "@/stores/useToastStore";
import { faDateRange, faFullDate, faNumber, faTime } from "@/lib/format";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { EventDetail } from "@/types/event";

function paragraphs(text?: string | null) {
  return (text ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

/** 06 جزئیات رویداد: عادی، رویداد لغوشده، ظرفیت تکمیل. */
export function EventDetailView({ slug }: { slug: string }) {
  const { data: event, isLoading, isError, error, refetch } = useEventDetail(slug);
  if (isError) {
    return (
      <>
        <PageTopBar title="جزئیات رویداد" fallbackHref="/events" />
        <ErrorState className="container-page" message={errorMessage(error)} onRetry={() => refetch()} />
      </>
    );
  }
  if (isLoading || !event) return <EventDetailSkeleton />;
  return <EventDetailContent event={event} />;
}

/** The design's .hero: the title and a line (date · place) over the event's poster. */
export function EventHero({ title, line, banner, fallback, className }: { title: string; line?: string; banner?: string | null; fallback?: string | null; className?: string }) {
  return (
    <section className={cn("bg-hero relative overflow-hidden rounded-[23px] text-white", className)}>
      <SmartImage src={mediaUrl(banner)} fallback={mediaUrl(fallback)} alt="" fill preload sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover opacity-55" />
      <div className="absolute inset-0 bg-gradient-to-l from-[#0b1854]/80 to-transparent" />
      <div className="relative flex min-h-[130px] flex-col justify-center p-[18px] lg:min-h-[240px] lg:px-10">
        <p className="text-[20px] font-black leading-[1.7] lg:text-[32px]">{title}</p>
        {line && <p className="mt-1 text-[11px] leading-[1.8] text-white/90 lg:text-[15px]">{line}</p>}
      </div>
    </section>
  );
}

function EventDetailContent({ event }: { event: EventDetail }) {
  const router = useRouter();
  const bookable = event.sessions.filter((s) => sessionAvailability(s).bookable);
  const [stateSeen, setStateSeen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const { isFavorite, toggle } = useFavoriteToggle();
  const cancelled = event.status === "CANCELLED";
  const about = paragraphs(event.description);
  const rules = (event.notice ?? "").split("\n").map((l) => l.trim()).filter(Boolean);
  const favorite = isFavorite(event.id);
  const venue = [event.venue_name, event.hall_name].filter(Boolean).join("، ");
  const mapQuery = [event.hall_address, event.venue_name, event.city_name].filter(Boolean).join("، ");
  const sessionsHref = `/events/${encodeURIComponent(event.slug)}/sessions`;
  const soldOut = event.sessions.length > 0 && !bookable.length;

  const tabs = [
    about.length > 0 && { id: "about", label: "معرفی" },
    { id: "sessions", label: "سانس‌ها" },
    event.speakers.length > 0 && { id: "speakers-title", label: "سخنرانان" },
    event.gallery.length > 0 && { id: "gallery-title", label: "گالری" },
    event.faqs.length > 0 && { id: "faq-title", label: "سوالات متداول" },
  ].filter(Boolean) as { id: string; label: string }[];
  const [activeTab, setActiveTab] = useState(tabs[0].id);

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

  return (
    <>
      <PageTopBar
        title="جزئیات رویداد"
        fallbackHref="/events"
        actions={
          <>
            <TopBarButton label="اشتراک‌گذاری" onClick={share}>
              <Share2 className="size-[18px]" />
            </TopBarButton>
            <TopBarButton label={favorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"} pressed={favorite} onClick={() => toggle(event.id)}>
              <Heart className={cn("size-[18px]", favorite && "fill-ticket text-ticket")} />
            </TopBarButton>
          </>
        }
      />

      <div className="container-page pb-28 pt-1.5 lg:pb-10">
        <EventHero
          className="[&>div:last-child]:min-h-[168px] lg:[&>div:last-child]:min-h-[300px]"
          title={event.title}
          line={[event.first_start ? faDateRange(event.first_start, event.last_end) : null, event.city_name].filter(Boolean).join(" · ")}
          banner={event.banner_url}
          fallback={event.category_cover_url}
        />

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="group" aria-label="بخش‌های رویداد">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-pressed={t.id === activeTab}
              onClick={() => {
                setActiveTab(t.id);
                document.getElementById(t.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className={cn("flex min-h-10 shrink-0 items-center rounded-full px-[13px] text-[12px]", t.id === activeTab ? "bg-chip font-bold text-white" : "border border-line-strong bg-field text-ink")}
            >
              {t.label}
            </button>
          ))}
        </div>

        {about.length > 0 && (
          <section id="about" className="scroll-mt-4">
            <h2 className="mb-1.5 mt-[19px] text-[15px] font-black text-ink">درباره رویداد</h2>
            {event.subtitle && <p className="text-[12px] font-bold leading-[2] text-ink-2">{event.subtitle}</p>}
            <div className={cn("space-y-2 text-[12px] leading-[2] text-muted", !aboutOpen && "line-clamp-3")}>
              {about.map((p, i) => (
                <p key={i} className="whitespace-pre-line">
                  {p}
                </p>
              ))}
            </div>
            {(about.length > 1 || about[0].length > 160) && (
              <button type="button" onClick={() => setAboutOpen((v) => !v)} aria-expanded={aboutOpen} className="flex min-h-10 items-center gap-1 text-[12px] font-bold text-brand-500">
                {aboutOpen ? "بستن" : "مشاهده بیشتر"}
                <ChevronDown className={cn("size-4 transition", aboutOpen && "rotate-180")} />
              </button>
            )}
            {event.topics.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {event.topics.map((t) => (
                  <li key={t.title} className="flex min-h-9 items-center gap-1.5 rounded-full border border-line bg-field px-3 text-[12px] text-ink">
                    {t.icon_url && <SvgIcon src={t.icon_url} className="size-4" style={{ color: t.color ?? undefined }} />}
                    {t.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section id="sessions" className="scroll-mt-4">
          <h2 className="mb-[9px] mt-[19px] text-[15px] font-black text-ink">سانس‌های موجود</h2>
          {event.sessions.length ? (
            <ul className="grid gap-3 lg:grid-cols-2">
              {event.sessions.map((s) => (
                <li key={s.id} className="card p-4">
                  <b className="block text-[14px] text-ink">{faFullDate(s.start_time)}</b>
                  {s.title && <span className="block text-[12px] text-muted">{s.title}</span>}
                  <p className="mt-1 text-[12px] leading-[2] text-muted">
                    <span className="tabular">{faTime(s.start_time)}</span> · {sessionAvailability(s).label} · از {faNumber(s.from_price)} تومان
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[12px] leading-[2] text-muted">سانسی برای این رویداد ثبت نشده است؛ زمان برگزاری به‌زودی اعلام می‌شود.</p>
          )}
        </section>

        {(venue || event.hall_address) && (
          <section className="card mt-3 p-4">
            <h2 className="text-[15px] font-black text-ink">محل برگزاری</h2>
            <p className="mt-2 text-[13px] font-bold text-ink-2">{venue || event.city_name}</p>
            {(event.hall_address || event.city_name) && <p className="mt-1 text-[12px] leading-6 text-muted">{[event.city_name, event.hall_address].filter(Boolean).join("، ")}</p>}
            {mapQuery && (
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`} target="_blank" rel="noreferrer" className="mt-2 flex min-h-11 items-center gap-2 text-[12px] font-bold text-brand-500">
                <Icon name="common/map" className="size-[18px]" />
                مشاهده روی نقشه
              </a>
            )}
            {event.organizer_name && <p className="mt-2 border-t border-line pt-3 text-[12px] text-muted">برگزارکننده: <b className="text-ink">{event.organizer_name}</b></p>}
          </section>
        )}

        {rules.length > 0 && (
          <section className="card mt-3 p-4">
            <h2 className="text-[15px] font-black text-ink">قوانین و نکات مهم</h2>
            <ul className="mt-2 space-y-1.5 text-[12px] leading-6 text-muted">
              {rules.map((r) => (
                <li key={r} className="flex items-start gap-2">
                  <Info className="mt-1 size-4 shrink-0 text-ink" />
                  {r}
                </li>
              ))}
            </ul>
          </section>
        )}

        <ExtraSections event={event} />

        <div className="fixed inset-x-0 bottom-[calc(70px+env(safe-area-inset-bottom))] z-30 bg-gradient-to-t from-page via-page/80 to-transparent lg:bg-none px-4 pb-3 pt-6 lg:static lg:mt-5 lg:p-0">
          <Button size="xl" block disabled={cancelled || event.sessions.length === 0} onClick={() => router.push(sessionsHref)}>
            انتخاب سانس
            <ArrowLeft className="size-5" />
          </Button>
        </div>
      </div>

      {!stateSeen && cancelled && <StateDialog symbol={SYMBOL.warning} title="این رویداد لغو شده است" message="برای اطلاعات بیشتر با پشتیبانی تماس بگیرید." onAction={() => setStateSeen(true)} />}
      {!stateSeen && !cancelled && soldOut && <StateDialog symbol={SYMBOL.ticket} title="ظرفیت رویداد تکمیل است" message="می‌توانید سایر سانس‌ها را بررسی کنید." onAction={() => setStateSeen(true)} />}
    </>
  );
}

/** Speakers, gallery and FAQ of the event (shown only when the admin filled them). */
function ExtraSections({ event }: { event: EventDetail }) {
  return (
    <>
      {event.speakers.length > 0 && (
        <section aria-labelledby="speakers-title" className="scroll-mt-4">
          <SectionHeader title="سخنرانان" headingId="speakers-title" />
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
        <section aria-labelledby="gallery-title" className="scroll-mt-4">
          <SectionHeader title="گالری رویداد" headingId="gallery-title" />
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
        <section aria-labelledby="faq-title" className="scroll-mt-4">
          <SectionHeader title="سوالات متداول" headingId="faq-title" />
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
        <ul className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {event.stats.map((s) => (
            <li key={s.label} className="card p-3 text-center">
              <p className="text-[19px] font-black" style={{ color: s.color ?? "var(--brand-500)" }}>
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
      <PageTopBar title="جزئیات رویداد" fallbackHref="/events" />
      <div className="container-page space-y-3 pt-1.5" aria-busy>
        <Skeleton className="h-[168px] rounded-[23px] lg:h-[300px]" />
        <Skeleton className="h-10 w-3/5 rounded-full" />
        <Skeleton className="h-[90px] rounded-[20px]" />
        <Skeleton className="h-[90px] rounded-[20px]" />
      </div>
    </>
  );
}
