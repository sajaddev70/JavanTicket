package com.devs.nisha.service.seatmap

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.order.OrderService
import com.devs.nisha.support.JdbcCrud
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * Seat locks taken on the seat map, before checkout. Each browser picks seats under a random hold token; a seat is
 * locked in the database (unique session/seat reservation) the moment it is picked, so two buyers can never hold the
 * same seat. All seats of one token in a session share one deadline, [holdMinutes] after the first pick, which is
 * also the checkout countdown.
 */
@Service
class SeatHoldService(
    private val crud: JdbcCrud,
    private val seatMaps: SeatMapService,
    private val orders: OrderService,
    @Value("\${checkout.hold-minutes:10}") private val holdMinutes: Int,
    @Value("\${checkout.max-seats:10}") private val maxSeats: Int,
) {

    /** Seats the token holds in a session, with the remaining time: { seat_ids, expires_at, seconds_left }. */
    fun holds(sessionId: Long, token: String): Map<String, Any?> {
        seatMaps.releaseExpiredHolds()
        return summary(sessionId, validToken(token))
    }

    @Transactional
    fun hold(sessionId: Long, seatId: Long, token: String): Map<String, Any?> {
        val holder = validToken(token)
        seatMaps.releaseExpiredHolds()
        orders.ensureOnSale(sessionId)
        // Fails for seats outside the session's hall or disabled seats.
        seatMaps.seatPrices(sessionId, listOf(seatId))

        val mine = crud.list(
            "SELECT seat_id FROM seat_reservations WHERE session_id = :sessionId AND hold_token = :token AND status = 'HELD'",
            mapOf("sessionId" to sessionId, "token" to holder),
        ).map { (it["seat_id"] as Number).toLong() }
        if (seatId in mine) return summary(sessionId, holder)
        if (mine.size >= maxSeats) throw BusinessException("در هر خرید حداکثر $maxSeats صندلی قابل انتخاب است.")

        // A new seat joins the deadline of the seats already held, so the countdown never restarts.
        val inserted = crud.jdbc.update(
            "INSERT INTO seat_reservations (session_id, seat_id, status, hold_token, held_until) " +
                "VALUES (:sessionId, :seatId, 'HELD', :token, COALESCE(" +
                "(SELECT MIN(held_until) FROM seat_reservations WHERE session_id = :sessionId AND hold_token = :token AND status = 'HELD'), " +
                "LOCALTIMESTAMP + make_interval(mins => :minutes))) " +
                "ON CONFLICT (session_id, seat_id) DO NOTHING",
            mapOf("sessionId" to sessionId, "seatId" to seatId, "token" to holder, "minutes" to holdMinutes),
        )
        if (inserted == 0) {
            // A double click from the same buyer races into the conflict too; that seat is theirs already.
            val ownedAlready = crud.exists(
                "SELECT 1 FROM seat_reservations WHERE session_id = :sessionId AND seat_id = :seatId AND hold_token = :token AND status = 'HELD'",
                mapOf("sessionId" to sessionId, "seatId" to seatId, "token" to holder),
            )
            if (!ownedAlready) throw BusinessException(SEAT_TAKEN, HttpStatus.CONFLICT)
        }
        return summary(sessionId, holder)
    }

    /** Frees one held seat; an unpaid order that included it is cancelled (its other seats stay held). */
    @Transactional
    fun release(sessionId: Long, seatId: Long, token: String): Map<String, Any?> {
        val holder = validToken(token)
        releaseWhere("r.session_id = :sessionId AND r.seat_id = :seatId", mapOf("sessionId" to sessionId, "seatId" to seatId, "token" to holder))
        return summary(sessionId, holder)
    }

    /** Frees every seat the token holds in a session ("reset selection"). */
    @Transactional
    fun releaseAll(sessionId: Long, token: String): Map<String, Any?> {
        val holder = validToken(token)
        releaseWhere("r.session_id = :sessionId", mapOf("sessionId" to sessionId, "token" to holder))
        return summary(sessionId, holder)
    }

    private fun releaseWhere(condition: String, params: Map<String, Any?>) {
        val rows = crud.list(
            "SELECT r.id, r.order_id FROM seat_reservations r WHERE $condition AND r.hold_token = :token AND r.status = 'HELD' FOR UPDATE",
            params,
        )
        if (rows.isEmpty()) return
        rows.mapNotNull { (it["order_id"] as Number?)?.toLong() }.distinct().forEach(orders::cancelPending)
        crud.jdbc.update("DELETE FROM seat_reservations WHERE id IN (:ids)", mapOf("ids" to rows.map { it["id"] }))
    }

    private fun summary(sessionId: Long, token: String): Map<String, Any?> {
        val rows = crud.list(
            "SELECT seat_id, held_until, GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (held_until - LOCALTIMESTAMP))))::INT AS seconds_left " +
                "FROM seat_reservations WHERE session_id = :sessionId AND hold_token = :token AND status = 'HELD' ORDER BY id",
            mapOf("sessionId" to sessionId, "token" to token),
        )
        return linkedMapOf(
            "seat_ids" to rows.map { it["seat_id"] },
            "expires_at" to rows.minOfOrNull { it["held_until"] as String },
            "seconds_left" to rows.minOfOrNull { (it["seconds_left"] as Number).toInt() },
            "hold_minutes" to holdMinutes,
            "max_seats" to maxSeats,
        )
    }

    companion object {
        const val SEAT_TAKEN = "این صندلی در حال حاضر توسط کاربر دیگری انتخاب شده است."
        private val TOKEN = Regex("^[A-Za-z0-9-]{16,64}$")

        fun validToken(token: String?): String =
            token?.trim()?.takeIf { TOKEN.matches(it) } ?: throw BusinessException("شناسه انتخاب صندلی معتبر نیست. لطفاً صفحه را دوباره بارگذاری کنید.")
    }
}
