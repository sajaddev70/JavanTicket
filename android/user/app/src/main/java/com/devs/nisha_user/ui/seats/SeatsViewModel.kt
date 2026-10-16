package com.devs.nisha_user.ui.seats

import android.os.SystemClock
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Seat
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.domain.model.SeatStatus
import com.devs.nisha_user.domain.repository.ContentRepository
import com.devs.nisha_user.domain.usecase.GetSeatMapUseCase
import com.devs.nisha_user.domain.usecase.ReleaseAllSeatsUseCase
import com.devs.nisha_user.domain.usecase.ToggleSeatUseCase
import com.devs.nisha_user.ui.navigation.SeatsRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import java.time.Instant
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

data class SeatsUiState(
    val data: SeatMapData? = null,
    val error: AppError? = null,
    /** elapsedRealtime of the last answer: anchors the hold countdown. */
    val receivedAt: Long = 0,
    /** Seats whose lock / release request is in flight. */
    val pending: Set<Long> = emptySet(),
    val feePercent: Double = 0.0,
) {
    val selected: List<Seat> get() = data?.seats?.filter { it.status == SeatStatus.SELECTED }.orEmpty()
    val maxSeats: Int get() = data?.hold?.maxSeats ?: 10

    fun priceOf(seat: Seat): Double {
        val session = data?.session ?: return 0.0
        return session.tiers.firstOrNull { it.code == seat.tierCode }?.price ?: session.price
    }

    val subtotal: Double get() = selected.sumOf { priceOf(it) }

    /** Preview only: the order's fee is calculated by the backend at checkout. */
    val fee: Double get() = Math.round(subtotal * feePercent / 100.0).toDouble()

    val onSale: Boolean
        get() {
            val s = data?.session ?: return false
            return s.status == "ACTIVE" && Fa.instant(s.startTime).isAfter(Instant.now())
        }
}

@HiltViewModel
class SeatsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val getSeatMap: GetSeatMapUseCase,
    private val toggleSeat: ToggleSeatUseCase,
    private val releaseAllSeats: ReleaseAllSeatsUseCase,
    content: ContentRepository,
    private val toaster: Toaster,
) : ViewModel() {

    val sessionId: Long = savedState.toRoute<SeatsRoute>().sessionId
    private val _state = MutableStateFlow(SeatsUiState(feePercent = content.settings.value?.serviceFeePercent ?: 0.0))
    val state: StateFlow<SeatsUiState> = _state.asStateFlow()
    private var polling: Job? = null

    init {
        load()
    }

    fun load() {
        viewModelScope.launch { fetch() }
    }

    private suspend fun fetch() {
        try {
            val data = getSeatMap(sessionId)
            _state.update { it.copy(data = data, error = null, receivedAt = SystemClock.elapsedRealtime()) }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            _state.update { it.copy(error = e.appError) }
        }
    }

    /** Other buyers pick seats too: keep the map fresh while the screen is visible. */
    fun startPolling() {
        if (polling?.isActive == true) return
        polling = viewModelScope.launch {
            while (isActive) {
                delay(15_000)
                if (_state.value.pending.isEmpty()) fetch()
            }
        }
    }

    fun stopPolling() {
        polling?.cancel()
    }

    fun toggle(seat: Seat) {
        val s = _state.value
        if (!s.onSale || !seat.selectable || seat.id in s.pending) return
        _state.update { it.copy(pending = it.pending + seat.id) }
        viewModelScope.launch {
            try {
                val (status, hold) = toggleSeat(sessionId, seat, s.selected.size, s.maxSeats)
                patch(seat.id, status)
                _state.update { it.copy(data = it.data?.copy(hold = hold), receivedAt = SystemClock.elapsedRealtime()) }
            } catch (e: Exception) {
                val error = e.appError
                toaster.error(error.message)
                if (error.isConflict) patch(seat.id, SeatStatus.LOCKED)
                if (error.status != null) fetch()
            } finally {
                _state.update { it.copy(pending = it.pending - seat.id) }
            }
        }
    }

    fun releaseAll() {
        viewModelScope.launch {
            try {
                releaseAllSeats(sessionId)
            } catch (e: Exception) {
                toaster.error(e.appError.message)
            }
            fetch()
        }
    }

    fun onHoldExpired() {
        toaster.error("زمان نگهداری صندلی‌ها به پایان رسید و آزاد شدند. لطفاً دوباره انتخاب کنید.")
        load()
    }

    private fun patch(seatId: Long, status: SeatStatus) = _state.update { s ->
        s.copy(data = s.data?.copy(seats = s.data.seats.map { if (it.id == seatId) it.copy(status = status) else it }))
    }
}
