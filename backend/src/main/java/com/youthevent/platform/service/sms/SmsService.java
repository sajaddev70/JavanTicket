package com.youthevent.platform.service.sms;

public interface SmsService {
    void sendOtp(String mobile, String code);
}
