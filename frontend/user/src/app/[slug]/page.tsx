'use client';

import { use } from "react";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useContentPage, useSiteSettings } from "@/hooks/usePublicData";

/** Content pages written in the admin panel ("صفحات محتوایی"), e.g. /about or /terms. */
export default function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[860px] flex-1 px-4 py-8 lg:py-12">
        <PageBody slug={decodeURIComponent(slug)} />
      </main>
      <SiteFooter />
    </div>
  );
}

function PageBody({ slug }: { slug: string }) {
  const { data: page, isLoading, isError, error, refetch } = useContentPage(slug);
  const { data: settings } = useSiteSettings();

  if ((error as { status?: number } | null)?.status === 404) notFound();
  if (isError) return <ErrorState message="دریافت صفحه با خطا مواجه شد." onRetry={() => refetch()} />;
  if (isLoading || !page) {
    return (
      <div className="space-y-4">
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
          settings?.contact_phone && { icon: Phone, text: settings.contact_phone, href: `tel:${settings.contact_phone.replace(/[^\d+]/g, "")}` },
          settings?.contact_email && { icon: Mail, text: settings.contact_email, href: `mailto:${settings.contact_email}` },
          settings?.address && { icon: MapPin, text: settings.address },
        ].filter(Boolean) as { icon: typeof Phone; text: string; href?: string }[])
      : [];

  return (
    <article>
      <h1 className="text-[26px] font-black text-ink sm:text-[32px]">{page.title}</h1>
      <div className="mt-6 space-y-4 text-[15.5px] leading-8 text-ink/90">
        {paragraphs.map((p, i) => (
          <p key={i} className="whitespace-pre-line">
            {p}
          </p>
        ))}
      </div>
      {contacts.length > 0 && (
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {contacts.map(({ icon: Icon, text, href }) => (
            <li key={text} className="flex items-center gap-3 rounded-xl border border-line bg-surface-2 p-4 text-[14.5px] text-ink">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="size-5" />
              </span>
              {href ? (
                <a href={href} dir="ltr" className="min-w-0 break-words font-semibold hover:text-brand-600">
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
  );
}
