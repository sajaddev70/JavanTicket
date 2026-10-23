package com.devs.nisha_user.ui.app

import android.Manifest
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.compose.animation.EnterTransition
import androidx.compose.animation.ExitTransition
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hasRoute
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.toRoute
import com.devs.nisha_user.BuildConfig
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.LocalMediaOrigin
import com.devs.nisha_user.core.designsystem.component.LocalSiteSettings
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.ToastHost
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.notification.NotificationHelper
import com.devs.nisha_user.ui.notification.NotificationPermissionSheet
import com.devs.nisha_user.domain.model.BlockKeys
import com.devs.nisha_user.domain.model.ThemeMode
import com.devs.nisha_user.ui.account.ContentScreen
import com.devs.nisha_user.ui.account.FavoritesScreen
import com.devs.nisha_user.ui.account.OrderScreen
import com.devs.nisha_user.ui.account.OrdersScreen
import com.devs.nisha_user.ui.account.ProfileScreen
import com.devs.nisha_user.ui.auth.LoginScreen
import com.devs.nisha_user.ui.auth.VerifyScreen
import com.devs.nisha_user.ui.checkout.CheckoutScreen
import com.devs.nisha_user.ui.common.AppActions
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.eventdetail.EventDetailScreen
import com.devs.nisha_user.ui.events.EventsScreen
import com.devs.nisha_user.ui.home.HomeScreen
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.FavoritesRoute
import com.devs.nisha_user.ui.navigation.GatewayRoute
import com.devs.nisha_user.ui.navigation.HomeRoute
import com.devs.nisha_user.ui.navigation.LinkRouter
import com.devs.nisha_user.ui.navigation.LinkTarget
import com.devs.nisha_user.ui.navigation.LoginRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.PaymentResultRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.ProfileRoute
import com.devs.nisha_user.ui.navigation.Route
import com.devs.nisha_user.ui.navigation.SeatsRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute
import com.devs.nisha_user.ui.navigation.VerifyRoute
import com.devs.nisha_user.ui.payment.GatewayScreen
import com.devs.nisha_user.ui.payment.PaymentResultScreen
import com.devs.nisha_user.ui.payment.PaymentScreen
import com.devs.nisha_user.ui.seats.SeatsScreen
import com.devs.nisha_user.ui.tickets.TicketScreen
import com.devs.nisha_user.ui.tickets.TicketsScreen

/** The whole app: theme-aware chrome (header, bottom tabs, menu, toasts) around the navigation graph. */
@Composable
fun JavanAppRoot(app: AppViewModel, dark: Boolean) {
    val nav = rememberNavController()
    val context = LocalContext.current
    val user by app.user.collectAsStateWithLifecycle()
    val settings by app.settings.collectAsStateWithLifecycle()
    val navigation by app.navigation.collectAsStateWithLifecycle()
    val categories by app.categories.collectAsStateWithLifecycle()
    val cities by app.cities.collectAsStateWithLifecycle()
    val features by app.features.collectAsStateWithLifecycle()
    val blocks by app.pageBlocks.collectAsStateWithLifecycle()
    val cityId by app.cityId.collectAsStateWithLifecycle()
    val favoriteIds by app.favoriteIds.collectAsStateWithLifecycle()
    val contentError by app.contentError.collectAsStateWithLifecycle()
    val notificationPromptDismissed by app.notificationPromptDismissed.collectAsStateWithLifecycle()
    var menuOpen by rememberSaveable { mutableStateOf(false) }
    var showNotificationSheet by remember { mutableStateOf(false) }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestPermission()
    ) { granted ->
        app.setNotificationPromptDismissed(true)
        showNotificationSheet = false
        if (granted) {
            val sent = NotificationHelper.sendTestNotification(context)
            if (sent) {
                app.toaster.success("اعلان‌ها با موفقیت فعال شدند.")
            }
        }
    }

    LaunchedEffect(notificationPromptDismissed) {
        if (!notificationPromptDismissed) {
            val hasPermission = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
            } else {
                NotificationManagerCompat.from(context).areNotificationsEnabled()
            }
            if (!hasPermission) {
                showNotificationSheet = true
            }
        }
    }

    val actions = remember(nav, favoriteIds) {
        AppActions(
            navigate = { route -> nav.navigateRoute(route) },
            replace = { route -> nav.navigate(route) { nav.currentDestination?.id?.let { popUpTo(it) { inclusive = true } } } },
            back = { if (!nav.popBackStack()) nav.navigateTab(HomeRoute) },
            openLink = { link -> openLink(context, nav, link) },
            requireLogin = { next -> nav.navigate(LoginRoute(next)) },
            finishLogin = { next ->
                nav.popBackStack<LoginRoute>(inclusive = true)
                if (next != "/") LinkRouter.route(next)?.let { nav.navigateRoute(it) }
            },
            isFavorite = { it in favoriteIds },
            toggleFavorite = { id -> app.toggleFavorite(id) { nav.navigate(LoginRoute(nav.currentPath())) } },
            share = { title, text -> share(context, title, text) },
            siteUrl = BuildConfig.SITE_URL.trimEnd('/'),
        )
    }

    val backStack by nav.currentBackStackEntryAsState()
    val destination = backStack?.destination
    val tab = when {
        destination?.hasRoute(HomeRoute::class) == true -> Tab.HOME
        destination?.hasRoute(EventsRoute::class) == true -> Tab.EVENTS
        destination?.hasRoute(TicketsRoute::class) == true -> Tab.TICKETS
        destination?.hasRoute(ProfileRoute::class) == true -> Tab.ACCOUNT
        else -> null
    }
    val selectedCity = cities.firstOrNull { it.id == cityId }

    val header: @Composable (query: String, onSearch: ((String) -> Unit)?) -> Unit = { query, onSearch ->
        SiteHeader(
            user = user,
            cities = cities,
            cityId = cityId,
            onCity = app::setCity,
            dark = dark,
            onToggleTheme = { app.setTheme(if (dark) ThemeMode.LIGHT else ThemeMode.DARK) },
            onMenu = { menuOpen = true },
            initialQuery = query,
            onSearch = onSearch,
        )
    }

    CompositionLocalProvider(
        LocalAppActions provides actions,
        LocalSiteSettings provides settings,
        LocalMediaOrigin provides BuildConfig.API_BASE_URL.replace(Regex("/api/v\\d+/?$"), ""),
        LocalToaster provides app.toaster,
    ) {
        Box(Modifier.fillMaxSize().background(Jt.colors.page)) {
            if (settings == null && contentError != null) {
                // Nothing could be loaded at all (no connection at first start): the offline page with a retry.
                Column(Modifier.fillMaxSize().statusBarsPadding().padding(top = 48.dp)) { ErrorState(contentError, onRetry = { app.loadContent(force = true) }) }
            } else {
                Column(Modifier.fillMaxSize()) {
                    NavHost(
                        nav,
                        startDestination = HomeRoute,
                        modifier = Modifier.weight(1f),
                        // RTL: new screens come in from the left (the reading direction), back goes right.
                        enterTransition = { slideInHorizontally(tween(260)) { -it / 5 } + fadeIn(tween(260)) },
                        exitTransition = { fadeOut(tween(180)) },
                        popEnterTransition = { fadeIn(tween(220)) },
                        popExitTransition = { slideOutHorizontally(tween(240)) { it / 5 } + fadeOut(tween(240)) },
                    ) {
                        composable<HomeRoute>(enterTransition = { EnterTransition.None }, exitTransition = { ExitTransition.None }) {
                            HomeScreen(
                                header = { header("", null) },
                                footer = { SiteFooter(settings, navigation, app::subscribe) },
                                categories = categories,
                                cities = cities,
                                cityName = selectedCity?.name,
                            )
                        }
                        composable<EventsRoute>(enterTransition = { EnterTransition.None }, exitTransition = { ExitTransition.None }) {
                            EventsScreen(header = { onSearch, q -> header(q, onSearch) }, hero = blocks[BlockKeys.EVENTS_HERO], categories = categories, cities = cities)
                        }
                        composable<EventDetailRoute> { EventDetailScreen() }
                        composable<SeatsRoute> { SeatsScreen(blocks[BlockKeys.SEAT_HERO], signedIn = user != null) }
                        composable<CheckoutRoute> { entry -> Guarded(entry.toRoute<CheckoutRoute>(), user != null, nav) { CheckoutScreen(blocks[BlockKeys.CHECKOUT_NOTICE]) } }
                        composable<PaymentRoute> { entry -> Guarded(entry.toRoute<PaymentRoute>(), user != null, nav) { PaymentScreen(blocks[BlockKeys.PAYMENT_NOTICE]) } }
                        composable<GatewayRoute> { entry ->
                            val r = entry.toRoute<GatewayRoute>()
                            Guarded(r, user != null, nav) { GatewayScreen(r.url, r.paymentId) }
                        }
                        composable<PaymentResultRoute> { entry -> Guarded(entry.toRoute<PaymentResultRoute>(), user != null, nav) { PaymentResultScreen() } }
                        composable<TicketsRoute>(enterTransition = { EnterTransition.None }, exitTransition = { ExitTransition.None }) {
                            Guarded(TicketsRoute, user != null, nav) { TicketsScreen() }
                        }
                        composable<TicketRoute> { entry -> Guarded(entry.toRoute<TicketRoute>(), user != null, nav) { TicketScreen(blocks[BlockKeys.TICKET_GUIDE]) } }
                        composable<OrdersRoute> { Guarded(OrdersRoute, user != null, nav) { OrdersScreen() } }
                        composable<OrderRoute> { entry -> Guarded(entry.toRoute<OrderRoute>(), user != null, nav) { OrderScreen() } }
                        composable<ProfileRoute>(enterTransition = { EnterTransition.None }, exitTransition = { ExitTransition.None }) {
                            Guarded(ProfileRoute, user != null, nav) {
                                ProfileScreen(cities, onSignOut = {
                                    app.signOut()
                                    nav.navigateTab(HomeRoute)
                                })
                            }
                        }
                        composable<FavoritesRoute> { Guarded(FavoritesRoute, user != null, nav) { FavoritesScreen() } }
                        composable<LoginRoute> { LoginScreen(blocks[BlockKeys.AUTH_HERO], features) }
                        composable<VerifyRoute> { VerifyScreen(blocks[BlockKeys.AUTH_HERO]) }
                        composable<ContentRoute> { ContentScreen() }
                    }
                    // Screens with their own sticky action bar (event, seats, checkout, payment, login) hide the tabs.
                    if (tab != null) {
                        BottomTabBar(tab, signedIn = user != null) { t ->
                            when (t) {
                                Tab.HOME -> nav.navigateTab(HomeRoute)
                                Tab.EVENTS -> nav.navigateTab(EventsRoute())
                                Tab.TICKETS -> if (user != null) nav.navigateTab(TicketsRoute) else nav.navigate(LoginRoute(TicketsRoute.path()))
                                Tab.ACCOUNT -> if (user != null) nav.navigateTab(ProfileRoute) else nav.navigate(LoginRoute())
                            }
                        }
                    }
                }
            }
            ToastHost(app.toaster)
        }
        if (menuOpen) MenuSheet(navigation, settings, user, onSignOut = { app.signOut(); nav.navigateTab(HomeRoute) }, onDismiss = { menuOpen = false }, dark = dark, onToggleTheme = { app.setTheme(if (dark) ThemeMode.LIGHT else ThemeMode.DARK) })
        if (showNotificationSheet) {
            NotificationPermissionSheet(
                onRequestPermission = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        app.setNotificationPromptDismissed(true)
                        showNotificationSheet = false
                        val sent = NotificationHelper.sendTestNotification(context)
                        if (sent) {
                            app.toaster.success("اعلان‌ها با موفقیت فعال شدند.")
                        }
                    }
                },
                onDismiss = {
                    app.setNotificationPromptDismissed(true)
                    showNotificationSheet = false
                }
            )
        }
    }
}

/** Pages for signed-in users only (the web's RequireAuth): signed-out visitors go to the login and come back after. */
@Composable
private fun Guarded(route: Route, signedIn: Boolean, nav: NavController, content: @Composable () -> Unit) {
    if (signedIn) {
        content()
    } else {
        LaunchedEffect(Unit) {
            nav.navigate(LoginRoute(route.path())) { nav.currentDestination?.id?.let { popUpTo(it) { inclusive = true } } }
        }
    }
}

/** Main tabs keep their own back stack state, like a bottom navigation should. */
private fun NavHostController.navigateTab(route: Route) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}

private fun NavHostController.navigateRoute(route: Route) {
    when (route) {
        HomeRoute, TicketsRoute, ProfileRoute -> navigateTab(route)
        else -> navigate(route) { launchSingleTop = true }
    }
}

/** Site path of the current screen (for "sign in, then come back here"). */
private fun NavHostController.currentPath(): String {
    val entry = currentBackStackEntry ?: return "/"
    val d = entry.destination
    return runCatching {
        when {
            d.hasRoute(EventDetailRoute::class) -> entry.toRoute<EventDetailRoute>().path()
            d.hasRoute(EventsRoute::class) -> entry.toRoute<EventsRoute>().path()
            d.hasRoute(SeatsRoute::class) -> entry.toRoute<SeatsRoute>().path()
            d.hasRoute(ContentRoute::class) -> entry.toRoute<ContentRoute>().path()
            else -> "/"
        }
    }.getOrDefault("/")
}

private fun openLink(context: Context, nav: NavHostController, link: String) {
    when (val target = LinkRouter.resolve(link, BuildConfig.SITE_URL)) {
        is LinkTarget.Screen -> nav.navigateRoute(target.route)
        is LinkTarget.External -> try {
            context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(target.url)).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
        } catch (e: ActivityNotFoundException) {
            // No app can open it (e.g. no browser); nothing else to do.
        }
    }
}

private fun share(context: Context, title: String, text: String) {
    val send = Intent(Intent.ACTION_SEND).setType("text/plain").putExtra(Intent.EXTRA_SUBJECT, title).putExtra(Intent.EXTRA_TEXT, text)
    context.startActivity(Intent.createChooser(send, "اشتراک‌گذاری").addFlags(Intent.FLAG_ACTIVITY_NEW_TASK))
}
