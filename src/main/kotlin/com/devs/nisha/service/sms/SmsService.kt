package com.devs.nisha.service.sms

import com.devs.nisha.exception.BusinessException
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import org.springframework.web.client.RestClient
import org.springframework.web.client.RestClientException

interface SmsService {
    /** True when codes really go out by SMS; otherwise the fixed dev code is used and only logged. */
    val sendsRealSms: Boolean

    fun sendOtp(mobile: String, code: String)

    /** Plain text message (e.g. a ticket). */
    fun sendText(mobile: String, message: String)
}

/**
 * Kavenegar "verify lookup" (template based OTP). Without an API key, or with `sms.provider=dev`, nothing is sent
 * and the OTP is only written to the log, so local development works with the dev code.
 */
@Service
class KavenegarSmsService(
    @Value("\${sms.provider:kavenegar}") provider: String,
    @Value("\${sms.kavenegar.api-key:}") private val apiKey: String,
    @Value("\${sms.kavenegar.otp-template:otp}") private val otpTemplate: String,
    @Value("\${sms.kavenegar.sender:}") private val sender: String,
) : SmsService {

    private val log = LoggerFactory.getLogger(javaClass)
    private val http = RestClient.create("https://api.kavenegar.com")

    override val sendsRealSms: Boolean = provider.equals("kavenegar", ignoreCase = true) && apiKey.isNotBlank()

    init {
        if (!sendsRealSms) log.warn("SMS is in development mode: OTP codes are not sent and the fixed dev code is accepted. Set KAVENEGAR_API_KEY in production.")
    }

    override fun sendOtp(mobile: String, code: String) {
        if (!sendsRealSms) {
            log.info("[SMS dev] OTP for {}: {}", mobile, code)
            return
        }
        try {
            http.get()
                .uri("/v1/{key}/verify/lookup.json?receptor={mobile}&token={code}&template={template}", apiKey, mobile, code, otpTemplate)
                .retrieve()
                .toBodilessEntity()
        } catch (ex: RestClientException) {
            log.error("Kavenegar OTP to {} failed: {}", mobile, ex.message)
            throw BusinessException("ارسال پیامک با خطا مواجه شد. لطفاً چند لحظه دیگر دوباره تلاش کنید.", HttpStatus.SERVICE_UNAVAILABLE)
        }
    }

    override fun sendText(mobile: String, message: String) {
        if (!sendsRealSms) {
            log.info("[SMS dev] To {}: {}", mobile, message)
            return
        }
        try {
            http.post()
                .uri { b ->
                    b.path("/v1/{key}/sms/send.json").queryParam("receptor", mobile).queryParam("message", message)
                        .apply { if (sender.isNotBlank()) queryParam("sender", sender) }
                        .build(apiKey)
                }
                .retrieve()
                .toBodilessEntity()
        } catch (ex: RestClientException) {
            log.error("Kavenegar SMS to {} failed: {}", mobile, ex.message)
            throw BusinessException("ارسال پیامک با خطا مواجه شد. لطفاً چند لحظه دیگر دوباره تلاش کنید.", HttpStatus.SERVICE_UNAVAILABLE)
        }
    }
}
