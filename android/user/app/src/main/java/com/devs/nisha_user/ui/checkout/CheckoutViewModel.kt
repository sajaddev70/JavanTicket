package com.devs.nisha_user.ui.checkout

import android.os.SystemClock
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.usecase.ApplyDiscountUseCase
import com.devs.nisha_user.domain.usecase.BuyerForm
import com.devs.nisha_user.domain.usecase.CreateOrderUseCase
import com.devs.nisha_user.domain.usecase.GetOrderUseCase
import com.devs.nisha_user.domain.usecase.RemoveDiscountUseCase
import com.devs.nisha_user.domain.usecase.SubmitBuyerUseCase
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.receiveAsFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CheckoutUiState(
    /** "در حال ثبت سفارش ..." while the order is being created from the held seats. */
    val creating: Boolean = false,
    val createError: AppError? = null,
    val order: Order? = null,
    val receivedAt: Long = 0,
    val loadError: AppError? = null,
    val form: BuyerForm = BuyerForm(),
    val fieldErrors: Map<String, String> = emptyMap(),
    val submitting: Boolean = false,
    val code: String = "",
    val discountError: String? = null,
    val discountBusy: Boolean = false,
)

sealed interface CheckoutEvent {
    data class GoToPayment(val orderNumber: String) : CheckoutEvent
}

/**
 * Checkout (features/checkout/CheckoutView.tsx). Opened with a session (and a ticket count for general admission) it
 * first creates the order from this device's held seats; then it shows the order the backend calculated.
 */
@HiltViewModel
class CheckoutViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val createOrder: CreateOrderUseCase,
    private val getOrder: GetOrderUseCase,
    private val submitBuyer: SubmitBuyerUseCase,
    private val applyDiscount: ApplyDiscountUseCase,
    private val removeDiscount: RemoveDiscountUseCase,
    private val toaster: Toaster,
) : ViewModel() {

    private val route = savedState.toRoute<CheckoutRoute>()
    val sessionId: Long? = route.sessionId
    private var number: String? = route.order

    private val _state = MutableStateFlow(CheckoutUiState())
    val state: StateFlow<CheckoutUiState> = _state.asStateFlow()
    private val _events = Channel<CheckoutEvent>(Channel.BUFFERED)
    val events = _events.receiveAsFlow()

    init {
        if (number != null) load() else if (sessionId != null) create(sessionId, route.quantity)
    }

    private fun create(sessionId: Long, quantity: Int?) {
        _state.update { it.copy(creating = true, createError = null) }
        viewModelScope.launch {
            try {
                number = createOrder(sessionId, quantity)
                _state.update { it.copy(creating = false) }
                load()
            } catch (e: Exception) {
                _state.update { it.copy(creating = false, createError = e.appError) }
            }
        }
    }

    fun load() {
        val n = number ?: return
        viewModelScope.launch {
            try {
                val order = getOrder(n)
                _state.update { s ->
                    s.copy(
                        order = order,
                        receivedAt = SystemClock.elapsedRealtime(),
                        loadError = null,
                        // Fill the form once, from the order (or the signed-in user's details).
                        form = if (s.order == null) BuyerForm(
                            firstName = order.buyerFirstName ?: order.userFirstName.orEmpty(),
                            lastName = order.buyerLastName ?: order.userLastName.orEmpty(),
                            mobile = order.buyerMobile ?: order.userMobile,
                            email = order.buyerEmail ?: order.userEmail.orEmpty(),
                            note = order.buyerNote.orEmpty(),
                        ) else s.form,
                    )
                }
            } catch (e: Exception) {
                _state.update { it.copy(loadError = e.appError) }
            }
        }
    }

    fun edit(change: (BuyerForm) -> BuyerForm) = _state.update { s ->
        val form = change(s.form)
        // Clear a field's error as soon as it is edited.
        val changed = SubmitBuyerUseCase.validate(form).keys
        s.copy(form = form, fieldErrors = s.fieldErrors.filterKeys { it in changed })
    }

    fun submit() {
        val n = number ?: return
        val errors = SubmitBuyerUseCase.validate(_state.value.form)
        if (errors.isNotEmpty()) {
            _state.update { it.copy(fieldErrors = errors) }
            return
        }
        _state.update { it.copy(submitting = true) }
        viewModelScope.launch {
            try {
                val order = submitBuyer(n, _state.value.form)
                _state.update { it.copy(order = order, submitting = false) }
                _events.send(CheckoutEvent.GoToPayment(n))
            } catch (e: Exception) {
                val error = e.appError
                _state.update { it.copy(submitting = false, fieldErrors = error.fieldErrors) }
                toaster.error(error.message)
                load()
            }
        }
    }

    fun setCode(code: String) = _state.update { it.copy(code = code, discountError = null) }

    fun apply() {
        val n = number ?: return
        _state.update { it.copy(discountBusy = true, discountError = null) }
        viewModelScope.launch {
            try {
                val order = applyDiscount(n, _state.value.code)
                _state.update { it.copy(order = order, discountBusy = false, receivedAt = SystemClock.elapsedRealtime()) }
                toaster.success("کد تخفیف اعمال شد.")
            } catch (e: Exception) {
                _state.update { it.copy(discountBusy = false, discountError = e.appError.message) }
            }
        }
    }

    fun remove() {
        val n = number ?: return
        _state.update { it.copy(discountBusy = true) }
        viewModelScope.launch {
            try {
                val order = removeDiscount(n)
                _state.update { it.copy(order = order, discountBusy = false, code = "", receivedAt = SystemClock.elapsedRealtime()) }
            } catch (e: Exception) {
                _state.update { it.copy(discountBusy = false) }
                toaster.error(e.appError.message)
            }
        }
    }
}
