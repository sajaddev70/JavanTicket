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
    /** Opaque surface for what floats above the page: sheets, dialogs, toasts. */
    val surfaceSolid: Color,
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
    surfaceSolid = Color(0xFFFFFFFF),
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

/** The dark gradient look of the app design (file/javan_complete_states/assets/style.css): glass surfaces over [JtBrushes]. */
val DarkJavanColors = JavanColors(
    isDark = true,
    page = Color(0xFF0B1240),
    surface = Color(0x17FFFFFF),
    surfaceSolid = Color(0xFF111E55),
    surface2 = Color(0x12FFFFFF),
    field = Color(0x16FFFFFF),
    line = Color(0x29FFFFFF),
    lineStrong = Color(0x3BFFFFFF),
    ink = Color(0xFFFFFFFF),
    ink2 = Color(0xFFD0DBF5),
    muted = Color(0xFFB9C8E7),
    skeleton = Color(0x1FFFFFFF),
    navy800 = Color(0xFF273D91),
    navy900 = Color(0xFF0E1851),
    navy950 = Color(0xFF071538),
    brand50 = Color(0x2E8C35FF),
    brand100 = Color(0x478C35FF),
    brand500 = Color(0xFF80D8FF),
    brand600 = Color(0xFFB79BFF),
    brand700 = Color(0xFF7739E9),
    purple = Color(0xFFA78BFA),
    purpleBg = Color(0xFF261C45),
    ticket = Color(0xFFFF4F94),
    ticket700 = Color(0xFFF43F5E),
    success = Color(0xFF0DBB80),
    successBg = Color(0x4D0DBB80),
    successFg = Color(0xFFD5FFEF),
    warning = Color(0xFFF3B83C),
    warningBg = Color(0x33F3B83C),
    danger = Color(0xFFF45B69),
    dangerBg = Color(0x33F45B69),
    dangerFg = Color(0xFFFF9AA5),
    seatFree = Color(0xFF7CD5FF),
    seatFreeStroke = Color(0xFF2382BF),
    seatSelected = Color(0xFFAC30FA),
    seatSold = Color(0xFF7584A5),
    seatSoldStroke = Color(0xFF5C6A8A),
    seatSoldMark = Color(0xFF2C3654),
    seatVip = Color(0xFFF3B83C),
    seatVipStroke = Color(0xFFB98A1F),
    seatLocked = Color(0xFF4A5778),
    seatLockedStroke = Color(0xFF66749A),
    seatReserved = Color(0xFF7948D9),
    seatReservedStroke = Color(0xFF9B78EE),
    stage = Color(0xFF4523A5),
    seatDisabled = Color.Transparent,
    shadow = Color(0xFF020725),
)

/** White event cards and the bottom bar stay light on the dark page (.event and .nav of the design). */
val OnLightColors = LightJavanColors.copy(
    surface = Color(0xFFF8FAFF),
    surfaceSolid = Color(0xFFF8FAFF),
    ink = Color(0xFF13224D),
    ink2 = Color(0xFF152456),
    muted = Color(0xFF63708F),
    brand600 = Color(0xFF0567B5),
    line = Color(0x00000000),
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
