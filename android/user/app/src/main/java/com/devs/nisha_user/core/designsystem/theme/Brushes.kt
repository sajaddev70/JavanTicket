package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * Gradients of the Javan Light Redesign (same stops as the site's globals.css). Horizontal brushes run from the
 * start (right, RTL) to the end, so the darker stop sits on the right like the references.
 */
object JtBrushes {
    /** Violet pill buttons, active chips and tabs. */
    val primary = Brush.horizontalGradient(listOf(Color(0xFF8E45FF), Color(0xFF6324F9)))
    /** Magenta event CTA ("انتخاب سانس"). */
    val pink = Brush.horizontalGradient(listOf(Color(0xFFE8168A), Color(0xFFC9046A)))
    /** Green pay button. */
    val success = Brush.horizontalGradient(listOf(Color(0xFF1DBB3B), Color(0xFF079A22)))
    /** Orange hero button. */
    val orange = Brush.horizontalGradient(listOf(Color(0xFFFDA54F), Color(0xFFFB8A06)))
    /** Login CTA: pink → violet → blue. */
    val login = Brush.horizontalGradient(listOf(Color(0xFFFA68B5), Color(0xFFA45CF0), Color(0xFF675CFC)))

    /** Navy → indigo band behind the top of each screen, fading into [end] (the page color). */
    fun band(end: Color, startY: Float = 0f, endY: Float = Float.POSITIVE_INFINITY) = Brush.verticalGradient(
        0f to Color(0xFF0F2A68),
        0.34f to Color(0xFF183887),
        0.58f to Color(0xFF33409F),
        0.78f to mixTo(Color(0xFF6A5CC8), end, 0.55f),
        1f to end,
        startY = startY,
        endY = endY,
    )

    /** Solid version of the band (seat panel, profile, login top). */
    val bandSolid = Brush.verticalGradient(listOf(Color(0xFF0F2A68), Color(0xFF1A3A8C), Color(0xFF2F3C9C)))

    /** Payment result backgrounds (reference 07). */
    val resultSuccess = Brush.verticalGradient(listOf(Color(0xFF005846), Color(0xFF0B5A5C), Color(0xFF115465), Color(0xFF0B3367), Color(0xFF102B67)))
    val resultFailed = Brush.verticalGradient(listOf(Color(0xFF7A1230), Color(0xFF5A1D55), Color(0xFF23306F), Color(0xFF102B67)))
    val resultPending = Brush.verticalGradient(listOf(Color(0xFF6B3E05), Color(0xFF4A3A52), Color(0xFF1D3470), Color(0xFF102B67)))

    /** Login / OTP background (reference 13). */
    val login13 = Brush.verticalGradient(
        0f to Color(0xFF0F2A68), 0.3f to Color(0xFF1D47A6), 0.55f to Color(0xFF4A63C7), 0.72f to Color(0xFF8A6FD6),
        0.88f to Color(0xFFE58FBF), 1f to Color(0xFFF6B48A),
    )

    private fun mixTo(a: Color, b: Color, f: Float) = Color(
        red = a.red * f + b.red * (1 - f), green = a.green * f + b.green * (1 - f), blue = a.blue * f + b.blue * (1 - f), alpha = 1f,
    )
}

/** Translucent white of the glass controls on the band. */
val GlassFill = Color(0x1FFFFFFF)
val GlassStroke = Color(0x24FFFFFF)
