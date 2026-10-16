package com.devs.nisha_user.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Events, sessions and seat maps (GET /public/events..., /public/sessions/...), as the web's types/event.ts.

@Serializable
data class PublicEvent(
    val id: Long,
    val title: String,
    val slug: String,
    val subtitle: String? = null,
    val description: String? = null,
    val notice: String? = null,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("organizer_name") val organizerName: String? = null,
    @SerialName("website_url") val websiteUrl: String? = null,
    @SerialName("min_price") val minPrice: Double? = null,
    val featured: Boolean = false,
    val popular: Boolean = false,
    val status: String? = null,
    @SerialName("start_date") val startDate: String? = null,
    @SerialName("end_date") val endDate: String? = null,
    @SerialName("next_session_at") val nextSessionAt: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_slug") val categorySlug: String? = null,
    @SerialName("category_color") val categoryColor: String? = null,
    @SerialName("category_icon_url") val categoryIconUrl: String? = null,
    @SerialName("category_cover_url") val categoryCoverUrl: String? = null,
    @SerialName("city_id") val cityId: Long? = null,
    @SerialName("city_name") val cityName: String? = null,
    @SerialName("hall_name") val hallName: String? = null,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("hall_address") val hallAddress: String? = null,
)

@Serializable
data class EventSession(
    val id: Long,
    val title: String? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String,
    val price: Double = 0.0,
    @SerialName("from_price") val fromPrice: Double = 0.0,
    val capacity: Int = 0,
    @SerialName("reserved_seats") val reservedSeats: Int = 0,
    @SerialName("available_seats") val availableSeats: Int = 0,
    val status: String = "ACTIVE",
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("city_name") val cityName: String = "",
    @SerialName("has_seat_map") val hasSeatMap: Boolean = false,
)

@Serializable
data class EventStat(val value: String, val label: String, @SerialName("icon_url") val iconUrl: String? = null, val color: String? = null)

@Serializable
data class EventTopic(val title: String, @SerialName("icon_url") val iconUrl: String? = null, val color: String? = null)

@Serializable
data class Speaker(
    @SerialName("full_name") val fullName: String,
    @SerialName("job_title") val jobTitle: String? = null,
    val organization: String? = null,
    @SerialName("photo_url") val photoUrl: String? = null,
    val keynote: Boolean = false,
)

@Serializable
data class GalleryImage(@SerialName("image_url") val imageUrl: String, val caption: String? = null)

@Serializable
data class Faq(val question: String, val answer: String)

/** Event with its sessions, speakers, gallery and FAQ (GET /public/events/{slug}). */
@Serializable
data class EventDetail(
    val id: Long,
    val title: String,
    val slug: String,
    val subtitle: String? = null,
    val description: String? = null,
    val notice: String? = null,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("organizer_name") val organizerName: String? = null,
    @SerialName("website_url") val websiteUrl: String? = null,
    @SerialName("min_price") val minPrice: Double? = null,
    val status: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_slug") val categorySlug: String? = null,
    @SerialName("category_color") val categoryColor: String? = null,
    @SerialName("category_icon_url") val categoryIconUrl: String? = null,
    @SerialName("category_cover_url") val categoryCoverUrl: String? = null,
    @SerialName("city_name") val cityName: String? = null,
    @SerialName("hall_name") val hallName: String? = null,
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("first_start") val firstStart: String? = null,
    @SerialName("last_end") val lastEnd: String? = null,
    @SerialName("sold_count") val soldCount: Long = 0,
    val sessions: List<EventSession> = emptyList(),
    val stats: List<EventStat> = emptyList(),
    val topics: List<EventTopic> = emptyList(),
    val speakers: List<Speaker> = emptyList(),
    val gallery: List<GalleryImage> = emptyList(),
    val faqs: List<Faq> = emptyList(),
) {
    val cancelled: Boolean get() = status == "CANCELLED"
}

@Serializable
data class Paged<T>(val items: List<T> = emptyList(), val total: Int = 0, val page: Int = 1, val size: Int = 12) {
    val pages: Int get() = if (size <= 0) 1 else maxOf(1, (total + size - 1) / size)
    val hasMore: Boolean get() = page < pages
}

enum class EventSort(val api: String, val label: String) {
    NEWEST("newest", "جدیدترین"),
    SOONEST("soonest", "نزدیک‌ترین زمان"),
    PRICE("price", "ارزان‌ترین"),
}

enum class EventWhen(val api: String?, val label: String) {
    ANY(null, "همه تاریخ‌ها"),
    TODAY("today", "امروز"),
    WEEK("week", "این هفته"),
    MONTH("month", "این ماه"),
}

enum class EventType(val api: String?, val label: String) {
    ANY(null, "همه انواع"),
    FEATURED("featured", "رویدادهای ویژه"),
    POPULAR("popular", "پرطرفدار"),
}

/** Filters of the events screen (the web keeps the same values in the URL). */
data class EventFilters(
    val q: String = "",
    val category: String = "",
    /** null = every city; otherwise a city id. */
    val cityId: Long? = null,
    val whenFilter: EventWhen = EventWhen.ANY,
    val type: EventType = EventType.ANY,
    val minPrice: Long? = null,
    val maxPrice: Long? = null,
    val sort: EventSort = EventSort.NEWEST,
) {
    /** Filters counted on the "فیلترها" button (search and category have their own controls). */
    val activeCount: Int get() = listOf(type != EventType.ANY, whenFilter != EventWhen.ANY, minPrice != null, maxPrice != null).count { it }
    val isDefault: Boolean get() = q.isEmpty() && category.isEmpty() && activeCount == 0
}

/** AVAILABLE, SELECTED (held by this device), LOCKED (held by someone else), SOLD, B2B_RESERVED, DISABLED. */
@Serializable
enum class SeatStatus { AVAILABLE, SELECTED, LOCKED, SOLD, B2B_RESERVED, DISABLED }

@Serializable
data class Seat(
    val id: Long,
    @SerialName("section_id") val sectionId: Long,
    @SerialName("row_index") val rowIndex: Int,
    @SerialName("row_label") val rowLabel: String,
    @SerialName("seat_number") val seatNumber: Int,
    val x: Double,
    val y: Double,
    @SerialName("tier_code") val tierCode: String? = null,
    val status: SeatStatus = SeatStatus.AVAILABLE,
) {
    val selectable: Boolean get() = status == SeatStatus.AVAILABLE || status == SeatStatus.SELECTED
}

@Serializable
data class SeatTier(val code: String, val name: String, val color: String, val price: Double? = null)

@Serializable
data class HallSection(
    val id: Long,
    val name: String,
    @SerialName("tier_code") val tierCode: String? = null,
    @SerialName("tier_name") val tierName: String? = null,
    @SerialName("tier_color") val tierColor: String? = null,
)

@Serializable
data class SeatHold(
    @SerialName("seat_ids") val seatIds: List<Long> = emptyList(),
    @SerialName("expires_at") val expiresAt: String? = null,
    @SerialName("seconds_left") val secondsLeft: Long? = null,
    @SerialName("hold_minutes") val holdMinutes: Int = 10,
    @SerialName("max_seats") val maxSeats: Int = 10,
)

@Serializable
data class SeatMapSession(
    val id: Long,
    @SerialName("event_id") val eventId: Long,
    @SerialName("event_title") val eventTitle: String,
    @SerialName("event_subtitle") val eventSubtitle: String? = null,
    @SerialName("event_slug") val eventSlug: String,
    val title: String? = null,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String,
    val price: Double = 0.0,
    val capacity: Int = 0,
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("city_name") val cityName: String = "",
    val status: String = "ACTIVE",
    val tiers: List<SeatTier> = emptyList(),
)

@Serializable
data class SeatMapData(
    val session: SeatMapSession,
    val sections: List<HallSection> = emptyList(),
    val seats: List<Seat> = emptyList(),
    val hold: SeatHold? = null,
)
