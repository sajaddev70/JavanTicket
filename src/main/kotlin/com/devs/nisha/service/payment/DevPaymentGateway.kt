package com.devs.nisha.service.payment

import com.devs.nisha.support.SecureCodes
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.context.annotation.Profile
import org.springframework.stereotype.Component
import org.springframework.web.servlet.support.ServletUriComponentsBuilder

/**
 * Simulated bank gateway for development (`payment.mode=dev`, never in production). It follows the same redirect →
 * callback → verify round trip as a real gateway: the buyer lands on a test bank page served by the backend
 * (/api/v1/payments/dev/{authority}) and chooses to pay or cancel.
 */
@Component
@Profile("!prod")
@ConditionalOnProperty(name = ["payment.mode"], havingValue = "dev")
class DevPaymentGateway : PaymentGateway {
    override val code = CODE
    override val title = "درگاه پرداخت آزمایشی"
    override val description = "شبیه‌ساز درگاه بانکی برای محیط توسعه"
    override val logoUrl: String? = null

    override fun start(request: PaymentStart): String =
        ServletUriComponentsBuilder.fromCurrentContextPath().path("/api/v1/payments/dev/{authority}").buildAndExpand(request.authority).toUriString()

    override fun verify(payment: PaymentRecord, params: Map<String, String>): PaymentVerification =
        if (params["status"] == "OK" && params["authority"] == payment.authority) {
            PaymentVerification(success = true, referenceId = SecureCodes.digits(12), cardPan = "6037-99**-****-" + SecureCodes.digits(4))
        } else {
            PaymentVerification(success = false, failureReason = "پرداخت توسط کاربر لغو شد.")
        }

    companion object {
        const val CODE = "dev"
    }
}
