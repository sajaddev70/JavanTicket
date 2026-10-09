'use client';

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePageBlocks } from "@/hooks/usePublicData";
import { SmartImage } from "@/components/ui/SmartImage";
import { mediaUrl } from "@/lib/media";

/** "Buy tickets in a few clicks" banner (HOME_CTA block). */
export function CtaBanner() {
  const cta = usePageBlocks().data?.HOME_CTA;
  if (!cta) return null;
  return (
    <section className="relative overflow-hidden rounded-[20px] bg-gradient-to-l from-brand-50 to-surface-2 shadow-card">
      <div className="absolute inset-y-0 left-0 hidden w-[38%] md:block">
        <SmartImage src={mediaUrl(cta.image_url)} fallback={null} alt="" fill sizes="520px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-l from-brand-50 via-transparent to-transparent dark:from-surface-2" />
      </div>
      <div className="relative flex flex-col items-start gap-4 p-5 sm:p-7 md:w-[62%] md:flex-row md:items-center md:justify-between">
        <div className="max-w-xl text-center md:text-right">
          {cta.kicker && <p className="text-[13px] text-muted">{cta.kicker}</p>}
          {cta.title && <h2 className="mt-1 text-[20px] font-black text-ink sm:text-[24px]">{cta.title}</h2>}
          {cta.subtitle && <p className="mt-1.5 text-[13.5px] leading-7 text-muted">{cta.subtitle}</p>}
        </div>
        {cta.button_text && cta.button_url && (
          <Link
            href={cta.button_url}
            className="flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-600 px-7 text-[15px] font-bold text-white shadow-cta hover:bg-brand-700 md:w-auto"
          >
            {cta.button_text}
            <ChevronLeft className="size-5" />
          </Link>
        )}
      </div>
    </section>
  );
}
