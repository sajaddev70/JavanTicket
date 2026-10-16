package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.domain.model.ThemeMode

val LocalJavanColors = staticCompositionLocalOf { LightJavanColors }

/** Design tokens of the current theme: `Jt.colors.brand600`, `Jt.shapes.card`. */
object Jt {
    val colors: JavanColors
        @Composable @ReadOnlyComposable get() = LocalJavanColors.current
    val shapes = JtShapes
}

/** The site's radii: card 1.125rem, rounded-2xl 16, rounded-xl 12, rounded-lg 8, the hero 22. */
object JtShapes {
    val card = RoundedCornerShape(18.dp)
    val xl2 = RoundedCornerShape(16.dp)
    val xl = RoundedCornerShape(12.dp)
    val lg = RoundedCornerShape(8.dp)
    val md = RoundedCornerShape(6.dp)
    val hero = RoundedCornerShape(22.dp)
    val header = RoundedCornerShape(20.dp)
    val pill = RoundedCornerShape(percent = 50)
}

@Composable
fun isDarkTheme(mode: ThemeMode): Boolean = when (mode) {
    ThemeMode.SYSTEM -> isSystemInDarkTheme()
    ThemeMode.LIGHT -> false
    ThemeMode.DARK -> true
}

/** The app theme: the site's tokens, IRANSans, and right-to-left layout everywhere (the site is fa / dir="rtl"). */
@Composable
fun JavanTheme(dark: Boolean, content: @Composable () -> Unit) {
    val c = if (dark) DarkJavanColors else LightJavanColors
    val scheme = if (dark) {
        darkColorScheme(
            primary = c.brand600, onPrimary = androidx.compose.ui.graphics.Color.White, secondary = c.brand500,
            background = c.page, onBackground = c.ink, surface = c.surface, onSurface = c.ink, surfaceVariant = c.surface2,
            onSurfaceVariant = c.ink2, outline = c.lineStrong, outlineVariant = c.line, error = c.dangerFg, surfaceContainer = c.surface,
            surfaceContainerHigh = c.surface, surfaceContainerLow = c.surface, surfaceContainerHighest = c.surface2,
        )
    } else {
        lightColorScheme(
            primary = c.brand600, onPrimary = androidx.compose.ui.graphics.Color.White, secondary = c.brand500,
            background = c.page, onBackground = c.ink, surface = c.surface, onSurface = c.ink, surfaceVariant = c.surface2,
            onSurfaceVariant = c.ink2, outline = c.lineStrong, outlineVariant = c.line, error = c.dangerFg, surfaceContainer = c.surface,
            surfaceContainerHigh = c.surface, surfaceContainerLow = c.surface, surfaceContainerHighest = c.surface2,
        )
    }
    val base = text(14f)
    val typography = Typography(
        displayLarge = base, displayMedium = base, displaySmall = base,
        headlineLarge = text(28f, W.Black), headlineMedium = text(24f, W.Black), headlineSmall = text(20f, W.Black),
        titleLarge = text(18f, W.Black), titleMedium = text(16f, W.Bold), titleSmall = text(14f, W.Bold),
        bodyLarge = text(15f), bodyMedium = text(14f), bodySmall = text(12.5f),
        labelLarge = text(14f, W.Bold), labelMedium = text(13f, W.Semibold), labelSmall = text(11.5f, W.Semibold),
    )
    CompositionLocalProvider(LocalJavanColors provides c, LocalLayoutDirection provides LayoutDirection.Rtl) {
        MaterialTheme(colorScheme = scheme, typography = typography, content = content)
    }
}
