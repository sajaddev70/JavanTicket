package com.devs.nisha.dto.auth

import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern

// Fields are nullable so a missing value reaches bean validation (and its Persian message)
// instead of failing earlier during JSON deserialization.

data class LoginRequest(
    @NotBlank(message = "شماره تلفن همراه نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^09\\d{9}$", message = "شماره تلفن همراه معتبر نیست. (نمونه: 09123456789)")
    val mobile: String?,
)

data class VerifyOtpRequest(
    @NotBlank(message = "شماره تلفن همراه نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^09\\d{9}$", message = "شماره تلفن همراه معتبر نیست.")
    val mobile: String?,

    @NotBlank(message = "کد تأیید نمی‌تواند خالی باشد.")
    @Pattern(regexp = "^\\d{4}$", message = "کد تأیید باید ۴ رقم باشد.")
    val code: String?,
)

data class AuthResponse(
    val accessToken: String,
    val refreshToken: String,
    val user: UserDto,
) {
    data class UserDto(
        val id: Long?,
        val mobile: String,
        val fullName: String?,
        val email: String?,
        val userType: String,
        val roles: Set<String>,
        val permissions: Set<String>,
    )
}
