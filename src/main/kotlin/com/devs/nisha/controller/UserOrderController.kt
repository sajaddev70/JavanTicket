package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.repository.UserRepository
import com.devs.nisha.service.order.OrderService
import jakarta.validation.Valid
import jakarta.validation.constraints.NotNull
import org.springframework.http.HttpStatus
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming

/** Signed-in site users: seat checkout and their orders. */
@RestController
@RequestMapping("/api/v1/user")
class UserOrderController(private val orders: OrderService, private val userRepository: UserRepository) {

    @PostMapping("/orders")
    fun checkout(authentication: Authentication, @Valid @RequestBody req: CheckoutRequest): ApiResponse<Map<String, String>> {
        val number = orders.checkout(userId(authentication), req.sessionId!!, req.seatIds ?: emptyList(), req.quantity, req.discountCode)
        return ApiResponse.ok("سفارش شما ثبت شد.", mapOf("order_number" to number))
    }

    @GetMapping("/orders/{number}")
    fun order(authentication: Authentication, @PathVariable number: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(orders.order(userId(authentication), number))

    @PostMapping("/orders/{number}/pay")
    fun pay(authentication: Authentication, @PathVariable number: String): ApiResponse<Unit> {
        orders.pay(userId(authentication), number)
        return ApiResponse.ok("پرداخت با موفقیت انجام شد و بلیت‌ها صادر شدند.", null)
    }

    private fun userId(authentication: Authentication): Long =
        userRepository.findByMobile(authentication.name)?.id ?: throw BusinessException("کاربر یافت نشد.", HttpStatus.UNAUTHORIZED)
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CheckoutRequest(
    @field:NotNull(message = "سانس مشخص نشده است.") val sessionId: Long?,
    /** Seats, for sessions in a hall with a seat map. */
    val seatIds: List<Long>? = null,
    /** Number of tickets, for sessions without a seat map. */
    val quantity: Int? = null,
    val discountCode: String? = null,
)
