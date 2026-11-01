"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import { useContentPage, useSiteSettings } from "@/hooks/useContent";
import { PageTopBar } from "@/components/layout/PageTopBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/feedback/States";
import { errorMessage } from "@/services/api";
import { faDate, toFaDigits } from "@/lib/format";

/** Pages written in the admin panel ("صفحات محتوایی"); the contact page also lists the site's contact details. */
export function ContentPageView({ slug }: { slug: string }) {
  const { data: page, isError, error, refetch } = useContentPage(slug);
  const { data: settings } = useSiteSettings();

  if (isError) return <ErrorState className="container-page my-8" message={errorMessage(error)} onRetry={() => refetch()} />;
  if (!page) {
    return (
      <div className="container-page max-w-[960px] space-y-4 py-8">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    );
  }

  const paragraphs = (page.content ?? "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const contacts =
    slug === "contact"
      ? ([
          settings?.contact_phone && { icon: Phone, text: toFaDigits(settings.contact_phone), href: `tel:${settings.contact_phone.replace(/[^\d+]/g, "")}`, ltr: true },
          settings?.contact_email && { icon: Mail, text: settings.contact_email, href: `mailto:${settings.contact_email}`, ltr: true },
          settings?.address && { icon: MapPin, text: settings.address },
        ].filter(Boolean) as { icon: typeof Phone; text: string; href?: string; ltr?: boolean }[])
      : [];

  return (
    <>
    <PageTopBar title={page.title} subtitle={page.updated_at ? `آخرین به‌روزرسانی: ${faDate(page.updated_at)}` : undefined} />
    <div className="container-page max-w-[960px] pb-8 pt-1.5">
      <article className="card p-5 sm:p-8">
        <div className="space-y-4 text-[14px] leading-8 text-ink-2">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-line">
              {p}
            </p>
          ))}
        </div>
        {contacts.length > 0 && (
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {contacts.map(({ icon: Icon, text, href, ltr }) => (
              <li key={text} className="flex items-center gap-3 rounded-2xl border border-line bg-surface-2 p-4 text-[14.5px] text-ink">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon className="size-5" />
                </span>
                {href ? (
                  <a href={href} dir={ltr ? "ltr" : undefined} className="min-w-0 break-words font-bold hover:text-brand-600">
                    {text}
                  </a>
                ) : (
                  <span className="min-w-0">{text}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </article>
    </div>
    </>
  );
}
