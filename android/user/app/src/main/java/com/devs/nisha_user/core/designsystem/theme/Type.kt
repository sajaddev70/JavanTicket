package com.devs.nisha_user.core.designsystem.theme

import androidx.compose.ui.text.PlatformTextStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.LineHeightStyle
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.devs.nisha_user.R

/**
 * Vazirmatn "FD" (Farsi Digits), the site's font (digits are drawn as Persian digits), one file per weight like the
 * web (frontend/user/src/fonts). SIL Open Font License 1.1.
 */
val Vazirmatn = FontFamily(
    Font(R.font.vazirmatn_regular, FontWeight.Normal),
    Font(R.font.vazirmatn_medium, FontWeight.Medium),
    Font(R.font.vazirmatn_semibold, FontWeight.SemiBold),
    Font(R.font.vazirmatn_bold, FontWeight.Bold),
    Font(R.font.vazirmatn_extrabold, FontWeight.ExtraBold),
    Font(R.font.vazirmatn_black, FontWeight.Black),
)

/** Font weights by their Tailwind names. */
object W {
    val Normal = FontWeight.Normal
    val Medium = FontWeight.Medium
    val Semibold = FontWeight.SemiBold
    val Bold = FontWeight.Bold
    val Extrabold = FontWeight.ExtraBold
    val Black = FontWeight.Black
}

/**
 * Text style from the site's px values: `text(14.5, W.Bold)` = `text-[14.5px] font-bold`.
 * Persian text gets a generous default line height ([lineHeight] em), with the font's extra padding removed.
 */
fun text(size: Float, weight: FontWeight = W.Normal, lineHeight: Float = 1.7f): TextStyle = TextStyle(
    fontFamily = Vazirmatn,
    fontSize = size.sp,
    fontWeight = weight,
    lineHeight = lineHeight.em,
    platformStyle = PlatformTextStyle(includeFontPadding = false),
    lineHeightStyle = LineHeightStyle(LineHeightStyle.Alignment.Center, LineHeightStyle.Trim.None),
)

/** Explicit line height in px (leading-7 = 28px). */
fun text(size: Float, weight: FontWeight, lineHeightPx: TextUnit): TextStyle = text(size, weight).copy(lineHeight = lineHeightPx)

/**
 * Codes people may type back (order / ticket / tracking / discount codes, card numbers): Latin digits in a monospaced
 * face, like the site's `font-code` (Vazirmatn FD would draw them as Persian digits).
 */
fun code(size: Float, weight: FontWeight = W.Bold): TextStyle = text(size, weight).copy(fontFamily = FontFamily.Monospace, letterSpacing = 0.02.em)
