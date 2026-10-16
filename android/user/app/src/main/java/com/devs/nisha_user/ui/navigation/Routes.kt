package com.devs.nisha_user.ui.navigation

import java.net.URLEncoder
import kotlinx.serialization.Serializable

/**
 * Screens of the app (type-safe Navigation Compose routes), one per page of the web user site.
 * [path] is the site address of the same page: it is the "next" target after signing in and the shared link.
 */
sealed interface Route {
    fun path(): String

    /** Pages that need a signed-in user (the web's RequireAuth). */
    val requiresAuth: Boolean get() = false
}

@Serializable data object HomeRoute : Route {
    override fun path() = "/"
}

@Serializable
data class EventsRoute(
    val q: String? = null,
    val category: String? = null,
    /** City id, or -1 for "every city" (without it the header city applies). */
    val city: Long? = null,
    val type: String? = null,
    val whenFilter: String? = null,
    val sort: String? = null,
) : Route {
    override fun path() = query(
        "/events",
        "q" to q, "category" to category, "city" to city?.let { if (it < 0) "all" else it.toString() },
        "type" to type, "when" to whenFilter, "sort" to sort,
    )
}

@Serializable data class EventDetailRoute(val slug: String) : Route {
    override fun path() = "/events/${encode(slug)}"
}

@Serializable data class SeatsRoute(val sessionId: Long) : Route {
    override fun path() = "/sessions/$sessionId/seats"
}

/** /checkout?session=ID[&quantity=N] creates the order; /checkout?order=NUMBER shows it. */
@Serializable data class CheckoutRoute(val sessionId: Long? = null, val quantity: Int? = null, val order: String? = null) : Route {
    override fun path() = query("/checkout", "session" to sessionId?.toString(), "quantity" to quantity?.toString(), "order" to order)
    override val requiresAuth get() = true
}

@Serializable data class PaymentRoute(val order: String) : Route {
    override fun path() = query("/payment", "order" to order)
    override val requiresAuth get() = true
}

/** The bank's page inside the app; the gateway's return to /payment/result is caught there. */
@Serializable data class GatewayRoute(val url: String, val paymentId: Long, val order: String) : Route {
    override fun path() = query("/payment", "order" to order)
    override val requiresAuth get() = true
}

@Serializable data class PaymentResultRoute(val id: Long) : Route {
    override fun path() = query("/payment/result", "id" to id.toString())
    override val requiresAuth get() = true
}

@Serializable data object TicketsRoute : Route {
    override fun path() = "/tickets"
    override val requiresAuth get() = true
}

@Serializable data class TicketRoute(val id: Long) : Route {
    override fun path() = "/tickets/$id"
    override val requiresAuth get() = true
}

@Serializable data object OrdersRoute : Route {
    override fun path() = "/orders"
    override val requiresAuth get() = true
}

@Serializable data class OrderRoute(val number: String) : Route {
    override fun path() = "/orders/${encode(number)}"
    override val requiresAuth get() = true
}

@Serializable data object ProfileRoute : Route {
    override fun path() = "/profile"
    override val requiresAuth get() = true
}

@Serializable data object FavoritesRoute : Route {
    override fun path() = "/favorites"
    override val requiresAuth get() = true
}

@Serializable data class LoginRoute(val next: String? = null) : Route {
    override fun path() = query("/login", "next" to next)
}

@Serializable data class VerifyRoute(val mobile: String, val next: String? = null) : Route {
    override fun path() = "/verify"
}

/** /about, /contact, /faq, /terms, /privacy ... any page published in the admin panel. */
@Serializable data class ContentRoute(val slug: String) : Route {
    override fun path() = "/${encode(slug)}"
}

private fun query(base: String, vararg params: Pair<String, String?>): String {
    val q = params.filter { !it.second.isNullOrBlank() }.joinToString("&") { "${it.first}=${encode(it.second)}" }
    return if (q.isEmpty()) base else "$base?$q"
}

/** Percent-encoding of a path segment / query value (spaces as %20, like encodeURIComponent). */
internal fun encode(value: String?): String = URLEncoder.encode(value.orEmpty(), "UTF-8").replace("+", "%20")
