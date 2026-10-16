package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.sms.SmsService
import com.devs.nisha.service.user.CurrentUser
import com.devs.nisha.support.Jalali
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SecureCodes
import com.devs.nisha.support.SqlFilters
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.beans.factory.annotation.Value
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import java.time.Instant
import java.time.ZoneId
import java.util.concurrent.ConcurrentHashMap

/** The signed-in user's tickets. `qr_code` is the random payload of the ticket's QR code, checked at the gate. */
@RestController
@RequestMapping("/api/v1/user/tickets")
class UserTicketController(
    private val crud: JdbcCrud,
    private val currentUser: CurrentUser,
    private val sms: SmsService,
    @Value("\${app.user-site-url:http://localhost:3003}") private val userSiteUrl: String,
) {
    /** Last SMS per ticket, so the button cannot be used to flood a number. */
    private val lastSent = ConcurrentHashMap<Long, Long>()

    /** scope: upcoming (default), past or cancelled; also returns the count of each scope for the tabs. */
    @GetMapping
    fun list(
        authentication: Authentication,
        @RequestParam(defaultValue = "upcoming") scope: String,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "12") size: Int,
    ): ApiResponse<Map<String, Any?>> {
        val userId = currentUser.id(authentication)
        val filters = SqlFilters().add("t.user_id = :userId", "userId" to userId).add(SCOPES[scope] ?: SCOPES.getValue("upcoming"))
        val result = crud.page(
            "SELECT t.id, t.ticket_code, t.seat_label, t.price, t.status, t.used_at, t.created_at, s.id AS session_id, s.start_time, s.end_time, " +
                "e.title AS event_title, e.slug AS event_slug, e.banner_url, c.name AS category_name, c.color AS category_color, " +
                "h.name AS hall_name, h.venue_name, ci.name AS city_name, o.order_number",
            FROM, filters, if (scope == "upcoming") "s.start_time ASC, t.id" else "s.start_time DESC, t.id", page, size.coerceIn(1, 48),
        )
        val counts = SCOPES.mapValues { (_, condition) ->
            crud.number("SELECT COUNT(*) $FROM WHERE t.user_id = :userId AND $condition", mapOf("userId" to userId)).toLong()
        }
        return ApiResponse.ok(result + ("counts" to counts))
    }

    @GetMapping("/{id}")
    fun ticket(authentication: Authentication, @PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val params = mapOf("id" to id, "userId" to currentUser.id(authentication))
        val ticket = crud.one(
            "SELECT t.id, t.ticket_code, t.qr_code, t.seat_label, t.price, t.status, t.used_at, t.created_at, " +
                "st.row_label, st.seat_number, hs.name AS section_name, tr.name AS tier_name, tr.color AS tier_color, " +
                "s.id AS session_id, s.title AS session_title, s.start_time, s.end_time, s.status AS session_status, " +
                "e.title AS event_title, e.subtitle AS event_subtitle, e.slug AS event_slug, e.banner_url, " +
                "c.name AS category_name, c.color AS category_color, c.icon_url AS category_icon_url, " +
                "h.name AS hall_name, h.venue_name, h.address AS hall_address, ci.name AS city_name, " +
                "o.order_number, o.status AS order_status, o.created_at AS ordered_at, o.paid_at, o.total_amount AS order_total, " +
                "(SELECT COUNT(*) FROM tickets x WHERE x.order_id = o.id) AS order_tickets_count, " +
                "COALESCE(NULLIF(TRIM(CONCAT_WS(' ', o.buyer_first_name, o.buyer_last_name)), ''), u.full_name) AS buyer_name, " +
                "COALESCE(o.buyer_mobile, u.mobile) AS buyer_mobile " +
                "$FROM JOIN users u ON u.id = t.user_id LEFT JOIN seats st ON st.id = t.seat_id LEFT JOIN hall_sections hs ON hs.id = st.section_id " +
                "LEFT JOIN seat_tiers tr ON tr.code = st.tier_code WHERE t.id = :id AND t.user_id = :userId",
            params,
        ) ?: throw BusinessException("بلیت موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        if (ticket["qr_code"] != null) return ApiResponse.ok(ticket)
        // Tickets issued before QR payloads existed get one on first view.
        val qr = SecureCodes.ticketQr()
        crud.jdbc.update("UPDATE tickets SET qr_code = :qr WHERE id = :id AND qr_code IS NULL", mapOf("qr" to qr, "id" to id))
        return ApiResponse.ok(ticket + ("qr_code" to crud.one("SELECT qr_code FROM tickets WHERE id = :id", mapOf("id" to id))?.get("qr_code")))
    }

    /** Sends the ticket (event, time, seat and entry code) by SMS to the buyer's mobile; at most once a minute per ticket. */
    @PostMapping("/{id}/send-sms")
    fun sendSms(authentication: Authentication, @PathVariable id: Long): ApiResponse<Map<String, Any?>> {
        val ticket = ticket(authentication, id).data!!
        if (ticket["status"] == "CANCELLED") throw BusinessException("این بلیت لغو شده است.")
        val now = System.currentTimeMillis()
        val previous = lastSent.put(id, now)
        if (previous != null && now - previous < SMS_COOLDOWN_MS) {
            lastSent[id] = previous
            throw BusinessException("پیامک این بلیت به‌تازگی ارسال شده است. لطفاً یک دقیقه دیگر دوباره تلاش کنید.", HttpStatus.TOO_MANY_REQUESTS)
        }
        val mobile = ticket["buyer_mobile"] as String
        val start = Instant.parse(ticket["start_time"] as String).atZone(TEHRAN)
        val message = listOfNotNull(
            "بلیت ${ticket["event_title"]}",
            "${Jalali.format(start.toLocalDate())} ساعت ${Jalali.persianDigits("%02d:%02d".format(start.hour, start.minute))}",
            listOfNotNull(ticket["hall_name"], ticket["city_name"]).joinToString("، "),
            (ticket["seat_label"] as String?)?.let(Jalali::persianDigits),
            "کد ورود: ${(ticket["qr_code"] as String).chunked(4).joinToString("-")}",
            "${userSiteUrl.trimEnd('/')}/tickets/$id",
        ).joinToString("\n")
        try {
            sms.sendText(mobile, message)
        } catch (ex: BusinessException) {
            lastSent.remove(id)
            throw ex
        }
        return ApiResponse.ok("بلیت به شماره ${mobile.take(4)}***${mobile.takeLast(4)} پیامک شد.", mapOf("mobile" to mobile))
    }

    private companion object {
        const val SMS_COOLDOWN_MS = 60_000L
        val TEHRAN: ZoneId = ZoneId.of("Asia/Tehran")

        const val FROM =
            "FROM tickets t JOIN orders o ON o.id = t.order_id JOIN sessions s ON s.id = t.session_id JOIN events e ON e.id = s.event_id " +
                "LEFT JOIN categories c ON c.id = e.category_id JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id"

        val SCOPES = linkedMapOf(
            "upcoming" to "t.status <> 'CANCELLED' AND s.status <> 'CANCELLED' AND s.end_time >= LOCALTIMESTAMP",
            "past" to "t.status <> 'CANCELLED' AND s.status <> 'CANCELLED' AND s.end_time < LOCALTIMESTAMP",
            "cancelled" to "(t.status = 'CANCELLED' OR s.status = 'CANCELLED')",
        )
    }
}
