package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.service.order.BuyerDetails
import com.devs.nisha.service.order.OrderService
import com.devs.nisha.service.user.CurrentUser
import jakarta.validation.Valid
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size
import org.springframework.security.core.Authentication
import org.springframework.web.bind.annotation.DeleteMapping
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.PutMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import tools.jackson.databind.PropertyNamingStrategies
import tools.jackson.databind.annotation.JsonNaming

/** Signed-in site users: checkout (order draft, buyer details, discount) and their orders. */
@RestController
@RequestMapping("/api/v1/user/orders")
class UserOrderController(private val orders: OrderService, private val currentUser: CurrentUser) {

    /** Creates the order from the seats held on the seat map (hold_token) or a ticket count; returns its number. */
    @PostMapping
    fun checkout(authentication: Authentication, @Valid @RequestBody req: CheckoutRequest): ApiResponse<Map<String, String>> {
        val number = orders.checkout(currentUser.id(authentication), req.sessionId!!, req.holdToken, req.quantity, req.discountCode)
        return ApiResponse.ok("سفارش شما ثبت شد.", mapOf("order_number" to number))
    }

    @GetMapping
    fun list(
        authentication: Authentication,
        @RequestParam(required = false) status: String?,
        @RequestParam(defaultValue = "1") page: Int,
        @RequestParam(defaultValue = "10") size: Int,
    ): ApiResponse<Map<String, Any?>> = ApiResponse.ok(orders.list(currentUser.id(authentication), status, page, size.coerceIn(1, 50)))

    @GetMapping("/{number}")
    fun order(authentication: Authentication, @PathVariable number: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(orders.order(currentUser.id(authentication), number))

    @PutMapping("/{number}/buyer")
    fun buyer(authentication: Authentication, @PathVariable number: String, @Valid @RequestBody req: BuyerRequest): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok(
            "اطلاعات خریدار ثبت شد.",
            orders.updateBuyer(
                currentUser.id(authentication), number,
                BuyerDetails(req.firstName!!.trim(), req.lastName!!.trim(), req.mobile!!, req.email?.trim()?.ifBlank { null }, req.note?.trim()?.ifBlank { null }),
            ),
        )

    @PostMapping("/{number}/discount")
    fun applyDiscount(authentication: Authentication, @PathVariable number: String, @Valid @RequestBody req: DiscountRequest): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("کد تخفیف اعمال شد.", orders.applyDiscount(currentUser.id(authentication), number, req.code!!))

    @DeleteMapping("/{number}/discount")
    fun removeDiscount(authentication: Authentication, @PathVariable number: String): ApiResponse<Map<String, Any?>> =
        ApiResponse.ok("کد تخفیف حذف شد.", orders.removeDiscount(currentUser.id(authentication), number))
}

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class CheckoutRequest(
    @field:NotNull(message = "سانس مشخص نشده است.") val sessionId: Long?,
    /** Hold token of the seats locked on the seat map, for sessions in a hall with a seat map. */
    @field:Size(max = 64) val holdToken: String? = null,
    /** Number of tickets, for sessions without a seat map. */
    val quantity: Int? = null,
    @field:Size(max = 50) val discountCode: String? = null,
)

@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy::class)
data class BuyerRequest(
    @field:NotBlank(message = "نام را وارد کنید.") @field:Size(max = 50, message = "نام حداکثر ۵۰ کاراکتر است.") val firstName: String?,
    @field:NotBlank(message = "نام خانوادگی را وارد کنید.") @field:Size(max = 50, message = "نام خانوادگی حداکثر ۵۰ کاراکتر است.") val lastName: String?,
    @field:NotBlank(message = "شماره موبایل را وارد کنید.") @field:Pattern(regexp = "^09\\d{9}$", message = "شماره موبایل معتبر نیست. (نمونه: 09123456789)")
    val mobile: String?,
    @field:Email(message = "ایمیل واردشده معتبر نیست.") @field:Size(max = 100, message = "ایمیل حداکثر ۱۰۰ کاراکتر است.") val email: String? = null,
    @field:Size(max = 500, message = "یادداشت حداکثر ۵۰۰ کاراکتر است.") val note: String? = null,
)

data class DiscountRequest(@field:NotBlank(message = "کد تخفیف را وارد کنید.") @field:Size(max = 50) val code: String?)
