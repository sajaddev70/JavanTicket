'use client';

import { Info } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { MenuSectionCard } from "@/components/menu/MenuSectionCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useAdminMenu } from "@/hooks/useAdmin";

export default function AdminMenuStructurePage() {
  const menu = useAdminMenu();
  return (
    <AdminLayout>
      <PageHeader title="ساختار منوهای پنل مدیریت" crumbs={["ساختار منوهای پنل مدیریت"]} />

      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-brand-500/20 bg-brand-500/8 px-5 py-4 text-[14px] leading-8 text-ink/85">
        <Info className="mt-1.5 size-5 shrink-0 text-brand-600" />
        <p>
          در این صفحه، ساختار کامل منوهای پنل مدیریت به همراه گروه‌بندی و توضیح مختصر هر بخش نمایش داده شده است.
          <br className="hidden sm:block" />
          از طریق منوهای سمت راست می‌توانید به بخش‌های مختلف سامانه دسترسی داشته باشید.
        </p>
      </div>

      {menu.isError ? (
        <ErrorState message="دریافت منوی پنل با خطا مواجه شد." onRetry={() => menu.refetch()} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {menu.isLoading
            ? Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)
            : menu.data?.sections.filter((s) => s.items.length > 0).map((section) => <MenuSectionCard key={section.id} section={section} />)}
        </div>
      )}
    </AdminLayout>
  );
}
