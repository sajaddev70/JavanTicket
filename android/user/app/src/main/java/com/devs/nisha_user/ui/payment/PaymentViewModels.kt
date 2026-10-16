package com.devs.nisha_user.ui.payment

import android.os.SystemClock
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStatus
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.usecase.AppSettingsUseCase
import com.devs.nisha_user.domain.usecase.GetFeaturedEventsUseCase
import com.devs.nisha_user.domain.usecase.GetOrderUseCase
import com.devs.nisha_user.domain.usecase.GetPaymentMethodsUseCase
import com.devs.nisha_user.domain.usecase.GetPaymentResultUseCase
import com.devs.nisha_user.domain.usecase.StartPaymentUseCase
import com.devs.nisha_user.ui.navigation.PaymentResultRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class PaymentUiState(
    val order: Order? = null,
    val receivedAt: Long = 0,
    val error: AppError? = null,
    val methods: List<PaymentMethod>? = null,
    val methodsError: AppError? = null,
    val chosen: String? = null,
    val starting: Boolean = false,
    val startError: String? = null,
) {
    val method: PaymentMethod? get() = methods?.firstOrNull { it.code == (chosen ?: methods.firstOrNull()?.code) }
}

sealed interface PaymentEvent {
    data class OpenGateway(val url: String, val paymentId: Long) : PaymentEvent
    data object NeedsBuyer : PaymentEvent
}

/** features/payment/PaymentView.tsx: pick a gateway; the backend registers the payment and returns the bank page. */
@HiltViewModel
class PaymentViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val getOrder: GetOrderUseCase,
    private val getMethods: GetPaymentMethodsUseCase,
    private val startPayment: StartPaymentUseCase,
) : ViewModel() {

    val number: String = savedState.toRoute<PaymentRoute>().order
    private val _state = MutableStateFlow(PaymentUiState())
    val state: StateFlow<PaymentUiState> = _state.asStateFlow()
    private val _events = Channel<PaymentEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        load()
        loadMethods()
    }

    fun load() {
        viewModelScope.launch {
            try {
                val order = getOrder(number)
                _state.update { it.copy(order = order, receivedAt = SystemClock.elapsedRealtime(), error = null) }
                // Buyer details come first (they are on the order and checked again by the backend).
                if (order.needsBuyer) _events.send(PaymentEvent.NeedsBuyer)
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError) }
            }
        }
    }

    fun loadMethods() {
        viewModelScope.launch {
            try {
                _state.update { it.copy(methods = getMethods(), methodsError = null) }
            } catch (e: Exception) {
                _state.update { it.copy(methodsError = e.appError) }
            }
        }
    }

    fun choose(code: String) = _state.update { it.copy(chosen = code) }

    fun start() {
        val method = _state.value.method ?: return
        _state.update { it.copy(starting = true, startError = null) }
        viewModelScope.launch {
            try {
                val start = startPayment(number, method.code)
                _events.send(PaymentEvent.OpenGateway(start.redirectUrl, start.paymentId))
                _state.update { it.copy(starting = false) }
            } catch (e: Exception) {
                _state.update { it.copy(starting = false, startError = e.appError.message) }
                load()
            }
        }
    }
}

data class PaymentResultUiState(
    val result: PaymentResult? = null,
    val error: AppError? = null,
    val suggestions: List<PublicEvent> = emptyList(),
)

/** features/payment/PaymentResultView.tsx: the verified payment; a payment still being verified is re-checked. */
@HiltViewModel
class PaymentResultViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val getResult: GetPaymentResultUseCase,
    private val featured: GetFeaturedEventsUseCase,
    private val settings: AppSettingsUseCase,
) : ViewModel() {

    private val id: Long = savedState.toRoute<PaymentResultRoute>().id
    private val _state = MutableStateFlow(PaymentResultUiState())
    val state: StateFlow<PaymentResultUiState> = _state.asStateFlow()
    private var poll: Job? = null

    init {
        load()
        viewModelScope.launch { runCatching { featured(settings.cityId.value) }.onSuccess { list -> _state.update { it.copy(suggestions = list) } } }
    }

    fun load() {
        poll?.cancel()
        poll = viewModelScope.launch {
            while (true) {
                try {
                    val result = getResult(id)
                    _state.update { it.copy(result = result, error = null) }
                    if (result.status != PaymentStatus.INITIATED) break
                } catch (e: Exception) {
                    if (e is kotlinx.coroutines.CancellationException) throw e
                    _state.update { it.copy(error = e.appError) }
                    break
                }
                delay(4000)
            }
        }
    }
}
