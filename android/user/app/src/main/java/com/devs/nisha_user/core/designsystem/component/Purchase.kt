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
import com.devs.nisha_user.core.designsystem.theme.Jt
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
        TimerVariant.TEXT -> Text(clock, style = text(14f, W.Bold), modifier = modifier.semantics { contentDescription = label })
        TimerVariant.LARGE -> Text(clock, style = text(28f, W.Black), color = if (urgent) c.dangerFg else c.brand600, modifier = modifier.semantics { contentDescription = label })
        TimerVariant.CHIP -> Row(
            modifier
                .clip(JtShapes.lg)
                .background(if (urgent) c.dangerBg else c.brand50)
                .padding(horizontal = 10.dp, vertical = 4.dp)
                .semantics { contentDescription = label },
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            JtIcon(Lucide.Clock, size = 16.dp, tint = if (urgent) c.dangerFg else c.brand600)
            Text(clock, style = text(14f, W.Black), color = if (urgent) c.dangerFg else c.brand600)
        }
    }
}

private val STEPS = listOf(
    "انتخاب صندلی" to Lucide.Armchair,
    "اطلاعات خریدار" to Lucide.UserRound,
    "پرداخت" to Lucide.CreditCard,
    "بلیت" to Lucide.Ticket,
)

/** Purchase progress: seat selection → buyer details → payment → ticket ([current] is 0-based). */
@Composable
fun CheckoutSteps(current: Int, modifier: Modifier = Modifier) {
    val c = Jt.colors
    val done = c.brand600
    val todo = c.lineStrong
    Box(
        modifier
            .fillMaxWidth()
            .drawBehind {
                // Connectors between neighbouring circles (RTL: the first step is on the right).
                val step = size.width / STEPS.size
                val gap = 26.dp.toPx()
                val y = 20.dp.toPx()
                for (i in 1 until STEPS.size) {
                    val from = size.width - (i - 0.5f) * step - gap
                    val to = size.width - (i + 0.5f) * step + gap
                    drawLine(if (i <= current) done else todo, Offset(from, y), Offset(to, y), strokeWidth = 3.dp.toPx(), cap = StrokeCap.Round)
                }
            },
    ) {
        Row(Modifier.fillMaxWidth()) {
            STEPS.forEachIndexed { i, (label, icon) ->
                val isDone = i < current
                val active = i == current
                Column(
                    Modifier.weight(1f).semantics { contentDescription = label + if (isDone) " (انجام شد)" else if (active) " (مرحله فعلی)" else "" },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Box(
                        Modifier
                            .size(40.dp)
                            .then(if (active) Modifier.border(4.dp, c.brand500.copy(alpha = 0.15f), CircleShape).padding(2.dp) else Modifier)
                            .clip(CircleShape)
                            .background(if (isDone || active) c.brand600 else c.surface)
                            .border(3.dp, if (isDone || active) c.brand600 else c.lineStrong, CircleShape),
                        contentAlignment = Alignment.Center,
                    ) {
                        JtIcon(if (isDone) Lucide.Check else icon, size = 20.dp, tint = if (isDone || active) Color.White else c.muted, strokeWidth = if (isDone) 3f else 2f)
                    }
                    Text(
                        label,
                        style = text(12.5f, W.Black),
                        color = if (active || isDone) c.brand600 else c.ink2,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp),
                    )
                }
            }
        }
    }
}
