import Link from "next/link";

export function PageHeader({ title, crumbs, action }: { title: string; crumbs: string[]; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-black text-ink sm:text-[28px]">{title}</h1>
        <nav aria-label="مسیر صفحه" className="mt-2 flex items-center gap-2 text-[13px] text-muted">
          <Link href="/dashboard" className="hover:text-brand-600">
            خانه
          </Link>
          {crumbs.map((crumb) => (
            <span key={crumb} className="flex items-center gap-2">
              <span className="text-muted/50">/</span>
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
      </div>
      {action}
    </div>
  );
}
