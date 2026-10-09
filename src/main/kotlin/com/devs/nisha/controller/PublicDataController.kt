package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.order.OrderService
import com.devs.nisha.service.seatmap.SeatMapService
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.math.BigDecimal

/** Read-only content for the user site; everything here is managed from the admin panel. */
@RestController
@RequestMapping("/api/v1/public")
class PublicDataController(
    private val crud: JdbcCrud,
    private val seatMaps: SeatMapService,
    private val orders: OrderService,
) {

    @GetMapping("/site-settings")
    fun getSiteSettings(): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        crud.list(
            "SELECT site_name, short_name, tagline, meta_description, logo_url, logo_dark_url, contact_phone, contact_email, " +
                "address, instagram_url, telegram_url, linkedin_url, aparat_url, newsletter_title, newsletter_text, footer_text " +
                "FROM site_settings ORDER BY id LIMIT 1",
        ).firstOrNull() ?: emptyMap(),
    )

    /** Header links plus the footer columns (groups with at least one active link). */
    @GetMapping("/navigation")
    fun getNavigation(): ApiResponse<Map<String, Any?>> {
        val rows = crud.list(
            "SELECT g.id AS group_id, g.title AS group_title, g.placement, l.id, l.title, l.url, l.open_in_new_tab " +
                "FROM link_groups g JOIN links l ON l.group_id = g.id " +
                "WHERE g.active = TRUE AND l.active = TRUE ORDER BY g.sort_order, g.id, l.sort_order, l.id",
        )
        fun link(row: Map<String, Any?>) = mapOf("id" to row["id"], "title" to row["title"], "url" to row["url"], "open_in_new_tab" to row["open_in_new_tab"])

        val (header, footer) = rows.partition { it["placement"] == "HEADER" }
        return ApiResponse.ok(
            mapOf(
                "header" to header.map(::link),
                "footer" to footer.groupBy { it["group_id"] }.values.map { group ->
                    mapOf("id" to group.first()["group_id"], "title" to group.first()["group_title"], "links" to group.map(::link))
                },
            ),
        )
    }

    /** Heroes and call-to-action banners, keyed by block_key (HOME_HERO, HOME_CTA, EVENTS_HERO, SEAT_HERO). */
    @GetMapping("/page-blocks")
    fun getPageBlocks(): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        crud.list("SELECT block_key, kicker, title, subtitle, button_text, button_url, image_url FROM page_blocks WHERE active = TRUE")
            .associateBy { it["block_key"] as String },
    )

    @GetMapping("/features")
    fun getFeatures(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list("SELECT id, title, description, icon_url FROM site_features WHERE active = TRUE ORDER BY sort_order, id"),
    )

    /** Event rows of the homepage; `section` / `category_slug` are the query to send to /events. */
    @GetMapping("/home-sections")
    fun getHomeSections(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT hs.id, hs.title, hs.subtitle, hs.item_limit, " +
                "CASE hs.section_type WHEN 'CATEGORY' THEN NULL ELSE LOWER(REPLACE(hs.section_type, '_', '-')) END AS section, " +
                "c.slug AS category_slug " +
                "FROM home_sections hs LEFT JOIN categories c ON c.id = hs.category_id " +
                "WHERE hs.active = TRUE AND (hs.section_type <> 'CATEGORY' OR c.active = TRUE) ORDER BY hs.sort_order, hs.id",
        ),
    )

    @GetMapping("/banners")
    fun getBanners(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT b.id, b.title, b.subtitle, b.image_url, b.link_url, b.button_text, b.sort_order, b.event_id, " +
                "e.slug AS event_slug, e.start_date, e.end_date, h.name AS hall_name, ci.name AS city_name, " +
                "cat.name AS category_name, cat.slug AS category_slug, cat.cover_url AS category_cover_url, ns.next_session_at " +
                "FROM banners b " +
                "LEFT JOIN events e ON e.id = b.event_id " +
                "LEFT JOIN halls h ON h.id = e.hall_id " +
                "LEFT JOIN cities ci ON ci.id = e.city_id " +
                "LEFT JOIN categories cat ON cat.id = e.category_id " +
                NEXT_SESSION_JOIN +
                "WHERE b.active = TRUE ORDER BY b.sort_order ASC, b.id",
        ),
    )

    @GetMapping("/cities")
    fun getCities(): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(crud.list("SELECT id, name, province FROM cities WHERE active = TRUE ORDER BY id"))

    @GetMapping("/categories")
    fun getCategories(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT c.id, c.name, c.slug, c.tagline, c.icon_url, c.image_url, c.cover_url, c.color, " +
                "(SELECT COUNT(*) FROM events e WHERE e.category_id = c.id AND e.status = 'PUBLISHED') AS events_count " +
                "FROM categories c WHERE c.active = TRUE ORDER BY c.sort_order, c.id",
        ),
    )

    /**
     * Published events for the homepage and listings.
     * section: "this-week" (has a session or runs within the next 7 days), "featured", "popular" or "latest".
     */
    @GetMapping("/events")
    fun getEvents(
        @RequestParam(required = false) section: String?,
        @RequestParam(required = false) cityId: Long?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(defaultValue = "20") limit: Int,
    ): ApiResponse<List<Map<String, Any?>>> {
        val sql = StringBuilder(EVENT_SELECT + "WHERE e.status = 'PUBLISHED'")
        val params = mutableMapOf<String, Any?>()

        when (section) {
            "this-week" -> sql.append(
                " AND (ns.next_session_at < LOCALTIMESTAMP + INTERVAL '7 days' " +
                    "OR (e.start_date < LOCALTIMESTAMP + INTERVAL '7 days' AND COALESCE(e.end_date, e.start_date) >= CURRENT_DATE))",
            )
            "featured" -> sql.append(" AND e.featured = TRUE")
            "popular" -> sql.append(" AND e.popular = TRUE")
        }
        if (cityId != null) {
            sql.append(" AND e.city_id = :cityId")
            params["cityId"] = cityId
        }
        if (!category.isNullOrBlank()) {
            sql.append(" AND c.slug = :category")
            params["category"] = category
        }
        if (!q.isNullOrBlank()) {
            sql.append(" AND (e.title ILIKE :q OR ci.name ILIKE :q OR h.name ILIKE :q OR c.name ILIKE :q)")
            params["q"] = "%${q.trim()}%"
        }
        sql.append(
            if (section == "latest") " ORDER BY e.created_at DESC, e.id DESC LIMIT :limit"
            else " ORDER BY COALESCE(ns.next_session_at, e.start_date) ASC NULLS LAST, e.id DESC LIMIT :limit",
        )
        params["limit"] = limit.coerceIn(1, 100)

        return ApiResponse.ok(crud.list(sql.toString(), params))
    }

    /**
     * Events page: filters plus paging. when: today, week, month; sort: newest, soonest, price.
     * Returns { items, total }.
     */
    @GetMapping("/events/search")
    fun searchEvents(
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) cityId: Long?,
        @RequestParam(required = false) category: String?,
        @RequestParam(required = false) `when`: String?,
        @RequestParam(defaultValue = "newest") sort: String,
        @RequestParam(required = false) section: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "12") size: Int,
    ): ApiResponse<Map<String, Any?>> {
        val where = StringBuilder("WHERE e.status = 'PUBLISHED' AND COALESCE(e.end_date, ls.last_end, LOCALTIMESTAMP) >= CURRENT_DATE")
        val params = mutableMapOf<String, Any?>()
        if (cityId != null) { where.append(" AND e.city_id = :cityId"); params["cityId"] = cityId }
        if (!category.isNullOrBlank()) { where.append(" AND c.slug = :category"); params["category"] = category }
        when (section) {
            "featured" -> where.append(" AND e.featured = TRUE")
            "popular" -> where.append(" AND e.popular = TRUE")
        }
        if (!q.isNullOrBlank()) {
            where.append(" AND (e.title ILIKE :q OR e.subtitle ILIKE :q OR e.organizer_name ILIKE :q OR ci.name ILIKE :q OR h.name ILIKE :q OR c.name ILIKE :q)")
            params["q"] = "%${q.trim()}%"
        }
        val horizon = when (`when`) {
            "today" -> "CURRENT_DATE + 1"
            "week" -> "CURRENT_DATE + 7"
            "month" -> "CURRENT_DATE + 30"
            else -> null
        }
        if (horizon != null) {
            where.append(" AND COALESCE(ns.next_session_at, e.start_date) < $horizon")
        }
        val order = when (sort) {
            "soonest" -> "COALESCE(ns.next_session_at, e.start_date) ASC NULLS LAST, e.id DESC"
            "price" -> "e.min_price ASC, e.id DESC"
            else -> "e.created_at DESC, e.id DESC"
        }
        val from = EVENT_FROM + LAST_SESSION_JOIN + where
        val total = crud.jdbc.queryForObject("SELECT COUNT(*) $from", params, Long::class.java) ?: 0
        val pageSize = size.coerceIn(1, 48)
        val items = crud.list(
            "$EVENT_COLUMNS $from ORDER BY $order LIMIT :limit OFFSET :offset",
            params + mapOf("limit" to pageSize, "offset" to (page.coerceAtLeast(1) - 1) * pageSize),
        )
        return ApiResponse.ok(mapOf("items" to items, "total" to total, "page" to page, "size" to pageSize))
    }

    @GetMapping("/events/{slug}")
    fun getEvent(@PathVariable slug: String): ApiResponse<Map<String, Any?>> {
        val event = crud.list(EVENT_SELECT + "WHERE e.status IN ('PUBLISHED', 'CANCELLED') AND e.slug = :slug", mapOf("slug" to slug)).firstOrNull()
            ?: throw BusinessException("رویداد موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        val id = mapOf("id" to event["id"])
        val sessions = crud.list(
            "SELECT s.id, s.title, s.start_time, s.end_time, s.price, s.capacity, s.reserved_seats, s.status, h.name AS hall_name, ci.name AS city_name, " +
                "COALESCE((SELECT MIN(sp.price) FROM session_prices sp WHERE sp.session_id = s.id), s.price) AS from_price, " +
                "EXISTS (SELECT 1 FROM seats st WHERE st.hall_id = s.hall_id) AS has_seat_map " +
                "FROM sessions s JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE s.event_id = :id AND s.status IN ('ACTIVE', 'SCHEDULED') AND s.end_time >= LOCALTIMESTAMP ORDER BY s.start_time",
            id,
        )
        val span = crud.list("SELECT MIN(start_time) AS first_start, MAX(end_time) AS last_end FROM sessions WHERE event_id = :id AND status <> 'CANCELLED'", id).first()
        return ApiResponse.ok(
            event + span + mapOf(
                "sessions" to sessions,
                "stats" to crud.list("SELECT value, label, icon_url, color FROM event_stats WHERE event_id = :id ORDER BY sort_order, id", id),
                "topics" to crud.list("SELECT title, icon_url, color FROM event_topics WHERE event_id = :id ORDER BY sort_order, id", id),
                "speakers" to crud.list(
                    "SELECT full_name, job_title, organization, photo_url, keynote FROM event_speakers WHERE event_id = :id ORDER BY keynote DESC, sort_order, id", id,
                ),
                "gallery" to crud.list("SELECT image_url, caption FROM event_gallery WHERE event_id = :id ORDER BY sort_order, id", id),
                "faqs" to crud.list("SELECT question, answer FROM event_faqs WHERE event_id = :id ORDER BY sort_order, id", id),
            ),
        )
    }

    /** Seat selection screen: session, prices per tier and the state of every seat (AVAILABLE or taken). */
    @GetMapping("/sessions/{id}/seat-map")
    fun getSeatMap(@PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val session = seatMaps.sessionInfo(id)
        val hallId = (session["hall_id"] as Number).toLong()
        val seats = seatMaps.seats(hallId, id).map { seat ->
            val status = seat["status"]
            seat + ("status" to if (status == "AVAILABLE") "AVAILABLE" else if (status == "DISABLED") "DISABLED" else "TAKEN")
        }
        return ApiResponse.ok(mapOf("session" to session, "sections" to seatMaps.sections(hallId), "seats" to seats))
    }

    @PostMapping("/discounts/validate")
    fun validateDiscount(@Valid @RequestBody req: DiscountCheckRequest): ApiResponse<Map<String, Any?>> {
        val (code, discount) = orders.discountFor(req.code!!, req.amount!!)
        return ApiResponse.ok("کد تخفیف اعمال شد.", mapOf("code" to code, "discount" to discount, "total" to req.amount - discount))
    }

    @GetMapping("/pages/{slug}")
    fun getPage(@PathVariable slug: String): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        crud.list("SELECT slug, title, content, updated_at FROM pages WHERE slug = :slug AND active = TRUE", mapOf("slug" to slug)).firstOrNull()
            ?: throw BusinessException("صفحه موردنظر پیدا نشد.", HttpStatus.NOT_FOUND),
    )

    @PostMapping("/newsletter")
    fun subscribe(@Valid @RequestBody req: NewsletterRequest): ApiResponse<Unit> {
        crud.jdbc.update(
            "INSERT INTO newsletter_subscribers (email) VALUES (:email) ON CONFLICT (email) DO NOTHING",
            mapOf("email" to req.email!!.trim().lowercase()),
        )
        return ApiResponse.ok("عضویت شما در خبرنامه ثبت شد.", null)
    }

    private companion object {
        const val NEXT_SESSION_JOIN =
            "LEFT JOIN LATERAL (SELECT MIN(s.start_time) AS next_session_at FROM sessions s " +
                "WHERE s.event_id = e.id AND s.status = 'ACTIVE' AND s.start_time >= LOCALTIMESTAMP) ns ON TRUE "

        const val EVENT_COLUMNS =
            "SELECT e.id, e.title, e.slug, e.subtitle, e.description, e.notice, e.banner_url, e.organizer_name, e.website_url, e.min_price, " +
                "e.featured, e.popular, e.status, e.start_date, e.end_date, c.name AS category_name, c.slug AS category_slug, " +
                "c.color AS category_color, c.icon_url AS category_icon_url, c.cover_url AS category_cover_url, ci.id AS city_id, " +
                "ci.name AS city_name, h.name AS hall_name, h.venue_name, h.address AS hall_address, ns.next_session_at"

        const val EVENT_FROM =
            " FROM events e " +
                "LEFT JOIN categories c ON e.category_id = c.id " +
                "LEFT JOIN cities ci ON e.city_id = ci.id " +
                "LEFT JOIN halls h ON e.hall_id = h.id " +
                NEXT_SESSION_JOIN

        const val LAST_SESSION_JOIN =
            "LEFT JOIN LATERAL (SELECT MAX(s.end_time) AS last_end FROM sessions s WHERE s.event_id = e.id AND s.status <> 'CANCELLED') ls ON TRUE "

        const val EVENT_SELECT = EVENT_COLUMNS + EVENT_FROM
    }
}

data class DiscountCheckRequest(
    @NotBlank(message = "کد تخفیف را وارد کنید.") val code: String?,
    @NotNull @DecimalMin(value = "0") val amount: BigDecimal?,
)

data class NewsletterRequest(
    @NotBlank(message = "ایمیل خود را وارد کنید.")
    @Email(message = "ایمیل واردشده معتبر نیست.")
    @Size(max = 150)
    val email: String?,
)
