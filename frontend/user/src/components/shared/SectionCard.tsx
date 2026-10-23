import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/** Section title on the start side and an optional "مشاهده همه ‹" link on the end side, as on the home reference. */
export function SectionHeader({
  title,
  subtitle,
  icon,
  moreHref,
  moreLabel = "مشاهده همه",
  actions,
  headingId,
  className,
}: {
  title: string;
  subtitle?: string | null;
  icon?: React.ReactNode;
  moreHref?: string;
  moreLabel?: string;
  actions?: React.ReactNode;
  headingId?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-3.5 flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={headingId} className="flex items-center gap-2 text-[19px] font-black leading-8 text-ink sm:text-[21px]">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-[13px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {moreHref && (
          <Link href={moreHref} className="flex min-h-11 items-center gap-1 text-[13.5px] font-bold text-brand-600 hover:text-brand-700">
            {moreLabel}
            <ChevronLeft className="size-[18px]" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** Calm white panel holding one home / detail section, with its [SectionHeader]. */
export function SectionCard({
  title,
  subtitle,
  icon,
  moreHref,
  moreLabel,
  actions,
  headingId,
  className,
  children,
}: {
  title: string;
  subtitle?: string | null;
  icon?: React.ReactNode;
  moreHref?: string;
  moreLabel?: string;
  actions?: React.ReactNode;
  headingId?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section aria-labelledby={headingId} className={cn("card p-4 sm:p-5", className)}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} moreHref={moreHref} moreLabel={moreLabel} actions={actions} headingId={headingId} />
      {children}
    </section>
  );
}
