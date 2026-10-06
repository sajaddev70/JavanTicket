package com.youthevent.platform.service.sms;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class KavenegarSmsService implements SmsService {

    @Value("${sms.kavenegar.api-key:}")
    private String apiKey;

    @Value("${sms.kavenegar.otp-template:otp}")
    private String otpTemplate;

    @Override
    public void sendOtp(String mobile, String code) {
        log.info("[KavenegarSmsService] Sending OTP code [{}] to mobile [{}] using template [{}] (API key present: {})",
                code, mobile, otpTemplate, !apiKey.isBlank());
        // Standard Kavenegar REST Call place-holder
    }
}
