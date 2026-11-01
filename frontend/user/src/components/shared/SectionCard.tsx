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
    <div className={cn("mb-[9px] mt-[19px] flex items-center justify-between gap-3", className)}>
      <div className="min-w-0">
        <h2 id={headingId} className="flex items-center gap-2 text-[15px] font-black leading-7 text-ink lg:text-[18px]">
          {icon}
          {title}
        </h2>
        {subtitle && <p className="text-[11px] text-muted">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {moreHref && (
          <Link href={moreHref} className="flex min-h-11 items-center gap-1 text-[11px] text-muted hover:text-ink">
            {moreLabel}
            <ChevronLeft className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/** One home / detail section directly on the page, with its [SectionHeader]. */
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
    <section aria-labelledby={headingId} className={className}>
      <SectionHeader title={title} subtitle={subtitle} icon={icon} moreHref={moreHref} moreLabel={moreLabel} actions={actions} headingId={headingId} />
      {children}
    </section>
  );
}
