package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.runtime.Immutable
import androidx.compose.ui.graphics.Color

/**
 * The web user site's design tokens (frontend/user/src/app/globals.css — the redesign package's
 * docs/design-tokens.json), light and dark, one to one. Screens use these names exactly as the site's Tailwind
 * classes do (bg-surface, text-ink-2, border-line ...).
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
    val purple: Color,
    val purpleBg: Color,
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
    val seatSoldStroke: Color,
    val seatSoldMark: Color,
    val seatVip: Color,
    val seatVipStroke: Color,
    val seatLocked: Color,
    val seatLockedStroke: Color,
    val seatReserved: Color,
    val seatReservedStroke: Color,
    val stage: Color,
    /** Seats that can not be sold (outlined only). */
    val seatDisabled: Color,
    /** Shadow tint of shadow-card / shadow-float. */
    val shadow: Color,
) {
    /** Order "در انتظار پرداخت" text: the warning-fg token. */
    val pendingFg: Color get() = if (isDark) warning else Color(0xFFB45309)
}

val LightJavanColors = JavanColors(
    isDark = false,
    page = Color(0xFFF7F9FC),
    surface = Color(0xFFFFFFFF),
    surface2 = Color(0xFFF5F7FB),
    field = Color(0xFFF1F4F9),
    line = Color(0xFFE4E7EC),
    lineStrong = Color(0xFFD0D5DD),
    ink = Color(0xFF101828),
    ink2 = Color(0xFF344054),
    muted = Color(0xFF667085),
    skeleton = Color(0xFFEAEEF4),
    navy800 = Color(0xFF12386F),
    navy900 = Color(0xFF0B2B5B),
    navy950 = Color(0xFF071D3E),
    brand50 = Color(0xFFEEF5FF),
    brand100 = Color(0xFFDCEAFF),
    brand500 = Color(0xFF2F7BEF),
    brand600 = Color(0xFF1268E8),
    brand700 = Color(0xFF0B57C9),
    purple = Color(0xFF7C3AED),
    purpleBg = Color(0xFFF4EFFF),
    ticket = Color(0xFFF43F5E),
    ticket700 = Color(0xFFE11D48),
    success = Color(0xFF16A34A),
    successBg = Color(0xFFECFDF3),
    successFg = Color(0xFF15803D),
    warning = Color(0xFFF59E0B),
    warningBg = Color(0xFFFFF8EB),
    danger = Color(0xFFDC2626),
    dangerBg = Color(0xFFFEF2F2),
    dangerFg = Color(0xFFDC2626),
    seatFree = Color(0xFFD9E9FF),
    seatFreeStroke = Color(0xFF84B7FF),
    seatSelected = Color(0xFF1268E8),
    seatSold = Color(0xFFEEF1F5),
    seatSoldStroke = Color(0xFFCDD4DD),
    seatSoldMark = Color(0xFF98A2B3),
    seatVip = Color(0xFFF5B223),
    seatVipStroke = Color(0xFFD99400),
    seatLocked = Color(0xFFE4E7EC),
    seatLockedStroke = Color(0xFFC3CAD5),
    seatReserved = Color(0xFFEDE9FE),
    seatReservedStroke = Color(0xFFC4B5FD),
    stage = Color(0xFF0B2B5B),
    seatDisabled = Color.Transparent,
    shadow = Color(0xFF101828),
)

val DarkJavanColors = JavanColors(
    isDark = true,
    page = Color(0xFF0A1424),
    surface = Color(0xFF111D33),
    surface2 = Color(0xFF15233B),
    field = Color(0xFF18273F),
    line = Color(0xFF22324F),
    lineStrong = Color(0xFF2C3D5C),
    ink = Color(0xFFEEF2F8),
    ink2 = Color(0xFFC3CEE0),
    muted = Color(0xFF95A3BA),
    skeleton = Color(0xFF1F2E4A),
    navy800 = Color(0xFF13305A),
    navy900 = Color(0xFF0D2347),
    navy950 = Color(0xFF061430),
    brand50 = Color(0xFF13284A),
    brand100 = Color(0xFF1A3561),
    brand500 = Color(0xFF5596FF),
    brand600 = Color(0xFF3B86F7),
    brand700 = Color(0xFF2F74E0),
    purple = Color(0xFFA78BFA),
    purpleBg = Color(0xFF261C45),
    ticket = Color(0xFFFB7185),
    ticket700 = Color(0xFFF43F5E),
    success = Color(0xFF2CCF68),
    successBg = Color(0xFF0F2A1E),
    successFg = Color(0xFF4ADE80),
    warning = Color(0xFFFBBF24),
    warningBg = Color(0xFF2B2310),
    danger = Color(0xFFF45B69),
    dangerBg = Color(0xFF2C1420),
    dangerFg = Color(0xFFFB7185),
    seatFree = Color(0xFF1D3A66),
    seatFreeStroke = Color(0xFF3A6DB8),
    seatSelected = Color(0xFF3B86F7),
    seatSold = Color(0xFF1B2A43),
    seatSoldStroke = Color(0xFF2C3D5C),
    seatSoldMark = Color(0xFF5F6F89),
    seatVip = Color(0xFFD99A1A),
    seatVipStroke = Color(0xFFF5B223),
    seatLocked = Color(0xFF2A3A58),
    seatLockedStroke = Color(0xFF3A4C6E),
    seatReserved = Color(0xFF2E2554),
    seatReservedStroke = Color(0xFF5B5299),
    stage = Color(0xFF13305A),
    seatDisabled = Color.Transparent,
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
