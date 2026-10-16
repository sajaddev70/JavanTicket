package com.devs.nisha_user

import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.HomeRoute
import com.devs.nisha_user.ui.navigation.LinkRouter
import com.devs.nisha_user.ui.navigation.LinkTarget
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.PaymentResultRoute
import com.devs.nisha_user.ui.navigation.SeatsRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

/** Links written in the admin panel must open the same page in the app as on the site. */
class LinkRouterTest {
    private val site = "http://45.156.186.169:3003"

    @Test
    fun `site paths map to app screens`() {
        assertEquals(HomeRoute, LinkRouter.route("/"))
        assertEquals(EventsRoute(category = "exhibition"), LinkRouter.route("/events?category=exhibition"))
        assertEquals(EventsRoute(city = -1L, whenFilter = "week"), LinkRouter.route("/events?city=all&when=week"))
        assertEquals(EventDetailRoute("hamid-hirad-concert"), LinkRouter.route("/events/hamid-hirad-concert"))
        assertEquals(SeatsRoute(44), LinkRouter.route("/sessions/44/seats"))
        assertEquals(CheckoutRoute(sessionId = 40, quantity = 3), LinkRouter.route("/checkout?session=40&quantity=3"))
        assertEquals(PaymentResultRoute(12), LinkRouter.route("/payment/result?id=12"))
        assertEquals(TicketsRoute, LinkRouter.route("/tickets"))
        assertEquals(TicketRoute(14921), LinkRouter.route("/tickets/14921"))
        assertEquals(OrderRoute("JT-D0001"), LinkRouter.route("/orders/JT-D0001"))
        assertEquals(ContentRoute("about"), LinkRouter.route("/about"))
    }

    @Test
    fun `unknown nested paths have no screen`() {
        assertNull(LinkRouter.route("/a/b/c"))
        assertNull(LinkRouter.route("/sessions/x/seats"))
    }

    @Test
    fun `full site urls are internal, other sites external`() {
        assertEquals(LinkTarget.Screen(ContentRoute("faq")), LinkRouter.resolve("$site/faq", site))
        assertEquals(LinkTarget.External("https://t.me/javanfair"), LinkRouter.resolve("https://t.me/javanfair", site))
        assertEquals(LinkTarget.External("tel:02112345678"), LinkRouter.resolve("tel:02112345678", site))
    }

    @Test
    fun `persian slugs and spaces survive the round trip`() {
        val route = EventDetailRoute("کنسرت جوان")
        assertEquals(route, LinkRouter.route(route.path()))
        val events = EventsRoute(q = "هوش مصنوعی", category = "music")
        assertEquals(events, LinkRouter.route(events.path()))
    }

    @Test
    fun `only internal paths are accepted as the next page`() {
        assertEquals("/tickets", LinkRouter.safeNext("/tickets"))
        assertEquals("/", LinkRouter.safeNext("https://evil.example"))
        assertEquals("/", LinkRouter.safeNext("//evil.example"))
        assertEquals("/", LinkRouter.safeNext("/login?next=/x"))
        assertEquals("/", LinkRouter.safeNext(null))
    }
}
