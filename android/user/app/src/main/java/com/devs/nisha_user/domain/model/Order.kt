package com.devs.nisha_user.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

// Orders, payments and tickets of the signed-in user (GET /user/...), as the web's types/order.ts.

@Serializable
enum class OrderStatus { PENDING, PAID, CANCELLED, REFUNDED }

@Serializable
enum class TicketStatus { VALID, USED, CANCELLED }

enum class TicketScope(val api: String, val label: String, val empty: String) {
    UPCOMING("upcoming", "آینده", "هنوز بلیتی برای رویدادهای پیش رو خریداری نکرده‌اید."),
    PAST("past", "گذشته", "بلیتی از رویدادهای گذشته ندارید."),
    CANCELLED("cancelled", "لغو شده", "بلیت لغو شده‌ای ندارید."),
}

@Serializable
data class OrderSeat(
    val id: Long,
    @SerialName("row_label") val rowLabel: String,
    @SerialName("seat_number") val seatNumber: Int,
    @SerialName("section_name") val sectionName: String? = null,
    @SerialName("tier_code") val tierCode: String? = null,
    @SerialName("tier_name") val tierName: String? = null,
    @SerialName("tier_color") val tierColor: String? = null,
    val price: Double = 0.0,
)

@Serializable
data class OrderTicket(
    val id: Long,
    @SerialName("ticket_code") val ticketCode: String,
    @SerialName("seat_label") val seatLabel: String? = null,
    val price: Double = 0.0,
    val status: TicketStatus = TicketStatus.VALID,
)

@Serializable
data class Order(
    val id: Long,
    @SerialName("order_number") val orderNumber: String,
    val status: OrderStatus,
    val subtotal: Double = 0.0,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    @SerialName("discount_code") val discountCode: String? = null,
    @SerialName("discount_amount") val discountAmount: Double? = null,
    /** Service fee, already included in total_amount. */
    @SerialName("service_fee") val serviceFee: Double = 0.0,
    val quantity: Int? = null,
    @SerialName("unit_price") val unitPrice: Double = 0.0,
    @SerialName("created_at") val createdAt: String,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("tracking_code") val trackingCode: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("buyer_first_name") val buyerFirstName: String? = null,
    @SerialName("buyer_last_name") val buyerLastName: String? = null,
    @SerialName("buyer_mobile") val buyerMobile: String? = null,
    @SerialName("buyer_email") val buyerEmail: String? = null,
    @SerialName("buyer_note") val buyerNote: String? = null,
    @SerialName("user_mobile") val userMobile: String = "",
    @SerialName("user_first_name") val userFirstName: String? = null,
    @SerialName("user_last_name") val userLastName: String? = null,
    @SerialName("user_email") val userEmail: String? = null,
    @SerialName("session_id") val sessionId: Long,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String,
    @SerialName("event_title") val eventTitle: String,
    @SerialName("event_subtitle") val eventSubtitle: String? = null,
    @SerialName("event_slug") val eventSlug: String,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("hall_address") val hallAddress: String? = null,
    @SerialName("city_name") val cityName: String = "",
    /** Deadline of the seat hold (seat-mapped) or of the order (general admission). */
    @SerialName("expires_at") val expiresAt: String? = null,
    /** Seconds until expires_at by the server's clock; null unless PENDING. */
    @SerialName("seconds_left") val secondsLeft: Long? = null,
    val payable: Boolean = false,
    val seats: List<OrderSeat> = emptyList(),
    val tickets: List<OrderTicket> = emptyList(),
) {
    val ticketsCount: Int get() = quantity ?: seats.size
    val hasDiscount: Boolean get() = !discountCode.isNullOrBlank() && (discountAmount ?: 0.0) > 0
    val needsBuyer: Boolean get() = payable && buyerFirstName.isNullOrBlank()
}

@Serializable
data class OrderListItem(
    val id: Long,
    @SerialName("order_number") val orderNumber: String,
    val status: OrderStatus,
    @SerialName("total_amount") val totalAmount: Double = 0.0,
    @SerialName("discount_amount") val discountAmount: Double? = null,
    val quantity: Int? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("tracking_code") val trackingCode: String? = null,
    @SerialName("payment_method") val paymentMethod: String? = null,
    @SerialName("session_id") val sessionId: Long,
    @SerialName("start_time") val startTime: String,
    @SerialName("event_title") val eventTitle: String,
    @SerialName("event_slug") val eventSlug: String,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("city_name") val cityName: String = "",
    @SerialName("tickets_count") val ticketsCount: Int = 0,
    @SerialName("first_ticket_id") val firstTicketId: Long? = null,
)

@Serializable
data class BuyerInput(
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val mobile: String,
    val email: String? = null,
    val note: String? = null,
)

@Serializable
data class PaymentMethod(
    val code: String,
    val title: String,
    val description: String? = null,
    @SerialName("logo_url") val logoUrl: String? = null,
)

@Serializable
enum class PaymentStatus { INITIATED, SUCCESS, FAILED }

@Serializable
data class PaymentStart(@SerialName("payment_id") val paymentId: Long, @SerialName("redirect_url") val redirectUrl: String)

@Serializable
data class PaymentResult(
    val id: Long,
    val status: PaymentStatus,
    val gateway: String,
    @SerialName("gateway_title") val gatewayTitle: String,
    val amount: Double = 0.0,
    @SerialName("reference_id") val referenceId: String? = null,
    @SerialName("tracking_code") val trackingCode: String? = null,
    @SerialName("card_pan") val cardPan: String? = null,
    @SerialName("failure_reason") val failureReason: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("verified_at") val verifiedAt: String? = null,
    @SerialName("order_number") val orderNumber: String,
    @SerialName("order_status") val orderStatus: OrderStatus,
    val order: Order,
)

@Serializable
data class TicketListItem(
    val id: Long,
    @SerialName("ticket_code") val ticketCode: String,
    @SerialName("seat_label") val seatLabel: String? = null,
    val price: Double = 0.0,
    val status: TicketStatus = TicketStatus.VALID,
    @SerialName("used_at") val usedAt: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("session_id") val sessionId: Long,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String,
    @SerialName("event_title") val eventTitle: String,
    @SerialName("event_slug") val eventSlug: String,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_color") val categoryColor: String? = null,
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("city_name") val cityName: String = "",
    @SerialName("order_number") val orderNumber: String,
)

@Serializable
data class TicketPage(
    val items: List<TicketListItem> = emptyList(),
    val total: Int = 0,
    val page: Int = 1,
    val size: Int = 12,
    val counts: Map<String, Int> = emptyMap(),
) {
    val hasMore: Boolean get() = page * size < total
}

@Serializable
data class TicketDetail(
    val id: Long,
    @SerialName("ticket_code") val ticketCode: String,
    /** Random payload of the QR code, verified at the gate. */
    @SerialName("qr_code") val qrCode: String,
    @SerialName("seat_label") val seatLabel: String? = null,
    val price: Double = 0.0,
    val status: TicketStatus = TicketStatus.VALID,
    @SerialName("used_at") val usedAt: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("row_label") val rowLabel: String? = null,
    @SerialName("seat_number") val seatNumber: Int? = null,
    @SerialName("section_name") val sectionName: String? = null,
    @SerialName("tier_name") val tierName: String? = null,
    @SerialName("tier_color") val tierColor: String? = null,
    @SerialName("session_id") val sessionId: Long,
    @SerialName("session_title") val sessionTitle: String? = null,
    @SerialName("start_time") val startTime: String,
    @SerialName("end_time") val endTime: String,
    @SerialName("session_status") val sessionStatus: String = "ACTIVE",
    @SerialName("event_title") val eventTitle: String,
    @SerialName("event_subtitle") val eventSubtitle: String? = null,
    @SerialName("event_slug") val eventSlug: String,
    @SerialName("banner_url") val bannerUrl: String? = null,
    @SerialName("category_name") val categoryName: String? = null,
    @SerialName("category_color") val categoryColor: String? = null,
    @SerialName("category_icon_url") val categoryIconUrl: String? = null,
    @SerialName("hall_name") val hallName: String = "",
    @SerialName("venue_name") val venueName: String? = null,
    @SerialName("hall_address") val hallAddress: String? = null,
    @SerialName("city_name") val cityName: String = "",
    @SerialName("order_number") val orderNumber: String,
    @SerialName("order_status") val orderStatus: OrderStatus = OrderStatus.PAID,
    @SerialName("ordered_at") val orderedAt: String,
    @SerialName("paid_at") val paidAt: String? = null,
    @SerialName("order_total") val orderTotal: Double = 0.0,
    @SerialName("order_tickets_count") val orderTicketsCount: Int = 1,
    @SerialName("buyer_name") val buyerName: String? = null,
    @SerialName("buyer_mobile") val buyerMobile: String? = null,
) {
    val cancelled: Boolean get() = status == TicketStatus.CANCELLED || sessionStatus == "CANCELLED"
}
