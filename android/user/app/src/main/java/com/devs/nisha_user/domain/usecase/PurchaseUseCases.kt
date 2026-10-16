package com.devs.nisha_user.domain.usecase

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.normalizeIranMobile
import com.devs.nisha_user.domain.model.BuyerInput
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderSeat
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStart
import com.devs.nisha_user.domain.model.Seat
import com.devs.nisha_user.domain.model.SeatHold
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.domain.model.SeatStatus
import com.devs.nisha_user.domain.repository.AuthRepository
import com.devs.nisha_user.domain.repository.OrderRepository
import com.devs.nisha_user.domain.repository.PaymentRepository
import com.devs.nisha_user.domain.repository.ProfileRepository
import com.devs.nisha_user.domain.repository.SeatRepository
import javax.inject.Inject

/** UC-05 Pick seats on the hall map (step 1): the map with this device's held seats marked SELECTED. */
class GetSeatMapUseCase @Inject constructor(private val seats: SeatRepository) {
    suspend operator fun invoke(sessionId: Long): SeatMapData = seats.seatMap(sessionId)
}

/**
 * UC-05 (step 2): every pick is a lock on the server; only when it succeeds is the seat selected. A seat taken
 * meanwhile by someone else answers 409 (the caller shows the message and reloads the map).
 */
class ToggleSeatUseCase @Inject constructor(private val seats: SeatRepository) {
    suspend operator fun invoke(sessionId: Long, seat: Seat, selectedCount: Int, maxSeats: Int): Pair<SeatStatus, SeatHold> {
        if (seat.status == SeatStatus.SELECTED) return SeatStatus.AVAILABLE to seats.release(sessionId, seat.id)
        if (selectedCount >= maxSeats) throw AppError("در هر خرید حداکثر ${Fa.number(maxSeats)} صندلی قابل انتخاب است.")
        return SeatStatus.SELECTED to seats.lock(sessionId, seat.id)
    }
}

class ReleaseAllSeatsUseCase @Inject constructor(private val seats: SeatRepository) {
    suspend operator fun invoke(sessionId: Long) {
        seats.releaseAll(sessionId)
    }
}

/** UC-06 Start the checkout: the backend turns the held seats (or a ticket count) into a pending order. */
class CreateOrderUseCase @Inject constructor(private val orders: OrderRepository) {
    suspend operator fun invoke(sessionId: Long, quantity: Int?): String = orders.create(sessionId, quantity)
}

class GetOrderUseCase @Inject constructor(private val orders: OrderRepository) {
    suspend operator fun invoke(number: String): Order = orders.get(number)
}

/** Buyer form values as typed; validated by [SubmitBuyerUseCase]. */
data class BuyerForm(
    val firstName: String = "",
    val lastName: String = "",
    val mobile: String = "",
    val email: String = "",
    val note: String = "",
    val terms: Boolean = false,
)

/**
 * UC-06 Buyer details: validates the form with the same rules (and messages) as the web, saves it on the order, and
 * refreshes the signed-in user's name (the first purchase also fills the profile).
 */
class SubmitBuyerUseCase @Inject constructor(
    private val orders: OrderRepository,
    private val profile: ProfileRepository,
    private val auth: AuthRepository,
) {
    suspend operator fun invoke(number: String, form: BuyerForm): Order {
        val errors = validate(form)
        if (errors.isNotEmpty()) throw AppError(errors.values.first(), fieldErrors = errors)
        val order = orders.updateBuyer(
            number,
            BuyerInput(
                firstName = form.firstName.trim(),
                lastName = form.lastName.trim(),
                mobile = normalizeIranMobile(form.mobile)!!,
                email = form.email.trim().ifBlank { null },
                note = form.note.trim().ifBlank { null },
            ),
        )
        runCatching {
            val p = profile.get()
            auth.user.value?.let { auth.updateUser(it.copy(fullName = p.fullName, email = p.email)) }
        }
        return order
    }

    companion object {
        private val EMAIL = Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")

        fun validate(f: BuyerForm): Map<String, String> = buildMap {
            when {
                f.firstName.isBlank() -> put("first_name", "نام را وارد کنید.")
                f.firstName.trim().length > 50 -> put("first_name", "نام حداکثر ۵۰ کاراکتر است.")
            }
            when {
                f.lastName.isBlank() -> put("last_name", "نام خانوادگی را وارد کنید.")
                f.lastName.trim().length > 50 -> put("last_name", "نام خانوادگی حداکثر ۵۰ کاراکتر است.")
            }
            when {
                f.mobile.isBlank() -> put("mobile", "شماره موبایل را وارد کنید.")
                normalizeIranMobile(f.mobile) == null -> put("mobile", "شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹")
            }
            val email = f.email.trim()
            if (email.isNotEmpty() && !EMAIL.matches(email)) put("email", "ایمیل واردشده معتبر نیست.")
            else if (email.length > 100) put("email", "ایمیل حداکثر ۱۰۰ کاراکتر است.")
            if (f.note.length > 500) put("note", "یادداشت حداکثر ۵۰۰ کاراکتر است.")
            if (!f.terms) put("terms", "برای ادامه، پذیرش قوانین و مقررات لازم است.")
        }
    }
}

/** UC-07 Apply / remove a discount code; the backend recalculates every amount. */
class ApplyDiscountUseCase @Inject constructor(private val orders: OrderRepository) {
    suspend operator fun invoke(number: String, code: String): Order {
        if (code.isBlank()) throw AppError("کد تخفیف را وارد کنید.")
        return orders.applyDiscount(number, code.trim())
    }
}

class RemoveDiscountUseCase @Inject constructor(private val orders: OrderRepository) {
    suspend operator fun invoke(number: String): Order = orders.removeDiscount(number)
}

class GetPaymentMethodsUseCase @Inject constructor(private val payments: PaymentRepository) {
    suspend operator fun invoke(): List<PaymentMethod> = payments.methods()
}

/** UC-08 Pay online: the backend registers the payment with the gateway and returns the bank page to open. */
class StartPaymentUseCase @Inject constructor(private val payments: PaymentRepository) {
    suspend operator fun invoke(orderNumber: String, gateway: String): PaymentStart = payments.start(orderNumber, gateway)
}

/** UC-08 (result): the verified payment with the order and its issued tickets. */
class GetPaymentResultUseCase @Inject constructor(private val payments: PaymentRepository) {
    suspend operator fun invoke(paymentId: Long): PaymentResult = payments.result(paymentId)
}

/** Seats of an order grouped by tier: name, seats, total (checkout and payment summaries). */
data class SeatGroup(val name: String, val seats: List<OrderSeat>, val total: Double)

fun Order.seatGroups(): List<SeatGroup> =
    seats.groupBy { it.tierCode ?: "-" }.values.map { list ->
        SeatGroup(list.first().tierName ?: "عادی", list, list.sumOf { it.price })
    }
