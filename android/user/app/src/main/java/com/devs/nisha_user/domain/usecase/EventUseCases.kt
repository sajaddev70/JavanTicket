package com.devs.nisha_user.domain.usecase

import com.devs.nisha_user.domain.model.Banner
import com.devs.nisha_user.domain.model.BlockKeys
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.EventFilters
import com.devs.nisha_user.domain.model.EventSession
import com.devs.nisha_user.domain.model.EventSort
import com.devs.nisha_user.domain.model.EventType
import com.devs.nisha_user.domain.model.EventWhen
import com.devs.nisha_user.domain.model.HomeSection
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.Paged
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.repository.ContentRepository
import com.devs.nisha_user.domain.repository.EventRepository
import javax.inject.Inject
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope

/** One slide of the homepage hero: the HOME_HERO block first, then the active banners. */
data class HeroSlide(
    val key: String,
    val kicker: String?,
    val title: String,
    val subtitle: String?,
    val image: String?,
    /** Site path (or external URL) the button opens. */
    val link: String?,
    val button: String?,
)

data class HomeRow(val section: HomeSection, val events: Result<List<PublicEvent>>)

data class HomeFeed(val slides: List<HeroSlide>, val rows: List<HomeRow>)

/**
 * UC-02 Browse the homepage: hero slides (HOME_HERO + banners) and every admin-defined row narrowed to the city
 * picked in the header. A failing row keeps the others (each row has its own result, like on the web).
 */
class GetHomeFeedUseCase @Inject constructor(private val content: ContentRepository, private val events: EventRepository) {
    suspend operator fun invoke(cityId: Long?): HomeFeed = coroutineScope {
        val banners = async { content.banners() }
        val sections = content.homeSections()
        val rows = sections.map { s ->
            async { HomeRow(s, runCatching { events.list(s.section, s.categorySlug, cityId, s.itemLimit) }) }
        }
        HomeFeed(slides(content.pageBlocks.value[BlockKeys.HOME_HERO], banners.await()), rows.awaitAll())
    }

    companion object {
        fun slides(hero: PageBlock?, banners: List<Banner>): List<HeroSlide> = buildList {
            if (!hero?.title.isNullOrBlank()) {
                add(HeroSlide("hero", hero!!.kicker, hero.title!!, hero.subtitle, hero.imageUrl, hero.buttonUrl ?: "/events", hero.buttonText ?: "مشاهده همه رویدادها"))
            }
            banners.forEach { b ->
                add(
                    HeroSlide(
                        key = "banner-${b.id}",
                        kicker = listOfNotNull(b.categoryName, b.cityName).joinToString(" • ").ifBlank { null },
                        title = b.title,
                        subtitle = b.subtitle,
                        image = b.imageUrl ?: b.categoryCoverUrl,
                        // A banner tied to an event always follows the event's current slug.
                        link = b.eventSlug?.let { "/events/$it" } ?: b.linkUrl,
                        button = b.buttonText,
                    ),
                )
            }
        }

        /** Filters of the events screen matching a homepage row ("مشاهده همه"). */
        fun filtersOf(section: HomeSection): EventFilters = EventFilters(
            category = section.categorySlug.orEmpty(),
            type = when (section.section) {
                "featured" -> EventType.FEATURED
                "popular" -> EventType.POPULAR
                else -> EventType.ANY
            },
            whenFilter = if (section.section == "this-week") EventWhen.WEEK else EventWhen.ANY,
            sort = EventSort.NEWEST,
        )
    }
}

/** UC-03 Search and filter events (text, category, city, date, type, price, sort), page by page. */
class SearchEventsUseCase @Inject constructor(private val events: EventRepository) {
    suspend operator fun invoke(filters: EventFilters, page: Int): Paged<PublicEvent> = events.search(filters, page, PAGE_SIZE)

    companion object {
        const val PAGE_SIZE = 12
    }
}

/** Featured events (payment result suggestions). */
class GetFeaturedEventsUseCase @Inject constructor(private val events: EventRepository) {
    suspend operator fun invoke(cityId: Long?, limit: Int = 4): List<PublicEvent> = events.list("featured", null, cityId, limit)
}

/** UC-04 View an event: details, sessions, speakers, gallery and FAQ. */
class GetEventDetailUseCase @Inject constructor(private val events: EventRepository) {
    suspend operator fun invoke(slug: String): EventDetail = events.detail(slug)
}

enum class AvailabilityTone { OK, LOW, NONE }

data class Availability(val label: String, val tone: AvailabilityTone, val bookable: Boolean)

/** Whether a session can be booked and how it is labelled ("موجود", "ظرفیت محدود", "تکمیل ظرفیت", "به‌زودی"). */
fun EventSession.availability(formatCount: (Int) -> String): Availability = when {
    status != "ACTIVE" -> Availability("به‌زودی", AvailabilityTone.NONE, false)
    availableSeats <= 0 -> Availability("تکمیل ظرفیت", AvailabilityTone.NONE, false)
    availableSeats <= maxOf(10.0, capacity * 0.1) -> Availability("ظرفیت محدود (${formatCount(availableSeats)} جای خالی)", AvailabilityTone.LOW, true)
    else -> Availability("موجود", AvailabilityTone.OK, true)
}

/** Lowest ticket price of an event: its sessions' "from" prices, else the event's start price. */
fun EventDetail.lowestPrice(): Double =
    if (sessions.isNotEmpty()) sessions.minOf { it.fromPrice } else minPrice ?: 0.0
