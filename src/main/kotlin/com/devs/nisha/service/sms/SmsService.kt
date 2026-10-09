package com.devs.nisha.service.sms

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service

interface SmsService {
    fun sendOtp(mobile: String, code: String)
}

@Service
class KavenegarSmsService(
    @Value("\${sms.kavenegar.api-key:}") private val apiKey: String,
    @Value("\${sms.kavenegar.otp-template:otp}") private val otpTemplate: String,
) : SmsService {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun sendOtp(mobile: String, code: String) {
        log.info(
            "[KavenegarSmsService] Sending OTP code [{}] to mobile [{}] using template [{}] (API key present: {})",
            code, mobile, otpTemplate, apiKey.isNotBlank(),
        )
        // Standard Kavenegar REST call placeholder
    }
}
