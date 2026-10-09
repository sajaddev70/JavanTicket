package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.DecimalMax
import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.Instant

/** Events, sessions, categories, cities and halls. Request and response fields are snake_case. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminCatalogController(private val crud: JdbcCrud) {

    // ---------- Events ----------

    @GetMapping("/events")
    fun events(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT e.*, c.name AS category_name, c.color AS category_color, ci.name AS city_name, h.name AS hall_name, " +
                "agg.sessions_count, agg.capacity, agg.sold, agg.next_session_at, " +
                "COALESCE(e.start_date, agg.first_start) AS starts_at, COALESCE(e.end_date, agg.last_end) AS ends_at, " +
                "CASE WHEN e.status = 'CANCELLED' THEN 'CANCELLED' " +
                "     WHEN e.status = 'DRAFT' THEN 'SCHEDULED' " +
                "     WHEN e.status = 'ARCHIVED' OR COALESCE(e.end_date, agg.last_end) < LOCALTIMESTAMP THEN 'FINISHED' " +
                "     WHEN COALESCE(e.start_date, agg.first_start) <= LOCALTIMESTAMP THEN 'RUNNING' " +
                "     ELSE 'ON_SALE' END AS display_status " +
                "FROM events e " +
                "LEFT JOIN categories c ON e.category_id = c.id " +
                "LEFT JOIN cities ci ON e.city_id = ci.id " +
                "LEFT JOIN halls h ON e.hall_id = h.id " +
                "LEFT JOIN LATERAL (SELECT COUNT(*) AS sessions_count, COALESCE(SUM(s.capacity), 0) AS capacity, " +
                "  COALESCE(SUM(s.reserved_seats), 0) AS sold, MIN(s.start_time) AS first_start, MAX(s.end_time) AS last_end, " +
                "  MIN(s.start_time) FILTER (WHERE s.status = 'ACTIVE' AND s.start_time >= LOCALTIMESTAMP) AS next_session_at " +
                "  FROM sessions s WHERE s.event_id = e.id AND s.status <> 'CANCELLED') agg ON TRUE " +
                "ORDER BY e.id DESC",
        ),
    )

    @PostMapping("/events")
    fun createEvent(@Valid @RequestBody req: EventRequest): ApiResponse<Long> {
        checkHallInCity(req.hallId, req.cityId)
        return ApiResponse.ok("رویداد با موفقیت ثبت شد.", crud.insert("events", req.columns()))
    }

    @PutMapping("/events/{id}")
    fun updateEvent(@PathVariable id: Long, @Valid @RequestBody req: EventRequest): ApiResponse<Unit> {
        checkHallInCity(req.hallId, req.cityId)
        crud.update("events", id, req.columns())
        return ApiResponse.ok("رویداد با موفقیت ویرایش شد.", null)
    }

    @DeleteMapping("/events/{id}")
    fun deleteEvent(@PathVariable id: Long): ApiResponse<Unit> {
        if (crud.exists("SELECT 1 FROM tickets t JOIN sessions s ON s.id = t.session_id WHERE s.event_id = :id", mapOf("id" to id))) {
            throw BusinessException("برای این رویداد بلیت فروخته شده است؛ به‌جای حذف، وضعیت آن را «لغو» یا «بایگانی» کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("events", id)
        return ApiResponse.ok("رویداد حذف شد.", null)
    }

    // ---------- Sessions ----------

    /** All sessions, optionally within [from, to); used by the sessions table and the rotation calendar. */
    @GetMapping("/sessions")
    fun allSessions(@RequestParam(required = false) from: Instant?, @RequestParam(required = false) to: Instant?): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(
            crud.list(
                SESSION_SELECT +
                    "WHERE (CAST(:from AS TIMESTAMP) IS NULL OR s.start_time >= CAST(:from AS TIMESTAMP)) " +
                    "AND (CAST(:to AS TIMESTAMP) IS NULL OR s.start_time < CAST(:to AS TIMESTAMP)) ORDER BY s.start_time",
                mapOf("from" to from?.let(java.sql.Timestamp::from), "to" to to?.let(java.sql.Timestamp::from)),
            ),
        )

    @GetMapping("/sessions/summary")
    fun sessionsSummary(): ApiResponse<Map<String, Any?>> {
        fun one(sql: String) = (crud.jdbc.queryForObject(sql, emptyMap<String, Any>(), Number::class.java) ?: 0).toDouble()
        val thisMonth = "DATE_TRUNC('month', CURRENT_DATE)"
        // Month to date, compared with the same span of the previous month.
        val lastMonth = "DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month'"
        val lastMonthToDate = "LOCALTIMESTAMP - INTERVAL '1 month'"
        val sales = one("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'PAID' AND created_at >= $thisMonth")
        val salesPrev = one("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'PAID' AND created_at >= $lastMonth AND created_at < $lastMonthToDate")
        val active = one("SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE' AND end_time >= LOCALTIMESTAMP")
        val activePrev = one("SELECT COUNT(*) FROM sessions WHERE status = 'ACTIVE' AND created_at < $thisMonth AND end_time >= $thisMonth")
        val tickets = one("SELECT COUNT(*) FROM tickets WHERE status <> 'CANCELLED' AND created_at >= $thisMonth")
        val ticketsPrev = one("SELECT COUNT(*) FROM tickets WHERE status <> 'CANCELLED' AND created_at >= $lastMonth AND created_at < $lastMonthToDate")
        val capacity = one("SELECT COALESCE(SUM(capacity), 0) FROM sessions WHERE status IN ('ACTIVE', 'SCHEDULED') AND end_time >= LOCALTIMESTAMP")
        val capacityPrev = one("SELECT COALESCE(SUM(capacity), 0) FROM sessions WHERE status IN ('ACTIVE', 'SCHEDULED') AND created_at < $thisMonth AND end_time >= $thisMonth")
        return ApiResponse.ok(
            linkedMapOf(
                "sales" to metric(sales, salesPrev),
                "activeSessions" to metric(active, activePrev),
                "ticketsSold" to metric(tickets, ticketsPrev),
                "capacity" to metric(capacity, capacityPrev),
            ),
        )
    }

    @GetMapping("/events/{eventId}/sessions")
    fun sessions(@PathVariable eventId: Long): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(crud.list(SESSION_SELECT + "WHERE s.event_id = :eventId ORDER BY s.start_time", mapOf("eventId" to eventId)))

    @PostMapping("/events/{eventId}/sessions")
    fun createSession(@PathVariable eventId: Long, @Valid @RequestBody req: SessionRequest): ApiResponse<Long> {
        req.validateTimes()
        return ApiResponse.ok("سانس با موفقیت ثبت شد.", crud.insert("sessions", req.columns() + ("event_id" to eventId)))
    }

    /** Same as above with the event chosen in the form (sessions screen). */
    @PostMapping("/sessions")
    fun createSessionForEvent(@Valid @RequestBody req: SessionRequest): ApiResponse<Long> {
        val eventId = req.eventId ?: throw BusinessException("رویداد سانس را انتخاب کنید.")
        return createSession(eventId, req)
    }

    @PutMapping("/sessions/{id}")
    fun updateSession(@PathVariable id: Long, @Valid @RequestBody req: SessionRequest): ApiResponse<Unit> {
        req.validateTimes()
        crud.update("sessions", id, req.columns() + listOfNotNull(req.eventId?.let { "event_id" to it }))
        return ApiResponse.ok("سانس با موفقیت ویرایش شد.", null)
    }

    @DeleteMapping("/sessions/{id}")
    fun deleteSession(@PathVariable id: Long): ApiResponse<Unit> {
        if (crud.exists("SELECT 1 FROM tickets WHERE session_id = :id", mapOf("id" to id))) {
            throw BusinessException("برای این سانس بلیت فروخته شده است؛ به‌جای حذف، آن را «لغو» کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("sessions", id)
        return ApiResponse.ok("سانس حذف شد.", null)
    }

    @GetMapping("/sessions/{id}/prices")
    fun sessionPrices(@PathVariable id: Long): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT t.code, t.name, t.color, sp.price FROM seat_tiers t " +
                "LEFT JOIN session_prices sp ON sp.tier_code = t.code AND sp.session_id = :id ORDER BY t.sort_order",
            mapOf("id" to id),
        ),
    )

    /** Body: { "VIP": 1500000, "GOLD": null, ... } — null removes the tier price (falls back to the session price). */
    @PutMapping("/sessions/{id}/prices")
    @Transactional
    fun updateSessionPrices(@PathVariable id: Long, @RequestBody prices: Map<String, BigDecimal?>): ApiResponse<Unit> {
        if (!crud.exists("SELECT 1 FROM sessions WHERE id = :id", mapOf("id" to id))) throw JdbcCrud.notFound()
        crud.jdbc.update("DELETE FROM session_prices WHERE session_id = :id", mapOf("id" to id))
        prices.filterValues { it != null }.forEach { (tier, price) ->
            if (price!! < BigDecimal.ZERO) throw BusinessException("قیمت نمی‌تواند منفی باشد.")
            crud.jdbc.update(
                "INSERT INTO session_prices (session_id, tier_code, price) VALUES (:id, :tier, :price)",
                mapOf("id" to id, "tier" to tier, "price" to price),
            )
        }
        return ApiResponse.ok("قیمت‌های سانس ذخیره شد.", null)
    }

    // ---------- Categories ----------

    @GetMapping("/categories")
    fun categories(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT c.*, (SELECT COUNT(*) FROM events e WHERE e.category_id = c.id) AS events_count " +
                "FROM categories c ORDER BY c.sort_order, c.id",
        ),
    )

    @PostMapping("/categories")
    fun createCategory(@Valid @RequestBody req: CategoryRequest): ApiResponse<Long> =
        ApiResponse.ok("دسته‌بندی ثبت شد.", crud.insert("categories", req.columns()))

    @PutMapping("/categories/{id}")
    fun updateCategory(@PathVariable id: Long, @Valid @RequestBody req: CategoryRequest): ApiResponse<Unit> {
        crud.update("categories", id, req.columns())
        return ApiResponse.ok("دسته‌بندی ویرایش شد.", null)
    }

    @DeleteMapping("/categories/{id}")
    fun deleteCategory(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("categories", id)
        return ApiResponse.ok("دسته‌بندی حذف شد.", null)
    }

    // ---------- Cities ----------

    @GetMapping("/cities")
    fun cities(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT c.*, (SELECT COUNT(*) FROM halls h WHERE h.city_id = c.id) AS halls_count, " +
                "(SELECT COALESCE(SUM(h.capacity), 0) FROM halls h WHERE h.city_id = c.id AND h.status = 'ACTIVE') AS capacity, " +
                "(SELECT COUNT(*) FROM events e WHERE e.city_id = c.id) AS events_count, " +
                "(SELECT COUNT(*) FROM events e WHERE e.city_id = c.id AND e.status = 'PUBLISHED' " +
                "  AND COALESCE(e.end_date, (SELECT MAX(s.end_time) FROM sessions s WHERE s.event_id = e.id), LOCALTIMESTAMP) >= LOCALTIMESTAMP) AS active_events " +
                "FROM cities c ORDER BY c.id",
        ),
    )

    /** Stat cards of the cities screen, each compared with the start of the current month. */
    @GetMapping("/cities/summary")
    fun citiesSummary(): ApiResponse<Map<String, Any?>> {
        fun one(sql: String) = (crud.jdbc.queryForObject(sql, emptyMap<String, Any>(), Number::class.java) ?: 0).toDouble()
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        val activeEvents =
            "FROM events e WHERE e.status = 'PUBLISHED' AND COALESCE(e.end_date, (SELECT MAX(s.end_time) FROM sessions s WHERE s.event_id = e.id), LOCALTIMESTAMP) >= "
        return ApiResponse.ok(
            linkedMapOf(
                "halls" to metric(one("SELECT COUNT(*) FROM halls"), one("SELECT COUNT(*) FROM halls WHERE created_at < $monthStart")),
                "capacity" to metric(
                    one("SELECT COALESCE(SUM(capacity), 0) FROM halls WHERE status = 'ACTIVE'"),
                    one("SELECT COALESCE(SUM(capacity), 0) FROM halls WHERE status = 'ACTIVE' AND created_at < $monthStart"),
                ),
                "activeEvents" to metric(
                    one("SELECT COUNT(*) $activeEvents LOCALTIMESTAMP"),
                    one("SELECT COUNT(*) $activeEvents $monthStart AND e.created_at < $monthStart"),
                ),
                "activeCities" to metric(
                    one("SELECT COUNT(*) FROM cities WHERE status = 'ACTIVE'"),
                    one("SELECT COUNT(*) FROM cities WHERE status = 'ACTIVE' AND created_at < $monthStart"),
                ),
                "totalCities" to one("SELECT COUNT(*) FROM cities"),
            ),
        )
    }

    @PostMapping("/cities")
    fun createCity(@Valid @RequestBody req: CityRequest): ApiResponse<Long> =
        ApiResponse.ok("شهر ثبت شد.", crud.insert("cities", req.columns()))

    @PutMapping("/cities/{id}")
    fun updateCity(@PathVariable id: Long, @Valid @RequestBody req: CityRequest): ApiResponse<Unit> {
        crud.update("cities", id, req.columns())
        return ApiResponse.ok("شهر ویرایش شد.", null)
    }

    @DeleteMapping("/cities/{id}")
    fun deleteCity(@PathVariable id: Long): ApiResponse<Unit> {
        val params = mapOf("id" to id)
        if (crud.exists("SELECT 1 FROM halls WHERE city_id = :id", params) || crud.exists("SELECT 1 FROM events WHERE city_id = :id", params)) {
            throw BusinessException("این شهر سالن یا رویداد ثبت‌شده دارد؛ به‌جای حذف، آن را غیرفعال کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("cities", id)
        return ApiResponse.ok("شهر حذف شد.", null)
    }

    // ---------- Halls ----------

    @GetMapping("/halls")
    fun halls(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT h.*, c.name AS city_name, (SELECT COUNT(*) FROM sessions s WHERE s.hall_id = h.id) AS sessions_count, " +
                "(SELECT COUNT(*) FROM seats st WHERE st.hall_id = h.id) AS seats_count " +
                "FROM halls h JOIN cities c ON c.id = h.city_id ORDER BY h.id",
        ),
    )

    @PostMapping("/halls")
    fun createHall(@Valid @RequestBody req: HallRequest): ApiResponse<Long> =
        ApiResponse.ok("سالن ثبت شد.", crud.insert("halls", req.columns()))

    @PutMapping("/halls/{id}")
    fun updateHall(@PathVariable id: Long, @Valid @RequestBody req: HallRequest): ApiResponse<Unit> {
        crud.update("halls", id, req.columns())
        return ApiResponse.ok("سالن ویرایش شد.", null)
    }

    @DeleteMapping("/halls/{id}")
    fun deleteHall(@PathVariable id: Long): ApiResponse<Unit> {
        if (crud.exists("SELECT 1 FROM sessions WHERE hall_id = :id", mapOf("id" to id))) {
            throw BusinessException("برای این سالن سانس ثبت شده است؛ به‌جای حذف، آن را غیرفعال کنید.", HttpStatus.CONFLICT)
        }
        crud.delete("halls", id)
        return ApiResponse.ok("سالن حذف شد.", null)
    }

    private fun checkHallInCity(hallId: Long?, cityId: Long?) {
        if (hallId == null || cityId == null) return
        if (!crud.exists("SELECT 1 FROM halls WHERE id = :hallId AND city_id = :cityId", mapOf("hallId" to hallId, "cityId" to cityId))) {
            throw BusinessException("سالن انتخاب‌شده در شهر انتخاب‌شده قرار ندارد.")
        }
    }

    private companion object {
        const val SESSION_SELECT =
            "SELECT s.*, e.title AS event_title, e.banner_url AS event_banner_url, e.category_id, c.name AS category_name, c.color AS category_color, " +
                "h.name AS hall_name, ci.id AS city_id, ci.name AS city_name, " +
                "(SELECT COUNT(*) FROM seats st WHERE st.hall_id = s.hall_id) AS seats_count, " +
                "CASE WHEN s.status = 'CANCELLED' THEN 'CANCELLED' " +
                "     WHEN s.status = 'COMPLETED' OR s.end_time < LOCALTIMESTAMP THEN 'FINISHED' " +
                "     WHEN s.status = 'SCHEDULED' THEN 'SCHEDULED' " +
                "     WHEN s.start_time <= LOCALTIMESTAMP THEN 'RUNNING' " +
                "     WHEN s.reserved_seats >= s.capacity THEN 'SOLD_OUT' " +
                "     WHEN s.reserved_seats >= s.capacity * 0.9 THEN 'ALMOST_FULL' " +
                "     WHEN s.reserved_seats >= s.capacity * 0.75 THEN 'LIMITED' " +
                "     ELSE 'ON_SALE' END AS display_status " +
                "FROM sessions s JOIN events e ON e.id = s.event_id JOIN halls h ON h.id = s.hall_id " +
                "JOIN cities ci ON ci.id = h.city_id LEFT JOIN categories c ON c.id = e.category_id "

        fun metric(value: Double, previous: Double): Map<String, Double?> = linkedMapOf(
            "value" to value,
            "previous" to previous,
            "changePercent" to if (previous > 0) BigDecimal.valueOf((value - previous) * 100 / previous).setScale(1, RoundingMode.HALF_UP).toDouble() else null,
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class EventRequest(
    @field:NotBlank(message = "عنوان رویداد الزامی است.")
    @field:Size(max = 200, message = "عنوان رویداد حداکثر ۲۰۰ کاراکتر است.")
    val title: String?,
    @field:NotBlank(message = "نامک (آدرس) رویداد الزامی است.")
    @field:Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE)
    val slug: String?,
    @field:Size(max = 255) val subtitle: String? = null,
    val categoryId: Long? = null,
    val cityId: Long? = null,
    val hallId: Long? = null,
    val description: String? = null,
    val notice: String? = null,
    @field:Size(max = 500) val bannerUrl: String? = null,
    @field:Size(max = 150) val organizerName: String? = null,
    @field:Size(max = 255) val websiteUrl: String? = null,
    @field:DecimalMin(value = "0", message = "قیمت نمی‌تواند منفی باشد.") val minPrice: BigDecimal? = null,
    @field:Pattern(regexp = "DRAFT|PUBLISHED|CANCELLED|ARCHIVED", message = "وضعیت رویداد معتبر نیست.") val status: String? = "PUBLISHED",
    val featured: Boolean? = false,
    val popular: Boolean? = false,
    val startDate: Instant? = null,
    val endDate: Instant? = null,
) {
    fun columns() = linkedMapOf(
        "title" to title!!.trim(), "slug" to slug!!.trim(), "subtitle" to subtitle.blankToNull(), "category_id" to categoryId,
        "city_id" to cityId, "hall_id" to hallId, "description" to description?.trim(), "notice" to notice.blankToNull(),
        "banner_url" to bannerUrl.blankToNull(), "organizer_name" to organizerName?.trim(), "website_url" to websiteUrl.blankToNull(),
        "min_price" to (minPrice ?: BigDecimal.ZERO), "status" to (status ?: "PUBLISHED"), "featured" to (featured ?: false),
        "popular" to (popular ?: false), "start_date" to startDate, "end_date" to endDate,
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SessionRequest(
    val eventId: Long? = null,
    @field:NotNull(message = "سالن سانس را انتخاب کنید.") val hallId: Long?,
    @field:Size(max = 200) val title: String? = null,
    @field:NotNull(message = "زمان شروع سانس الزامی است.") val startTime: Instant?,
    @field:NotNull(message = "زمان پایان سانس الزامی است.") val endTime: Instant?,
    @field:NotNull(message = "ظرفیت سانس الزامی است.") @field:Min(value = 1, message = "ظرفیت باید حداقل ۱ باشد.") val capacity: Int?,
    @field:Min(value = 0, message = "تعداد رزرو نمی‌تواند منفی باشد.") val reservedSeats: Int? = 0,
    @field:NotNull(message = "قیمت بلیت الزامی است.") @field:DecimalMin(value = "0", message = "قیمت نمی‌تواند منفی باشد.") val price: BigDecimal?,
    @field:Pattern(regexp = "SCHEDULED|ACTIVE|CANCELLED|COMPLETED", message = "وضعیت سانس معتبر نیست.") val status: String? = "ACTIVE",
) {
    fun validateTimes() {
        if (!endTime!!.isAfter(startTime)) throw BusinessException("زمان پایان سانس باید بعد از زمان شروع باشد.")
        if ((reservedSeats ?: 0) > capacity!!) throw BusinessException("تعداد رزرو نمی‌تواند از ظرفیت بیشتر باشد.")
    }

    fun columns() = linkedMapOf(
        "hall_id" to hallId, "title" to title.blankToNull(), "start_time" to startTime, "end_time" to endTime, "capacity" to capacity,
        "reserved_seats" to (reservedSeats ?: 0), "price" to price, "status" to (status ?: "ACTIVE"),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CategoryRequest(
    @field:NotBlank(message = "نام دسته‌بندی الزامی است.") @field:Size(max = 100) val name: String?,
    @field:NotBlank(message = "نامک دسته‌بندی الزامی است.") @field:Pattern(regexp = SLUG_PATTERN, message = SLUG_MESSAGE) val slug: String?,
    @field:Size(max = 150) val tagline: String? = null,
    @field:Size(max = 500) val iconUrl: String? = null,
    @field:Size(max = 500) val imageUrl: String? = null,
    @field:Size(max = 500) val coverUrl: String? = null,
    @field:Pattern(regexp = "^#[0-9a-fA-F]{6}$", message = "رنگ باید به شکل #RRGGBB باشد.") val color: String? = null,
    val sortOrder: Int? = 0,
    val active: Boolean? = true,
) {
    fun columns() = linkedMapOf(
        "name" to name!!.trim(), "slug" to slug!!.trim(), "tagline" to tagline.blankToNull(), "icon_url" to iconUrl.blankToNull(),
        "image_url" to imageUrl.blankToNull(), "cover_url" to coverUrl.blankToNull(), "color" to color.blankToNull(),
        "sort_order" to (sortOrder ?: 0), "active" to (active ?: true),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CityRequest(
    @field:NotBlank(message = "نام شهر الزامی است.") @field:Size(max = 100) val name: String?,
    @field:NotBlank(message = "نام استان الزامی است.") @field:Size(max = 100) val province: String?,
    @field:Size(max = 100) val managerName: String? = null,
    @field:Size(max = 500) val imageUrl: String? = null,
    @field:DecimalMin(value = "-90") @field:DecimalMax(value = "90") val latitude: BigDecimal? = null,
    @field:DecimalMin(value = "-180") @field:DecimalMax(value = "180") val longitude: BigDecimal? = null,
    @field:Pattern(regexp = "ACTIVE|PLANNED|INACTIVE", message = "وضعیت شهر معتبر نیست.") val status: String? = "ACTIVE",
) {
    fun columns() = linkedMapOf(
        "name" to name!!.trim(), "province" to province!!.trim(), "manager_name" to managerName.blankToNull(), "image_url" to imageUrl.blankToNull(),
        "latitude" to latitude, "longitude" to longitude, "status" to (status ?: "ACTIVE"), "active" to ((status ?: "ACTIVE") != "INACTIVE"),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class HallRequest(
    @field:NotNull(message = "شهر سالن را انتخاب کنید.") val cityId: Long?,
    @field:NotBlank(message = "نام سالن الزامی است.") @field:Size(max = 150) val name: String?,
    @field:Size(max = 150) val venueName: String? = null,
    val address: String? = null,
    @field:Size(max = 500) val imageUrl: String? = null,
    @field:Pattern(regexp = "CONFERENCE|EXHIBITION|CONCERT|EDUCATION|THEATER", message = "نوع نمایش معتبر نیست.") val hallType: String? = "CONFERENCE",
    @field:NotNull(message = "ظرفیت سالن الزامی است.") @field:Min(value = 0, message = "ظرفیت نمی‌تواند منفی باشد.") val capacity: Int?,
    @field:Min(value = 0, message = "تعداد گیت نمی‌تواند منفی باشد.") val gatesCount: Int? = 1,
    @field:Pattern(regexp = "ACTIVE|INACTIVE|EQUIPPING|UNDER_CONSTRUCTION", message = "وضعیت سالن معتبر نیست.") val status: String? = "ACTIVE",
) {
    fun columns() = linkedMapOf(
        "city_id" to cityId, "name" to name!!.trim(), "venue_name" to venueName.blankToNull(), "address" to address.blankToNull(),
        "image_url" to imageUrl.blankToNull(), "hall_type" to (hallType ?: "CONFERENCE"), "capacity" to capacity, "gates_count" to (gatesCount ?: 1),
        "status" to (status ?: "ACTIVE"), "active" to ((status ?: "ACTIVE") == "ACTIVE"),
    )
}

/** Any URL-safe text without spaces, so Persian slugs keep working. */
const val SLUG_PATTERN = "^[^\\s/?#%]+$"
const val SLUG_MESSAGE = "نامک نباید فاصله یا کاراکترهای / ? # % داشته باشد."

fun String?.blankToNull(): String? = this?.trim()?.takeIf { it.isNotEmpty() }
