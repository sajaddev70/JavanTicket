package com.devs.nisha.service.payment

import java.math.BigDecimal

/**
 * A bank / Shaparak payment gateway. The user site lists the enabled gateways (beans of this type), the buyer's
 * browser is sent to [start]'s URL, and the gateway sends it back to `/api/v1/payments/callback/{code}`, where
 * [verify] confirms the payment with the bank before any ticket is issued.
 *
 * Amounts are in Toman (as stored in orders); gateways that work in Rial convert themselves.
 */
interface PaymentGateway {
    val code: String
    val title: String
    val description: String?
    val logoUrl: String?

    /** Registers the payment with the bank and returns the URL the buyer is redirected to. */
    fun start(request: PaymentStart): String

    /** Verifies the callback ([params] are the gateway's query / form fields) for the given payment. */
    fun verify(payment: PaymentRecord, params: Map<String, String>): PaymentVerification
}

data class PaymentStart(
    val paymentId: Long,
    val authority: String,
    val amount: BigDecimal,
    val orderNumber: String,
    val callbackUrl: String,
    val mobile: String?,
)

data class PaymentRecord(val id: Long, val authority: String, val amount: BigDecimal)

data class PaymentVerification(
    val success: Boolean,
    val referenceId: String? = null,
    val cardPan: String? = null,
    val failureReason: String? = null,
)
