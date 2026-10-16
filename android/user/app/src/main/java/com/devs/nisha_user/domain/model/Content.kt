package com.devs.nisha_user.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Site content managed in the admin panel (GET /public/...), the same shapes as the web's types/content.ts.
// Models are the API's JSON contract and are used directly by the domain (no separate DTO layer): the backend
// already answers in the exact shape the screens need, and the mappers would only copy fields one to one.

@Serializable
data class SiteSettings(
    @SerialName("site_name") val siteName: String? = null,
    @SerialName("short_name") val shortName: String? = null,
    val tagline: String? = null,
    @SerialName("meta_description") val metaDescription: String? = null,
    /** Artwork for light surfaces. */
    @SerialName("logo_url") val logoUrl: String? = null,
    /** Artwork for navy / dark surfaces. */
    @SerialName("logo_dark_url") val logoDarkUrl: String? = null,
    @SerialName("contact_phone") val contactPhone: String? = null,
    @SerialName("contact_email") val contactEmail: String? = null,
    val address: String? = null,
    @SerialName("footer_text") val footerText: String? = null,
    @SerialName("instagram_url") val instagramUrl: String? = null,
    @SerialName("telegram_url") val telegramUrl: String? = null,
    @SerialName("linkedin_url") val linkedinUrl: String? = null,
    @SerialName("aparat_url") val aparatUrl: String? = null,
    @SerialName("newsletter_title") val newsletterTitle: String? = null,
    @SerialName("newsletter_text") val newsletterText: String? = null,
    /** Service fee in percent of the tickets after discount (0 = none). */
    @SerialName("service_fee_percent") val serviceFeePercent: Double? = null,
)

/** Hero / banner text blocks keyed by block_key (HOME_HERO, EVENTS_HERO, SEAT_HERO, AUTH_HERO, CHECKOUT_NOTICE, ...). */
@Serializable
data class PageBlock(
    @SerialName("block_key") val key: String,
    val kicker: String? = null,
    val title: String? = null,
    val subtitle: String? = null,
    @SerialName("button_text") val buttonText: String? = null,
    @SerialName("button_url") val buttonUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
) {
    /** Content lines of list blocks ("one item per line"). */
    val lines: List<String> get() = subtitle.orEmpty().lines().map { it.trim() }.filter { it.isNotEmpty() }
}

object BlockKeys {
    const val HOME_HERO = "HOME_HERO"
    const val HOME_CTA = "HOME_CTA"
    const val EVENTS_HERO = "EVENTS_HERO"
    const val SEAT_HERO = "SEAT_HERO"
    const val AUTH_HERO = "AUTH_HERO"
    const val CHECKOUT_NOTICE = "CHECKOUT_NOTICE"
    const val PAYMENT_NOTICE = "PAYMENT_NOTICE"
    const val TICKET_GUIDE = "TICKET_GUIDE"
}

@Serializable
data class NavLink(
    val id: Long,
    val title: String,
    val url: String,
    @SerialName("open_in_new_tab") val openInNewTab: Boolean = false,
)

@Serializable
data class FooterColumn(val id: Long, val title: String, val links: List<NavLink> = emptyList())

@Serializable
data class Navigation(val header: List<NavLink> = emptyList(), val footer: List<FooterColumn> = emptyList())

@Serializable
data class Feature(
    val id: Long,
    val title: String,
    val description: String? = null,
    @SerialName("icon_url") val iconUrl: String? = null,
)

@Serializable
data class HomeSection(
    val id: Long,
    val title: String,
    val subtitle: String? = null,
    @SerialName("item_limit") val itemLimit: Int = 8,
    /** "this-week" | "featured" | "popular" | "latest" */
    val section: String? = null,
    @SerialName("category_slug") val categorySlug: String? = null,
)

@Serializable
data class Banner(
    val id: Long,
    val title: String,
    val subtitle: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("link_url") val linkUrl: String? = null,
    @SerialName("button_text") val buttonText: String? = null,
    @SerialName("event_slug") val eventSlug: String? = null,
    @SerialName("next_session_at") val nextSessionAt: String? = null,
    @SerialName("hall_name") val hallName: String? = null,
    @SerialName("city_name") val cityName: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_cover_url") val categoryCoverUrl: String? = null,
)

@Serializable
data class Category(
    val id: Long,
    val name: String,
    val slug: String,
    val tagline: String? = null,
    @SerialName("icon_url") val iconUrl: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("cover_url") val coverUrl: String? = null,
    val color: String? = null,
    @SerialName("events_count") val eventsCount: Int = 0,
)

@Serializable
data class City(
    val id: Long,
    val name: String,
    val province: String? = null,
    @SerialName("image_url") val imageUrl: String? = null,
    @SerialName("events_count") val eventsCount: Int = 0,
)

@Serializable
data class ContentPage(
    val slug: String,
    val title: String,
    val content: String? = null,
    @SerialName("updated_at") val updatedAt: String? = null,
)
