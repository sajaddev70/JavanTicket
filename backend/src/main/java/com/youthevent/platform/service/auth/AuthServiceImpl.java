package com.youthevent.platform.service.auth;

import com.youthevent.platform.dto.auth.AuthResponse;
import com.youthevent.platform.entity.Otp;
import com.youthevent.platform.entity.Permission;
import com.youthevent.platform.entity.Role;
import com.youthevent.platform.entity.User;
import com.youthevent.platform.exception.BusinessException;
import com.youthevent.platform.repository.OtpRepository;
import com.youthevent.platform.repository.UserRepository;
import com.youthevent.platform.security.JwtProvider;
import com.youthevent.platform.service.sms.SmsService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final OtpRepository otpRepository;
    private final SmsService smsService;
    private final JwtProvider jwtProvider;

    @Value("${sms.dev-code:1111}")
    private String devOtpCode;

    @Override
    public void requestAdminOtp(String mobile) {
        Optional<User> userOpt = userRepository.findByMobile(mobile);
        if (userOpt.isEmpty() || !"ADMIN".equals(userOpt.get().getUserType())) {
            throw new BusinessException("این شماره تلفن دسترسی به پنل مدیریت ندارد.", HttpStatus.FORBIDDEN);
        }

        User admin = userOpt.get();
        if ("DISABLED".equals(admin.getStatus())) {
            throw new BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN);
        }

        saveAndSendOtp(mobile, "ADMIN");
    }

    @Override
    public AuthResponse verifyAdminOtp(String mobile, String code) {
        User admin = userRepository.findByMobileAndUserType(mobile, "ADMIN")
                .orElseThrow(() -> new BusinessException("این شماره تلفن دسترسی به پنل مدیریت ندارد.", HttpStatus.FORBIDDEN));

        if ("DISABLED".equals(admin.getStatus())) {
            throw new BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN);
        }

        validateCode(mobile, code, "ADMIN");

        String token = jwtProvider.generateToken(mobile, "ADMIN");
        return buildAuthResponse(admin, token);
    }

    @Override
    public void requestUserOtp(String mobile) {
        Optional<User> userOpt = userRepository.findByMobile(mobile);
        if (userOpt.isEmpty()) {
            // Register auto user
            User newUser = User.builder()
                    .mobile(mobile)
                    .fullName("کاربر " + mobile.substring(mobile.length() - 4))
                    .status("ACTIVE")
                    .userType("USER")
                    .build();
            userRepository.save(newUser);
        } else if ("DISABLED".equals(userOpt.get().getStatus())) {
            throw new BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN);
        }

        saveAndSendOtp(mobile, "USER");
    }

    @Override
    public AuthResponse verifyUserOtp(String mobile, String code) {
        User user = userRepository.findByMobile(mobile)
                .orElseThrow(() -> new BusinessException("کاربر یافت نشد."));

        if ("DISABLED".equals(user.getStatus())) {
            throw new BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN);
        }

        validateCode(mobile, code, "USER");

        String token = jwtProvider.generateToken(mobile, "USER");
        return buildAuthResponse(user, token);
    }

    private void saveAndSendOtp(String mobile, String domain) {
        String code = devOtpCode; // 1111 for dev mode
        Otp otp = Otp.builder()
                .mobile(mobile)
                .code(code)
                .domain(domain)
                .expiresAt(LocalDateTime.now().plusMinutes(2))
                .used(false)
                .build();
        otpRepository.save(otp);

        smsService.sendOtp(mobile, code);
    }

    private void validateCode(String mobile, String code, String domain) {
        // Dev override
        if (devOtpCode.equals(code)) {
            return;
        }

        Otp otp = otpRepository.findTopByMobileAndDomainAndUsedFalseOrderByCreatedAtDesc(mobile, domain)
                .orElseThrow(() -> new BusinessException("کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید."));

        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BusinessException("کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.");
        }

        if (!otp.getCode().equals(code)) {
            throw new BusinessException("کد تأیید واردشده صحیح نیست.");
        }

        otp.setUsed(true);
        otpRepository.save(otp);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        Set<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toSet());

        Set<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getCode)
                .collect(Collectors.toSet());

        AuthResponse.UserDto userDto = AuthResponse.UserDto.builder()
                .id(user.getId())
                .mobile(user.getMobile())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .userType(user.getUserType())
                .roles(roles)
                .permissions(permissions)
                .build();

        return AuthResponse.builder()
                .accessToken(token)
                .refreshToken("refresh-" + token)
                .user(userDto)
                .build();
    }
}
