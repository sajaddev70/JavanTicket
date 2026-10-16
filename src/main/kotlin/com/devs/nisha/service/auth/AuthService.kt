package com.devs.nisha.service.auth

import com.devs.nisha.dto.auth.AuthResponse
import com.devs.nisha.entity.Otp
import com.devs.nisha.entity.User
import com.devs.nisha.exception.BusinessException
import com.devs.nisha.repository.OtpRepository
import com.devs.nisha.repository.UserRepository
import com.devs.nisha.security.AdminAccess
import com.devs.nisha.security.JwtProvider
import com.devs.nisha.service.activity.ActivityLogService
import com.devs.nisha.service.sms.SmsService
import jakarta.servlet.http.HttpServletRequest
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
    private val adminAccess: AdminAccess,
    private val activity: ActivityLogService,
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

    fun verifyAdminOtp(mobile: String, code: String, request: HttpServletRequest? = null): AuthResponse {
        val admin = userRepository.findByMobileAndUserType(mobile, ADMIN)
            ?: throw BusinessException("این شماره تلفن دسترسی به پنل مدیریت ندارد.", HttpStatus.FORBIDDEN)
        ensureActive(admin)
        validateCode(mobile, code, ADMIN)
        admin.lastLoginAt = LocalDateTime.now()
        userRepository.save(admin)
        activity.record(adminAccess.load(mobile), "LOGIN", null, "ورود به پنل مدیریت", request, 200)
        return buildAuthResponse(admin, ADMIN)
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
        return buildAuthResponse(user, USER)
    }

    /** New access + refresh tokens for a site user, from a still valid refresh token. */
    fun refreshUser(refreshToken: String): AuthResponse {
        val claims = jwtProvider.parseRefresh(refreshToken)
        if (claims == null || claims["userType"] != USER) throw BusinessException(SESSION_EXPIRED, HttpStatus.UNAUTHORIZED)
        val user = userRepository.findByMobile(claims.subject) ?: throw BusinessException(SESSION_EXPIRED, HttpStatus.UNAUTHORIZED)
        if (user.status != "ACTIVE") throw BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.UNAUTHORIZED)
        return buildAuthResponse(user, USER)
    }

    private fun ensureActive(user: User) {
        if (user.status == "DISABLED") {
            throw BusinessException("حساب کاربری شما غیرفعال شده است.", HttpStatus.FORBIDDEN)
        }
    }

    /** Random 4-digit code when SMS is really sent; the fixed dev code (1111) while SMS runs in development mode. */
    private fun saveAndSendOtp(mobile: String, domain: String) {
        val code = if (smsService.sendsRealSms) "%04d".format(random.nextInt(10_000)) else devOtpCode
        otpRepository.save(Otp(mobile = mobile, code = code, domain = domain, expiresAt = LocalDateTime.now().plusMinutes(2)))
        smsService.sendOtp(mobile, code)
    }

    private fun validateCode(mobile: String, code: String, domain: String) {
        // The dev code works only while no real SMS is sent (no Kavenegar API key).
        if (!smsService.sendsRealSms && devOtpCode == code) return

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

    private fun buildAuthResponse(user: User, userType: String) = AuthResponse(
        accessToken = jwtProvider.generateToken(user.mobile, userType),
        refreshToken = jwtProvider.generateRefreshToken(user.mobile, userType),
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
        const val SESSION_EXPIRED = "نشست شما منقضی شده است. لطفاً مجدداً وارد شوید."
        val random = java.security.SecureRandom()
    }
}
