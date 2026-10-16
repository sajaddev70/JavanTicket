package com.devs.nisha.service.payment

import com.devs.nisha.exception.BusinessException
import com.devs.nisha.service.order.OrderService
import com.devs.nisha.support.JdbcCrud
import com.devs.nisha.support.SecureCodes
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.servlet.support.ServletUriComponentsBuilder
import java.math.BigDecimal

/**
 * Online payment of an order: create a payment with the chosen gateway, redirect the buyer to the bank, verify the
 * gateway's callback, then issue the tickets. Only the backend decides whether a payment succeeded.
 */
@Service
class PaymentService(
    private val crud: JdbcCrud,
    private val orders: OrderService,
    private val gateways: List<PaymentGateway>,
    @Value("\${app.user-site-url:http://localhost:3003}") private val userSiteUrl: String,
    @Value("\${checkout.hold-minutes:10}") private val holdMinutes: Int,
) {
    private val log = LoggerFactory.getLogger(javaClass)

    fun methods(): List<Map<String, Any?>> =
        gateways.map { mapOf("code" to it.code, "title" to it.title, "description" to it.description, "logo_url" to it.logoUrl) }

    /** Starts paying [orderNumber]; returns { payment_id, redirect_url }. */
    @Transactional
    fun start(userId: Long, orderNumber: String, gatewayCode: String): Map<String, Any?> {
        val order = orders.payableOrder(userId, orderNumber)
        if (order["buyer_first_name"] == null) throw BusinessException("ابتدا اطلاعات خریدار را تکمیل کنید.")
        val gateway = gateway(gatewayCode)
        val amount = order["total_amount"] as BigDecimal
        if (amount.signum() <= 0) throw BusinessException("مبلغ این سفارش قابل پرداخت آنلاین نیست.")

        val authority = SecureCodes.hex(16)
        val paymentId = crud.insert(
            "payments",
            linkedMapOf("order_id" to order["id"], "gateway" to gateway.code, "amount" to amount, "status" to "INITIATED", "authority" to authority),
        )
        crud.jdbc.update("UPDATE orders SET payment_method = :gateway WHERE id = :id", mapOf("gateway" to gateway.code, "id" to order["id"]))
        // The buyer may spend a while on the bank page: keep the seats for at least one more hold period.
        crud.jdbc.update(
            "UPDATE seat_reservations SET held_until = GREATEST(held_until, LOCALTIMESTAMP + make_interval(mins => :minutes)) " +
                "WHERE order_id = :id AND status = 'HELD'",
            mapOf("minutes" to holdMinutes, "id" to order["id"]),
        )
        val callbackUrl = ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/v1/payments/callback/{code}").buildAndExpand(gateway.code).toUriString()
        val redirectUrl = gateway.start(
            PaymentStart(paymentId, authority, amount, orderNumber, callbackUrl, order["buyer_mobile"] as String? ?: order["user_mobile"] as String?),
        )
        return mapOf("payment_id" to paymentId, "redirect_url" to redirectUrl)
    }

    /** Handles the gateway's callback and returns the user site page the buyer is sent to. */
    @Transactional
    fun callback(gatewayCode: String, params: Map<String, String>): String {
        val authority = params["authority"].orEmpty()
        val payment = crud.one(
            "SELECT id, order_id, gateway, amount, status, authority FROM payments WHERE authority = :authority AND gateway = :gateway FOR UPDATE",
            mapOf("authority" to authority, "gateway" to gatewayCode),
        ) ?: return resultUrl(null)
        val paymentId = (payment["id"] as Number).toLong()
        if (payment["status"] != "INITIATED") return resultUrl(paymentId)

        val verification = runCatching {
            gateway(gatewayCode).verify(PaymentRecord(paymentId, authority, payment["amount"] as BigDecimal), params)
        }.getOrElse {
            log.error("Payment {} verification failed", paymentId, it)
            PaymentVerification(success = false, failureReason = "تأیید پرداخت با بانک انجام نشد. در صورت کسر مبلغ، طی ۷۲ ساعت به حساب شما بازمی‌گردد.")
        }
        val orderId = (payment["order_id"] as Number).toLong()
        val failure = if (verification.success) orders.complete(orderId) else verification.failureReason ?: "پرداخت ناموفق بود."
        if (verification.success && failure != null) {
            // Paid at the bank but the order expired meanwhile: a real gateway integration must reverse this payment.
            log.warn("Payment {} verified but order {} could not be completed: {}", paymentId, orderId, failure)
        }

        if (failure == null) {
            val trackingCode = "JT" + SecureCodes.digits(10)
            crud.jdbc.update(
                "UPDATE payments SET status = 'SUCCESS', reference_id = :ref, tracking_code = :tracking, card_pan = :pan, verified_at = LOCALTIMESTAMP WHERE id = :id",
                mapOf("ref" to verification.referenceId, "tracking" to trackingCode, "pan" to verification.cardPan, "id" to paymentId),
            )
            crud.jdbc.update("UPDATE orders SET tracking_code = :tracking WHERE id = :id", mapOf("tracking" to trackingCode, "id" to orderId))
        } else {
            crud.jdbc.update(
                "UPDATE payments SET status = 'FAILED', reference_id = :ref, failure_reason = :reason, verified_at = LOCALTIMESTAMP WHERE id = :id",
                mapOf("ref" to verification.referenceId, "reason" to failure.take(255), "id" to paymentId),
            )
        }
        return resultUrl(paymentId)
    }

    /** Payment result for the buyer: payment, order, seats and the issued tickets. */
    fun result(userId: Long, paymentId: Long): Map<String, Any?> {
        val payment = crud.one(
            "SELECT p.id, p.status, p.gateway, p.amount, p.reference_id, p.tracking_code, p.card_pan, p.failure_reason, p.created_at, p.verified_at, " +
                "o.order_number, o.status AS order_status FROM payments p JOIN orders o ON o.id = p.order_id WHERE p.id = :id AND o.user_id = :userId",
            mapOf("id" to paymentId, "userId" to userId),
        ) ?: throw BusinessException("پرداخت موردنظر پیدا نشد.", HttpStatus.NOT_FOUND)
        val gateway = gateways.firstOrNull { it.code == payment["gateway"] }
        return payment + mapOf(
            // The dev gateway is not registered in prod, but demo payments still name it.
            "gateway_title" to (gateway?.title ?: if (payment["gateway"] == DevPaymentGateway.CODE) DevPaymentGateway.TITLE else payment["gateway"]),
            "order" to orders.order(userId, payment["order_number"] as String),
        )
    }

    private fun gateway(code: String): PaymentGateway =
        gateways.firstOrNull { it.code == code } ?: throw BusinessException("روش پرداخت انتخاب‌شده در دسترس نیست.")

    private fun resultUrl(paymentId: Long?) =
        userSiteUrl.trimEnd('/') + "/payment/result" + (paymentId?.let { "?id=$it" } ?: "")
}
