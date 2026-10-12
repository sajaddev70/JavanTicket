package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.security.AdminAccess
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.support.JdbcCrud
import jakarta.servlet.http.HttpServletRequest
import jakarta.validation.Valid
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Size
import org.springframework.format.annotation.DateTimeFormat
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.time.LocalDate

/** Gate control: validates ticket codes (QR / barcode / typed) at the hall entrance and records every scan. */
@RestController
@RequestMapping("/api/v1/admin/gate")
class AdminGateController(private val crud: JdbcCrud, private val access: AdminAccess) {

    /** Sessions of a day (today by default) with sold and checked-in tickets. */
    @GetMapping("/sessions")
    fun sessions(@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) date: LocalDate?): ApiResponse<List<Map<String, Any?>>> {
        val day = date ?: LocalDate.now()
        return ApiResponse.ok(
            crud.list(
                "SELECT s.id, s.title, s.start_time, s.end_time, s.capacity, s.status, e.title AS event_title, e.banner_url AS event_banner_url, " +
                    "h.name AS hall_name, h.gates_count, ci.name AS city_name, " +
                    "(SELECT COUNT(*) FROM tickets t WHERE t.session_id = s.id AND t.status <> 'CANCELLED') AS tickets_count, " +
                    "(SELECT COUNT(*) FROM tickets t WHERE t.session_id = s.id AND t.status = 'USED') AS checked_in " +
                    "FROM sessions s JOIN events e ON e.id = s.event_id JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                    "WHERE s.start_time >= :day AND s.start_time < :next AND s.status <> 'CANCELLED' ORDER BY s.start_time",
                mapOf("day" to day, "next" to day.plusDays(1)),
            ),
        )
    }

    /** Today's scan counters, optionally for one session. */
    @GetMapping("/summary")
    fun summary(@RequestParam(required = false) sessionId: Long?): ApiResponse<Map<String, Any?>> {
        val params = mapOf("sessionId" to sessionId)
        val scope = "scanned_at >= CURRENT_DATE AND (CAST(:sessionId AS BIGINT) IS NULL OR session_id = :sessionId)"
        val ticketScope = "s.start_time >= CURRENT_DATE AND s.start_time < CURRENT_DATE + 1 AND (CAST(:sessionId AS BIGINT) IS NULL OR s.id = :sessionId)"
        return ApiResponse.ok(
            linkedMapOf(
                "scans" to crud.number("SELECT COUNT(*) FROM gate_scans WHERE $scope", params),
                "accepted" to crud.number("SELECT COUNT(*) FROM gate_scans WHERE result = 'ACCEPTED' AND $scope", params),
                "rejected" to crud.number("SELECT COUNT(*) FROM gate_scans WHERE result <> 'ACCEPTED' AND $scope", params),
                "expected" to crud.number("SELECT COUNT(*) FROM tickets t JOIN sessions s ON s.id = t.session_id WHERE t.status <> 'CANCELLED' AND $ticketScope", params),
                "checkedIn" to crud.number("SELECT COUNT(*) FROM tickets t JOIN sessions s ON s.id = t.session_id WHERE t.status = 'USED' AND $ticketScope", params),
            ),
        )
    }

    @GetMapping("/scans")
    fun scans(@RequestParam(required = false) sessionId: Long?, @RequestParam(defaultValue = "30") limit: Int): ApiResponse<List<Map<String, Any?>>> =
        ApiResponse.ok(
            crud.list(
                "SELECT g.*, t.seat_label, e.title AS event_title, s.start_time, u.full_name AS operator_name, cu.full_name AS customer_name " +
                    "FROM gate_scans g LEFT JOIN tickets t ON t.id = g.ticket_id LEFT JOIN sessions s ON s.id = COALESCE(t.session_id, g.session_id) " +
                    "LEFT JOIN events e ON e.id = s.event_id LEFT JOIN users u ON u.id = g.operator_id LEFT JOIN users cu ON cu.id = t.user_id " +
                    "WHERE (CAST(:sessionId AS BIGINT) IS NULL OR g.session_id = :sessionId) ORDER BY g.scanned_at DESC, g.id DESC LIMIT :limit",
                mapOf("sessionId" to sessionId, "limit" to limit.coerceIn(1, 200)),
            ),
        )

    /**
     * Validates a ticket code and admits it when valid. Always answers 200 with a `result`
     * (ACCEPTED, ALREADY_USED, CANCELLED, WRONG_SESSION, INVALID), so the gate screen can show it.
     */
    @PostMapping("/scan")
    @Transactional
    fun scan(@Valid @RequestBody req: GateScanRequest, request: HttpServletRequest): ApiResponse<Map<String, Any?>> {
        val operator = access.current(request)
        val code = req.code!!.trim().uppercase()
        val ticket = crud.one(
            "SELECT t.id, t.ticket_code, t.status, t.used_at, t.seat_label, t.session_id, t.price, s.start_time, s.end_time, " +
                "s.status AS session_status, e.title AS event_title, h.name AS hall_name, u.full_name AS customer_name, u.mobile AS customer_mobile, " +
                "o.order_number FROM tickets t JOIN sessions s ON s.id = t.session_id JOIN events e ON e.id = s.event_id " +
                "JOIN halls h ON h.id = s.hall_id JOIN users u ON u.id = t.user_id JOIN orders o ON o.id = t.order_id " +
                "WHERE UPPER(t.ticket_code) = :code FOR UPDATE OF t",
            mapOf("code" to code),
        )
        val result = when {
            ticket == null -> "INVALID"
            ticket["status"] == "CANCELLED" || ticket["session_status"] == "CANCELLED" -> "CANCELLED"
            ticket["status"] == "USED" -> "ALREADY_USED"
            req.sessionId != null && (ticket["session_id"] as Number).toLong() != req.sessionId -> "WRONG_SESSION"
            else -> "ACCEPTED"
        }
        if (result == "ACCEPTED") {
            crud.jdbc.update("UPDATE tickets SET status = 'USED', used_at = LOCALTIMESTAMP WHERE id = :id", mapOf("id" to ticket!!["id"]))
        }
        crud.insert(
            "gate_scans",
            linkedMapOf(
                "ticket_id" to ticket?.get("id"), "ticket_code" to code.take(100), "session_id" to (req.sessionId ?: ticket?.get("session_id")),
                "gate_name" to req.gateName.blankToNull(), "result" to result, "operator_id" to operator.id,
            ),
        )
        return ApiResponse.ok(MESSAGES.getValue(result), mapOf("result" to result, "ticket" to ticket))
    }

    /** Undoes a check-in (e.g. a guest who left before the show and comes back with the same ticket). */
    @PostMapping("/reset")
    @Transactional
    fun reset(@Valid @RequestBody req: GateScanRequest, request: HttpServletRequest): ApiResponse<Unit> {
        val code = req.code!!.trim().uppercase()
        val updated = crud.jdbc.update(
            "UPDATE tickets SET status = 'VALID', used_at = NULL WHERE UPPER(ticket_code) = :code AND status = 'USED'",
            mapOf("code" to code),
        )
        if (updated == 0) throw BusinessException("بلیتی با این کد که وارد شده باشد پیدا نشد.", HttpStatus.NOT_FOUND)
        request.setAttribute(ActivityLogService.DESCRIPTION, "لغو ثبت ورود بلیت $code")
        return ApiResponse.ok("ورود این بلیت لغو شد و دوباره قابل استفاده است.", null)
    }

    private companion object {
        val MESSAGES = mapOf(
            "ACCEPTED" to "بلیت معتبر است؛ ورود ثبت شد.",
            "ALREADY_USED" to "این بلیت قبلاً استفاده شده است.",
            "CANCELLED" to "این بلیت یا سانس آن لغو شده است.",
            "WRONG_SESSION" to "این بلیت مربوط به سانس دیگری است.",
            "INVALID" to "بلیتی با این کد پیدا نشد.",
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class GateScanRequest(
    @field:NotBlank(message = "کد بلیت را وارد کنید.") @field:Size(max = 100) val code: String?,
    val sessionId: Long? = null,
    @field:Size(max = 50) val gateName: String? = null,
)
