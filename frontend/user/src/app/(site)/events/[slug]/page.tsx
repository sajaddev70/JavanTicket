import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/queryClient";
import { eventQueries } from "@/features/events/queries";
import { EventDetailView } from "@/features/events/detail/EventDetailView";
import { getEvent } from "@/lib/serverSettings";
import { isStatus } from "@/services/api";
import { mediaUrl } from "@/lib/media";
import type { EventDetail } from "@/types/event";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = decodeURIComponent((await params).slug);
  const event = await getEvent(slug);
  if (!event) return { title: "رویداد" };
  const description = (event.subtitle || event.description || "").replace(/\s+/g, " ").slice(0, 160) || undefined;
  const image = mediaUrl(event.banner_url ?? event.category_cover_url);
  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${encodeURIComponent(event.slug)}` },
    openGraph: { type: "website", title: event.title, description, images: image ? [{ url: image }] : undefined },
    twitter: { card: "summary_large_image", title: event.title, description, images: image ? [image] : undefined },
  };
}

/** schema.org Event for search engines, from the same API data as the page. */
function jsonLd(event: EventDetail) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    image: mediaUrl(event.banner_url) ?? undefined,
    startDate: event.first_start ?? event.start_date ?? undefined,
    endDate: event.last_end ?? event.end_date ?? undefined,
    eventStatus: event.status === "CANCELLED" ? "https://schema.org/EventCancelled" : "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: [event.venue_name, event.hall_name].filter(Boolean).join(" - ") || event.city_name,
      address: event.hall_address ?? event.city_name ?? undefined,
    },
    organizer: event.organizer_name ? { "@type": "Organization", name: event.organizer_name } : undefined,
    offers: event.min_price ? { "@type": "Offer", price: event.min_price, priceCurrency: "IRT" } : undefined,
  };
}

export default async function EventPage({ params }: Props) {
  const slug = decodeURIComponent((await params).slug);
  const queryClient = makeQueryClient();
  let event: EventDetail | null = null;
  try {
    event = await queryClient.fetchQuery(eventQueries.detail(slug));
  } catch (error) {
    if (isStatus(error, 404)) notFound();
    // Other failures: the client retries and shows an error state with a retry button.
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {event && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(event)).replace(/</g, "\\u003c") }} />}
      <EventDetailView slug={slug} />
    </HydrationBoundary>
  );
}
