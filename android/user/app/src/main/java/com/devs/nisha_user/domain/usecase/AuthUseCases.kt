package com.devs.nisha_user.domain.usecase

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.format.normalizeIranMobile
import com.devs.nisha_user.domain.model.AuthUser
import com.devs.nisha_user.domain.repository.AuthRepository
import com.devs.nisha_user.domain.repository.FavoritesRepository
import javax.inject.Inject
import kotlinx.coroutines.flow.StateFlow

/** UC-01 Sign in with mobile and SMS code (step 1): validates the number and asks the backend to send the code. */
class SendOtpUseCase @Inject constructor(private val auth: AuthRepository) {
    /** Returns the normalized mobile (09XXXXXXXXX) the code was sent to. */
    suspend operator fun invoke(input: String): String {
        val mobile = validateMobile(input)
        auth.sendOtp(mobile)
        return mobile
    }

    companion object {
        fun validateMobile(input: String): String {
            if (input.isBlank()) throw AppError("شماره موبایل خود را وارد کنید.")
            return normalizeIranMobile(input) ?: throw AppError("شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹")
        }
    }
}

/** UC-01 (step 2): checks the 4-digit code; on success the session is stored and favorites are loaded. */
class VerifyOtpUseCase @Inject constructor(private val auth: AuthRepository, private val favorites: FavoritesRepository) {
    suspend operator fun invoke(mobile: String, code: String): AuthUser {
        if (code.length != OTP_LENGTH) throw AppError("کد تأیید را کامل وارد کنید.")
        val user = auth.verifyOtp(mobile, code)
        runCatching { favorites.refreshIds() }
        return user
    }

    companion object {
        const val OTP_LENGTH = 4
        const val RESEND_SECONDS = 120
    }
}

class ObserveUserUseCase @Inject constructor(private val auth: AuthRepository) {
    operator fun invoke(): StateFlow<AuthUser?> = auth.user
}

/** UC-13 Sign out: drops the session and every user-specific cache. */
class SignOutUseCase @Inject constructor(private val auth: AuthRepository, private val favorites: FavoritesRepository) {
    operator fun invoke() {
        auth.signOut()
        favorites.clear()
    }
}
