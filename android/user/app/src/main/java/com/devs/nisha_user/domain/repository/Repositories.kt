package com.devs.nisha_user.domain.repository

import com.devs.nisha_user.domain.model.AuthUser
import com.devs.nisha_user.domain.model.Banner
import com.devs.nisha_user.domain.model.BuyerInput
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.ContentPage
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.EventFilters
import com.devs.nisha_user.domain.model.Feature
import com.devs.nisha_user.domain.model.HomeSection
import com.devs.nisha_user.domain.model.Navigation
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.Paged
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStart
import com.devs.nisha_user.domain.model.ProfileInput
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.model.SeatHold
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.domain.model.SiteSettings
import com.devs.nisha_user.domain.model.ThemeMode
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketPage
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.domain.model.UserProfile
import kotlinx.coroutines.flow.StateFlow

// Contracts of the data layer. Every suspend function throws AppError (Persian message) on failure.

/** Site-wide content managed in the admin panel; cached in memory and refreshed on demand. */
interface ContentRepository {
    val settings: StateFlow<SiteSettings?>
    val navigation: StateFlow<Navigation?>
    val pageBlocks: StateFlow<Map<String, PageBlock>>
    val features: StateFlow<List<Feature>>
    val categories: StateFlow<List<Category>>
    val cities: StateFlow<List<City>>

    /** Loads (or reloads with [force]) settings, navigation, page blocks, features, categories and cities. */
    suspend fun refreshSiteContent(force: Boolean = false)
    suspend fun homeSections(): List<HomeSection>
    suspend fun banners(): List<Banner>
    suspend fun page(slug: String): ContentPage
    suspend fun subscribe(email: String)
}

interface EventRepository {
    suspend fun list(section: String?, category: String?, cityId: Long?, limit: Int?, q: String? = null): List<PublicEvent>
    suspend fun search(filters: EventFilters, page: Int, size: Int): Paged<PublicEvent>
    suspend fun detail(slug: String): EventDetail
}

/** Seat map and seat locks (10 minutes, shared by the selection). */
interface SeatRepository {
    suspend fun seatMap(sessionId: Long): SeatMapData
    suspend fun lock(sessionId: Long, seatId: Long): SeatHold
    suspend fun release(sessionId: Long, seatId: Long): SeatHold
    suspend fun releaseAll(sessionId: Long): SeatHold
}

interface AuthRepository {
    /** Signed-in user, or null. */
    val user: StateFlow<AuthUser?>
    suspend fun sendOtp(mobile: String)
    suspend fun verifyOtp(mobile: String, code: String): AuthUser
    fun updateUser(user: AuthUser)
    fun signOut()
}

interface OrderRepository {
    /** Order draft from this device's held seats (seat map) or a ticket count (general admission). */
    suspend fun create(sessionId: Long, quantity: Int?): String
    suspend fun list(status: OrderStatus?, page: Int, size: Int): Paged<OrderListItem>
    suspend fun get(number: String): Order
    suspend fun updateBuyer(number: String, buyer: BuyerInput): Order
    suspend fun applyDiscount(number: String, code: String): Order
    suspend fun removeDiscount(number: String): Order
}

interface PaymentRepository {
    suspend fun methods(): List<PaymentMethod>
    suspend fun start(orderNumber: String, gateway: String): PaymentStart
    suspend fun result(paymentId: Long): PaymentResult
}

interface TicketRepository {
    suspend fun list(scope: TicketScope, page: Int, size: Int): TicketPage
    suspend fun get(id: Long): TicketDetail
    /** SMS with the event, time, seat and entry code to the buyer's mobile; returns the server's message. */
    suspend fun sendSms(id: Long): String?
}

interface ProfileRepository {
    suspend fun get(): UserProfile
    suspend fun update(input: ProfileInput): UserProfile
}

/** Favorite events; the id set is shared by every screen (hearts on cards, detail page, favorites list). */
interface FavoritesRepository {
    val ids: StateFlow<Set<Long>>
    suspend fun refreshIds()
    suspend fun favorites(): List<PublicEvent>
    suspend fun setFavorite(eventId: Long, favorite: Boolean)
    fun clear()
}

interface SettingsRepository {
    val themeMode: StateFlow<ThemeMode>
    val cityId: StateFlow<Long?>
    fun setTheme(mode: ThemeMode)
    fun setCity(id: Long?)
}
