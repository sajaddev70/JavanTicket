package com.devs.nisha_user.data.repository

import com.devs.nisha_user.data.local.PreferencesStore
import com.devs.nisha_user.data.local.Session
import com.devs.nisha_user.data.local.SessionStore
import com.devs.nisha_user.data.remote.ApiCall
import com.devs.nisha_user.data.remote.api.AuthApi
import com.devs.nisha_user.data.remote.api.CodeBody
import com.devs.nisha_user.data.remote.api.CreateOrderBody
import com.devs.nisha_user.data.remote.api.GatewayBody
import com.devs.nisha_user.data.remote.api.MobileBody
import com.devs.nisha_user.data.remote.api.PublicApi
import com.devs.nisha_user.data.remote.api.SeatBody
import com.devs.nisha_user.data.remote.api.UserApi
import com.devs.nisha_user.data.remote.api.VerifyBody
import com.devs.nisha_user.domain.model.AuthUser
import com.devs.nisha_user.domain.model.BuyerInput
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.EventFilters
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.Paged
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStart
import com.devs.nisha_user.domain.model.ProfileInput
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.domain.model.SeatHold
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.domain.model.ThemeMode
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketPage
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.domain.model.UserProfile
import com.devs.nisha_user.domain.repository.AuthRepository
import com.devs.nisha_user.domain.repository.EventRepository
import com.devs.nisha_user.domain.repository.FavoritesRepository
import com.devs.nisha_user.domain.repository.OrderRepository
import com.devs.nisha_user.domain.repository.PaymentRepository
import com.devs.nisha_user.domain.repository.ProfileRepository
import com.devs.nisha_user.domain.repository.SeatRepository
import com.devs.nisha_user.domain.repository.SettingsRepository
import com.devs.nisha_user.domain.repository.TicketRepository
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.flow.update

@Singleton
class EventRepositoryImpl @Inject constructor(private val api: PublicApi, private val call: ApiCall) : EventRepository {
    override suspend fun list(section: String?, category: String?, cityId: Long?, limit: Int?, q: String?): List<PublicEvent> =
        call { api.events(section, category?.ifBlank { null }, q?.ifBlank { null }, cityId, limit) }

    override suspend fun search(filters: EventFilters, page: Int, size: Int): Paged<PublicEvent> = call {
        api.search(
            q = filters.q.ifBlank { null },
            cityId = filters.cityId,
            category = filters.category.ifBlank { null },
            whenFilter = filters.whenFilter.api,
            section = filters.type.api,
            minPrice = filters.minPrice,
            maxPrice = filters.maxPrice,
            sort = filters.sort.api,
            page = page,
            size = size,
        )
    }

    override suspend fun detail(slug: String): EventDetail = call { api.event(slug) }
}

@Singleton
class SeatRepositoryImpl @Inject constructor(private val api: PublicApi, private val call: ApiCall) : SeatRepository {
    override suspend fun seatMap(sessionId: Long): SeatMapData = call { api.seatMap(sessionId) }
    override suspend fun lock(sessionId: Long, seatId: Long): SeatHold = call { api.lock(sessionId, SeatBody(seatId)) }
    override suspend fun release(sessionId: Long, seatId: Long): SeatHold = call { api.release(sessionId, seatId) }
    override suspend fun releaseAll(sessionId: Long): SeatHold = call { api.releaseAll(sessionId) }
}

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val api: AuthApi,
    private val call: ApiCall,
    private val sessions: SessionStore,
) : AuthRepository {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)

    override val user: StateFlow<AuthUser?> =
        sessions.session.map { it?.user }.stateIn(scope, SharingStarted.Eagerly, sessions.current?.user)

    override suspend fun sendOtp(mobile: String) = call.unit { api.sendOtp(MobileBody(mobile)) }

    override suspend fun verifyOtp(mobile: String, code: String): AuthUser {
        val auth = call { api.verify(VerifyBody(mobile, code)) }
        sessions.save(Session(auth.accessToken, auth.refreshToken, auth.user))
        return auth.user
    }

    override fun updateUser(user: AuthUser) = sessions.updateUser(user)
    override fun signOut() = sessions.clear()
}

@Singleton
class OrderRepositoryImpl @Inject constructor(
    private val api: UserApi,
    private val call: ApiCall,
    private val prefs: PreferencesStore,
) : OrderRepository {
    override suspend fun create(sessionId: Long, quantity: Int?): String =
        call { api.createOrder(CreateOrderBody(sessionId, prefs.holdToken, quantity)) }.orderNumber

    override suspend fun list(status: OrderStatus?, page: Int, size: Int): Paged<OrderListItem> = call { api.orders(status?.name, page, size) }
    override suspend fun get(number: String): Order = call { api.order(number) }
    override suspend fun updateBuyer(number: String, buyer: BuyerInput): Order = call { api.updateBuyer(number, buyer) }
    override suspend fun applyDiscount(number: String, code: String): Order = call { api.applyDiscount(number, CodeBody(code)) }
    override suspend fun removeDiscount(number: String): Order = call { api.removeDiscount(number) }
}

@Singleton
class PaymentRepositoryImpl @Inject constructor(private val api: UserApi, private val call: ApiCall) : PaymentRepository {
    override suspend fun methods(): List<PaymentMethod> = call { api.paymentMethods() }
    override suspend fun start(orderNumber: String, gateway: String): PaymentStart = call { api.startPayment(orderNumber, GatewayBody(gateway)) }
    override suspend fun result(paymentId: Long): PaymentResult = call { api.payment(paymentId) }
}

@Singleton
class TicketRepositoryImpl @Inject constructor(private val api: UserApi, private val call: ApiCall) : TicketRepository {
    override suspend fun list(scope: TicketScope, page: Int, size: Int): TicketPage = call { api.tickets(scope.api, page, size) }
    override suspend fun get(id: Long): TicketDetail = call { api.ticket(id) }
    override suspend fun sendSms(id: Long): String? = call.withMessage { api.sendTicketSms(id) }.message
}

@Singleton
class ProfileRepositoryImpl @Inject constructor(private val api: UserApi, private val call: ApiCall) : ProfileRepository {
    override suspend fun get(): UserProfile = call { api.profile() }
    override suspend fun update(input: ProfileInput): UserProfile = call { api.updateProfile(input) }
}

@Singleton
class FavoritesRepositoryImpl @Inject constructor(private val api: UserApi, private val call: ApiCall) : FavoritesRepository {
    private val _ids = MutableStateFlow<Set<Long>>(emptySet())
    override val ids: StateFlow<Set<Long>> = _ids.asStateFlow()

    override suspend fun refreshIds() {
        _ids.value = call { api.favoriteIds() }.toSet()
    }

    override suspend fun favorites(): List<PublicEvent> = call { api.favorites() }.also { list -> _ids.value = list.map { it.id }.toSet() }

    /** Optimistic: the heart changes at once and is rolled back if the server refuses. */
    override suspend fun setFavorite(eventId: Long, favorite: Boolean) {
        val previous = _ids.value
        _ids.update { if (favorite) it + eventId else it - eventId }
        try {
            if (favorite) call.unit { api.addFavorite(eventId) } else call.unit { api.removeFavorite(eventId) }
        } catch (e: Exception) {
            _ids.value = previous
            throw e
        }
    }

    override fun clear() {
        _ids.value = emptySet()
    }
}

@Singleton
class SettingsRepositoryImpl @Inject constructor(private val prefs: PreferencesStore) : SettingsRepository {
    override val themeMode: StateFlow<ThemeMode> = prefs.themeMode
    override val cityId: StateFlow<Long?> = prefs.cityId
    override val notificationPromptDismissed: StateFlow<Boolean> = prefs.notificationPromptDismissed
    override fun setTheme(mode: ThemeMode) = prefs.setTheme(mode)
    override fun setCity(id: Long?) = prefs.setCity(id)
    override fun setNotificationPromptDismissed(dismissed: Boolean) = prefs.setNotificationPromptDismissed(dismissed)
}
