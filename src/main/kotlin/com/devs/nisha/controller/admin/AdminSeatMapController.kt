package com.devs.nisha.controller.admin

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.seatmap.SeatMapService
import com.devs.nisha.support.JdbcCrud
import jakarta.validation.Valid
import jakarta.validation.constraints.Max
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotEmpty
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming
import java.math.BigDecimal

/** Seat map screen: hall sections (generated seats), seat states per session and quick actions. */
@RestController
@RequestMapping("/api/v1/admin")
class AdminSeatMapController(private val crud: JdbcCrud, private val seatMaps: SeatMapService) {

    @GetMapping("/seat-tiers")
    fun tiers(): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(seatMaps.tiers())

    @GetMapping("/halls/{hallId}/sections")
    fun sections(@PathVariable hallId: Long): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(seatMaps.sections(hallId))

    @PostMapping("/halls/{hallId}/sections")
    @Transactional
    fun createSection(@PathVariable hallId: Long, @Valid @RequestBody req: SectionRequest): ApiResponse<Long> {
        seatMaps.ensureHallEditable(hallId)
        val id = crud.insert("hall_sections", req.columns() + ("hall_id" to hallId))
        seatMaps.regenerateHall(hallId)
        return ApiResponse.ok("بخش ثبت و صندلی‌های آن ساخته شد.", id)
    }

    @PutMapping("/sections/{id}")
    @Transactional
    fun updateSection(@PathVariable id: Long, @Valid @RequestBody req: SectionRequest): ApiResponse<Unit> {
        val hallId = sectionHall(id)
        seatMaps.ensureHallEditable(hallId)
        crud.update("hall_sections", id, req.columns())
        seatMaps.regenerateHall(hallId)
        return ApiResponse.ok("بخش ویرایش و صندلی‌های آن بازسازی شد.", null)
    }

    @DeleteMapping("/sections/{id}")
    @Transactional
    fun deleteSection(@PathVariable id: Long): ApiResponse<Unit> {
        val hallId = sectionHall(id)
        seatMaps.ensureHallEditable(hallId)
        crud.delete("hall_sections", id)
        seatMaps.regenerateHall(hallId)
        return ApiResponse.ok("بخش و صندلی‌های آن حذف شد.", null)
    }

    private fun sectionHall(sectionId: Long): Long =
        crud.jdbc.queryForObject("SELECT hall_id FROM hall_sections WHERE id = :id", mapOf("id" to sectionId), Long::class.java)
            ?: throw JdbcCrud.notFound()

    /** Hall layout without a session (all seats AVAILABLE unless disabled). */
    @GetMapping("/halls/{hallId}/seat-map")
    fun hallSeatMap(@PathVariable hallId: Long): ApiResponse<Map<String, Any?>> = ApiResponse.ok(
        mapOf("sections" to seatMaps.sections(hallId), "seats" to seatMaps.seats(hallId, null), "tiers" to seatMaps.tiers()),
    )

    @GetMapping("/sessions/{sessionId}/seat-map")
    fun sessionSeatMap(@PathVariable sessionId: Long): ApiResponse<Map<String, Any?>> {
        val session = seatMaps.sessionInfo(sessionId)
        val hallId = (session["hall_id"] as Number).toLong()
        return ApiResponse.ok(
            mapOf("session" to session, "sections" to seatMaps.sections(hallId), "seats" to seatMaps.seats(hallId, sessionId)),
        )
    }

    /** BLOCK (guests, sponsors), GROUP (group reservation) or RELEASE selected seats of a session. Sold seats are never touched. */
    @PostMapping("/sessions/{sessionId}/seats")
    @Transactional
    fun seatAction(@PathVariable sessionId: Long, @Valid @RequestBody req: SeatActionRequest): ApiResponse<Int> {
        val params = mapOf("sessionId" to sessionId, "ids" to req.seatIds)
        val changed = when (req.action) {
            "RELEASE" -> crud.jdbc.update(
                "DELETE FROM seat_reservations WHERE session_id = :sessionId AND seat_id IN (:ids) AND status IN ('BLOCKED', 'GROUP')",
                params,
            )
            else -> crud.jdbc.update(
                "INSERT INTO seat_reservations (session_id, seat_id, status) " +
                    "SELECT :sessionId, st.id, :status FROM seats st JOIN sessions s ON s.hall_id = st.hall_id AND s.id = :sessionId " +
                    "WHERE st.id IN (:ids) AND st.disabled = FALSE " +
                    "ON CONFLICT (session_id, seat_id) DO UPDATE SET status = EXCLUDED.status WHERE seat_reservations.status IN ('BLOCKED', 'GROUP')",
                params + ("status" to if (req.action == "BLOCK") "BLOCKED" else "GROUP"),
            )
        }
        syncReservedSeats(sessionId)
        return ApiResponse.ok("وضعیت ${changed} صندلی به‌روزرسانی شد.", changed)
    }

    /** Marks seats as out of service (broken, camera position, ...) in every session of the hall. */
    @PutMapping("/seats/disabled")
    fun disableSeats(@Valid @RequestBody req: SeatDisableRequest): ApiResponse<Int> {
        val changed = crud.jdbc.update("UPDATE seats SET disabled = :disabled WHERE id IN (:ids)", mapOf("disabled" to req.disabled, "ids" to req.seatIds))
        return ApiResponse.ok("وضعیت ${changed} صندلی به‌روزرسانی شد.", changed)
    }

    /** Sales of one session per price tier. */
    @GetMapping("/sessions/{sessionId}/sales-report")
    fun salesReport(@PathVariable sessionId: Long): ApiResponse<List<Map<String, Any?>>> = ApiResponse.ok(
        crud.list(
            "SELECT t.code, t.name, t.color, COUNT(st.id) AS seats, " +
                "COUNT(r.id) FILTER (WHERE r.status = 'SOLD') AS sold, " +
                "COUNT(r.id) FILTER (WHERE r.status IN ('BLOCKED', 'GROUP', 'HELD')) AS reserved, " +
                "COUNT(r.id) FILTER (WHERE r.status = 'SOLD') * COALESCE(MAX(sp.price), MAX(s.price)) AS revenue, " +
                "COALESCE(MAX(sp.price), MAX(s.price)) AS price " +
                "FROM seat_tiers t " +
                "JOIN sessions s ON s.id = :sessionId " +
                "JOIN seats st ON st.tier_code = t.code AND st.hall_id = s.hall_id " +
                "LEFT JOIN seat_reservations r ON r.seat_id = st.id AND r.session_id = s.id " +
                "LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = t.code " +
                "GROUP BY t.code, t.name, t.color, t.sort_order ORDER BY t.sort_order",
            mapOf("sessionId" to sessionId),
        ),
    )

    /** Keeps sessions.reserved_seats (used by dashboards and sales bars) in step with the seat map. */
    private fun syncReservedSeats(sessionId: Long) {
        crud.jdbc.update(
            "UPDATE sessions SET reserved_seats = LEAST(capacity, (SELECT COUNT(*) FROM seat_reservations WHERE session_id = :id)) " +
                "WHERE id = :id AND EXISTS (SELECT 1 FROM seats st WHERE st.hall_id = sessions.hall_id)",
            mapOf("id" to sessionId),
        )
    }
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SectionRequest(
    @field:NotBlank(message = "نام بخش الزامی است.") @field:Size(max = 100) val name: String?,
    @field:Min(value = 1, message = "شماره ردیف شروع باید حداقل ۱ باشد.") val firstRow: Int? = 1,
    @field:NotNull(message = "تعداد ردیف الزامی است.") @field:Min(1) @field:Max(value = 60, message = "حداکثر ۶۰ ردیف") val rowsCount: Int?,
    @field:NotNull(message = "تعداد صندلی هر ردیف الزامی است.") @field:Min(1) @field:Max(value = 80, message = "حداکثر ۸۰ صندلی در هر ردیف") val seatsPerRow: Int?,
    val posX: BigDecimal? = BigDecimal.ZERO,
    val posY: BigDecimal? = BigDecimal.ZERO,
    val curve: BigDecimal? = BigDecimal.ZERO,
    val tierCode: String? = null,
    val sortOrder: Int? = 0,
) {
    fun columns() = linkedMapOf(
        "name" to name!!.trim(), "first_row" to (firstRow ?: 1), "rows_count" to rowsCount, "seats_per_row" to seatsPerRow,
        "pos_x" to (posX ?: BigDecimal.ZERO), "pos_y" to (posY ?: BigDecimal.ZERO), "curve" to (curve ?: BigDecimal.ZERO),
        "tier_code" to tierCode.blankToNull(), "sort_order" to (sortOrder ?: 0),
    )
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SeatActionRequest(
    @field:NotEmpty(message = "هیچ صندلی‌ای انتخاب نشده است.") val seatIds: List<Long>?,
    @field:NotNull @field:Pattern(regexp = "BLOCK|GROUP|RELEASE", message = "عملیات معتبر نیست.") val action: String?,
)

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class SeatDisableRequest(
    @field:NotEmpty(message = "هیچ صندلی‌ای انتخاب نشده است.") val seatIds: List<Long>?,
    val disabled: Boolean = true,
)

/** Sub-resources of the event page: key -> (table, columns, required columns). */
private val EVENT_CONTENT = mapOf(
    "stats" to Triple("event_stats", listOf("value", "label", "icon_url", "color", "sort_order"), listOf("value", "label")),
    "topics" to Triple("event_topics", listOf("title", "icon_url", "color", "sort_order"), listOf("title")),
    "speakers" to Triple("event_speakers", listOf("full_name", "job_title", "organization", "photo_url", "keynote", "sort_order"), listOf("full_name")),
    "gallery" to Triple("event_gallery", listOf("image_url", "caption", "sort_order"), listOf("image_url")),
    "faqs" to Triple("event_faqs", listOf("question", "answer", "sort_order"), listOf("question", "answer")),
)

/** Stats, topics, speakers, gallery and FAQ of an event page; one generic endpoint per kind. */
@RestController
@RequestMapping("/api/v1/admin/events/{eventId}/content")
class AdminEventContentController(private val crud: JdbcCrud) {

    @GetMapping("/{kind}")
    fun list(@PathVariable eventId: Long, @PathVariable kind: String): ApiResponse<List<Map<String, Any?>>> {
        val (table) = spec(kind)
        return ApiResponse.ok(crud.list("SELECT * FROM $table WHERE event_id = :eventId ORDER BY sort_order, id", mapOf("eventId" to eventId)))
    }

    @PostMapping("/{kind}")
    fun create(@PathVariable eventId: Long, @PathVariable kind: String, @RequestBody body: Map<String, Any?>): ApiResponse<Long> {
        val (table, columns, required) = spec(kind)
        return ApiResponse.ok("مورد ثبت شد.", crud.insert(table, values(body, columns, required) + ("event_id" to eventId)))
    }

    @PutMapping("/{kind}/{id}")
    fun update(@PathVariable eventId: Long, @PathVariable kind: String, @PathVariable id: Long, @RequestBody body: Map<String, Any?>): ApiResponse<Unit> {
        val (table, columns, required) = spec(kind)
        ensureOwned(table, id, eventId)
        crud.update(table, id, values(body, columns, required))
        return ApiResponse.ok("مورد ویرایش شد.", null)
    }

    @DeleteMapping("/{kind}/{id}")
    fun delete(@PathVariable eventId: Long, @PathVariable kind: String, @PathVariable id: Long): ApiResponse<Unit> {
        val (table) = spec(kind)
        ensureOwned(table, id, eventId)
        crud.delete(table, id)
        return ApiResponse.ok("مورد حذف شد.", null)
    }

    private fun spec(kind: String) = EVENT_CONTENT[kind] ?: throw JdbcCrud.notFound()

    private fun ensureOwned(table: String, id: Long, eventId: Long) {
        if (!crud.exists("SELECT 1 FROM $table WHERE id = :id AND event_id = :eventId", mapOf("id" to id, "eventId" to eventId))) throw JdbcCrud.notFound()
    }

    private fun values(body: Map<String, Any?>, columns: List<String>, required: List<String>): Map<String, Any?> {
        required.firstOrNull { (body[it] as? String).isNullOrBlank() }?.let { throw BusinessException("لطفاً همه فیلدهای الزامی را پر کنید.") }
        return columns.associateWith { col ->
            val v = body[col]
            when (col) {
                "sort_order" -> (v as? Number)?.toInt() ?: (v as? String)?.toIntOrNull() ?: 0
                "keynote" -> v == true
                else -> (v as? String).blankToNull()
            }
        }
    }
}
