package com.devs.nisha_user.ui.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.common.appResult
import com.devs.nisha_user.domain.usecase.AppSettingsUseCase
import com.devs.nisha_user.domain.usecase.GetHomeFeedUseCase
import com.devs.nisha_user.domain.usecase.HomeFeed
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.launch

data class HomeUiState(val feed: Async<HomeFeed> = Async.Loading(), val refreshing: Boolean = false)

/** Homepage feed; reloads when the header city changes (every row follows it). */
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val getHomeFeed: GetHomeFeedUseCase,
    private val settings: AppSettingsUseCase,
) : ViewModel() {

    private val _state = MutableStateFlow(HomeUiState())
    val state: StateFlow<HomeUiState> = _state.asStateFlow()
    private var job: Job? = null

    init {
        load()
        viewModelScope.launch { settings.cityId.drop(1).collect { load() } }
    }

    fun load(refresh: Boolean = false) {
        job?.cancel()
        val previous = _state.value.feed.valueOrNull
        _state.value = HomeUiState(if (refresh) _state.value.feed else Async.Loading(previous), refreshing = refresh)
        job = viewModelScope.launch {
            val result = appResult { getHomeFeed(settings.cityId.value) }
            _state.value = HomeUiState(Async.of(result, previous))
        }
    }
}
