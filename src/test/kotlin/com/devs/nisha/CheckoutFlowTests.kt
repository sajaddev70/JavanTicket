package com.devs.nisha

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.order.BuyerDetails
import com.devs.nisha.service.order.OrderService
import com.devs.nisha.service.seatmap.SeatHoldService
import com.devs.nisha.support.JdbcCrud
import org.junit.jupiter.api.Assumptions.assumeTrue
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.http.HttpStatus
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.math.RoundingMode
import java.util.UUID
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNotNull
import kotlin.test.assertNull
import kotlin.test.assertTrue

/**
 * Seat lock → order → discount → ticket issue, against the configured database. Every test runs in a transaction
 * that is rolled back, so the data is left untouched.
 */
@SpringBootTest
@Transactional
class CheckoutFlowTests {

    @Autowired lateinit var crud: JdbcCrud
    @Autowired lateinit var holds: SeatHoldService
    @Autowired lateinit var orders: OrderService

    private fun token() = UUID.randomUUID().toString()

    /** An upcoming, on-sale session in a hall with a seat map, and two of its free seats. */
    private fun sessionWithFreeSeats(): Pair<Long, List<Long>> {
        val row = crud.one(
            "SELECT s.id FROM sessions s JOIN events e ON e.id = s.event_id WHERE s.status = 'ACTIVE' AND e.status = 'PUBLISHED' " +
                "AND s.start_time > LOCALTIMESTAMP + INTERVAL '1 hour' AND EXISTS (SELECT 1 FROM seats st WHERE st.hall_id = s.hall_id) ORDER BY s.id LIMIT 1",
        )
        assumeTrue(row != null, "needs a seat-mapped session (demo data)")
        val sessionId = (row!!["id"] as Number).toLong()
        val seats = crud.list(
            "SELECT st.id FROM seats st JOIN sessions s ON s.hall_id = st.hall_id WHERE s.id = :id AND st.disabled = FALSE " +
                "AND NOT EXISTS (SELECT 1 FROM seat_reservations r WHERE r.session_id = s.id AND r.seat_id = st.id) ORDER BY st.id LIMIT 2",
            mapOf("id" to sessionId),
        ).map { (it["id"] as Number).toLong() }
        assumeTrue(seats.size == 2, "needs two free seats")
        return sessionId to seats
    }

    private fun newUser(): Long = crud.insert(
        "users",
        linkedMapOf("mobile" to "0919" + (1_000_000..9_999_999).random(), "full_name" to "Test", "user_type" to "USER", "status" to "ACTIVE"),
    )

    @Test
    fun `a seat locked by one buyer cannot be locked by another`() {
        val (sessionId, seats) = sessionWithFreeSeats()
        val a = token()
        val hold = holds.hold(sessionId, seats[0], a)
        assertEquals(listOf(seats[0]), hold["seat_ids"])
        assertTrue((hold["seconds_left"] as Int) in 1..600)

        val error = assertFailsWith<BusinessException> { holds.hold(sessionId, seats[0], token()) }
        assertEquals(HttpStatus.CONFLICT, error.status)
        assertEquals(SeatHoldService.SEAT_TAKEN, error.message)

        // Picking the same seat again is harmless for its holder.
        assertEquals(listOf(seats[0]), holds.hold(sessionId, seats[0], a)["seat_ids"])
    }

    @Test
    fun `held seats become an order, discount is computed by the backend, payment issues tickets with QR payloads`() {
        val (sessionId, seats) = sessionWithFreeSeats()
        val userId = newUser()
        val holder = token()
        seats.forEach { holds.hold(sessionId, it, holder) }

        val number = orders.checkout(userId, sessionId, holder, null, null)
        val order = orders.order(userId, number)
        assertEquals("PENDING", order["status"])
        assertEquals(true, order["payable"])
        assertEquals(2, (order["seats"] as List<*>).size)

        assertFailsWith<BusinessException> { orders.applyDiscount(userId, number, "NO-SUCH-CODE") }
        orders.updateBuyer(userId, number, BuyerDetails("علی", "رضایی", "09120000000", null, null))

        val orderId = (order["id"] as Number).toLong()
        assertNull(orders.complete(orderId))
        val paid = orders.order(userId, number)
        assertEquals("PAID", paid["status"])
        val tickets = crud.list("SELECT qr_code, seat_id FROM tickets WHERE order_id = :id", mapOf("id" to orderId))
        assertEquals(2, tickets.size)
        tickets.forEach { assertTrue((it["qr_code"] as String).matches(Regex("^[A-Z2-9]{16}$"))) }
        assertEquals(
            2,
            crud.number("SELECT COUNT(*) FROM seat_reservations WHERE order_id = :id AND status = 'SOLD'", mapOf("id" to orderId)).toInt(),
        )
        // A paid order cannot be completed twice.
        assertNotNull(orders.complete(orderId))
    }

    @Test
    fun `releasing a seat of an unpaid order cancels that order`() {
        val (sessionId, seats) = sessionWithFreeSeats()
        val userId = newUser()
        val holder = token()
        seats.forEach { holds.hold(sessionId, it, holder) }
        val number = orders.checkout(userId, sessionId, holder, null, null)

        holds.release(sessionId, seats[0], holder)
        assertEquals("CANCELLED", orders.order(userId, number)["status"])
        // The other seat stays held for the buyer, who can check out again.
        assertEquals(listOf(seats[1]), holds.holds(sessionId, holder)["seat_ids"])
        val again = orders.checkout(userId, sessionId, holder, null, null)
        assertEquals(1, (orders.order(userId, again)["seats"] as List<*>).size)
    }

    @Test
    fun `service fee from the site settings is added to the total and follows the discount`() {
        val (sessionId, seats) = sessionWithFreeSeats()
        crud.jdbc.update("UPDATE site_settings SET service_fee_percent = 3", emptyMap<String, Any>())
        val code = "TEST" + (1000..9999).random()
        crud.insert("discount_codes", linkedMapOf("code" to code, "discount_type" to "PERCENT", "value" to BigDecimal(20), "active" to true))
        val userId = newUser()
        val holder = token()
        seats.forEach { holds.hold(sessionId, it, holder) }
        val number = orders.checkout(userId, sessionId, holder, null, null)

        val order = orders.order(userId, number)
        val subtotal = order["subtotal"] as BigDecimal
        val fee = subtotal.multiply(BigDecimal(3)).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        assertEquals(0, fee.compareTo(order["service_fee"] as BigDecimal))
        assertEquals(0, (subtotal + fee).compareTo(order["total_amount"] as BigDecimal))

        val discounted = orders.applyDiscount(userId, number, code)
        val discount = discounted["discount_amount"] as BigDecimal
        val newFee = (subtotal - discount).multiply(BigDecimal(3)).divide(BigDecimal(100), 0, RoundingMode.HALF_UP)
        assertEquals(0, subtotal.compareTo(discounted["subtotal"] as BigDecimal))
        assertEquals(0, newFee.compareTo(discounted["service_fee"] as BigDecimal))
        assertEquals(0, (subtotal - discount + newFee).compareTo(discounted["total_amount"] as BigDecimal))
    }

    @Test
    fun `checkout without held seats is refused`() {
        val (sessionId, _) = sessionWithFreeSeats()
        val error = assertFailsWith<BusinessException> { orders.checkout(newUser(), sessionId, token(), null, null) }
        assertEquals(HttpStatus.CONFLICT, error.status)
    }
}

class JalaliTests {
    @Test
    fun `converts gregorian dates to jalali`() {
        assertEquals(Triple(1405, 7, 24), com.devs.nisha.support.Jalali.of(java.time.LocalDate.of(2026, 10, 16)))
        assertEquals(Triple(1403, 1, 1), com.devs.nisha.support.Jalali.of(java.time.LocalDate.of(2024, 3, 20)))
        assertEquals("۲۸ اردیبهشت ۱۴۰۴", com.devs.nisha.support.Jalali.format(java.time.LocalDate.of(2025, 5, 18)))
    }
}
