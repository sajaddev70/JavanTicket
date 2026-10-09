package com.devs.nisha.service.auth

import com.devs.nisha.dto.auth.AuthResponse
import com.devs.nisha.entity.Otp
import com.devs.nisha.entity.User
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.repository.OtpRepository
import com.devs.nisha.repository.UserRepository
import com.devs.nisha.security.JwtProvider
import com.devs.nisha.service.sms.SmsService
import org.springframework.beans.factory.annotation.Value
import org.springframework.http.HttpStatus
import org.springframework.stereotype.Service
import java.time.LocalDateTime

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val otpRepository: OtpRepository,
    private val smsService: SmsService,
    private val jwtProvider: JwtProvider,
    @Value("\${sms.dev-code:1111}") private val devOtpCode: String,
) {

    fun requestAdminOtp(mobile: String) {
        val admin = userRepository.findByMobile(mobile)
        if (admin == null || admin.userType != ADMIN) {
            throw BusinessException("این شماره تلفن دسترسی به پنل مدیریت ندارد.", HttpStatus.FORBIDDEN)
        }
        ensureActive(admin)
        saveAndSendOtp(mobile, ADMIN)
    }

    fun verifyAdminOtp(mobile: String, code: String): AuthResponse {
        val admin = userRepository.findByMobileAndUserType(mobile, ADMIN)
            ?: throw BusinessException("این شماره تلفن دسترسی به پنل مدیریت ندارد.", HttpStatus.FORBIDDEN)
        ensureActive(admin)
        validateCode(mobile, code, ADMIN)
        return buildAuthResponse(admin, jwtProvider.generateToken(mobile, ADMIN))
    }

    fun requestUserOtp(mobile: String) {
        val user = userRepository.findByMobile(mobile)
        if (user == null) {
            // Auto-register new users on first login
            userRepository.save(User(mobile = mobile, fullName = "کاربر ${mobile.takeLast(4)}", userType = USER))
        } else {
            ensureActive(user)
        }
        saveAndSendOtp(mobile, USER)
    }

    fun verifyUserOtp(mobile: String, code: String): AuthResponse {
        val user = userRepository.findByMobile(mobile) ?: throw BusinessException("کاربر یافت نشد.")
        ensureActive(user)
        validateCode(mobile, code, USER)
        return buildAuthResponse(user, jwtProvider.generateToken(mobile, USER))
    }

    private fun ensureActive(user: User) {
        if (user.status == "DISABLED") {
            throw BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN)
        }
    }

    private fun saveAndSendOtp(mobile: String, domain: String) {
        val code = devOtpCode // 1111 for dev mode
        otpRepository.save(Otp(mobile = mobile, code = code, domain = domain, expiresAt = LocalDateTime.now().plusMinutes(2)))
        smsService.sendOtp(mobile, code)
    }

    private fun validateCode(mobile: String, code: String, domain: String) {
        // Dev override
        if (devOtpCode == code) return

        val otp = otpRepository.findTopByMobileAndDomainAndUsedFalseOrderByCreatedAtDesc(mobile, domain)
            ?: throw BusinessException("کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.")
        if (otp.expiresAt.isBefore(LocalDateTime.now())) {
            throw BusinessException("کد تأیید منقضی شده است. لطفاً کد جدید دریافت کنید.")
        }
        if (otp.code != code) {
            throw BusinessException("کد تأیید واردشده صحیح نیست.")
        }
        otp.used = true
        otpRepository.save(otp)
    }

    private fun buildAuthResponse(user: User, token: String) = AuthResponse(
        accessToken = token,
        refreshToken = "refresh-$token",
        user = AuthResponse.UserDto(
            id = user.id,
            mobile = user.mobile,
            fullName = user.fullName,
            email = user.email,
            userType = user.userType,
            roles = user.roles.map { it.name }.toSet(),
            permissions = user.roles.flatMap { it.permissions }.map { it.code }.toSet(),
        ),
    )

    private companion object {
        const val ADMIN = "ADMIN"
        const val USER = "USER"
    }
}
