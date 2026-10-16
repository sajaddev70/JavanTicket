"use client";

import { useState, useSyncExternalStore } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { useNavigation, useSiteSettings } from "@/hooks/useContent";
import { contentService } from "@/services/content.service";
import { errorMessage } from "@/services/api";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { SmartLink } from "@/components/ui/SmartLink";
import { faYear, toFaDigits } from "@/lib/format";

const noop = () => () => {};

const Instagram = () => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const LinkedIn = () => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="currentColor" aria-hidden>
    <path d="M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94zM20.44 13.3c0-3.1-1.65-4.55-3.86-4.55-1.78 0-2.58.98-3.02 1.67V8.5h-3.38V20h3.38v-6.1c0-1.6.3-3.15 2.29-3.15 1.96 0 1.99 1.83 1.99 3.25V20h3.38z" />
  </svg>
);
const Aparat = () => (
  <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
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
  const subscribe = useMutation({ mutationFn: contentService.subscribe, onSuccess: () => setEmail("") });

  const socials = [
    s?.telegram_url && { href: s.telegram_url, label: "تلگرام", icon: <Send className="size-[18px]" strokeWidth={1.8} /> },
    s?.instagram_url && { href: s.instagram_url, label: "اینستاگرام", icon: <Instagram /> },
    s?.linkedin_url && { href: s.linkedin_url, label: "لینکدین", icon: <LinkedIn /> },
    s?.aparat_url && { href: s.aparat_url, label: "آپارات", icon: <Aparat /> },
  ].filter(Boolean) as { href: string; label: string; icon: React.ReactNode }[];

  const contacts = [
    s?.contact_phone && { icon: Phone, text: toFaDigits(s.contact_phone), href: `tel:${s.contact_phone.replace(/[^\d+]/g, "")}`, ltr: true },
    s?.contact_email && { icon: Mail, text: s.contact_email, href: `mailto:${s.contact_email}`, ltr: true },
    s?.address && { icon: MapPin, text: s.address },
  ].filter(Boolean) as { icon: typeof Phone; text: string; href?: string; ltr?: boolean }[];

  return (
    <footer className="bg-navy-950 text-white">
      <div className="container-page grid gap-8 py-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_0.8fr_0.8fr_1.3fr_auto] lg:gap-0 lg:divide-x lg:divide-x-reverse lg:divide-white/10 lg:py-8">
        <div className="lg:pl-8">
          <h2 className="text-[15px] font-extrabold">{s?.newsletter_title ?? "خبرنامه"}</h2>
          <form
            className="mt-3.5 flex h-12 items-center overflow-hidden rounded-xl bg-white"
            onSubmit={(e) => {
              e.preventDefault();
              subscribe.mutate(email.trim());
            }}
          >
            <label htmlFor="newsletter" className="sr-only">
              ایمیل
            </label>
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
              placeholder="ایمیل خود را وارد کنید"
              className="h-full min-w-0 flex-1 bg-transparent px-4 text-right text-[13px] text-[#0f1b33] outline-none placeholder:text-[#8a96aa] placeholder:text-right"
            />
            <button type="submit" disabled={subscribe.isPending} className="m-1 h-10 shrink-0 rounded-lg bg-brand-600 px-5 text-[14px] font-bold text-white hover:bg-brand-700 disabled:opacity-70">
              عضویت
            </button>
          </form>
          <p className="mt-2 min-h-5 text-[12px]" role="status">
            {subscribe.isSuccess && <span className="text-[#4ade80]">عضویت شما در خبرنامه ثبت شد.</span>}
            {subscribe.isError && <span className="text-[#fb7185]">{errorMessage(subscribe.error)}</span>}
          </p>
          {socials.length > 0 && (
            <ul className="mt-1 flex gap-2.5">
              {socials.map((x) => (
                <li key={x.label}>
                  <a href={x.href} aria-label={x.label} target="_blank" rel="noreferrer" className="flex size-10 items-center justify-center rounded-full border border-white/25 text-white/90 transition hover:bg-white/10">
                    {x.icon}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="lg:px-8">
            <h2 className="text-[15px] font-extrabold">تماس با ما</h2>
            <ul className="mt-3.5 space-y-3 text-[13px] text-white/80">
              {contacts.map(({ icon: Icon, text, href, ltr }) => (
                <li key={text} className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 size-[17px] shrink-0 text-white/70" />
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
          <div key={col.id} className="lg:px-8">
            <h2 className="text-[15px] font-extrabold">{col.title}</h2>
            <ul className="mt-3 space-y-0.5 text-[13px] text-white/75">
              {col.links.map((l) => (
                <li key={l.id}>
                  <SmartLink link={l} className="inline-flex min-h-8 items-center hover:text-white" />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {s?.footer_text && (
          <p className="self-center text-[13px] leading-7 text-white/75 sm:col-span-2 lg:col-span-1 lg:px-8">{s.footer_text}</p>
        )}

        <div className="flex items-center lg:pr-8">
          <BrandLogo variant="light" width={120} className="h-auto w-[104px] lg:w-[112px]" />
        </div>
      </div>
      <div className="border-t border-white/10 pb-safe">
        <p className="container-page py-4 text-center text-[12.5px] text-white/55">
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
