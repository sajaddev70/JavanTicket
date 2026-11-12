package com.devs.nisha_user.core.format

import android.icu.text.DateFormat
import android.icu.text.NumberFormat
import android.icu.text.SimpleDateFormat
import android.icu.util.TimeZone
import android.icu.util.ULocale
import java.time.Instant
import java.util.Date

/**
 * Persian formatting, the same output as the web's lib/format.ts: Persian digits, Jalali dates in Tehran time and
 * prices in Toman. Android's ICU uses the same CLDR data as the browser's Intl, so strings match the site exactly.
 */
object Fa {
    private val TEHRAN: TimeZone = TimeZone.getTimeZone("Asia/Tehran")
    private val PERSIAN = ULocale("fa_IR@calendar=persian")
    private val FA = ULocale("fa_IR")

    private fun pattern(p: String): DateFormat = SimpleDateFormat(p, PERSIAN).apply { timeZone = TEHRAN }

    // ICU formatters are not thread-safe; one set per thread.
    private class Formats {
        val number: NumberFormat = NumberFormat.getInstance(FA)
        val date = pattern("d MMMM y")
        val dayMonth = pattern("d MMMM")
        val day = pattern("d")
        val weekday = pattern("EEEE")
        val month = pattern("MMMM")
        val time = pattern("HH:mm")
        val year = pattern("y")
        val ym = pattern("yyyy-MM")
        val ymd = pattern("yyyy-MM-dd")
    }

    private val formats = ThreadLocal.withInitial { Formats() }
    private val f get() = formats.get()!!

    private fun parse(iso: String): Date = Date.from(Instant.parse(normalizeIso(iso)))

    /** The API sends UTC instants ("2026-10-16T14:30:00Z"); older rows may lack the zone. */
    private fun normalizeIso(iso: String): String = if (iso.endsWith("Z") || iso.contains('+') || iso.lastIndexOf('-') > 9) iso else "${iso}Z"

    fun instant(iso: String): Instant = Instant.parse(normalizeIso(iso))

    /** "۲۱۰٬۰۰۰"; "—" for a missing value. */
    fun number(value: Number?): String = value?.let { f.number.format(it) } ?: "—"

    /** "۲۱۰٬۰۰۰ تومان" */
    fun price(value: Number?): String = "${number(value)} تومان"

    /** "۲۸ اردیبهشت ۱۴۰۴" */
    fun date(iso: String): String = f.date.format(parse(iso))

    /** "۲۸ اردیبهشت" */
    fun dayMonth(iso: String): String = f.dayMonth.format(parse(iso))

    /** "جمعه" */
    fun weekday(iso: String): String = f.weekday.format(parse(iso))

    /** "۲۸": Jalali day of month (event card date badge). */
    fun day(iso: String): String = f.day.format(parse(iso))

    /** "اردیبهشت" */
    fun month(iso: String): String = f.month.format(parse(iso))

    /** "۲۰:۰۰" */
    fun time(iso: String): String = f.time.format(parse(iso))

    /** "جمعه ۲۸ اردیبهشت ۱۴۰۴" */
    fun fullDate(iso: String): String = "${weekday(iso)} ${date(iso)}"

    /** "جمعه ۲۸ اردیبهشت ۱۴۰۴ - ۲۰:۰۰" */
    fun dateTime(iso: String): String = "${fullDate(iso)} - ${time(iso)}"

    fun year(instant: Instant = Instant.now()): String = f.year.format(Date.from(instant))

    fun sameDay(a: String, b: String): Boolean = f.ymd.format(parse(a)) == f.ymd.format(parse(b))

    /** Same-month ranges collapse to "۲۴ تا ۲۷ اردیبهشت ۱۴۰۴". */
    fun dateRange(start: String, end: String?): String {
        if (end == null || sameDay(start, end)) return date(start)
        if (f.ym.format(parse(start)) == f.ym.format(parse(end))) return "${f.day.format(parse(start))} تا ${date(end)}"
        return "${date(start)} تا ${date(end)}"
    }

    /** "۱۹:۰۰ تا ۲۱:۰۰" */
    fun timeRange(start: String, end: String?): String = if (end != null) "${time(start)} تا ${time(end)}" else time(start)

    /** Countdown "09:41" for hold timers. */
    fun clock(seconds: Long): String = toFaDigits("%02d:%02d".format(seconds / 60, seconds % 60))
}

private const val FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹"
private const val AR_DIGITS = "٠١٢٣٤٥٦٧٨٩"

fun toFaDigits(input: String): String = buildString(input.length) {
    input.forEach { c -> append(if (c in '0'..'9') FA_DIGITS[c - '0'] else c) }
}

fun toEnDigits(input: String): String = buildString(input.length) {
    input.forEach { c ->
        val fa = FA_DIGITS.indexOf(c)
        val ar = AR_DIGITS.indexOf(c)
        append(
            when {
                fa >= 0 -> '0' + fa
                ar >= 0 -> '0' + ar
                else -> c
            },
        )
    }
}

/** "09121234567" -> "۰۹۱۲ *** ۴۵۶۷" */
fun maskMobile(mobile: String): String =
    if (mobile.length < 8) toFaDigits(mobile) else toFaDigits("${mobile.take(4)} *** ${mobile.takeLast(4)}")

/** "09121234567" -> "۰۹۱۲ ۱۲۳ ۴۵۶۷" */
fun formatMobile(mobile: String): String =
    toFaDigits(if (mobile.length == 11) "${mobile.take(4)} ${mobile.substring(4, 7)} ${mobile.substring(7)}" else mobile)

/** Accepts Persian/Arabic digits, +98 / 0098 / 98 prefixes and spaces; returns 09XXXXXXXXX or null. */
fun normalizeIranMobile(input: String): String? {
    var digits = toEnDigits(input).filter { it.isDigit() }
    if (digits.startsWith("0098")) digits = digits.drop(4)
    else if (digits.startsWith("98") && digits.length == 12) digits = digits.drop(2)
    if (digits.length == 10 && digits.startsWith("9")) digits = "0$digits"
    return digits.takeIf { Regex("^09\\d{9}$").matches(it) }
}

/** "WYAXXWRLFTABA375" -> "WYAX-XWRL-FTAB-A375" (QR payload as printed under the code). */
fun groupCode(code: String, size: Int = 4): String = code.chunked(size).joinToString("-")

/** Blank-line separated paragraphs of an admin-written text. */
fun paragraphs(text: String?): List<String> = (text ?: "").split(Regex("\\n\\s*\\n")).map { it.trim() }.filter { it.isNotEmpty() }

/**
 * Left-to-right isolate (U+2066 … U+2069), the web's dir="ltr": keeps codes, mobiles and phone numbers in their own
 * order inside right-to-left text (otherwise "۰۹۱۲ *** ۴۵۶۷" is shown as "۴۵۶۷ *** ۰۹۱۲").
 */
fun ltr(value: String): String = "\u2066$value\u2069"
