package com.devs.nisha.service.order

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.seatmap.SeatMapService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SecureCodes
import com.devs.nisha.support.SqlFilters
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID

/**
 * Checkout. Seat-mapped sessions: the seats a buyer locked on the seat map (see SeatHoldService) become a PENDING
 * order that keeps their deadline. Sessions without a seat map take a ticket count and expire after the same hold
 * time. Prices, discounts and totals are always computed here; a verified payment issues the tickets ([complete]).
 */
@Service
class OrderService(
    private val crud: JdbcCrud,
    private val seatMaps: SeatMapService,
    @Value("\${checkout.hold-minutes:10}") private val holdMinutes: Int,
    @Value("\${checkout.max-seats:10}") private val maxSeats: Int,
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

    /** Service fee for [amount] (after discount), whole Toman, from the admin's site settings. */
    fun serviceFeeFor(amount: BigDecimal): BigDecimal {
        val percent = crud.one("SELECT service_fee_percent FROM site_settings ORDER BY id LIMIT 1")?.get("service_fee_percent") as BigDecimal?
            ?: BigDecimal.ZERO
        return amount.multiply(percent).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
    }

    /** Fails unless tickets of the session can be bought right now. */
    fun ensureOnSale(sessionId: Long) {
        val session = crud.one(
            "SELECT s.status, s.start_time > LOCALTIMESTAMP AS upcoming FROM sessions s JOIN events e ON e.id = s.event_id " +
                "WHERE s.id = :id AND e.status = 'PUBLISHED'",
            mapOf("id" to sessionId),
        ) ?: throw BusinessException("سانس موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        if (session["status"] != "ACTIVE" || session["upcoming"] != true) throw BusinessException("فروش این سانس فعال نیست.")
    }

    /**
     * Creates a PENDING order. Seat-mapped sessions use every seat [holdToken] holds in the session; an earlier unpaid
     * order of those seats (the buyer went back to the seat map) is replaced. Other sessions take [quantity] tickets.
     */
    @Transactional
    fun checkout(userId: Long, sessionId: Long, holdToken: String?, quantity: Int?, discountCode: String?): String {
        ensureOnSale(sessionId)
        val hasSeatMap = crud.exists("SELECT 1 FROM seats st JOIN sessions s ON s.hall_id = st.hall_id WHERE s.id = :id", mapOf("id" to sessionId))
        return if (hasSeatMap) checkoutSeats(userId, sessionId, holdToken, discountCode) else checkoutGeneralAdmission(userId, sessionId, quantity ?: 0, discountCode)
    }

    private fun checkoutSeats(userId: Long, sessionId: Long, holdToken: String?, discountCode: String?): String {
        if (holdToken.isNullOrBlank()) throw BusinessException("ابتدا صندلی‌های خود را روی نقشه سالن انتخاب کنید.")
        seatMaps.releaseExpiredHolds()
        val held = crud.list(
            "SELECT id, seat_id, order_id FROM seat_reservations WHERE session_id = :sessionId AND hold_token = :token AND status = 'HELD' FOR UPDATE",
            mapOf("sessionId" to sessionId, "token" to holdToken),
        )
        if (held.isEmpty()) throw BusinessException(HOLD_EXPIRED, HttpStatus.CONFLICT)
        held.mapNotNull { (it["order_id"] as Number?)?.toLong() }.distinct().forEach(::cancelPending)

        val prices = seatMaps.seatPrices(sessionId, held.map { (it["seat_id"] as Number).toLong() })
        val subtotal = prices.values.fold(BigDecimal.ZERO, BigDecimal::add)
        val (code, discount) = discountCode?.takeIf { it.isNotBlank() }?.let { discountFor(it, subtotal) } ?: (null to BigDecimal.ZERO)
        val orderNumber = newOrderNumber()
        val fee = serviceFeeFor(subtotal - discount)
        val orderId = crud.insert(
            "orders",
            linkedMapOf(
                "order_number" to orderNumber, "user_id" to userId, "session_id" to sessionId, "total_amount" to subtotal - discount + fee,
                "discount_code" to code, "discount_amount" to discount, "service_fee" to fee, "status" to "PENDING", "payment_method" to "ONLINE",
            ),
        )
        crud.jdbc.update("UPDATE seat_reservations SET order_id = :orderId WHERE id IN (:ids)", mapOf("orderId" to orderId, "ids" to held.map { it["id"] }))
        return orderNumber
    }

    private fun checkoutGeneralAdmission(userId: Long, sessionId: Long, quantity: Int, discountCode: String?): String {
        if (quantity !in 1..maxSeats) throw BusinessException("تعداد بلیت باید بین ۱ تا $maxSeats باشد.")
        val session = crud.one("SELECT price, capacity, reserved_seats FROM sessions WHERE id = :id", mapOf("id" to sessionId))!!
        if ((session["reserved_seats"] as Number).toInt() + quantity > (session["capacity"] as Number).toInt()) {
            throw BusinessException("ظرفیت باقی‌مانده این سانس کافی نیست.")
        }
        val subtotal = (session["price"] as BigDecimal).multiply(BigDecimal(quantity))
        val (code, discount) = discountCode?.takeIf { it.isNotBlank() }?.let { discountFor(it, subtotal) } ?: (null to BigDecimal.ZERO)
        val orderNumber = newOrderNumber()
        val fee = serviceFeeFor(subtotal - discount)
        crud.insert(
            "orders",
            linkedMapOf(
                "order_number" to orderNumber, "user_id" to userId, "session_id" to sessionId, "total_amount" to subtotal - discount + fee,
                "discount_code" to code, "discount_amount" to discount, "service_fee" to fee, "status" to "PENDING", "payment_method" to "ONLINE",
                "quantity" to quantity,
            ),
        )
        return orderNumber
    }

    /** Cancels an unpaid order; its seats stay held by the buyer's hold token so they can be picked again. */
    @Transactional
    fun cancelPending(orderId: Long) {
        crud.jdbc.update("UPDATE orders SET status = 'CANCELLED' WHERE id = :id AND status = 'PENDING'", mapOf("id" to orderId))
        crud.jdbc.update("UPDATE seat_reservations SET order_id = NULL WHERE order_id = :id AND status = 'HELD'", mapOf("id" to orderId))
    }

    /** The signed-in user's orders, newest first; [status] narrows to PENDING, PAID, CANCELLED or REFUNDED. */
    fun list(userId: Long, status: String?, page: Int, size: Int): Map<String, Any?> {
        seatMaps.releaseExpiredHolds()
        val filters = SqlFilters()
            .add("o.user_id = :userId", "userId" to userId)
            .whenPresent(status, "o.status = :status", "status") { (it as String).uppercase() }
        return crud.page(
            "SELECT o.id, o.order_number, o.status, o.total_amount, o.discount_amount, o.quantity, o.created_at, o.paid_at, o.tracking_code, " +
                "o.payment_method, s.id AS session_id, s.start_time, e.title AS event_title, e.slug AS event_slug, e.banner_url, " +
                "h.name AS hall_name, ci.name AS city_name, " +
                "(SELECT COUNT(*) FROM tickets t WHERE t.order_id = o.id) AS tickets_count, " +
                "(SELECT MIN(t.id) FROM tickets t WHERE t.order_id = o.id) AS first_ticket_id",
            "FROM orders o JOIN sessions s ON s.id = o.session_id JOIN events e ON e.id = s.event_id " +
                "JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id",
            filters, "o.created_at DESC, o.id DESC", page, size,
        )
    }

    fun order(userId: Long, orderNumber: String): Map<String, Any?> {
        seatMaps.releaseExpiredHolds()
        val order = crud.one(
            "SELECT o.id, o.order_number, o.status, o.total_amount, o.discount_code, o.discount_amount, o.created_at, o.paid_at, o.quantity, " +
                "o.tracking_code, o.payment_method, o.buyer_first_name, o.buyer_last_name, o.buyer_mobile, o.buyer_email, o.buyer_note, " +
                "o.service_fee, o.total_amount + COALESCE(o.discount_amount, 0) - o.service_fee AS subtotal, s.price AS unit_price, s.id AS session_id, s.start_time, s.end_time, " +
                "e.title AS event_title, e.subtitle AS event_subtitle, e.slug AS event_slug, e.banner_url, c.name AS category_name, " +
                "h.name AS hall_name, h.venue_name, h.address AS hall_address, ci.name AS city_name, " +
                "u.mobile AS user_mobile, u.first_name AS user_first_name, u.last_name AS user_last_name, u.email AS user_email, " +
                "CASE WHEN o.quantity IS NULL THEN (SELECT MIN(r.held_until) FROM seat_reservations r WHERE r.order_id = o.id AND r.status = 'HELD') " +
                "ELSE o.created_at + make_interval(mins => :minutes) END AS expires_at " +
                "FROM orders o JOIN users u ON u.id = o.user_id JOIN sessions s ON s.id = o.session_id JOIN events e ON e.id = s.event_id " +
                "LEFT JOIN categories c ON c.id = e.category_id JOIN halls h ON h.id = s.hall_id JOIN cities ci ON ci.id = h.city_id " +
                "WHERE o.order_number = :number AND o.user_id = :userId",
            mapOf("number" to orderNumber, "userId" to userId, "minutes" to holdMinutes),
        ) ?: throw BusinessException("سفارش پیدا نشد.", HttpStatus.NOT_FOUND)
        val id = mapOf("id" to order["id"])
        val secondsLeft = crud.number(
            "SELECT GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (CASE WHEN o.quantity IS NULL " +
                "THEN (SELECT MIN(r.held_until) FROM seat_reservations r WHERE r.order_id = o.id AND r.status = 'HELD') " +
                "ELSE o.created_at + make_interval(mins => :minutes) END - LOCALTIMESTAMP)))) FROM orders o WHERE o.id = :id",
            id + ("minutes" to holdMinutes),
        ).toInt()
        val seats = crud.list(
            "SELECT st.id, st.row_label, st.seat_number, hs.name AS section_name, t.code AS tier_code, t.name AS tier_name, t.color AS tier_color, " +
                "COALESCE(sp.price, s.price) AS price " +
                "FROM seat_reservations r JOIN seats st ON st.id = r.seat_id JOIN sessions s ON s.id = r.session_id " +
                "LEFT JOIN hall_sections hs ON hs.id = st.section_id LEFT JOIN seat_tiers t ON t.code = st.tier_code " +
                "LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = st.tier_code " +
                "WHERE r.order_id = :id ORDER BY st.row_index, st.seat_number",
            id,
        )
        val tickets = crud.list("SELECT id, ticket_code, seat_label, price, status FROM tickets WHERE order_id = :id ORDER BY id", id)
        val pending = order["status"] == "PENDING"
        val payable = pending && secondsLeft > 0 && (order["quantity"] != null || seats.isNotEmpty())
        return order + mapOf(
            "seconds_left" to if (pending) secondsLeft else null,
            "payable" to payable,
            "seats" to seats,
            "tickets" to tickets,
        )
    }

    /** Buyer details for the tickets; also fills the user's profile the first time. */
    @Transactional
    fun updateBuyer(userId: Long, orderNumber: String, buyer: BuyerDetails): Map<String, Any?> {
        val order = payableOrder(userId, orderNumber)
        crud.jdbc.update(
            "UPDATE orders SET buyer_first_name = :first, buyer_last_name = :last, buyer_mobile = :mobile, buyer_email = :email, buyer_note = :note WHERE id = :id",
            mapOf("first" to buyer.firstName, "last" to buyer.lastName, "mobile" to buyer.mobile, "email" to buyer.email, "note" to buyer.note, "id" to order["id"]),
        )
        crud.jdbc.update(
            "UPDATE users SET first_name = COALESCE(first_name, :first), last_name = COALESCE(last_name, :last), " +
                "full_name = CASE WHEN first_name IS NULL THEN :first || ' ' || :last ELSE full_name END, email = COALESCE(email, :email) WHERE id = :userId",
            mapOf("first" to buyer.firstName, "last" to buyer.lastName, "email" to buyer.email, "userId" to userId),
        )
        return order(userId, orderNumber)
    }

    @Transactional
    fun applyDiscount(userId: Long, orderNumber: String, code: String): Map<String, Any?> {
        val order = payableOrder(userId, orderNumber)
        val subtotal = order["subtotal"] as BigDecimal
        val (applied, discount) = discountFor(code, subtotal)
        setDiscount(order["id"], applied, discount, subtotal)
        return order(userId, orderNumber)
    }

    @Transactional
    fun removeDiscount(userId: Long, orderNumber: String): Map<String, Any?> {
        val order = payableOrder(userId, orderNumber)
        setDiscount(order["id"], null, BigDecimal.ZERO, order["subtotal"] as BigDecimal)
        return order(userId, orderNumber)
    }

    /** New discount; the service fee follows the discounted amount. */
    private fun setDiscount(orderId: Any?, code: String?, discount: BigDecimal, subtotal: BigDecimal) {
        val fee = serviceFeeFor(subtotal - discount)
        crud.jdbc.update(
            "UPDATE orders SET discount_code = :code, discount_amount = :discount, service_fee = :fee, total_amount = :total WHERE id = :id",
            mapOf("code" to code, "discount" to discount, "fee" to fee, "total" to subtotal - discount + fee, "id" to orderId),
        )
    }

    /** The order, when it is still PENDING and its hold time has not run out. */
    fun payableOrder(userId: Long, orderNumber: String): Map<String, Any?> {
        val order = order(userId, orderNumber)
        if (order["status"] != "PENDING") throw BusinessException("این سفارش قابل ویرایش یا پرداخت نیست.")
        if (order["payable"] != true) throw BusinessException(HOLD_EXPIRED, HttpStatus.CONFLICT)
        return order
    }

    /**
     * Issues the tickets of a PENDING order after its payment was verified. Returns null on success or the reason the
     * order can no longer be completed (it validates before writing, so the caller's transaction stays usable).
     */
    fun complete(orderId: Long): String? {
        seatMaps.releaseExpiredHolds()
        val order = crud.one(
            "SELECT o.id, o.order_number, o.user_id, o.session_id, o.status, o.quantity, o.discount_code, s.price AS unit_price, s.status AS session_status " +
                "FROM orders o JOIN sessions s ON s.id = o.session_id WHERE o.id = :id FOR UPDATE OF o",
            mapOf("id" to orderId),
        ) ?: return "سفارش پیدا نشد."
        if (order["status"] != "PENDING") return "این سفارش دیگر قابل پرداخت نیست."
        if (order["session_status"] == "CANCELLED") return "این سانس لغو شده است."
        val quantity = (order["quantity"] as Number?)?.toInt()
        val seats = crud.list(
            "SELECT st.id, st.row_label, st.seat_number, COALESCE(sp.price, s.price) AS price FROM seat_reservations r " +
                "JOIN seats st ON st.id = r.seat_id JOIN sessions s ON s.id = r.session_id " +
                "LEFT JOIN session_prices sp ON sp.session_id = s.id AND sp.tier_code = st.tier_code " +
                "WHERE r.order_id = :id AND r.status = 'HELD' ORDER BY st.row_index, st.seat_number",
            mapOf("id" to orderId),
        )
        val count = quantity ?: seats.size
        if (quantity == null && seats.isEmpty()) return HOLD_EXPIRED

        val reserved = crud.jdbc.update(
            "UPDATE sessions SET reserved_seats = reserved_seats + :n WHERE id = :id AND reserved_seats + :n <= capacity",
            mapOf("n" to count, "id" to order["session_id"]),
        )
        if (reserved == 0) {
            if (quantity != null) return "ظرفیت این سانس تکمیل شده است."
            // Seat-mapped sessions: the seats themselves are the limit; keep the counter at capacity.
            crud.jdbc.update("UPDATE sessions SET reserved_seats = capacity WHERE id = :id", mapOf("id" to order["session_id"]))
        }
        crud.jdbc.update("UPDATE orders SET status = 'PAID', paid_at = LOCALTIMESTAMP WHERE id = :id", mapOf("id" to orderId))
        crud.jdbc.update(
            "UPDATE seat_reservations SET status = 'SOLD', held_until = NULL, hold_token = NULL WHERE order_id = :id",
            mapOf("id" to orderId),
        )
        val orderNumber = order["order_number"]
        repeat(count) { i ->
            val seat = seats.getOrNull(i)
            crud.insert(
                "tickets",
                linkedMapOf(
                    "ticket_code" to "$orderNumber-${i + 1}", "order_id" to orderId, "user_id" to order["user_id"], "session_id" to order["session_id"],
                    "seat_id" to seat?.get("id"),
                    "seat_label" to if (seat != null) "ردیف ${seat["row_label"]} - صندلی ${seat["seat_number"]}" else "ورود عمومی",
                    "price" to (seat?.get("price") ?: order["unit_price"]), "status" to "VALID", "qr_code" to SecureCodes.ticketQr(),
                ),
            )
        }
        (order["discount_code"] as String?)?.let {
            crud.jdbc.update("UPDATE discount_codes SET used_count = used_count + 1 WHERE code = :code", mapOf("code" to it))
        }
        return null
    }

    private fun newOrderNumber() = "JT-" + UUID.randomUUID().toString().substring(0, 8).uppercase()

    companion object {
        const val HOLD_EXPIRED = "زمان نگهداری صندلی‌ها به پایان رسیده است. لطفاً دوباره انتخاب کنید."
    }
}

data class BuyerDetails(val firstName: String, val lastName: String, val mobile: String, val email: String?, val note: String?)
