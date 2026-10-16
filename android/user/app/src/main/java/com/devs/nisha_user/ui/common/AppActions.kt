package com.devs.nisha_user.ui.common

import androidx.compose.runtime.Stable
import androidx.compose.runtime.staticCompositionLocalOf
import com.devs.nisha_user.ui.navigation.Route

/** App-wide actions any composable can use without threading callbacks through every screen. */
@Stable
class AppActions(
    val navigate: (Route) -> Unit,
    /** Replaces the current screen (redirects such as checkout → payment). */
    val replace: (Route) -> Unit,
    val back: () -> Unit,
    /** A link written in the admin panel: internal paths open screens, the rest the browser. */
    val openLink: (String) -> Unit,
    /** Sign in first, then continue to [next] (a site path). */
    val requireLogin: (next: String) -> Unit,
    /** After signing in: leaves the login screens and continues to [next] (a site path). */
    val finishLogin: (next: String) -> Unit,
    val isFavorite: (Long) -> Boolean,
    val toggleFavorite: (Long) -> Unit,
    val share: (title: String, text: String) -> Unit,
    /** Address of the user site (shared links point at the same page on the web). */
    val siteUrl: String,
)

val LocalAppActions = staticCompositionLocalOf<AppActions> { error("AppActions not provided") }
