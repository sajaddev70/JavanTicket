package com.devs.nisha_user.data.remote.api

import com.devs.nisha_user.domain.model.AuthResponse
import com.devs.nisha_user.domain.model.Banner
import com.devs.nisha_user.domain.model.BuyerInput
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.ContentPage
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.Feature
import com.devs.nisha_user.domain.model.HomeSection
import com.devs.nisha_user.domain.model.Navigation
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
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
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketPage
import com.devs.nisha_user.domain.model.UserProfile
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.JsonElement
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

/** The backend's answer: { success, message, data, errors }. */
@Serializable
data class Envelope<T>(
    val success: Boolean = true,
    val message: String? = null,
    val data: T? = null,
    val errors: Map<String, String>? = null,
)

@Serializable data class MobileBody(val mobile: String)
@Serializable data class VerifyBody(val mobile: String, val code: String)
@Serializable data class RefreshBody(val refreshToken: String)
@Serializable data class EmailBody(val email: String)
@Serializable data class SeatBody(@SerialName("seat_id") val seatId: Long)
@Serializable data class CodeBody(val code: String)
@Serializable data class GatewayBody(val gateway: String)
@Serializable data class OrderNumber(@SerialName("order_number") val orderNumber: String)
@Serializable data class SmsSent(val mobile: String? = null)

@Serializable
data class CreateOrderBody(
    @SerialName("session_id") val sessionId: Long,
    @SerialName("hold_token") val holdToken: String,
    val quantity: Int? = null,
)

/** Site content and events (no sign-in). Same endpoints as the web's content / event / seat services. */
interface PublicApi {
    @GET("public/site-settings") suspend fun siteSettings(): Envelope<SiteSettings>
    @GET("public/navigation") suspend fun navigation(): Envelope<Navigation>
    @GET("public/page-blocks") suspend fun pageBlocks(): Envelope<Map<String, PageBlock>>
    @GET("public/features") suspend fun features(): Envelope<List<Feature>>
    @GET("public/home-sections") suspend fun homeSections(): Envelope<List<HomeSection>>
    @GET("public/banners") suspend fun banners(): Envelope<List<Banner>>
    @GET("public/categories") suspend fun categories(): Envelope<List<Category>>
    @GET("public/cities") suspend fun cities(): Envelope<List<City>>
    @GET("public/pages/{slug}") suspend fun page(@Path("slug") slug: String): Envelope<ContentPage>
    @POST("public/newsletter") suspend fun subscribe(@Body body: EmailBody): Envelope<JsonElement>

    /** Event rows of the homepage (section / category), narrowed to a city. */
    @GET("public/events")
    suspend fun events(
        @Query("section") section: String?,
        @Query("category") category: String?,
        @Query("q") q: String?,
        @Query("cityId") cityId: Long?,
        @Query("limit") limit: Int?,
    ): Envelope<List<PublicEvent>>

    /** Events screen: server-side filters and paging. */
    @GET("public/events/search")
    suspend fun search(
        @Query("q") q: String?,
        @Query("cityId") cityId: Long?,
        @Query("category") category: String?,
        @Query("when") whenFilter: String?,
        @Query("section") section: String?,
        @Query("minPrice") minPrice: Long?,
        @Query("maxPrice") maxPrice: Long?,
        @Query("sort") sort: String?,
        @Query("page") page: Int,
        @Query("size") size: Int,
    ): Envelope<Paged<PublicEvent>>

    @GET("public/events/{slug}") suspend fun event(@Path("slug") slug: String): Envelope<EventDetail>

    // Seat map and seat locks; X-Hold-Token is added by HoldTokenInterceptor.
    @GET("public/sessions/{id}/seat-map") suspend fun seatMap(@Path("id") sessionId: Long): Envelope<SeatMapData>
    @GET("public/sessions/{id}/holds") suspend fun holds(@Path("id") sessionId: Long): Envelope<SeatHold>
    @POST("public/sessions/{id}/holds") suspend fun lock(@Path("id") sessionId: Long, @Body body: SeatBody): Envelope<SeatHold>
    @DELETE("public/sessions/{id}/holds/{seat}") suspend fun release(@Path("id") sessionId: Long, @Path("seat") seatId: Long): Envelope<SeatHold>
    @DELETE("public/sessions/{id}/holds") suspend fun releaseAll(@Path("id") sessionId: Long): Envelope<SeatHold>
}

/** User OTP sign-in (separate from the admin panel's OTP). */
interface AuthApi {
    @POST("auth/user/login") suspend fun sendOtp(@Body body: MobileBody): Envelope<JsonElement>
    @POST("auth/user/verify") suspend fun verify(@Body body: VerifyBody): Envelope<AuthResponse>
    @POST("auth/user/refresh") suspend fun refresh(@Body body: RefreshBody): Envelope<AuthResponse>
}

/** Signed-in user: orders, payments, tickets, profile and favorites. */
interface UserApi {
    @POST("user/orders") suspend fun createOrder(@Body body: CreateOrderBody): Envelope<OrderNumber>

    @GET("user/orders")
    suspend fun orders(@Query("status") status: String?, @Query("page") page: Int, @Query("size") size: Int): Envelope<Paged<OrderListItem>>

    @GET("user/orders/{number}") suspend fun order(@Path("number") number: String): Envelope<Order>
    @PUT("user/orders/{number}/buyer") suspend fun updateBuyer(@Path("number") number: String, @Body body: BuyerInput): Envelope<Order>
    @POST("user/orders/{number}/discount") suspend fun applyDiscount(@Path("number") number: String, @Body body: CodeBody): Envelope<Order>
    @DELETE("user/orders/{number}/discount") suspend fun removeDiscount(@Path("number") number: String): Envelope<Order>

    @GET("user/payment-methods") suspend fun paymentMethods(): Envelope<List<PaymentMethod>>
    @POST("user/orders/{number}/payments") suspend fun startPayment(@Path("number") number: String, @Body body: GatewayBody): Envelope<PaymentStart>
    @GET("user/payments/{id}") suspend fun payment(@Path("id") id: Long): Envelope<PaymentResult>

    @GET("user/tickets")
    suspend fun tickets(@Query("scope") scope: String, @Query("page") page: Int, @Query("size") size: Int): Envelope<TicketPage>

    @GET("user/tickets/{id}") suspend fun ticket(@Path("id") id: Long): Envelope<TicketDetail>
    @POST("user/tickets/{id}/send-sms") suspend fun sendTicketSms(@Path("id") id: Long): Envelope<SmsSent>

    @GET("user/profile") suspend fun profile(): Envelope<UserProfile>
    @PUT("user/profile") suspend fun updateProfile(@Body body: ProfileInput): Envelope<UserProfile>
    @GET("user/favorites") suspend fun favorites(): Envelope<List<PublicEvent>>
    @GET("user/favorites/ids") suspend fun favoriteIds(): Envelope<List<Long>>
    @PUT("user/favorites/{id}") suspend fun addFavorite(@Path("id") eventId: Long): Envelope<JsonElement>
    @DELETE("user/favorites/{id}") suspend fun removeFavorite(@Path("id") eventId: Long): Envelope<JsonElement>
}
