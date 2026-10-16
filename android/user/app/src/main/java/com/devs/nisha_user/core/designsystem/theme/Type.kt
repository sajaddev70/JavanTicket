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
 * IRANSans FaNum, the site's font (digits are drawn as Persian digits). Weights follow the browser's matching of the
 * site's three files: 400 Regular, 500 the "Medium" file, 600–900 Bold (font-semibold / bold / extrabold / black).
 */
val IranSans = FontFamily(
    Font(R.font.iransans_regular, FontWeight.Normal),
    Font(R.font.iransans_medium, FontWeight.Medium),
    Font(R.font.iransans_bold, FontWeight.SemiBold),
    Font(R.font.iransans_bold, FontWeight.Bold),
    Font(R.font.iransans_bold, FontWeight.ExtraBold),
    Font(R.font.iransans_bold, FontWeight.Black),
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
    fontFamily = IranSans,
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
 * face, like the site's `font-code` (IRANSans FaNum would draw them as Persian digits).
 */
fun code(size: Float, weight: FontWeight = W.Bold): TextStyle = text(size, weight).copy(fontFamily = FontFamily.Monospace, letterSpacing = 0.02.em)
