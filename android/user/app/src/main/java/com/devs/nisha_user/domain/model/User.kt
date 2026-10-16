package com.devs.nisha_user.domain.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

/** Signed-in user (auth response). */
@Serializable
data class AuthUser(
    val id: Long,
    val mobile: String,
    val fullName: String? = null,
    val email: String? = null,
    val userType: String = "USER",
)

@Serializable
data class AuthResponse(val accessToken: String, val refreshToken: String, val user: AuthUser)

@Serializable
data class UserProfile(
    val id: Long,
    val mobile: String,
    @SerialName("first_name") val firstName: String? = null,
    @SerialName("last_name") val lastName: String? = null,
    @SerialName("full_name") val fullName: String? = null,
    val email: String? = null,
    @SerialName("city_id") val cityId: Long? = null,
    @SerialName("city_name") val cityName: String? = null,
    @SerialName("avatar_url") val avatarUrl: String? = null,
    @SerialName("created_at") val createdAt: String,
    @SerialName("orders_count") val ordersCount: Int = 0,
    @SerialName("upcoming_tickets_count") val upcomingTicketsCount: Int = 0,
    @SerialName("favorites_count") val favoritesCount: Int = 0,
)

@Serializable
data class ProfileInput(
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name") val lastName: String,
    val email: String? = null,
    @SerialName("city_id") val cityId: Long? = null,
)

/** Light / dark like the site's toggle; SYSTEM until the user picks one. */
enum class ThemeMode { SYSTEM, LIGHT, DARK }
