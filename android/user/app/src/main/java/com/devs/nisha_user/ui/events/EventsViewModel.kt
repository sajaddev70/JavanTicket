package com.devs.nisha_user.ui.events

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.domain.model.EventFilters
import com.devs.nisha_user.domain.model.EventSort
import com.devs.nisha_user.domain.model.EventType
import com.devs.nisha_user.domain.model.EventWhen
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.usecase.AppSettingsUseCase
import com.devs.nisha_user.domain.usecase.SearchEventsUseCase
import com.devs.nisha_user.ui.navigation.EventsRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class EventsUiState(
    val filters: EventFilters = EventFilters(),
    /** True when the city filter was set on this screen (otherwise the header city applies). */
    val cityOverridden: Boolean = false,
    val items: List<PublicEvent> = emptyList(),
    val total: Int = 0,
    val page: Int = 0,
    val hasMore: Boolean = true,
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val error: AppError? = null,
    val grid: Boolean = true,
)

/**
 * Events screen (features/events/EventsBrowser.tsx): server-side filters and paging. The web keeps the filters in the
 * URL; here they start from the route (homepage links) and live in this ViewModel. Pages load as the list scrolls.
 */
@HiltViewModel
class EventsViewModel @Inject constructor(
    savedState: SavedStateHandle,
    private val search: SearchEventsUseCase,
    private val settings: AppSettingsUseCase,
) : ViewModel() {

    private val route = savedState.toRoute<EventsRoute>()
    private val _state = MutableStateFlow(
        EventsUiState(
            filters = EventFilters(
                q = route.q.orEmpty(),
                category = route.category.orEmpty(),
                cityId = when (route.city) {
                    null -> settings.cityId.value
                    -1L -> null
                    else -> route.city
                },
                whenFilter = EventWhen.entries.firstOrNull { it.api == route.whenFilter } ?: EventWhen.ANY,
                type = EventType.entries.firstOrNull { it.api == route.type } ?: EventType.ANY,
                sort = EventSort.entries.firstOrNull { it.api == route.sort } ?: EventSort.NEWEST,
            ),
            cityOverridden = route.city != null,
        ),
    )
    val state: StateFlow<EventsUiState> = _state.asStateFlow()
    private var job: Job? = null

    init {
        reload()
        // Without a city of its own, the list follows the header city.
        viewModelScope.launch {
            settings.cityId.drop(1).collect { id -> if (!_state.value.cityOverridden) update { it.copy(cityId = id) } }
        }
    }

    fun update(change: (EventFilters) -> EventFilters) {
        val next = change(_state.value.filters)
        if (next == _state.value.filters) return
        _state.update { it.copy(filters = next) }
        reload()
    }

    fun setCity(id: Long?) {
        _state.update { it.copy(cityOverridden = true) }
        update { it.copy(cityId = id) }
    }

    fun clear() {
        _state.update { it.copy(cityOverridden = false) }
        update { EventFilters(cityId = settings.cityId.value) }
    }

    fun toggleView() = _state.update { it.copy(grid = !it.grid) }

    fun reload() {
        job?.cancel()
        _state.update { it.copy(loading = true, error = null, page = 0, hasMore = true) }
        job = viewModelScope.launch { loadPage(1) }
    }

    fun loadMore() {
        val s = _state.value
        if (s.loading || s.loadingMore || !s.hasMore || s.error != null) return
        _state.update { it.copy(loadingMore = true) }
        job = viewModelScope.launch { loadPage(s.page + 1) }
    }

    private suspend fun loadPage(page: Int) {
        try {
            val result = search(_state.value.filters, page)
            _state.update {
                it.copy(
                    items = if (page == 1) result.items else it.items + result.items.filter { e -> it.items.none { x -> x.id == e.id } },
                    total = result.total,
                    page = page,
                    hasMore = result.hasMore,
                    loading = false,
                    loadingMore = false,
                )
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            _state.update { it.copy(loading = false, loadingMore = false, error = e.appError) }
        }
    }
}
