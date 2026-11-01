package com.devs.nisha_user.core.designsystem.component

import android.os.SystemClock
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import kotlinx.coroutines.delay

/**
 * Seconds remaining until a server deadline. The backend reports `seconds_left` by its own clock; the deadline is
 * anchored to the moment that answer arrived ([receivedAt], elapsedRealtime), so the phone's clock cannot change it.
 */
@Composable
fun rememberCountdown(secondsLeft: Long?, receivedAt: Long): Long? {
    if (secondsLeft == null) return null
    var now by remember { mutableLongStateOf(SystemClock.elapsedRealtime()) }
    LaunchedEffect(secondsLeft, receivedAt) {
        while (true) {
            now = SystemClock.elapsedRealtime()
            delay(1000)
        }
    }
    return maxOf(0L, secondsLeft - maxOf(0L, now - receivedAt) / 1000)
}

enum class TimerVariant { CHIP, LARGE, TEXT }

/** Countdown of a seat hold / order; calls [onExpire] once when it reaches zero (shared/HoldTimer.tsx). */
@Composable
fun HoldTimer(secondsLeft: Long?, receivedAt: Long, modifier: Modifier = Modifier, variant: TimerVariant = TimerVariant.CHIP, onExpire: (() -> Unit)? = null) {
    val left = rememberCountdown(secondsLeft, receivedAt) ?: return
    val expire by rememberUpdatedState(onExpire)
    LaunchedEffect(left == 0L) { if (left == 0L) expire?.invoke() }
    val c = Jt.colors
    val urgent = left <= 60
    val label = "زمان باقی‌مانده: ${Fa.number((left + 59) / 60)} دقیقه"
    val clock = Fa.clock(left)
    when (variant) {
        TimerVariant.TEXT -> Text(clock, style = text(13f, W.Bold), color = Color.White, modifier = modifier.semantics { contentDescription = label })
        TimerVariant.LARGE -> Text(clock, style = text(28f, W.Black), color = if (urgent) c.dangerFg else c.brand600, modifier = modifier.semantics { contentDescription = label })
        TimerVariant.CHIP -> Row(
            modifier
                .clip(JtShapes.lg)
                .background(if (urgent) c.dangerBg else c.field)
                .padding(horizontal = 10.dp, vertical = 4.dp)
                .semantics { contentDescription = label },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            JtIcon(Lucide.Clock, size = 16.dp, tint = if (urgent) c.dangerFg else c.ink)
            Text(clock, style = text(13f, W.Black), color = if (urgent) c.dangerFg else c.ink)
        }
    }
}

private val STEPS = listOf("انتخاب", "اطلاعات", "پرداخت")

/** The design's .step row: ۱ انتخاب، ۲ اطلاعات، ۳ پرداخت ([current] is 0-based; it and the steps before it are filled). */
@Composable
fun CheckoutSteps(current: Int, modifier: Modifier = Modifier) {
    val c = Jt.colors
    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        STEPS.forEachIndexed { i, label ->
            val on = i <= current
            Text(
                "${Fa.number(i + 1)} $label",
                style = text(10f, if (on) W.Bold else W.Normal),
                color = if (on) Color.White else c.ink2,
                textAlign = TextAlign.Center,
                modifier = Modifier
                    .weight(1f)
                    .clip(JtShapes.field)
                    .background(if (on) c.brand700 else c.field)
                    .padding(horizontal = 4.dp, vertical = 10.dp)
                    .semantics { contentDescription = label + if (i < current) " (انجام شد)" else if (i == current) " (مرحله فعلی)" else "" },
            )
        }
    }
}

/** The design's .banner: navy-to-purple strip with a line of text. */
@Composable
fun InfoBanner(icon: LucidePaths?, modifier: Modifier = Modifier, centered: Boolean = false, content: @Composable () -> Unit) {
    Row(
        modifier
            .fillMaxWidth()
            .clip(JtShapes.xl)
            .background(JtBrushes.banner)
            .border(1.dp, Color(0xFF8561FA), JtShapes.xl)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = if (centered) Arrangement.Center else Arrangement.spacedBy(8.dp),
    ) {
        if (icon != null) JtIcon(icon, size = 18.dp, tint = Color.White)
        content()
    }
}
