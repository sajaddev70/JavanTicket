package com.devs.nisha_user.ui.tickets

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketListItem
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.domain.usecase.GetTicketUseCase
import com.devs.nisha_user.domain.usecase.GetTicketsUseCase
import com.devs.nisha_user.domain.usecase.SendTicketSmsUseCase
import com.devs.nisha_user.ui.navigation.TicketRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TicketsUiState(
    val scope: TicketScope = TicketScope.UPCOMING,
    val items: List<TicketListItem> = emptyList(),
    val counts: Map<String, Int> = emptyMap(),
    val page: Int = 0,
    val hasMore: Boolean = true,
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val refreshing: Boolean = false,
    val error: AppError? = null,
)

/** features/tickets/TicketsView.tsx: upcoming / past / cancelled tickets with the count of each tab. */
@HiltViewModel
class TicketsViewModel @Inject constructor(private val getTickets: GetTicketsUseCase) : ViewModel() {
    private val _state = MutableStateFlow(TicketsUiState())
    val state: StateFlow<TicketsUiState> = _state.asStateFlow()
    private var job: Job? = null

    init {
        reload()
    }

    fun select(scope: TicketScope) {
        if (scope == _state.value.scope) return
        _state.update { it.copy(scope = scope, items = emptyList()) }
        reload()
    }

    fun reload(refresh: Boolean = false) {
        job?.cancel()
        _state.update { it.copy(loading = !refresh, refreshing = refresh, error = null) }
        job = viewModelScope.launch { load(1) }
    }

    fun loadMore() {
        val s = _state.value
        if (s.loading || s.loadingMore || !s.hasMore || s.error != null) return
        _state.update { it.copy(loadingMore = true) }
        job = viewModelScope.launch { load(s.page + 1) }
    }

    private suspend fun load(page: Int) {
        try {
            val r = getTickets(_state.value.scope, page)
            _state.update {
                it.copy(
                    items = if (page == 1) r.items else it.items + r.items,
                    counts = r.counts,
                    page = page,
                    hasMore = r.hasMore,
                    loading = false,
                    loadingMore = false,
                    refreshing = false,
                )
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            _state.update { it.copy(loading = false, loadingMore = false, refreshing = false, error = e.appError) }
        }
    }
}

data class TicketUiState(val ticket: TicketDetail? = null, val error: AppError? = null, val sending: Boolean = false)

@HiltViewModel
class TicketViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val getTicket: GetTicketUseCase,
    private val sendSms: SendTicketSmsUseCase,
    private val toaster: Toaster,
) : ViewModel() {
    private val id = savedState.toRoute<TicketRoute>().id
    private val _state = MutableStateFlow(TicketUiState())
    val state: StateFlow<TicketUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            try {
                _state.update { it.copy(ticket = getTicket(id), error = null) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError) }
            }
        }
    }

    fun sms() {
        _state.update { it.copy(sending = true) }
        viewModelScope.launch {
            try {
                toaster.success(sendSms(id))
            } catch (e: Exception) {
                toaster.error(e.appError.message)
            } finally {
                _state.update { it.copy(sending = false) }
            }
        }
    }
}
