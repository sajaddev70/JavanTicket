package com.youthevent.platform.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank(message = "شماره تلفن همراه نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^09\\d{9}$", message = "شماره تلفن همراه معتبر نیست.")
    private String mobile;

    @NotBlank(message = "کد تأیید نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^\\d{4}$", message = "کد تأیید باید ۴ رقم باشد.")
    private String code;
}
