import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { contentQueries } from "@/hooks/useContent";
import { ContentPageView } from "@/features/content/ContentPageView";
import { getContentPage } from "@/lib/serverSettings";
import { isStatus } from "@/services/api";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);
  const page = await getContentPage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: (page.content ?? "").replace(/\s+/g, " ").slice(0, 160) || undefined,
    alternates: { canonical: `/${encodeURIComponent(slug)}` },
  };
}

/** /about, /contact, /faq, /terms, /privacy ... — any page published in the admin panel. */
export default async function ContentPage({ params }: Props) {
  const slug = decodeURIComponent((await params).slug);
  const queryClient = makeQueryClient();
  try {
    await queryClient.fetchQuery(contentQueries.page(slug));
  } catch (error) {
    if (isStatus(error, 404)) notFound();
  }
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContentPageView slug={slug} />
    </HydrationBoundary>
  );
}
