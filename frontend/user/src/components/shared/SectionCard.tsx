import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/cn";

/** White section panel with a title and an optional "مشاهده همه" link, as on the homepage. */
export function SectionCard({
  title,
  subtitle,
  icon,
  moreHref,
  moreLabel = "مشاهده همه",
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
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="flex items-center gap-2 text-[18px] font-black text-ink sm:text-[20px]">
            {icon}
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-[13px] text-muted">{subtitle}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {moreHref && (
            <Link href={moreHref} className="flex min-h-10 items-center gap-1.5 text-[13.5px] font-bold text-brand-600 hover:text-brand-700">
              {moreLabel}
              <ArrowLeft className="size-4" />
            </Link>
          )}
        </div>
      </div>
      {children}
    </section>
  );
}
