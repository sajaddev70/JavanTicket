package com.devs.nisha.service.seatmap

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.support.JdbcCrud
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode

/**
 * Seat maps: a hall has sections, each section generates a grid of seats (rows × seats per row) placed at
 * (pos_x, pos_y) in seat units and bent into an arc by `curve`. Per-session seat state lives in seat_reservations.
 */
@Service
class SeatMapService(private val crud: JdbcCrud) {

    /**
     * Rebuilds every seat of a hall from its sections. The arc is computed across the whole hall, so editing one
     * section re-lays all of them; refused once any seat of the hall has a reservation or sale.
     */
    @Transactional
    fun regenerateHall(hallId: Long) {
        ensureNoReservations("SELECT 1 FROM seat_reservations r JOIN seats st ON st.id = r.seat_id WHERE st.hall_id = :id", hallId)
        crud.jdbc.update("DELETE FROM seats WHERE hall_id = :id", mapOf("id" to hallId))
        val sections = crud.list("SELECT * FROM hall_sections WHERE hall_id = :id ORDER BY sort_order, id", mapOf("id" to hallId))
        if (sections.isEmpty()) return

        fun Map<String, Any?>.num(key: String) = (this[key] as Number).toDouble()
        val minX = sections.minOf { it.num("pos_x") }
        val maxX = sections.maxOf { it.num("pos_x") + it.num("seats_per_row") - 1 }
        val centerX = (minX + maxX) / 2
        val halfWidth = ((maxX - minX) / 2).coerceAtLeast(1.0)

        val batch = sections.flatMap { s ->
            val firstRow = s.num("first_row").toInt()
            val perRow = s.num("seats_per_row").toInt()
            (0 until s.num("rows_count").toInt()).flatMap { r ->
                (0 until perRow).map { n ->
                    val x = s.num("pos_x") + n
                    val offset = (x - centerX) / halfWidth
                    mapOf(
                        "hall_id" to hallId, "section_id" to s["id"], "row_index" to firstRow + r,
                        "row_label" to rowLabel(firstRow + r), "seat_number" to n + 1,
                        "x" to round(x), "y" to round(s.num("pos_y") + r - s.num("curve") * offset * offset),
                        "tier_code" to s["tier_code"],
                    )
                }
            }
        }
        crud.jdbc.batchUpdate(
            "INSERT INTO seats (hall_id, section_id, row_index, row_label, seat_number, x, y, tier_code) " +
                "VALUES (:hall_id, :section_id, :row_index, :row_label, :seat_number, :x, :y, :tier_code)",
            batch.toTypedArray(),
        )
    }

    fun ensureHallEditable(hallId: Long) =
        ensureNoReservations("SELECT 1 FROM seat_reservations r JOIN seats st ON st.id = r.seat_id WHERE st.hall_id = :id", hallId)

    /** Drops checkout holds whose time ran out, so their seats are free again. */
    fun releaseExpiredHolds() {
        crud.jdbc.update("DELETE FROM seat_reservations WHERE status = 'HELD' AND held_until < LOCALTIMESTAMP", emptyMap<String, Any>())
        crud.jdbc.update(
            "UPDATE orders SET status = 'CANCELLED' WHERE status = 'PENDING' AND created_at < LOCALTIMESTAMP - INTERVAL '30 minutes' " +
                "AND NOT EXISTS (SELECT 1 FROM seat_reservations r WHERE r.order_id = orders.id)",
            emptyMap<String, Any>(),
        )
    }

    fun tiers(): List<Map<String, Any?>> = crud.list("SELECT * FROM seat_tiers ORDER BY sort_order, code")

    fun sections(hallId: Long): List<Map<String, Any?>> = crud.list(
        "SELECT hs.*, t.name AS tier_name, t.color AS tier_color, (SELECT COUNT(*) FROM seats s WHERE s.section_id = hs.id) AS seats_count " +
            "FROM hall_sections hs LEFT JOIN seat_tiers t ON t.code = hs.tier_code WHERE hs.hall_id = :hallId ORDER BY hs.sort_order, hs.id",
        mapOf("hallId" to hallId),
    )

    /**
     * Seats of a hall with their state for [sessionId] (AVAILABLE when no session is given).
     * Statuses: AVAILABLE, SOLD, HELD, BLOCKED, GROUP, DISABLED.
     */
    fun seats(hallId: Long, sessionId: Long?): List<Map<String, Any?>> {
        if (sessionId != null) releaseExpiredHolds()
        return crud.list(
            "SELECT s.id, s.section_id, s.row_index, s.row_label, s.seat_number, s.x, s.y, s.tier_code, " +
                "CASE WHEN s.disabled THEN 'DISABLED' ELSE COALESCE(r.status, 'AVAILABLE') END AS status " +
                "FROM seats s LEFT JOIN seat_reservations r ON r.seat_id = s.id AND r.session_id = CAST(:sessionId AS BIGINT) " +
                "WHERE s.hall_id = :hallId ORDER BY s.row_index, s.section_id, s.seat_number",
            mapOf("hallId" to hallId, "sessionId" to sessionId),
        )
    }

    /** Session, event and hall details plus prices per tier, for both seat map screens. */
    fun sessionInfo(sessionId: Long): Map<String, Any?> {
        val session = crud.list(
            "SELECT s.id, s.event_id, s.hall_id, s.start_time, s.end_time, s.capacity, s.reserved_seats, s.price, s.status, s.title, " +
                "e.title AS event_title, e.subtitle AS event_subtitle, e.slug AS event_slug, e.banner_url, " +
                "h.name AS hall_name, h.venue_name, ci.name AS city_name " +
                "FROM sessions s JOIN events e ON e.id = s.event_id JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE s.id = :id",
            mapOf("id" to sessionId),
        ).firstOrNull() ?: throw BusinessException("سانس موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        val prices = crud.list(
            "SELECT t.code, t.name, t.color, sp.price FROM seat_tiers t LEFT JOIN session_prices sp ON sp.tier_code = t.code AND sp.session_id = :id " +
                "ORDER BY t.sort_order",
            mapOf("id" to sessionId),
        )
        return session + ("tiers" to prices)
    }

    /** Price of every requested seat for a session; fails when a seat is not part of the session's hall. */
    fun seatPrices(sessionId: Long, seatIds: List<Long>): Map<Long, BigDecimal> {
        val rows = crud.list(
            "SELECT st.id, COALESCE(sp.price, s.price) AS price FROM seats st JOIN sessions s ON s.hall_id = st.hall_id AND s.id = :sessionId " +
                "LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = st.tier_code WHERE st.id IN (:ids) AND st.disabled = FALSE",
            mapOf("sessionId" to sessionId, "ids" to seatIds),
        )
        if (rows.size != seatIds.toSet().size) throw BusinessException("برخی از صندلی‌های انتخاب‌شده معتبر نیستند.")
        return rows.associate { (it["id"] as Number).toLong() to (it["price"] as BigDecimal) }
    }

    private fun ensureNoReservations(sql: String, id: Long) {
        if (crud.exists(sql, mapOf("id" to id))) {
            throw BusinessException("برای صندلی‌های این سالن رزرو یا فروش ثبت شده است و نقشه آن قابل تغییر نیست.", HttpStatus.CONFLICT)
        }
    }

    companion object {
        /** Persian alphabet row labels: الف، ب، پ ... then الف۲ ... for very large halls. */
        private val LETTERS = listOf(
            "الف", "ب", "پ", "ت", "ث", "ج", "چ", "ح", "خ", "د", "ذ", "ر", "ز", "ژ", "س", "ش", "ص", "ض", "ط", "ظ",
            "ع", "غ", "ف", "ق", "ک", "گ", "ل", "م", "ن", "و", "ه", "ی",
        )

        fun rowLabel(rowIndex: Int): String {
            val i = rowIndex - 1
            val letter = LETTERS[i % LETTERS.size]
            return if (i < LETTERS.size) letter else "$letter${i / LETTERS.size + 1}"
        }

        private fun round(v: Double) = BigDecimal.valueOf(v).setScale(2, RoundingMode.HALF_UP)
    }
}
