package com.youthevent.platform.controller;

import com.youthevent.platform.dto.ApiResponse;
import com.youthevent.platform.dto.auth.AuthResponse;
import com.youthevent.platform.dto.auth.LoginRequest;
import com.youthevent.platform.dto.auth.VerifyOtpRequest;
import com.youthevent.platform.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/admin/login")
    public ResponseEntity<ApiResponse<Void>> adminLogin(@Valid @RequestBody LoginRequest request) {
        authService.requestAdminOtp(request.getMobile());
        return ResponseEntity.ok(ApiResponse.ok("کد تأیید برای مدیر ارسال شد.", null));
    }

    @PostMapping("/admin/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyAdminOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyAdminOtp(request.getMobile(), request.getCode());
        return ResponseEntity.ok(ApiResponse.ok("ورود با موفقیت انجام شد.", response));
    }

    @PostMapping("/user/login")
    public ResponseEntity<ApiResponse<Void>> userLogin(@Valid @RequestBody LoginRequest request) {
        authService.requestUserOtp(request.getMobile());
        return ResponseEntity.ok(ApiResponse.ok("کد تأیید ارسال شد.", null));
    }

    @PostMapping("/user/verify")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyUserOtp(@Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse response = authService.verifyUserOtp(request.getMobile(), request.getCode());
        return ResponseEntity.ok(ApiResponse.ok("ورود با موفقیت انجام شد.", response));
    }
}
