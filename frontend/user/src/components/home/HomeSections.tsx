'use client';

import { useHomeSections } from "@/hooks/usePublicData";
import { ErrorState } from "@/components/ui/States";
import { Skeleton } from "@/components/ui/Skeleton";
import { EventSection } from "./EventSection";

export function HomeSections() {
  const { data, isLoading, isError, refetch } = useHomeSections();
  if (isError) return <ErrorState message="دریافت بخش‌های صفحه اصلی با خطا مواجه شد." onRetry={() => refetch()} />;
  if (isLoading) return <Skeleton className="h-[380px] rounded-[20px]" />;
  return (
    <>
      {data?.map((section, i) => (
        <EventSection key={section.id} section={section} highlight={i === 0} />
      ))}
    </>
  );
}
