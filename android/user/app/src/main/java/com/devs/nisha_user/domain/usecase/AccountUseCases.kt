package com.devs.nisha_user.domain.usecase

import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.domain.model.ContentPage
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.Paged
import com.devs.nisha_user.domain.model.ProfileInput
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.model.ThemeMode
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketPage
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.domain.model.UserProfile
import com.devs.nisha_user.domain.repository.AuthRepository
import com.devs.nisha_user.domain.repository.ContentRepository
import com.devs.nisha_user.domain.repository.FavoritesRepository
import com.devs.nisha_user.domain.repository.OrderRepository
import com.devs.nisha_user.domain.repository.ProfileRepository
import com.devs.nisha_user.domain.repository.SettingsRepository
import com.devs.nisha_user.domain.repository.TicketRepository
import javax.inject.Inject

/** UC-09 My tickets (upcoming / past / cancelled) with the count of each tab. */
class GetTicketsUseCase @Inject constructor(private val tickets: TicketRepository) {
    suspend operator fun invoke(scope: TicketScope, page: Int): TicketPage = tickets.list(scope, page, PAGE_SIZE)

    companion object {
        const val PAGE_SIZE = 12
    }
}

/** UC-10 View an e-ticket with its QR code. */
class GetTicketUseCase @Inject constructor(private val tickets: TicketRepository) {
    suspend operator fun invoke(id: Long): TicketDetail = tickets.get(id)
}

/** UC-10 Send the ticket by SMS (at most once a minute, enforced by the backend). */
class SendTicketSmsUseCase @Inject constructor(private val tickets: TicketRepository) {
    suspend operator fun invoke(id: Long): String = tickets.sendSms(id) ?: "بلیت پیامک شد."
}

/** UC-11 My orders, filtered by status. */
class GetOrdersUseCase @Inject constructor(private val orders: OrderRepository) {
    suspend operator fun invoke(status: OrderStatus?, page: Int): Paged<OrderListItem> = orders.list(status, page, PAGE_SIZE)

    companion object {
        const val PAGE_SIZE = 10
    }
}

class GetProfileUseCase @Inject constructor(private val profile: ProfileRepository) {
    suspend operator fun invoke(): UserProfile = profile.get()
}

/** UC-12 Edit the profile; keeps the name shown in the app in sync. */
class UpdateProfileUseCase @Inject constructor(private val profile: ProfileRepository, private val auth: AuthRepository) {
    suspend operator fun invoke(firstName: String, lastName: String, email: String, cityId: Long?): UserProfile {
        val errors = buildMap {
            if (firstName.isBlank()) put("first_name", "نام را وارد کنید.") else if (firstName.trim().length > 50) put("first_name", "نام حداکثر ۵۰ کاراکتر است.")
            if (lastName.isBlank()) put("last_name", "نام خانوادگی را وارد کنید.") else if (lastName.trim().length > 50) put("last_name", "نام خانوادگی حداکثر ۵۰ کاراکتر است.")
            if (email.isNotBlank() && !Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(email.trim())) put("email", "ایمیل واردشده معتبر نیست.")
        }
        if (errors.isNotEmpty()) throw AppError(errors.values.first(), fieldErrors = errors)
        val updated = profile.update(ProfileInput(firstName.trim(), lastName.trim(), email.trim().ifBlank { null }, cityId))
        auth.user.value?.let { auth.updateUser(it.copy(fullName = updated.fullName, email = updated.email)) }
        return updated
    }
}

class GetFavoritesUseCase @Inject constructor(private val favorites: FavoritesRepository) {
    suspend operator fun invoke(): List<PublicEvent> = favorites.favorites()
}

/** UC-14 Add / remove a favorite. Signed-out visitors must sign in first ([NotSignedIn]). */
class ToggleFavoriteUseCase @Inject constructor(private val favorites: FavoritesRepository, private val auth: AuthRepository) {
    object NotSignedIn : Exception()

    /** Returns true when the event is now a favorite. */
    suspend operator fun invoke(eventId: Long): Boolean {
        if (auth.user.value == null) throw NotSignedIn
        val add = eventId !in favorites.ids.value
        favorites.setFavorite(eventId, add)
        return add
    }
}

class GetContentPageUseCase @Inject constructor(private val content: ContentRepository) {
    suspend operator fun invoke(slug: String): ContentPage = content.page(slug)
}

/** UC-15 Newsletter sign-up from the footer. */
class SubscribeNewsletterUseCase @Inject constructor(private val content: ContentRepository) {
    suspend operator fun invoke(email: String) {
        val e = email.trim()
        if (!Regex("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$").matches(e)) throw AppError("ایمیل واردشده معتبر نیست.")
        content.subscribe(e)
    }
}

/** UC-16 Theme (light / dark) and the header city. */
class AppSettingsUseCase @Inject constructor(private val settings: SettingsRepository) {
    val themeMode = settings.themeMode
    val cityId = settings.cityId
    val notificationPromptDismissed = settings.notificationPromptDismissed
    fun setTheme(mode: ThemeMode) = settings.setTheme(mode)
    fun setCity(id: Long?) = settings.setCity(id)
    fun setNotificationPromptDismissed(dismissed: Boolean) = settings.setNotificationPromptDismissed(dismissed)
}
