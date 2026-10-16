package com.devs.nisha_user.ui.auth

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.domain.usecase.SendOtpUseCase
import com.devs.nisha_user.domain.usecase.VerifyOtpUseCase
import com.devs.nisha_user.ui.navigation.LinkRouter
import com.devs.nisha_user.ui.navigation.LoginRoute
import com.devs.nisha_user.ui.navigation.VerifyRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(val mobile: String = "", val error: String? = null, val sending: Boolean = false)

/** features/auth/LoginView.tsx: the mobile number; the backend sends the code by SMS. */
@HiltViewModel
class LoginViewModel @Inject constructor(savedState: SavedStateHandle, private val sendOtp: SendOtpUseCase) : ViewModel() {
    val next: String = LinkRouter.safeNext(savedState.toRoute<LoginRoute>().next)
    private val _state = MutableStateFlow(LoginUiState())
    val state: StateFlow<LoginUiState> = _state.asStateFlow()
    private val _sent = Channel<String>(Channel.BUFFERED)
    /** Normalized mobile the code was sent to. */
    val sent = _sent.receiveAsFlow()

    fun setMobile(value: String) = _state.update { it.copy(mobile = value, error = null) }

    fun submit() {
        if (_state.value.sending) return
        _state.update { it.copy(sending = true, error = null) }
        viewModelScope.launch {
            try {
                _sent.send(sendOtp(_state.value.mobile))
                _state.update { it.copy(sending = false) }
            } catch (e: Exception) {
                _state.update { it.copy(sending = false, error = e.appError.message) }
            }
        }
    }
}

data class VerifyUiState(
    val digits: List<String> = List(VerifyOtpUseCase.OTP_LENGTH) { "" },
    val error: String? = null,
    val verifying: Boolean = false,
    val resendLeft: Int = VerifyOtpUseCase.RESEND_SECONDS,
    val resending: Boolean = false,
) {
    val code: String get() = digits.joinToString("")
    val complete: Boolean get() = digits.all { it.isNotEmpty() }
}

/** features/auth/VerifyView.tsx: the 4-digit code, resend after two minutes, then back to where the user was. */
@HiltViewModel
class VerifyViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val verifyOtp: VerifyOtpUseCase,
    private val sendOtp: SendOtpUseCase,
    private val toaster: Toaster,
) : ViewModel() {
    private val route = savedState.toRoute<VerifyRoute>()
    val mobile: String = route.mobile
    val next: String = LinkRouter.safeNext(route.next)
    private val _state = MutableStateFlow(VerifyUiState())
    val state: StateFlow<VerifyUiState> = _state.asStateFlow()
    private val _done = Channel<String>(Channel.BUFFERED)
    /** Emits the path to continue to after signing in. */
    val done = _done.receiveAsFlow()

    init {
        startCountdown()
    }

    private fun startCountdown() {
        viewModelScope.launch {
            _state.update { it.copy(resendLeft = VerifyOtpUseCase.RESEND_SECONDS) }
            while (_state.value.resendLeft > 0) {
                delay(1000)
                _state.update { it.copy(resendLeft = it.resendLeft - 1) }
            }
        }
    }

    fun setDigits(digits: List<String>) {
        _state.update { it.copy(digits = digits, error = null) }
        if (_state.value.complete) submit()
    }

    fun submit() {
        val s = _state.value
        if (s.verifying || !s.complete) return
        _state.update { it.copy(verifying = true, error = null) }
        viewModelScope.launch {
            try {
                verifyOtp(mobile, s.code)
                toaster.success("ورود با موفقیت انجام شد.")
                _done.send(next)
            } catch (e: Exception) {
                _state.update { it.copy(verifying = false, error = e.appError.message, digits = List(VerifyOtpUseCase.OTP_LENGTH) { "" }) }
            }
        }
    }

    fun resend() {
        if (_state.value.resendLeft > 0 || _state.value.resending) return
        _state.update { it.copy(resending = true) }
        viewModelScope.launch {
            try {
                sendOtp(mobile)
                toaster.success("کد تأیید جدید ارسال شد.")
                _state.update { it.copy(resending = false, digits = List(VerifyOtpUseCase.OTP_LENGTH) { "" }, error = null) }
                startCountdown()
            } catch (e: Exception) {
                _state.update { it.copy(resending = false) }
                toaster.error(e.appError.message)
            }
        }
    }
}
