package com.devs.nisha_user.ui.app

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.common.appError
import com.devs.nisha_user.core.designsystem.component.Toaster
import com.devs.nisha_user.domain.model.ThemeMode
import com.devs.nisha_user.domain.repository.ContentRepository
import com.devs.nisha_user.domain.repository.FavoritesRepository
import com.devs.nisha_user.domain.usecase.AppSettingsUseCase
import com.devs.nisha_user.domain.usecase.ObserveUserUseCase
import com.devs.nisha_user.domain.usecase.SignOutUseCase
import com.devs.nisha_user.domain.usecase.SubscribeNewsletterUseCase
import com.devs.nisha_user.domain.usecase.ToggleFavoriteUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.distinctUntilChangedBy
import kotlinx.coroutines.launch

/**
 * App-wide state shared by every screen: site content (logo, menus, categories, cities, page blocks), the signed-in
 * user, theme, the header city and the favorite ids (hearts on every card).
 */
@HiltViewModel
class AppViewModel @Inject constructor(
    private val content: ContentRepository,
    observeUser: ObserveUserUseCase,
    private val appSettings: AppSettingsUseCase,
    private val favorites: FavoritesRepository,
    private val toggleFavorite: ToggleFavoriteUseCase,
    private val signOutUseCase: SignOutUseCase,
    private val subscribeNewsletter: SubscribeNewsletterUseCase,
    val toaster: Toaster,
) : ViewModel() {

    val settings = content.settings
    val navigation = content.navigation
    val categories = content.categories
    val cities = content.cities
    val features = content.features
    val pageBlocks = content.pageBlocks
    val user = observeUser()
    val themeMode = appSettings.themeMode
    val cityId = appSettings.cityId
    val favoriteIds = favorites.ids

    private val _ready = MutableStateFlow(false)
    /** False until the first site-content answer (the splash screen stays up meanwhile). */
    val ready: StateFlow<Boolean> = _ready.asStateFlow()

    private val _contentError = MutableStateFlow<AppError?>(null)
    val contentError: StateFlow<AppError?> = _contentError.asStateFlow()

    init {
        loadContent()
        viewModelScope.launch {
            user.distinctUntilChangedBy { it?.id }.collect { u ->
                if (u != null) runCatching { favorites.refreshIds() } else favorites.clear()
            }
        }
    }

    fun loadContent(force: Boolean = false) {
        viewModelScope.launch {
            try {
                content.refreshSiteContent(force)
                _contentError.value = null
            } catch (e: Exception) {
                _contentError.value = e.appError
            } finally {
                _ready.value = true
            }
        }
    }

    fun setTheme(mode: ThemeMode) = appSettings.setTheme(mode)
    fun setCity(id: Long?) = appSettings.setCity(id)

    /** Heart on a card / the event page; [onNeedLogin] when signed out (the web sends to /login first). */
    fun toggleFavorite(eventId: Long, onNeedLogin: () -> Unit) {
        viewModelScope.launch {
            try {
                val added = toggleFavorite(eventId)
                toaster.success(if (added) "به علاقه‌مندی‌ها اضافه شد." else "از علاقه‌مندی‌ها حذف شد.")
            } catch (e: ToggleFavoriteUseCase.NotSignedIn) {
                onNeedLogin()
            } catch (e: Exception) {
                toaster.error(e.appError.message)
            }
        }
    }

    fun signOut() {
        signOutUseCase()
        toaster.info("از حساب کاربری خارج شدید.")
    }

    /** Footer newsletter; returns null on success or the error message. */
    suspend fun subscribe(email: String): String? = try {
        subscribeNewsletter(email)
        null
    } catch (e: Exception) {
        e.appError.message
    }
}
