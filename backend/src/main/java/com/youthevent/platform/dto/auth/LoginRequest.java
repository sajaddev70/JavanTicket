package com.youthevent.platform.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "شماره تلفن همراه نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^09\\d{9}$", message = "شماره تلفن همراه معتبر نیست. (نمونه: 09123456789)")
    private String mobile;
}
