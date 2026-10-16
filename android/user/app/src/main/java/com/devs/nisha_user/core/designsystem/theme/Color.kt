package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

/**
 * The web user site's design tokens (frontend/user/src/app/globals.css), light and dark, one to one.
 * Screens use these names exactly as the site's Tailwind classes do (bg-surface, text-ink-2, border-line ...).
 */
@Immutable
data class JavanColors(
    val isDark: Boolean,
    val page: Color,
    val surface: Color,
    val surface2: Color,
    val field: Color,
    val line: Color,
    val lineStrong: Color,
    val ink: Color,
    val ink2: Color,
    val muted: Color,
    val skeleton: Color,
    val navy800: Color,
    val navy900: Color,
    val navy950: Color,
    val brand50: Color,
    val brand100: Color,
    val brand500: Color,
    val brand600: Color,
    val brand700: Color,
    val ticket: Color,
    val ticket700: Color,
    val success: Color,
    val successBg: Color,
    val successFg: Color,
    val warning: Color,
    val warningBg: Color,
    val danger: Color,
    val dangerBg: Color,
    val dangerFg: Color,
    val seatFree: Color,
    val seatFreeStroke: Color,
    val seatSelected: Color,
    val seatSold: Color,
    val seatLocked: Color,
    val seatReserved: Color,
    val seatDisabled: Color,
    val stage: Color,
    /** Shadow tint of shadow-card / shadow-float. */
    val shadow: Color,
) {
    /** Order "در انتظار پرداخت" text: #b45309 in light, the warning color in dark. */
    val pendingFg: Color get() = if (isDark) warning else Color(0xFFB45309)
}

val LightJavanColors = JavanColors(
    isDark = false,
    page = Color(0xFFF4F7FC),
    surface = Color(0xFFFFFFFF),
    surface2 = Color(0xFFF3F6FB),
    field = Color(0xFFF1F5FB),
    line = Color(0xFFE6EBF3),
    lineStrong = Color(0xFFD8E0EB),
    ink = Color(0xFF0F1B33),
    ink2 = Color(0xFF33415C),
    muted = Color(0xFF6B7890),
    skeleton = Color(0xFFE4E9F1),
    navy800 = Color(0xFF0F2A52),
    navy900 = Color(0xFF0B2145),
    navy950 = Color(0xFF071834),
    brand50 = Color(0xFFEBF3FF),
    brand100 = Color(0xFFD9E8FF),
    brand500 = Color(0xFF2F80F5),
    brand600 = Color(0xFF1463E6),
    brand700 = Color(0xFF0F53C4),
    ticket = Color(0xFFE8143F),
    ticket700 = Color(0xFFC90F35),
    success = Color(0xFF16A34A),
    successBg = Color(0xFFECFBF1),
    successFg = Color(0xFF15803D),
    warning = Color(0xFFF59E0B),
    warningBg = Color(0xFFFFF7E6),
    danger = Color(0xFFEF4454),
    dangerBg = Color(0xFFFFF0F2),
    dangerFg = Color(0xFFE11D48),
    seatFree = Color(0xFFDFE5EE),
    seatFreeStroke = Color(0xFFC9D2DF),
    seatSelected = Color(0xFF1463E6),
    seatSold = Color(0xFFF7A8B8),
    seatLocked = Color(0xFFFCD58A),
    seatReserved = Color(0xFFB9B3E8),
    seatDisabled = Color(0xFFEEF1F6),
    stage = Color(0xFF0B2145),
    shadow = Color(0xFF102A54),
)

val DarkJavanColors = JavanColors(
    isDark = true,
    page = Color(0xFF0A1424),
    surface = Color(0xFF111D33),
    surface2 = Color(0xFF16243D),
    field = Color(0xFF172540),
    line = Color(0xFF22324F),
    lineStrong = Color(0xFF2C3D5C),
    ink = Color(0xFFE7EDF7),
    ink2 = Color(0xFFC3CEE0),
    muted = Color(0xFF95A3BA),
    skeleton = Color(0xFF1F2E4A),
    navy800 = Color(0xFF11284A),
    navy900 = Color(0xFF0B1A33),
    navy950 = Color(0xFF050E1E),
    brand50 = Color(0xFF13284A),
    brand100 = Color(0xFF1A3561),
    brand500 = Color(0xFF4B93FF),
    brand600 = Color(0xFF3A86F7),
    brand700 = Color(0xFF2F74E0),
    ticket = Color(0xFFF0294F),
    ticket700 = Color(0xFFD81C42),
    success = Color(0xFF2CCF68),
    successBg = Color(0xFF0F2A1E),
    successFg = Color(0xFF4ADE80),
    warning = Color(0xFFFBBF24),
    warningBg = Color(0xFF2B2310),
    danger = Color(0xFFF45B69),
    dangerBg = Color(0xFF2C1420),
    dangerFg = Color(0xFFFB7185),
    seatFree = Color(0xFF2A3A58),
    seatFreeStroke = Color(0xFF3A4C6E),
    seatSelected = Color(0xFF3A86F7),
    seatSold = Color(0xFF9B3550),
    seatLocked = Color(0xFFA07A2A),
    seatReserved = Color(0xFF5B5299),
    seatDisabled = Color(0xFF18243A),
    stage = Color(0xFF1D3560),
    shadow = Color(0xFF000000),
)

/** "#2F80F5" → Color; null / malformed values give [fallback] (colors come from the admin panel). */
fun parseHexColor(hex: String?, fallback: Color): Color {
    val h = hex?.trim()?.removePrefix("#") ?: return fallback
    return runCatching {
        when (h.length) {
            6 -> Color(("FF$h").toLong(16))
            8 -> Color(h.toLong(16))
            3 -> Color(("FF" + h.map { "$it$it" }.joinToString("")).toLong(16))
            else -> fallback
        }
    }.getOrDefault(fallback)
}

/** CSS color-mix(in srgb, [this] p%, [other]). */
fun Color.mix(other: Color, fraction: Float): Color = Color(
    red = red * fraction + other.red * (1 - fraction),
    green = green * fraction + other.green * (1 - fraction),
    blue = blue * fraction + other.blue * (1 - fraction),
    alpha = alpha * fraction + other.alpha * (1 - fraction),
)
