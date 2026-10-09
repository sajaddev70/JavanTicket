'use client';

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Mail, MapPin, Phone, Send } from "lucide-react";
import { useNavigation, useSiteSettings } from "@/hooks/usePublicData";
import { publicApi } from "@/services/public";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartLink } from "@/components/ui/SmartLink";
import { faYear } from "@/lib/format";

const noop = () => () => {};

function Social({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a href={href} aria-label={label} target="_blank" rel="noreferrer" className="flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20">
      {children}
    </a>
  );
}

const Instagram = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const LinkedIn = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
    <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94zM20.44 13.3c0-3.1-1.65-4.55-3.86-4.55-1.78 0-2.58.98-3.02 1.67V8.5h-3.38V20h3.38v-6.1c0-1.6.3-3.15 2.29-3.15 1.96 0 1.99 1.83 1.99 3.25V20h3.38z" />
  </svg>
);
const Aparat = () => (
  <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="7.8" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="12" cy="16.2" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="7.8" cy="12" r="1.6" fill="currentColor" stroke="none" />
    <circle cx="16.2" cy="12" r="1.6" fill="currentColor" stroke="none" />
  </svg>
);

export function SiteFooter() {
  const { data: s } = useSiteSettings();
  const columns = useNavigation().data?.footer ?? [];
  const year = useSyncExternalStore(noop, () => faYear(new Date()), () => "");
  const [email, setEmail] = useState("");
  const subscribe = useMutation({ mutationFn: publicApi.subscribe, onSuccess: () => setEmail("") });

  const contacts = [
    s?.address && { icon: MapPin, text: s.address },
    s?.contact_phone && { icon: Phone, text: s.contact_phone, href: `tel:${s.contact_phone.replace(/[^\d+]/g, "")}`, ltr: true },
    s?.contact_email && { icon: Mail, text: s.contact_email, href: `mailto:${s.contact_email}`, ltr: true },
  ].filter(Boolean) as { icon: typeof Phone; text: string; href?: string; ltr?: boolean }[];

  return (
    <footer className="mt-8 bg-navy-950 pb-[env(safe-area-inset-bottom)] text-white">
      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 py-9 sm:grid-cols-2 lg:grid-cols-[1.35fr_1.15fr_0.75fr_0.75fr_1.2fr] lg:gap-6 lg:px-8">
        <div>
          <h2 className="text-[15px] font-extrabold">{s?.newsletter_title ?? "خبرنامه"}</h2>
          {s?.newsletter_text && <p className="mt-2 text-[12.5px] leading-6 text-white/70">{s.newsletter_text}</p>}
          <form
            className="mt-4 flex h-12 items-center overflow-hidden rounded-xl bg-surface"
            onSubmit={(e) => {
              e.preventDefault();
              subscribe.mutate(email.trim());
            }}
          >
            <label htmlFor="newsletter" className="sr-only">
              ایمیل
            </label>
            <Mail className="mr-3 size-5 shrink-0 text-muted" />
            <input
              id="newsletter"
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (subscribe.isSuccess || subscribe.isError) subscribe.reset();
              }}
              placeholder="آدرس ایمیل شما"
              className="h-full min-w-0 flex-1 bg-transparent px-2 text-right text-[13.5px] text-ink outline-none placeholder:text-muted"
            />
            <button type="submit" disabled={subscribe.isPending} className="flex h-full shrink-0 items-center gap-2 bg-brand-600 px-5 text-[14px] font-bold hover:bg-brand-700 disabled:opacity-70">
              {subscribe.isPending && <Loader2 className="size-4 animate-spin" />}
              عضویت
            </button>
          </form>
          <p className="mt-2 min-h-5 text-[12px]" role="status">
            {subscribe.isSuccess && <span className="text-success">عضویت شما در خبرنامه ثبت شد.</span>}
            {subscribe.isError && <span className="text-danger">{(subscribe.error as { message?: string })?.message ?? "ثبت عضویت با خطا مواجه شد."}</span>}
          </p>
        </div>

        {contacts.length > 0 && (
          <div>
            <h2 className="text-[15px] font-extrabold">با ما در ارتباط باشید</h2>
            <ul className="mt-3 space-y-3 text-[13px] text-white/80">
              {contacts.map(({ icon: Icon, text, href, ltr }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-[18px] shrink-0 text-white/70" />
                  {href ? (
                    <a href={href} dir={ltr ? "ltr" : undefined} className="hover:text-white">
                      {text}
                    </a>
                  ) : (
                    <span className="leading-6">{text}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        {columns.map((col) => (
          <div key={col.id}>
            <h2 className="text-[15px] font-extrabold">{col.title}</h2>
            <ul className="mt-3 space-y-1.5 text-[13px] text-white/75">
              {col.links.map((l) => (
                <li key={l.id}>
                  <SmartLink link={l} className="inline-flex min-h-7 items-center hover:text-white" />
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col items-start gap-3">
          <BrandLogo variant="light" width={150} className="h-auto w-[140px]" />
          {s?.footer_text && <p className="text-[12.5px] leading-6 text-white/75">{s.footer_text}</p>}
          <div className="flex gap-2.5">
            {s?.telegram_url && (
              <Social href={s.telegram_url} label="تلگرام">
                <Send className="size-5" strokeWidth={1.8} />
              </Social>
            )}
            {s?.instagram_url && (
              <Social href={s.instagram_url} label="اینستاگرام">
                <Instagram />
              </Social>
            )}
            {s?.linkedin_url && (
              <Social href={s.linkedin_url} label="لینکدین">
                <LinkedIn />
              </Social>
            )}
            {s?.aparat_url && (
              <Social href={s.aparat_url} label="آپارات">
                <Aparat />
              </Social>
            )}
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-[1440px] px-4 py-4 text-center text-[12.5px] text-white/60 lg:px-8">
          {s?.site_name && (
            <>
              تمامی حقوق برای {s.site_name} محفوظ است. © {year}
            </>
          )}
        </p>
      </div>
    </footer>
  );
}
