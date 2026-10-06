package com.youthevent.platform.service.auth;

import com.youthevent.platform.dto.auth.AuthResponse;

public interface AuthService {
    void requestAdminOtp(String mobile);
    AuthResponse verifyAdminOtp(String mobile, String code);
    void requestUserOtp(String mobile);
    AuthResponse verifyUserOtp(String mobile, String code);
}
