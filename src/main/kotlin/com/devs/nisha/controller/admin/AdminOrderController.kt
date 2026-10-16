package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SqlFilters
import com.devs.nisha.support.likePattern
import com.devs.nisha.support.metric
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpHeaders
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.time.LocalDate

/** Ticket orders of the site: searchable list, details, cancel / refund and CSV export. */
@RestController
@RequestMapping("/api/v1/admin/orders")
class AdminOrderController(private val crud: JdbcCrud) {

    @GetMapping
    fun orders(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) cityId: Long?,
        @RequestParam(required = false) eventId: Long?,
        @RequestParam(required = false) userId: Long?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        crud.page(SELECT, FROM, filters(status, q, cityId, eventId, userId, from, to), "o.created_at DESC, o.id DESC", page, size),
    )

    /** Stat cards: month to date compared with the same span of the previous month, plus all-time status counts. */
    @GetMapping("/summary")
    fun summary(): ApiResponse<Map<String, Any?>> {
        val month = "created_at >= DATE_TRUNC('month', CURRENT_DATE)"
        val prev = "created_at >= DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 month' AND created_at < LOCALTIMESTAMP - INTERVAL '1 month'"
        val sales = crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'PAID' AND $month")
        val salesPrev = crud.number("SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE status = 'PAID' AND $prev")
        val paid = crud.number("SELECT COUNT(*) FROM orders WHERE status = 'PAID' AND $month")
        val paidPrev = crud.number("SELECT COUNT(*) FROM orders WHERE status = 'PAID' AND $prev")
        val tickets = crud.number("SELECT COUNT(*) FROM tickets WHERE status <> 'CANCELLED' AND $month")
        val ticketsPrev = crud.number("SELECT COUNT(*) FROM tickets WHERE status <> 'CANCELLED' AND $prev")
        val failed = crud.number("SELECT COUNT(*) FROM orders WHERE status IN ('CANCELLED', 'REFUNDED') AND $month")
        val failedPrev = crud.number("SELECT COUNT(*) FROM orders WHERE status IN ('CANCELLED', 'REFUNDED') AND $prev")
        val statusCounts = crud.list("SELECT status, COUNT(*) AS count FROM orders GROUP BY status")
            .associate { it["status"] as String to (it["count"] as Number).toLong() }
        return ApiResponse.ok(
            linkedMapOf(
                "sales" to metric(sales, salesPrev),
                "paidOrders" to metric(paid, paidPrev),
                "tickets" to metric(tickets, ticketsPrev),
                "cancelled" to metric(failed, failedPrev),
                "averageOrder" to if (paid > 0) sales / paid else 0.0,
                "statusCounts" to statusCounts,
            ),
        )
    }

    @GetMapping("/{id}")
    fun order(@PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val order = crud.one("$SELECT, o.refund_reason, u.email AS customer_email $FROM WHERE o.id = :id", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val tickets = crud.list(
            "SELECT t.id, t.ticket_code, t.seat_label, t.price, t.status, t.used_at, st.tier_code, tr.name AS tier_name " +
                "FROM tickets t LEFT JOIN seats st ON st.id = t.seat_id LEFT JOIN seat_tiers tr ON tr.code = st.tier_code " +
                "WHERE t.order_id = :id ORDER BY t.id",
            mapOf("id" to id),
        )
        val held = crud.list(
            "SELECT st.row_label, st.seat_number, r.status, r.held_until FROM seat_reservations r JOIN seats st ON st.id = r.seat_id " +
                "WHERE r.order_id = :id AND r.status = 'HELD' ORDER BY st.row_index, st.seat_number",
            mapOf("id" to id),
        )
        return ApiResponse.ok(order + mapOf("tickets" to tickets, "held_seats" to held))
    }

    /**
     * PENDING orders are cancelled and their held seats released. PAID orders are refunded: tickets are cancelled,
     * seats and session capacity freed. Orders with a ticket already used at the gate cannot be refunded.
     */
    @PostMapping("/{id}/cancel")
    @Transactional
    fun cancel(@PathVariable id: Long, @RequestBody(required = false) req: CancelOrderRequest?, request: HttpServletRequest): ApiResponse<Unit> {
        val order = crud.one("SELECT * FROM orders WHERE id = :id FOR UPDATE", mapOf("id" to id)) ?: throw JdbcCrud.notFound()
        val params = mapOf("id" to id)
        val reason = req?.reason?.trim()?.takeIf { it.isNotEmpty() }
        val number = order["order_number"]
        val message = when (order["status"]) {
            "PENDING" -> {
                crud.jdbc.update("DELETE FROM seat_reservations WHERE order_id = :id AND status = 'HELD'", params)
                crud.jdbc.update("UPDATE orders SET status = 'CANCELLED', refund_reason = :reason WHERE id = :id", params + ("reason" to reason))
                request.setAttribute(ActivityLogService.DESCRIPTION, "لغو سفارش $number")
                "سفارش لغو شد و صندلی‌های نگه‌داشته آزاد شدند."
            }
            "PAID" -> {
                if (crud.exists("SELECT 1 FROM tickets WHERE order_id = :id AND status = 'USED'", params)) {
                    throw BusinessException("بخشی از بلیت‌های این سفارش در گیت استفاده شده است؛ استرداد ممکن نیست.", HttpStatus.CONFLICT)
                }
                val count = crud.number("SELECT COUNT(*) FROM tickets WHERE order_id = :id AND status = 'VALID'", params).toInt()
                crud.jdbc.update("UPDATE tickets SET status = 'CANCELLED' WHERE order_id = :id", params)
                crud.jdbc.update("DELETE FROM seat_reservations WHERE order_id = :id", params)
                crud.jdbc.update(
                    "UPDATE sessions SET reserved_seats = GREATEST(0, reserved_seats - :n) WHERE id = :session",
                    mapOf("n" to count, "session" to order["session_id"]),
                )
                crud.jdbc.update(
                    "UPDATE orders SET status = 'REFUNDED', refunded_at = LOCALTIMESTAMP, refund_reason = :reason WHERE id = :id",
                    params + ("reason" to reason),
                )
                (order["discount_code"] as String?)?.let {
                    crud.jdbc.update("UPDATE discount_codes SET used_count = GREATEST(0, used_count - 1) WHERE code = :code", mapOf("code" to it))
                }
                request.setAttribute(ActivityLogService.DESCRIPTION, "استرداد سفارش $number ($count بلیت)")
                "سفارش مسترد شد و $count بلیت باطل گردید."
            }
            else -> throw BusinessException("این سفارش قبلاً لغو یا مسترد شده است.", HttpStatus.CONFLICT)
        }
        return ApiResponse.ok(message, null)
    }

    /** The filtered orders as a CSV file (UTF-8 with BOM, so Excel shows Persian text correctly). */
    @GetMapping("/export")
    fun export(
        @RequestParam(required = false) status: String?,
        @RequestParam(required = false) q: String?,
        @RequestParam(required = false) cityId: Long?,
        @RequestParam(required = false) eventId: Long?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) from: LocalDate?,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) to: LocalDate?,
    ): ResponseEntity<ByteArray> {
        val f = filters(status, q, cityId, eventId, null, from, to)
        val rows = crud.list("$SELECT $FROM${f.sql} ORDER BY o.created_at DESC LIMIT 20000", f.params)
        val header = listOf("شماره سفارش", "تاریخ ثبت", "مشتری", "موبایل", "رویداد", "شهر", "سالن", "زمان سانس", "تعداد بلیت", "تخفیف", "مبلغ", "وضعیت")
        val lines = rows.map { r ->
            listOf(
                r["order_number"], r["created_at"], r["customer_name"], r["customer_mobile"], r["event_title"], r["city_name"], r["hall_name"],
                r["start_time"], r["tickets_count"], r["discount_amount"], r["total_amount"], STATUS_LABELS[r["status"]] ?: r["status"],
            )
        }
        return csv("orders.csv", header, lines)
    }

    private fun filters(status: String?, q: String?, cityId: Long?, eventId: Long?, userId: Long?, from: LocalDate?, to: LocalDate?) = SqlFilters()
        .whenPresent(status, "o.status = :status", "status")
        .whenPresent(q, "(o.order_number ILIKE :q OR u.mobile ILIKE :q OR u.full_name ILIKE :q OR e.title ILIKE :q)", "q") { likePattern(it as String) }
        .whenPresent(cityId, "ci.id = :cityId", "cityId")
        .whenPresent(eventId, "e.id = :eventId", "eventId")
        .whenPresent(userId, "o.user_id = :userId", "userId")
        .whenPresent(from, "o.created_at >= :from", "from")
        .whenPresent(to, "o.created_at < :to", "to") { (it as LocalDate).plusDays(1) }

    private companion object {
        const val SELECT =
            "SELECT o.id, o.order_number, o.status, o.total_amount, o.discount_code, o.discount_amount, o.payment_method, o.created_at, " +
                "o.paid_at, o.refunded_at, o.quantity, u.id AS user_id, u.full_name AS customer_name, u.mobile AS customer_mobile, " +
                "s.id AS session_id, s.start_time, e.id AS event_id, e.title AS event_title, e.banner_url AS event_banner_url, " +
                "h.name AS hall_name, ci.id AS city_id, ci.name AS city_name, " +
                "(SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) + " +
                "  CASE WHEN o.status = 'PENDING' THEN COALESCE(o.quantity, (SELECT COUNT(*) FROM seat_reservations r WHERE r.order_id = o.id)) ELSE 0 END AS tickets_count"
        const val FROM =
            "FROM orders o JOIN users u ON u.id = o.user_id LEFT JOIN sessions s ON s.id = o.session_id " +
                "LEFT JOIN events e ON e.id = s.event_id LEFT JOIN halls h ON h.id = s.hall_id LEFT JOIN cities ci ON ci.id = h.city_id"

        val STATUS_LABELS = mapOf("PAID" to "پرداخت‌شده", "PENDING" to "در انتظار پرداخت", "CANCELLED" to "لغو شده", "REFUNDED" to "مسترد شده")
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CancelOrderRequest(@field:Size(max = 255) val reason: String? = null)

/** A CSV download (UTF-8 with BOM); values are quoted when needed. */
fun csv(fileName: String, header: List<String>, rows: List<List<Any?>>): ResponseEntity<ByteArray> {
    fun cell(v: Any?): String {
        val s = v?.toString().orEmpty()
        return if (s.any { it == ',' || it == '"' || it == '\n' }) "\"" + s.replace("\"", "\"\"") + "\"" else s
    }
    val body = buildString {
        append('﻿')
        append(header.joinToString(",") { cell(it) }).append("\r\n")
        rows.forEach { append(it.joinToString(",") { v -> cell(v) }).append("\r\n") }
    }
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"$fileName\"")
        .contentType(MediaType("text", "csv", Charsets.UTF_8))
        .body(body.toByteArray(Charsets.UTF_8))
}
