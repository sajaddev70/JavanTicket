package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.foundation.background
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
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
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

/** Radii of the design (assets/style.css): glass card 20, event card 17, button 15, field 13, hero 23, state box 22. */
object JtShapes {
    val card = RoundedCornerShape(20.dp)
    val event = RoundedCornerShape(17.dp)
    val xl2 = RoundedCornerShape(17.dp)
    val xl = RoundedCornerShape(15.dp)
    val field = RoundedCornerShape(13.dp)
    val lg = RoundedCornerShape(8.dp)
    val md = RoundedCornerShape(6.dp)
    val hero = RoundedCornerShape(23.dp)
    val state = RoundedCornerShape(22.dp)
    val sheet = RoundedCornerShape(topStart = 23.dp, topEnd = 23.dp)
    val header = RoundedCornerShape(20.dp)
    val pill = RoundedCornerShape(percent = 50)
}

/** Gradients of the design: buttons, chips and glass (assets/style.css). */
object JtBrushes {
    val primary = Brush.horizontalGradient(0f to Color(0xFF5C50FF), 0.6f to Color(0xFFAC30FA), 1f to Color(0xFFFF45B7))
    val primaryPressed = Brush.horizontalGradient(0f to Color(0xFF4A3FE0), 0.6f to Color(0xFF9326DB), 1f to Color(0xFFE0359F))
    val success = Brush.horizontalGradient(listOf(Color(0xFF0DBB80), Color(0xFF17DC9C)))
    val chip = Brush.horizontalGradient(listOf(Color(0xFF8C35FF), Color(0xFFEF42CE)))
    val glass = Brush.linearGradient(listOf(Color(0x1CFFFFFF), Color(0x08FFFFFF)))
    val banner = Brush.horizontalGradient(listOf(Color(0xFF092E64), Color(0xFF4523A5)))
    val thumb = Brush.linearGradient(0f to Color(0xFF071B5C), 0.55f to Color(0xFF096CC6), 1f to Color(0xFFA02CEF))
}

/** The page behind every dark screen: navy-to-indigo with two soft glows and the thin arc near the bottom. */
fun Modifier.designBackdrop(): Modifier = drawBehind {
    val w = size.width
    val h = size.height
    drawRect(Brush.linearGradient(0f to Color(0xFF071538), 0.65f to Color(0xFF0E1851), 1f to Color(0xFF140E47), start = Offset(w * 0.2f, 0f), end = Offset(w * 0.8f, h)))
    drawRect(Brush.radialGradient(listOf(Color(0xFF273D91), Color.Transparent), center = Offset(w, h * 0.04f), radius = h * 0.42f))
    drawRect(Brush.radialGradient(listOf(Color(0xFF401A8D), Color.Transparent), center = Offset(w * 0.05f, h * 0.85f), radius = h * 0.38f))
    drawArc(
        Color(0x66AB39FF), startAngle = 200f, sweepAngle = 140f, useCenter = false,
        topLeft = Offset(-w * 0.1f, h * 0.8f), size = Size(w * 1.2f, h * 0.1f), style = Stroke(2.dp.toPx()),
    )
}

/** Hero panel of the design: indigo-to-purple with magenta and cyan glows and a thin ring. */
fun Modifier.heroBackground(): Modifier = drawBehind {
    val w = size.width
    val h = size.height
    drawRect(Brush.linearGradient(0f to Color(0xFF0B1854), 0.55f to Color(0xFF3A1385), 1f to Color(0xFF071C5A), start = Offset.Zero, end = Offset(w, h)))
    drawRect(Brush.radialGradient(listOf(Color(0x8ADF3AFF), Color.Transparent), center = Offset(w * 0.3f, h * 0.3f), radius = maxOf(w, h) * 0.5f))
    drawRect(Brush.radialGradient(listOf(Color(0x8806CFFF), Color.Transparent), center = Offset(w * 0.85f, h * 0.8f), radius = maxOf(w, h) * 0.45f))
    val r = 105.dp.toPx()
    drawCircle(Color(0x38FFFFFF), r, Offset(w * 0.05f, h * 0.75f), style = Stroke(1.dp.toPx()))
}

/** Fades the page content out behind a fixed action at the bottom of the screen. */
@Composable
fun Modifier.bottomFade(): Modifier {
    val page = LocalJavanColors.current.page
    return background(Brush.verticalGradient(0f to page.copy(alpha = 0f), 0.35f to page.copy(alpha = 0.8f), 1f to page))
}

/** Content on a light surface inside the dark page: event cards and the bottom bar. */
@Composable
fun OnLight(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalJavanColors provides if (LocalJavanColors.current.isDark) OnLightColors else LocalJavanColors.current, content = content)
}

@Composable
fun isDarkTheme(mode: ThemeMode): Boolean = when (mode) {
    ThemeMode.SYSTEM -> isSystemInDarkTheme()
    ThemeMode.LIGHT -> false
    ThemeMode.DARK -> true
}

/** The app theme: the site's tokens, Vazirmatn, and right-to-left layout everywhere (the site is fa / dir="rtl"). */
@Composable
fun JavanTheme(dark: Boolean, content: @Composable () -> Unit) {
    val c = if (dark) DarkJavanColors else LightJavanColors
    val scheme = if (dark) {
        darkColorScheme(
            primary = c.brand600, onPrimary = androidx.compose.ui.graphics.Color.White, secondary = c.brand500,
            background = c.page, onBackground = c.ink, surface = c.surfaceSolid, onSurface = c.ink, surfaceVariant = c.surfaceSolid,
            onSurfaceVariant = c.ink2, outline = c.lineStrong, outlineVariant = c.line, error = c.dangerFg, surfaceContainer = c.surfaceSolid,
            surfaceContainerHigh = c.surfaceSolid, surfaceContainerLow = c.surfaceSolid, surfaceContainerHighest = c.surfaceSolid,
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
