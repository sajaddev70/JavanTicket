import Link from "next/link";
import { cn } from "@/lib/cn";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items, className, tone = "default" }: { items: Crumb[]; className?: string; tone?: "default" | "light" }) {
  return (
    <nav aria-label="مسیر صفحه" className={className}>
      <ol className={cn("flex flex-wrap items-center gap-1.5 text-[13px]", tone === "light" ? "text-white/75" : "text-muted")}>
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
              {item.href && !last ? (
                <Link href={item.href} className={cn("hover:underline", tone === "light" ? "hover:text-white" : i === 0 ? "text-brand-600" : "hover:text-brand-600")}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={cn(last && (tone === "light" ? "text-white" : "text-ink-2"))}>
                  {item.label}
                </span>
              )}
              {!last && <span aria-hidden>/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
