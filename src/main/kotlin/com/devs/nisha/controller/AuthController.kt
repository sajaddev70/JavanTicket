package com.devs.nisha.controller

import com.devs.nisha.dto.ApiResponse
import com.devs.nisha.dto.auth.AuthResponse
import com.devs.nisha.dto.auth.LoginRequest
import com.devs.nisha.dto.auth.VerifyOtpRequest
import com.devs.nisha.service.auth.AuthService
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

// Request fields are validated (@NotBlank) before these handlers run, so `!!` cannot fail here.
@RestController
@RequestMapping("/api/v1/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/admin/login")
    fun adminLogin(@Valid @RequestBody request: LoginRequest): ResponseEntity<ApiResponse<Unit>> {
        authService.requestAdminOtp(request.mobile!!)
        return ResponseEntity.ok(ApiResponse.ok("کد تأیید برای مدیر ارسال شد.", null))
    }

    @PostMapping("/admin/verify")
    fun verifyAdminOtp(@Valid @RequestBody request: VerifyOtpRequest): ResponseEntity<ApiResponse<AuthResponse>> =
        ResponseEntity.ok(ApiResponse.ok("ورود با موفقیت انجام شد.", authService.verifyAdminOtp(request.mobile!!, request.code!!)))

    @PostMapping("/user/login")
    fun userLogin(@Valid @RequestBody request: LoginRequest): ResponseEntity<ApiResponse<Unit>> {
        authService.requestUserOtp(request.mobile!!)
        return ResponseEntity.ok(ApiResponse.ok("کد تأیید ارسال شد.", null))
    }

    @PostMapping("/user/verify")
    fun verifyUserOtp(@Valid @RequestBody request: VerifyOtpRequest): ResponseEntity<ApiResponse<AuthResponse>> =
        ResponseEntity.ok(ApiResponse.ok("ورود با موفقیت انجام شد.", authService.verifyUserOtp(request.mobile!!, request.code!!)))
}
