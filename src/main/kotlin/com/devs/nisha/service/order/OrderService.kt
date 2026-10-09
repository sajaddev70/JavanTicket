package com.devs.nisha.service.order

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.seatmap.SeatMapService
import com.devs.nisha.support.JdbcCrud
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.time.LocalDateTime
import java.util.UUID

/**
 * Checkout: seats are held for [HOLD_MINUTES] while the order is PENDING, become SOLD when it is paid.
 * Without a configured payment gateway, `payment.mode=dev` completes payments locally (never in production).
 */
@Service
class OrderService(
    private val crud: JdbcCrud,
    private val seatMaps: SeatMapService,
    @Value("\${payment.mode:none}") private val paymentMode: String,
) {

    /** Discount for [amount], or an error explaining why the code cannot be used. */
    fun discountFor(code: String, amount: BigDecimal): Pair<String, BigDecimal> {
        val row = crud.list(
            "SELECT *, valid_from > LOCALTIMESTAMP AS not_started, valid_to < LOCALTIMESTAMP AS expired " +
                "FROM discount_codes WHERE UPPER(code) = UPPER(:code) AND active = TRUE",
            mapOf("code" to code.trim()),
        ).firstOrNull() ?: throw BusinessException("کد تخفیف معتبر نیست.")
        if (row["not_started"] == true) throw BusinessException("زمان استفاده از این کد تخفیف هنوز نرسیده است.")
        if (row["expired"] == true) throw BusinessException("مهلت استفاده از این کد تخفیف به پایان رسیده است.")
        val maxUses = (row["max_uses"] as Number?)?.toInt()
        if (maxUses != null && (row["used_count"] as Number).toInt() >= maxUses) throw BusinessException("ظرفیت استفاده از این کد تخفیف تکمیل شده است.")

        val value = row["value"] as BigDecimal
        val discount = if (row["discount_type"] == "PERCENT") amount.multiply(value).divide(BigDecimal(100), 0, RoundingMode.DOWN) else value
        return (row["code"] as String) to discount.min(amount)
    }

    /**
     * Seat-mapped sessions take [seatIds] (held for [HOLD_MINUTES]); sessions in halls without a seat map take
     * [quantity] tickets of the session price.
     */
    @Transactional
    fun checkout(userId: Long, sessionId: Long, seatIds: List<Long>, quantity: Int?, discountCode: String?): String {
        val hasSeatMap = crud.exists("SELECT 1 FROM seats st JOIN sessions s ON s.hall_id = st.hall_id WHERE s.id = :id", mapOf("id" to sessionId))
        if (!hasSeatMap) return checkoutGeneralAdmission(userId, sessionId, quantity ?: 0, discountCode)
        if (seatIds.isEmpty()) throw BusinessException("حداقل یک صندلی انتخاب کنید.")
        if (seatIds.size > MAX_SEATS) throw BusinessException("در هر سفارش حداکثر $MAX_SEATS صندلی قابل انتخاب است.")
        val session = crud.list(
            "SELECT s.id, s.status, s.start_time > LOCALTIMESTAMP AS upcoming FROM sessions s JOIN events e ON e.id = s.event_id " +
                "WHERE s.id = :id AND e.status = 'PUBLISHED'",
            mapOf("id" to sessionId),
        ).firstOrNull() ?: throw BusinessException("سانس موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        if (session["status"] != "ACTIVE" || session["upcoming"] != true) {
            throw BusinessException("فروش این سانس فعال نیست.")
        }

        seatMaps.releaseExpiredHolds()
        val prices = seatMaps.seatPrices(sessionId, seatIds)
        val subtotal = prices.values.fold(BigDecimal.ZERO, BigDecimal::add)
        val (code, discount) = discountCode?.takeIf { it.isNotBlank() }?.let { discountFor(it, subtotal) } ?: (null to BigDecimal.ZERO)

        val orderNumber = "JT-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
        val orderId = crud.insert(
            "orders",
            linkedMapOf(
                "order_number" to orderNumber, "user_id" to userId, "session_id" to sessionId, "total_amount" to subtotal - discount,
                "discount_code" to code, "discount_amount" to discount, "status" to "PENDING", "payment_method" to "ONLINE",
            ),
        )
        val heldUntil = java.sql.Timestamp.valueOf(LocalDateTime.now().plusMinutes(HOLD_MINUTES))
        val inserted = crud.jdbc.batchUpdate(
            "INSERT INTO seat_reservations (session_id, seat_id, status, order_id, held_until) " +
                "VALUES (:sessionId, :seatId, 'HELD', :orderId, :heldUntil) ON CONFLICT (session_id, seat_id) DO NOTHING",
            seatIds.map { mapOf("sessionId" to sessionId, "seatId" to it, "orderId" to orderId, "heldUntil" to heldUntil) }.toTypedArray(),
        ).sum()
        if (inserted != seatIds.size) throw BusinessException("برخی از صندلی‌ها همین حالا توسط شخص دیگری رزرو شدند. لطفاً دوباره انتخاب کنید.", HttpStatus.CONFLICT)
        return orderNumber
    }

    private fun checkoutGeneralAdmission(userId: Long, sessionId: Long, quantity: Int, discountCode: String?): String {
        if (quantity !in 1..MAX_SEATS) throw BusinessException("تعداد بلیت باید بین ۱ تا $MAX_SEATS باشد.")
        val session = crud.list(
            "SELECT s.price, s.capacity, s.reserved_seats, s.status, s.start_time > LOCALTIMESTAMP AS upcoming " +
                "FROM sessions s JOIN events e ON e.id = s.event_id WHERE s.id = :id AND e.status = 'PUBLISHED'",
            mapOf("id" to sessionId),
        ).firstOrNull() ?: throw BusinessException("سانس موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        if (session["status"] != "ACTIVE" || session["upcoming"] != true) throw BusinessException("فروش این سانس فعال نیست.")
        if ((session["reserved_seats"] as Number).toInt() + quantity > (session["capacity"] as Number).toInt()) {
            throw BusinessException("ظرفیت باقی‌مانده این سانس کافی نیست.")
        }
        val subtotal = (session["price"] as BigDecimal).multiply(BigDecimal(quantity))
        val (code, discount) = discountCode?.takeIf { it.isNotBlank() }?.let { discountFor(it, subtotal) } ?: (null to BigDecimal.ZERO)
        val orderNumber = "JT-" + UUID.randomUUID().toString().substring(0, 8).uppercase()
        crud.insert(
            "orders",
            linkedMapOf(
                "order_number" to orderNumber, "user_id" to userId, "session_id" to sessionId, "total_amount" to subtotal - discount,
                "discount_code" to code, "discount_amount" to discount, "status" to "PENDING", "payment_method" to "ONLINE", "quantity" to quantity,
            ),
        )
        return orderNumber
    }

    fun order(userId: Long, orderNumber: String): Map<String, Any?> {
        seatMaps.releaseExpiredHolds()
        val order = crud.list(
            "SELECT o.id, o.order_number, o.status, o.total_amount, o.discount_code, o.discount_amount, o.created_at, o.paid_at, o.quantity, " +
                "s.price AS unit_price, " +
                "s.id AS session_id, s.start_time, e.title AS event_title, e.slug AS event_slug, e.banner_url, h.name AS hall_name, ci.name AS city_name, " +
                "(SELECT MIN(r.held_until) FROM seat_reservations r WHERE r.order_id = o.id AND r.status = 'HELD') AS held_until " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN events e ON e.id = s.event_id " +
                "JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE o.order_number = :number AND o.user_id = :userId",
            mapOf("number" to orderNumber, "userId" to userId),
        ).firstOrNull() ?: throw BusinessException("سفارش پیدا نشد.", HttpStatus.NOT_FOUND)
        val seats = crud.list(
            "SELECT st.id, st.row_label, st.seat_number, t.name AS tier_name, COALESCE(sp.price, s.price) AS price, tk.ticket_code " +
                "FROM seat_reservations r JOIN seats st ON st.id = r.seat_id JOIN sessions s ON s.id = r.session_id " +
                "LEFT JOIN seat_tiers t ON t.code = st.tier_code LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = st.tier_code " +
                "LEFT JOIN tickets tk ON tk.order_id = r.order_id AND tk.seat_id = st.id " +
                "WHERE r.order_id = :id ORDER BY st.row_index, st.seat_number",
            mapOf("id" to order["id"]),
        )
        val tickets = crud.list(
            "SELECT ticket_code, seat_label, price FROM tickets WHERE order_id = :id ORDER BY id",
            mapOf("id" to order["id"]),
        )
        return order + mapOf("seats" to seats, "tickets" to tickets, "payment_available" to (paymentMode == "dev"))
    }

    @Transactional
    fun pay(userId: Long, orderNumber: String) {
        if (paymentMode != "dev") throw BusinessException("درگاه پرداخت هنوز پیکربندی نشده است.", HttpStatus.SERVICE_UNAVAILABLE)
        val order = order(userId, orderNumber)
        if (order["status"] != "PENDING") throw BusinessException("این سفارش قابل پرداخت نیست.")
        @Suppress("UNCHECKED_CAST")
        val seats = order["seats"] as List<Map<String, Any?>>
        val quantity = (order["quantity"] as Number?)?.toInt()
        val orderId = order["id"]
        val sessionId = order["session_id"]
        if (quantity != null) {
            payGeneralAdmission(userId, orderNumber, order, quantity)
            return
        }
        if (seats.isEmpty() || order["held_until"] == null) throw BusinessException("زمان نگهداری صندلی‌ها به پایان رسیده است. لطفاً دوباره انتخاب کنید.")

        crud.jdbc.update("UPDATE orders SET status = 'PAID', paid_at = LOCALTIMESTAMP WHERE id = :id", mapOf("id" to orderId))
        crud.jdbc.update("UPDATE seat_reservations SET status = 'SOLD', held_until = NULL WHERE order_id = :id", mapOf("id" to orderId))
        seats.forEachIndexed { i, seat ->
            crud.insert(
                "tickets",
                linkedMapOf(
                    "ticket_code" to "$orderNumber-${i + 1}", "order_id" to orderId, "user_id" to userId, "session_id" to sessionId,
                    "seat_id" to seat["id"], "seat_label" to "ردیف ${seat["row_label"]} - صندلی ${seat["seat_number"]}",
                    "price" to seat["price"], "status" to "VALID",
                ),
            )
        }
        crud.jdbc.update(
            "UPDATE sessions SET reserved_seats = LEAST(capacity, reserved_seats + :n) WHERE id = :id",
            mapOf("n" to seats.size, "id" to sessionId),
        )
        (order["discount_code"] as String?)?.let {
            crud.jdbc.update("UPDATE discount_codes SET used_count = used_count + 1 WHERE code = :code", mapOf("code" to it))
        }
    }

    private fun payGeneralAdmission(userId: Long, orderNumber: String, order: Map<String, Any?>, quantity: Int) {
        val updated = crud.jdbc.update(
            "UPDATE sessions SET reserved_seats = reserved_seats + :n WHERE id = :id AND reserved_seats + :n <= capacity",
            mapOf("n" to quantity, "id" to order["session_id"]),
        )
        if (updated == 0) throw BusinessException("ظرفیت این سانس تکمیل شده است.", HttpStatus.CONFLICT)
        crud.jdbc.update("UPDATE orders SET status = 'PAID', paid_at = LOCALTIMESTAMP WHERE id = :id", mapOf("id" to order["id"]))
        repeat(quantity) { i ->
            crud.insert(
                "tickets",
                linkedMapOf(
                    "ticket_code" to "$orderNumber-${i + 1}", "order_id" to order["id"], "user_id" to userId, "session_id" to order["session_id"],
                    "seat_label" to "ورود عمومی", "price" to order["unit_price"], "status" to "VALID",
                ),
            )
        }
        (order["discount_code"] as String?)?.let {
            crud.jdbc.update("UPDATE discount_codes SET used_count = used_count + 1 WHERE code = :code", mapOf("code" to it))
        }
    }

    private companion object {
        const val HOLD_MINUTES = 15L
        const val MAX_SEATS = 10
    }
}
