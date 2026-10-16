package com.devs.nisha_user.ui.eventdetail

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.common.appResult
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.usecase.GetEventDetailUseCase
import com.devs.nisha_user.domain.usecase.availability
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EventDetailUiState(
    val event: Async<EventDetail> = Async.Loading(),
    /** Session the buy button acts on: the first bookable one until the user picks another. */
    val selectedSessionId: Long? = null,
)

@HiltViewModel
class EventDetailViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val getEvent: GetEventDetailUseCase,
) : ViewModel() {

    val slug: String = savedState.toRoute<EventDetailRoute>().slug
    private val _state = MutableStateFlow(EventDetailUiState())
    val state: StateFlow<EventDetailUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        val previous = _state.value.event.valueOrNull
        _state.update { it.copy(event = Async.Loading(previous)) }
        viewModelScope.launch {
            val result = appResult { getEvent(slug) }
            _state.update { s ->
                val event = result.getOrNull()
                s.copy(
                    event = Async.of(result, previous),
                    selectedSessionId = s.selectedSessionId ?: event?.sessions?.firstOrNull { it.availability(Fa::number).bookable }?.id,
                )
            }
        }
    }

    fun select(sessionId: Long) = _state.update { it.copy(selectedSessionId = sessionId) }
}
