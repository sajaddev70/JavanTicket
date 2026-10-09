'use client';

import { use } from "react";
import { notFound } from "next/navigation";
import { Construction } from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/States";
import { useAdminMenu } from "@/hooks/useAdmin";

/** Menu destinations that do not have a dedicated screen yet. Anything else is a real 404. */
export default function PendingSectionPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = use(params);
  return (
    <AdminLayout>
      <PendingSection path={`/${slug.map(decodeURIComponent).join("/")}`} />
    </AdminLayout>
  );
}

function PendingSection({ path }: { path: string }) {
  const menu = useAdminMenu();
  if (menu.isLoading) return <Skeleton className="h-64 rounded-2xl" />;
  if (menu.isError) return <ErrorState message="دریافت منوی پنل با خطا مواجه شد." onRetry={() => menu.refetch()} />;

  const item = menu.data?.sidebar.flat().find((i) => path === i.path || path.startsWith(`${i.path}/`));
  if (!item) notFound();

  return (
    <>
      <PageHeader title={item.title} crumbs={[item.title]} />
      <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
          <Construction className="size-7" />
        </span>
        <h2 className="text-lg font-extrabold text-ink">این بخش به‌زودی فعال می‌شود</h2>
        {item.description && <p className="max-w-md text-sm leading-7 text-muted">{item.description}</p>}
      </Card>
    </>
  );
}
