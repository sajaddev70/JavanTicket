package com.devs.nisha_user.ui.navigation

import java.net.URI
import java.net.URLDecoder

/** Where a link of the site (menus, banners and buttons written in the admin panel) leads inside the app. */
sealed interface LinkTarget {
    data class Screen(val route: Route) : LinkTarget
    data class External(val url: String) : LinkTarget
}

/**
 * Maps the site's addresses to app screens, like the web's SmartLink: internal paths ("/events?category=x",
 * "/events/slug", "/about") open the matching screen; anything else (other sites, mailto:, tel:) opens outside.
 * Full URLs of the user site itself ([siteUrl]) are treated as internal paths too.
 */
object LinkRouter {
    private val RESERVED = setOf("events", "sessions", "checkout", "payment", "tickets", "orders", "profile", "favorites", "login", "verify", "offline")

    fun resolve(link: String, siteUrl: String): LinkTarget {
        val trimmed = link.trim()
        val site = siteUrl.trimEnd('/')
        val internal = when {
            site.isNotEmpty() && trimmed.startsWith(site) -> trimmed.removePrefix(site).ifEmpty { "/" }
            trimmed.startsWith("/") && !trimmed.startsWith("//") -> trimmed
            else -> return LinkTarget.External(trimmed)
        }
        return route(internal)?.let { LinkTarget.Screen(it) } ?: LinkTarget.External(site + internal)
    }

    /** Site path → route; null for paths the app has no screen for. */
    fun route(path: String): Route? {
        val uri = runCatching { URI("app://site" + path.replace(" ", "%20")) }.getOrNull() ?: return null
        val segments = uri.rawPath.orEmpty().split('/').filter { it.isNotEmpty() }.map { decode(it) }
        val params = uri.rawQuery.orEmpty().split('&').filter { it.isNotEmpty() }.associate {
            val (k, v) = (it.split('=', limit = 2) + "").take(2)
            decode(k) to decode(v)
        }
        val p = { key: String -> params[key]?.takeIf { it.isNotBlank() } }
        return when {
            segments.isEmpty() -> HomeRoute
            segments[0] == "events" && segments.size == 1 -> EventsRoute(
                q = p("q"),
                category = p("category"),
                city = p("city")?.let { if (it == "all") -1L else it.toLongOrNull() },
                type = p("type"),
                whenFilter = p("when"),
                sort = p("sort"),
            )
            segments[0] == "events" && segments.size == 2 -> EventDetailRoute(segments[1])
            segments[0] == "sessions" && segments.size >= 2 -> segments[1].toLongOrNull()?.let { SeatsRoute(it) }
            segments[0] == "checkout" -> CheckoutRoute(p("session")?.toLongOrNull(), p("quantity")?.toIntOrNull(), p("order"))
            segments[0] == "payment" && segments.getOrNull(1) == "result" -> p("id")?.toLongOrNull()?.let { PaymentResultRoute(it) }
            segments[0] == "payment" -> p("order")?.let { PaymentRoute(it) }
            segments[0] == "tickets" && segments.size == 1 -> TicketsRoute
            segments[0] == "tickets" -> segments[1].toLongOrNull()?.let { TicketRoute(it) }
            segments[0] == "orders" && segments.size == 1 -> OrdersRoute
            segments[0] == "orders" -> OrderRoute(segments[1])
            segments[0] == "profile" -> ProfileRoute
            segments[0] == "favorites" -> FavoritesRoute
            segments[0] == "login" -> LoginRoute(p("next"))
            segments.size == 1 && segments[0] !in RESERVED -> ContentRoute(segments[0])
            else -> null
        }
    }

    private fun decode(s: String): String = runCatching { URLDecoder.decode(s, "UTF-8") }.getOrDefault(s)

    /** Internal path to return to after signing in; anything else falls back to "/" (the web's safeNext). */
    fun safeNext(next: String?): String =
        if (next != null && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") && !next.startsWith("/verify")) next else "/"
}
