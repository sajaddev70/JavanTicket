package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.security.AdminAccess
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SqlFilters
import com.devs.nisha.support.likePattern
import com.devs.nisha.support.metric
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
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
import java.time.Instant
import java.time.LocalDate
import java.time.temporal.ChronoUnit

/** CRM (site customers with their purchase profile, and the follow-ups with customers and organizations) and reports. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminCrmController(private val crud: JdbcCrud, private val access: AdminAccess) {

    // ---------- Customers ----------

    @GetMapping("/crm/summary")
    fun summary(): ApiResponse<Map<String, Any?>> {
        val monthStart = "DATE_TRUNC('month', CURRENT_DATE)"
        val buyers = "SELECT COUNT(DISTINCT user_id) FROM orders WHERE status = 'PAID' AND created_at >= %s AND created_at < %s"
        val paidBuyers = crud.number("SELECT COUNT(*) FROM (SELECT user_id FROM orders WHERE status = 'PAID' GROUP BY user_id) b")
        val repeat = crud.number("SELECT COUNT(*) FROM (SELECT user_id FROM orders WHERE status = 'PAID' GROUP BY user_id HAVING COUNT(*) >= 2) b")
        return ApiResponse.ok(
            linkedMapOf(
                "customers" to metric(
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER'"),
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at < $monthStart"),
                ),
                "newCustomers" to metric(
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at >= $monthStart"),
                    crud.number("SELECT COUNT(*) FROM users WHERE user_type = 'USER' AND created_at >= $monthStart - INTERVAL '1 month' AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'"),
                ),
                "activeBuyers" to metric(
                    crud.number(buyers.format("LOCALTIMESTAMP - INTERVAL '30 days'", "LOCALTIMESTAMP")),
                    crud.number(buyers.format("LOCALTIMESTAMP - INTERVAL '60 days'", "LOCALTIMESTAMP - INTERVAL '30 days'")),
                ),
                "repeatRate" to if (paidBuyers > 0) repeat * 100 / paidBuyers else 0.0,
                "openFollowUps" to crud.number("SELECT COUNT(*) FROM crm_interactions WHERE status <> 'CLOSED'"),
                "dueFollowUps" to crud.number("SELECT COUNT(*) FROM crm_interactions WHERE status <> 'CLOSED' AND follow_up_at <= LOCALTIMESTAMP"),
            ),
        )
    }

    @GetMapping("/crm/customers")
    fun customers(
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) segment: String?,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "spent") sort: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): ApiResponse<Map<String, Any?>> {
        val filters = SqlFilters()
            .whenPresent(q, "(cs.full_name ILIKE :q OR cs.mobile ILIKE :q OR cs.email ILIKE :q)", "q") { likePattern(it as String) }
            .whenPresent(segment, "cs.segment = :segment", "segment")
            .whenPresent(status, "cs.status = :status", "status")
        val order = when (sort) {
            "recent" -> "cs.last_order_at DESC NULLS LAST, cs.id DESC"
            "orders" -> "cs.orders_count DESC, cs.id DESC"
            "joined" -> "cs.created_at DESC, cs.id DESC"
            else -> "cs.total_spent DESC, cs.id DESC"
        }
        return ApiResponse.ok(crud.page("SELECT cs.*", CUSTOMERS_FROM, filters, order, page, size))
    }

    /** Segment counts for the filter chips. */
    @GetMapping("/crm/segments")
    fun segments(): ApiResponse<Map<String, Long>> = ApiResponse.ok(
        crud.list("SELECT cs.segment, COUNT(*) AS count $CUSTOMERS_FROM GROUP BY cs.segment").associate { it["segment"] as String to (it["count"] as Number).toLong() },
    )

    @GetMapping("/crm/customers/{id}")
    fun customer(@PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val customer = crud.one("SELECT cs.* $CUSTOMERS_FROM WHERE cs.id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val orders = crud.list(
            "SELECT o.id, o.order_number, o.status, o.total_amount, o.created_at, e.title AS event_title, s.start_time, " +
                "(SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) AS tickets_count " +
                "FROM orders o LEFT JOIN sessions s ON s.id = o.session_id LEFT JOIN events e ON e.id = s.event_id " +
                "WHERE o.user_id = :id ORDER BY o.created_at DESC LIMIT 15",
            mapOf("id" to id),
        )
        val categories = crud.list(
            "SELECT COALESCE(c.name, 'سایر') AS name, c.color, COUNT(*) AS orders, SUM(o.total_amount) AS amount FROM orders o " +
                "JOIN sessions s ON s.id = o.session_id JOIN events e ON e.id = s.event_id LEFT JOIN categories c ON c.id = e.category_id " +
                "WHERE o.user_id = :id AND o.status = 'PAID' GROUP BY c.name, c.color ORDER BY orders DESC LIMIT 5",
            mapOf("id" to id),
        )
        return ApiResponse.ok(customer + mapOf("orders" to orders, "categories" to categories, "interactions" to interactions(id, null, null).data))
    }

    @PutMapping("/crm/customers/{id}")
    fun updateCustomer(@PathVariable id: Long, @Valid @RequestBody req: CustomerRequest): ApiResponse<Unit> {
        val updated = crud.jdbc.update(
            "UPDATE users SET full_name = :name, email = :email, notes = :notes, status = :status, updated_at = LOCALTIMESTAMP " +
                "WHERE id = :id AND user_type = 'USER'",
            mapOf("name" to req.fullName.blankToNull(), "email" to req.email.blankToNull(), "notes" to req.notes.blankToNull(), "status" to (req.status ?: "ACTIVE"), "id" to id),
        )
        if (updated == 0) throw JdbcCrud.notFound()
        return ApiResponse.ok("اطلاعات مشتری ذخیره شد.", null)
    }

    // ---------- Interactions / follow-ups ----------

    @GetMapping("/crm/interactions")
    fun interactions(
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) organizationId: Long?,
        @RequestParam(required = false) status: String?,
    ): ApiResponse<List<Map<String, Any?>>> {
        val f = SqlFilters()
            .whenPresent(userId, "i.user_id = :userId", "userId")
            .whenPresent(organizationId, "i.organization_id = :orgId", "orgId")
            .whenPresent(status, "i.status = :status", "status")
        return ApiResponse.ok(
            crud.list(
                "SELECT i.*, u.full_name AS customer_name, u.mobile AS customer_mobile, o.name AS organization_name, a.full_name AS created_by_name, " +
                    "(i.status <> 'CLOSED' AND i.follow_up_at <= LOCALTIMESTAMP) AS overdue " +
                    "FROM crm_interactions i LEFT JOIN users u ON u.id = i.user_id LEFT JOIN organizations o ON o.id = i.organization_id " +
                    "LEFT JOIN users a ON a.id = i.created_by${f.sql} ORDER BY (i.status = 'CLOSED'), i.follow_up_at NULLS LAST, i.created_at DESC LIMIT 300",
                f.params,
            ),
        )
    }

    @PostMapping("/crm/interactions")
    fun createInteraction(@Valid @RequestBody req: InteractionRequest, request: HttpServletRequest): ApiResponse<Long> =
        ApiResponse.ok("پیگیری ثبت شد.", crud.insert("crm_interactions", req.columns() + ("created_by" to access.current(request).id)))

    @PutMapping("/crm/interactions/{id}")
    fun updateInteraction(@PathVariable id: Long, @Valid @RequestBody req: InteractionRequest): ApiResponse<Unit> {
        crud.update("crm_interactions", id, req.columns())
        return ApiResponse.ok("پیگیری ویرایش شد.", null)
    }

    @DeleteMapping("/crm/interactions/{id}")
    fun deleteInteraction(@PathVariable id: Long): ApiResponse<Unit> {
        crud.delete("crm_interactions", id)
        return ApiResponse.ok("پیگیری حذف شد.", null)
    }

    // ---------- Reports ----------

    /** Sales analytics of [from, to] (default: last 30 days), optionally for one city. */
    @GetMapping("/reports/overview")
    fun reports(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
        @RequestParam(required = false) cityId: Long?,
    ): ApiResponse<Map<String, Any?>> {
        val end = (to ?: LocalDate.now()).plusDays(1)
        val start = from ?: end.minusDays(30)
        if (!start.isBefore(end)) throw BusinessException("بازه تاریخ معتبر نیست.")
        if (ChronoUnit.DAYS.between(start, end) > 731) throw BusinessException("بازه گزارش حداکثر دو سال است.")
        val prevStart = start.minusDays(ChronoUnit.DAYS.between(start, end))
        val p = mapOf("a" to start, "b" to end, "city" to cityId)
        val prevP = mapOf("a" to prevStart, "b" to start, "city" to cityId)
        val paid = "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN halls h ON h.id = s.hall_id " +
            "WHERE o.status = 'PAID' AND o.created_at >= :a AND o.created_at < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city)"
        val tickets = "FROM tickets t JOIN sessions s ON s.id = t.session_id JOIN halls h ON h.id = s.hall_id " +
            "WHERE t.status <> 'CANCELLED' AND t.created_at >= :a AND t.created_at < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city)"
        val sessionsIn = "FROM sessions s JOIN halls h ON h.id = s.hall_id " +
            "WHERE s.status <> 'CANCELLED' AND s.start_time >= :a AND s.start_time < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city)"

        fun occupancy(params: Map<String, Any?>): Double {
            val row = crud.one("SELECT COALESCE(SUM(s.reserved_seats), 0) AS sold, COALESCE(SUM(s.capacity), 0) AS cap $sessionsIn", params)!!
            val cap = (row["cap"] as Number).toDouble()
            return if (cap > 0) (row["sold"] as Number).toDouble() * 100 / cap else 0.0
        }
        val sales = crud.number("SELECT COALESCE(SUM(o.total_amount), 0) $paid", p)
        val salesPrev = crud.number("SELECT COALESCE(SUM(o.total_amount), 0) $paid", prevP)
        val ticketCount = crud.number("SELECT COUNT(*) $tickets", p)
        val ticketPrev = crud.number("SELECT COUNT(*) $tickets", prevP)

        val totals = linkedMapOf(
            "sales" to metric(sales, salesPrev),
            "orders" to metric(crud.number("SELECT COUNT(*) $paid", p), crud.number("SELECT COUNT(*) $paid", prevP)),
            "tickets" to metric(ticketCount, ticketPrev),
            "averageTicket" to metric(if (ticketCount > 0) sales / ticketCount else 0.0, if (ticketPrev > 0) salesPrev / ticketPrev else 0.0),
            "occupancy" to metric(occupancy(p), occupancy(prevP)),
            "sessions" to metric(crud.number("SELECT COUNT(*) $sessionsIn", p), crud.number("SELECT COUNT(*) $sessionsIn", prevP)),
        )

        val daily = crud.list(
            "SELECT d::date AS date, " +
                "(SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o JOIN sessions s ON s.id = o.session_id JOIN halls h ON h.id = s.hall_id " +
                "  WHERE o.status = 'PAID' AND o.created_at >= d AND o.created_at < d + INTERVAL '1 day' AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city)) AS amount, " +
                "(SELECT COUNT(*) FROM tickets t JOIN sessions s ON s.id = t.session_id JOIN halls h ON h.id = s.hall_id " +
                "  WHERE t.status <> 'CANCELLED' AND t.created_at >= d AND t.created_at < d + INTERVAL '1 day' AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city)) AS tickets " +
                "FROM generate_series(CAST(:a AS DATE), CAST(:b AS DATE) - 1, INTERVAL '1 day') d ORDER BY d",
            p,
        ).map { mapOf("date" to it["date"].toString(), "amount" to it["amount"], "tickets" to it["tickets"]) }

        val byCity = crud.list(
            "SELECT ci.id, ci.name, COALESCE(SUM(o.total_amount), 0) AS amount, COUNT(o.id) AS orders " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE o.status = 'PAID' AND o.created_at >= :a AND o.created_at < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city) " +
                "GROUP BY ci.id, ci.name ORDER BY amount DESC",
            p,
        )
        val byCategory = crud.list(
            "SELECT COALESCE(c.name, 'بدون دسته') AS name, c.color, COALESCE(SUM(o.total_amount), 0) AS amount, COUNT(o.id) AS orders " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN halls h ON h.id = s.hall_id JOIN events e ON e.id = s.event_id " +
                "LEFT JOIN categories c ON c.id = e.category_id " +
                "WHERE o.status = 'PAID' AND o.created_at >= :a AND o.created_at < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city) " +
                "GROUP BY c.name, c.color ORDER BY amount DESC",
            p,
        )
        val topEvents = crud.list(
            "SELECT e.id, e.title, e.banner_url, ci.name AS city_name, COUNT(DISTINCT o.id) AS orders, COALESCE(SUM(o.total_amount), 0) AS amount, " +
                "(SELECT COUNT(*) FROM tickets t JOIN sessions ts ON ts.id = t.session_id WHERE ts.event_id = e.id AND t.status <> 'CANCELLED' " +
                "  AND t.created_at >= :a AND t.created_at < :b) AS tickets, " +
                "(SELECT CASE WHEN SUM(x.capacity) > 0 THEN SUM(x.reserved_seats) * 100.0 / SUM(x.capacity) ELSE 0 END FROM sessions x " +
                "  WHERE x.event_id = e.id AND x.status <> 'CANCELLED') AS occupancy " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN halls h ON h.id = s.hall_id JOIN events e ON e.id = s.event_id " +
                "LEFT JOIN cities ci ON ci.id = e.city_id " +
                "WHERE o.status = 'PAID' AND o.created_at >= :a AND o.created_at < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city) " +
                "GROUP BY e.id, e.title, e.banner_url, ci.name ORDER BY amount DESC LIMIT 10",
            p,
        )
        val halls = crud.list(
            "SELECT h.id, h.name, ci.name AS city_name, COUNT(s.id) AS sessions, COALESCE(SUM(s.capacity), 0) AS capacity, " +
                "COALESCE(SUM(s.reserved_seats), 0) AS sold, " +
                "CASE WHEN SUM(s.capacity) > 0 THEN SUM(s.reserved_seats) * 100.0 / SUM(s.capacity) ELSE 0 END AS occupancy " +
                "FROM sessions s JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE s.status <> 'CANCELLED' AND s.start_time >= :a AND s.start_time < :b AND (CAST(:city AS BIGINT) IS NULL OR h.city_id = :city) " +
                "GROUP BY h.id, h.name, ci.name ORDER BY occupancy DESC",
            p,
        )
        // ISODOW: Monday = 1 ... Sunday = 7
        val byWeekday = crud.list(
            "SELECT EXTRACT(ISODOW FROM o.created_at)::int AS day, COALESCE(SUM(o.total_amount), 0) AS amount, COUNT(*) AS orders $paid GROUP BY 1 ORDER BY 1",
            p,
        )
        val byHour = crud.list("SELECT EXTRACT(HOUR FROM o.created_at)::int AS hour, COUNT(*) AS orders $paid GROUP BY 1 ORDER BY 1", p)

        return ApiResponse.ok(
            linkedMapOf(
                "from" to start.toString(), "to" to end.minusDays(1).toString(), "totals" to totals, "daily" to daily, "byCity" to byCity,
                "byCategory" to byCategory, "topEvents" to topEvents, "halls" to halls, "byWeekday" to byWeekday, "byHour" to byHour,
            ),
        )
    }

    private companion object {
        /** Site customers with their purchase profile and a segment, as subquery `cs`. */
        const val CUSTOMERS_FROM =
            "FROM (SELECT c.*, CASE " +
                "  WHEN c.total_spent > 0 AND c.spend_rank >= 0.9 THEN 'VIP' " +
                "  WHEN c.created_at >= LOCALTIMESTAMP - INTERVAL '30 days' THEN 'NEW' " +
                "  WHEN c.orders_count = 0 THEN 'PROSPECT' " +
                "  WHEN c.last_order_at < LOCALTIMESTAMP - INTERVAL '30 days' THEN 'AT_RISK' " +
                "  WHEN c.orders_count >= 3 THEN 'LOYAL' " +
                "  ELSE 'REGULAR' END AS segment " +
                "FROM (SELECT b.*, PERCENT_RANK() OVER (ORDER BY b.total_spent) AS spend_rank FROM (" +
                "  SELECT u.id, u.full_name, u.mobile, u.email, u.status, u.created_at, u.notes, u.avatar_url, " +
                "  COUNT(o.id) FILTER (WHERE o.status = 'PAID') AS orders_count, " +
                "  COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'PAID'), 0) AS total_spent, " +
                "  MAX(o.created_at) FILTER (WHERE o.status = 'PAID') AS last_order_at, " +
                "  (SELECT COUNT(*) FROM tickets t WHERE t.user_id = u.id AND t.status <> 'CANCELLED') AS tickets_count, " +
                "  (SELECT COUNT(*) FROM crm_interactions ci WHERE ci.user_id = u.id) AS interactions_count " +
                "  FROM users u LEFT JOIN orders o ON o.user_id = u.id WHERE u.user_type = 'USER' GROUP BY u.id) b) c) cs"
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CustomerRequest(
    @field:Size(max = 100) val fullName: String? = null,
    @field:Email(message = "ایمیل معتبر نیست.") @field:Size(max = 100) val email: String? = null,
    val notes: String? = null,
    @field:Pattern(regexp = "ACTIVE|DISABLED", message = "وضعیت معتبر نیست.") val status: String? = "ACTIVE",
)

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class InteractionRequest(
    val userId: Long? = null,
    val organizationId: Long? = null,
    @field:Pattern(regexp = "CALL|SMS|EMAIL|MEETING|SUPPORT", message = "کانال ارتباط معتبر نیست.") val channel: String? = "CALL",
    @field:NotBlank(message = "موضوع پیگیری الزامی است.") @field:Size(max = 200) val subject: String?,
    val notes: String? = null,
    @field:Pattern(regexp = "OPEN|FOLLOW_UP|CLOSED", message = "وضعیت پیگیری معتبر نیست.") val status: String? = "OPEN",
    val followUpAt: Instant? = null,
) {
    fun columns(): Map<String, Any?> {
        if (userId == null && organizationId == null) throw BusinessException("مشتری یا مدرسه / سازمان را انتخاب کنید.")
        return linkedMapOf(
            "user_id" to userId, "organization_id" to organizationId, "channel" to (channel ?: "CALL"), "subject" to subject!!.trim(),
            "notes" to notes.blankToNull(), "status" to (status ?: "OPEN"), "follow_up_at" to followUpAt,
        )
    }
}
