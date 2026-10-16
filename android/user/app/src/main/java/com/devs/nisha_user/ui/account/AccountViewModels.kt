package com.devs.nisha_user.ui.account

import android.os.SystemClock
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.toRoute
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.domain.model.ContentPage
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.model.UserProfile
import com.devs.nisha_user.domain.repository.FavoritesRepository
import com.devs.nisha_user.domain.usecase.GetContentPageUseCase
import com.devs.nisha_user.domain.usecase.GetFavoritesUseCase
import com.devs.nisha_user.domain.usecase.GetOrderUseCase
import com.devs.nisha_user.domain.usecase.GetOrdersUseCase
import com.devs.nisha_user.domain.usecase.GetProfileUseCase
import com.devs.nisha_user.domain.usecase.UpdateProfileUseCase
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.drop
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class OrdersUiState(
    /** null = every status. */
    val status: OrderStatus? = null,
    val items: List<OrderListItem> = emptyList(),
    val page: Int = 0,
    val hasMore: Boolean = true,
    val loading: Boolean = true,
    val loadingMore: Boolean = false,
    val refreshing: Boolean = false,
    val error: AppError? = null,
)

/** features/orders/OrdersView.tsx: every purchase with its payment status and tickets. */
@HiltViewModel
class OrdersViewModel @Inject constructor(private val getOrders: GetOrdersUseCase) : ViewModel() {
    private val _state = MutableStateFlow(OrdersUiState())
    val state: StateFlow<OrdersUiState> = _state.asStateFlow()
    private var job: Job? = null

    init {
        reload()
    }

    fun select(status: OrderStatus?) {
        if (status == _state.value.status) return
        _state.update { it.copy(status = status, items = emptyList()) }
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
            val r = getOrders(_state.value.status, page)
            _state.update {
                it.copy(items = if (page == 1) r.items else it.items + r.items, page = page, hasMore = r.hasMore, loading = false, loadingMore = false, refreshing = false)
            }
        } catch (e: Exception) {
            if (e is kotlinx.coroutines.CancellationException) throw e
            _state.update { it.copy(loading = false, loadingMore = false, refreshing = false, error = e.appError) }
        }
    }
}

data class OrderUiState(val order: Order? = null, val receivedAt: Long = 0, val error: AppError? = null)

@HiltViewModel
class OrderViewModel @Inject constructor(savedState: SavedStateHandle, private val getOrder: GetOrderUseCase) : ViewModel() {
    private val number = savedState.toRoute<OrderRoute>().number
    private val _state = MutableStateFlow(OrderUiState())
    val state: StateFlow<OrderUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            try {
                _state.update { it.copy(order = getOrder(number), receivedAt = SystemClock.elapsedRealtime(), error = null) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError) }
            }
        }
    }
}

data class ProfileForm(val firstName: String = "", val lastName: String = "", val email: String = "", val cityId: Long? = null)

data class ProfileUiState(
    val profile: UserProfile? = null,
    val error: AppError? = null,
    val form: ProfileForm = ProfileForm(),
    val fieldErrors: Map<String, String> = emptyMap(),
    val saving: Boolean = false,
    val saveError: String? = null,
) {
    val dirty: Boolean
        get() = profile != null && form != ProfileForm(profile.firstName.orEmpty(), profile.lastName.orEmpty(), profile.email.orEmpty(), profile.cityId)
}

/** features/profile/ProfileView.tsx: counts, personal details and sign out. */
@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val getProfile: GetProfileUseCase,
    private val updateProfile: UpdateProfileUseCase,
    private val toaster: Toaster,
) : ViewModel() {
    private val _state = MutableStateFlow(ProfileUiState())
    val state: StateFlow<ProfileUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            try {
                val p = getProfile()
                _state.update { it.copy(profile = p, error = null, form = ProfileForm(p.firstName.orEmpty(), p.lastName.orEmpty(), p.email.orEmpty(), p.cityId)) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError) }
            }
        }
    }

    fun edit(change: (ProfileForm) -> ProfileForm) = _state.update { it.copy(form = change(it.form), fieldErrors = emptyMap(), saveError = null) }

    fun save() {
        val f = _state.value.form
        _state.update { it.copy(saving = true, saveError = null) }
        viewModelScope.launch {
            try {
                val p = updateProfile(f.firstName, f.lastName, f.email, f.cityId)
                _state.update { it.copy(profile = p, saving = false, form = ProfileForm(p.firstName.orEmpty(), p.lastName.orEmpty(), p.email.orEmpty(), p.cityId)) }
                toaster.success("اطلاعات حساب کاربری ذخیره شد.")
            } catch (e: Exception) {
                val error = e.appError
                _state.update { it.copy(saving = false, fieldErrors = error.fieldErrors, saveError = if (error.fieldErrors.isEmpty()) error.message else null) }
            }
        }
    }
}

data class FavoritesUiState(val events: List<PublicEvent>? = null, val error: AppError? = null, val refreshing: Boolean = false)

@HiltViewModel
class FavoritesViewModel @Inject constructor(private val getFavorites: GetFavoritesUseCase, favorites: FavoritesRepository) : ViewModel() {
    private val _state = MutableStateFlow(FavoritesUiState())
    val state: StateFlow<FavoritesUiState> = _state.asStateFlow()

    init {
        load()
        // A heart removed on this screen drops the card at once.
        viewModelScope.launch {
            favorites.ids.drop(1).collect { ids -> _state.update { s -> s.copy(events = s.events?.filter { it.id in ids }) } }
        }
    }

    fun load(refresh: Boolean = false) {
        _state.update { it.copy(refreshing = refresh) }
        viewModelScope.launch {
            try {
                _state.update { it.copy(events = getFavorites(), error = null, refreshing = false) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError, refreshing = false) }
            }
        }
    }
}

data class ContentUiState(val page: ContentPage? = null, val error: AppError? = null)

@HiltViewModel
class ContentViewModel @Inject constructor(savedState: SavedStateHandle, private val getPage: GetContentPageUseCase) : ViewModel() {
    val slug: String = savedState.toRoute<ContentRoute>().slug
    private val _state = MutableStateFlow(ContentUiState())
    val state: StateFlow<ContentUiState> = _state.asStateFlow()

    init {
        load()
    }

    fun load() {
        viewModelScope.launch {
            try {
                _state.update { it.copy(page = getPage(slug), error = null) }
            } catch (e: Exception) {
                _state.update { it.copy(error = e.appError) }
            }
        }
    }
}
