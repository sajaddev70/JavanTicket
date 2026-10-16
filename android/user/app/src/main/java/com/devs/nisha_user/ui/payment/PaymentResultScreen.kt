package com.devs.nisha_user.ui.payment

import com.devs.nisha_user.core.designsystem.component.CodeText
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.SectionCard
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStatus
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardVariant
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.seatText
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.HomeRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute

private enum class Tone { SUCCESS, PENDING, FAILED }

@Composable
fun PaymentResultScreen(viewModel: PaymentResultViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    Column(Modifier.fillMaxSize()) {
        JtTopBar("نتیجه پرداخت", onBack = { actions.replace(HomeRoute) })
        val result = s.result
        when {
            result != null -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Result(result)
                if (s.suggestions.isNotEmpty()) {
                    SectionCard("شاید به این رویدادها هم علاقه‌مند باشید", moreLabel = "مشاهده همه", onMore = { actions.navigate(EventsRoute()) }) {
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            s.suggestions.forEach { EventCard(it, Modifier.fillMaxWidth(), EventCardVariant.FEATURED) }
                        }
                    }
                }
            }
            s.error?.isNotFound == true -> Unverified()
            s.error != null -> ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::load)
            else -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Skeleton(Modifier.fillMaxWidth().height(200.dp), JtShapes.card)
                Skeleton(Modifier.fillMaxWidth().height(320.dp), JtShapes.card)
            }
        }
    }
}

@Composable
private fun Result(p: PaymentResult) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val o = p.order
    val tone = when (p.status) {
        PaymentStatus.SUCCESS -> Tone.SUCCESS
        PaymentStatus.INITIATED -> Tone.PENDING
        PaymentStatus.FAILED -> Tone.FAILED
    }
    val (bg, solid, fg) = when (tone) {
        Tone.SUCCESS -> Triple(c.successBg, c.success, c.successFg)
        Tone.PENDING -> Triple(c.warningBg, c.warning, c.ink)
        Tone.FAILED -> Triple(c.dangerBg, c.danger, c.dangerFg)
    }

    JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(0.dp)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Illustration(tone)
            Text(
                when (tone) {
                    Tone.SUCCESS -> "پرداخت با موفقیت انجام شد!"
                    Tone.PENDING -> "در حال بررسی پرداخت ..."
                    Tone.FAILED -> "پرداخت ناموفق بود."
                },
                style = text(24f, W.Black),
                color = c.ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 20.dp),
            )
            Text(
                when (tone) {
                    Tone.SUCCESS -> "از خرید شما سپاسگزاریم. بلیت شما با موفقیت صادر شد و هم‌اکنون در بخش بلیت‌های من قابل مشاهده است."
                    Tone.PENDING -> "اگر مبلغی از حساب شما کسر شده باشد، پس از تأیید بانک بلیت صادر می‌شود."
                    Tone.FAILED -> "در صورت کسر مبلغ، طی ۷۲ ساعت به حساب شما بازمی‌گردد."
                },
                style = text(15f, lineHeight = 2.1f),
                color = c.ink2,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp).widthIn(max = 460.dp),
            )
            Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                when (tone) {
                    Tone.SUCCESS -> {
                        val first = o.tickets.firstOrNull()
                        JtButton("مشاهده بلیت", { actions.replace(if (first != null) TicketRoute(first.id) else TicketsRoute) }, size = ButtonSize.XL, block = true, leading = Lucide.Ticket)
                        JtButton("بازگشت به صفحه اصلی", { actions.replace(HomeRoute) }, variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, leading = Lucide.Home)
                    }
                    Tone.PENDING -> Unit
                    Tone.FAILED -> {
                        if (o.payable) JtButton("تلاش مجدد", { actions.replace(PaymentRoute(o.orderNumber)) }, size = ButtonSize.XL, block = true, leading = Lucide.RefreshCw)
                        JtButton("بازگشت به سفارش", { actions.replace(OrderRoute(o.orderNumber)) }, variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, leading = Lucide.Undo2)
                    }
                }
            }
        }
    }

    JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(0.dp)) {
        Row(Modifier.fillMaxWidth().background(bg).padding(20.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            Box(Modifier.size(56.dp).clip(CircleShape).background(solid), contentAlignment = Alignment.Center) {
                JtIcon(
                    when (tone) {
                        Tone.SUCCESS -> Lucide.Check
                        Tone.PENDING -> Lucide.Hourglass
                        Tone.FAILED -> Lucide.CircleX
                    },
                    size = 30.dp, tint = Color.White, strokeWidth = if (tone == Tone.SUCCESS) 3f else 2f,
                )
            }
            Column {
                Text(
                    when (tone) {
                        Tone.SUCCESS -> "پرداخت موفق"
                        Tone.PENDING -> "در انتظار تأیید پرداخت"
                        Tone.FAILED -> "پرداخت ناموفق بود."
                    },
                    style = text(21f, W.Black),
                    color = fg,
                )
                Text(
                    when (tone) {
                        Tone.SUCCESS -> "تراکنش شما با موفقیت انجام شد."
                        Tone.PENDING -> "نتیجه پرداخت از بانک دریافت نشده است؛ این صفحه به‌روز می‌شود."
                        Tone.FAILED -> p.failureReason ?: "پرداخت انجام نشد."
                    },
                    style = text(13.5f),
                    color = c.ink2,
                    modifier = Modifier.padding(top = 4.dp),
                )
            }
        }
        Column(Modifier.padding(horizontal = 16.dp)) {
            p.trackingCode?.let { CopyRow("شماره پیگیری", it) }
            p.referenceId?.let { CopyRow("شماره تراکنش", it) }
            ResultRow(if (tone == Tone.SUCCESS) "تاریخ و ساعت پرداخت" else "تاریخ و ساعت", Fa.dateTime(p.verifiedAt ?: p.createdAt))
            ResultRow("روش پرداخت", p.gatewayTitle)
            p.cardPan?.let { ResultRow("شماره کارت", it, isCode = true) }
            CopyRow("شماره سفارش", o.orderNumber)
            Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("نام رویداد", style = text(14f), color = c.ink2)
                Column(Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                    Text(o.eventTitle, style = text(14f, W.Black), color = c.ink, textAlign = TextAlign.Left, modifier = Modifier.clip(JtShapes.md).clickable { actions.navigate(EventDetailRoute(o.eventSlug)) })
                    o.eventSubtitle?.let { Text(it, style = text(12f), color = c.muted) }
                }
                RemoteImage(o.bannerUrl, Modifier.size(48.dp).clip(JtShapes.lg))
            }
            HDivider()
            IconResultRow(Lucide.CalendarDays, "تاریخ و ساعت اجرا", "${Fa.fullDate(o.startTime)} - ${Fa.time(o.startTime)}")
            IconResultRow(Lucide.MapPin, "محل برگزاری", listOfNotNull(o.hallName, o.venueName, o.cityName).joinToString(" - "))
            IconResultRow(Lucide.Armchair, if (o.quantity != null) "بلیت‌ها" else "صندلی‌ها", if (o.quantity != null) "${Fa.number(o.quantity)} بلیت ورود عمومی" else o.seats.joinToString("، ") { seatText(it) })
        }
        Row(
            Modifier.padding(12.dp).fillMaxWidth().clip(JtShapes.xl2).background(if (tone == Tone.SUCCESS) c.successBg else c.surface2).padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            JtIcon(Lucide.Banknote, size = 24.dp, tint = if (tone == Tone.SUCCESS) c.successFg else c.ink)
            Text(if (tone == Tone.SUCCESS) " مبلغ کل پرداختی" else " مبلغ سفارش", style = text(15f, W.Black), color = if (tone == Tone.SUCCESS) c.successFg else c.ink, modifier = Modifier.weight(1f))
            Text(Fa.price(p.amount), style = text(20f, W.Black), color = if (tone == Tone.SUCCESS) c.successFg else c.ink)
        }
    }
}

@Composable
private fun ResultRow(label: String, value: String, isCode: Boolean = false) {
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = text(14f), color = Jt.colors.ink2, modifier = Modifier.weight(1f))
            if (isCode) CodeText(value, size = 14f) else Text(value, style = text(14f, W.Bold), color = Jt.colors.ink, textAlign = TextAlign.Left)
        }
        HDivider()
    }
}

@Composable
private fun CopyRow(label: String, value: String) {
    val clipboard = LocalClipboardManager.current
    val toaster = LocalToaster.current
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = text(14f), color = Jt.colors.ink2, modifier = Modifier.weight(1f))
            JtIconButton(Lucide.Copy, {
                clipboard.setText(AnnotatedString(value))
                toaster.success("$label کپی شد.")
            }, "کپی $label", size = 36.dp, iconSize = 16.dp, borderColor = null, tint = Jt.colors.muted)
            CodeText(value, size = 14f)
        }
        HDivider()
    }
}

@Composable
private fun IconResultRow(icon: LucidePaths, label: String, value: String) {
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Text(label, style = text(14f), color = Jt.colors.ink2)
            Text(value, style = text(13.5f, W.Bold), color = Jt.colors.ink, textAlign = TextAlign.Left, modifier = Modifier.weight(1f))
            JtIcon(icon, size = 18.dp, tint = Jt.colors.ink2)
        }
        HDivider()
    }
}

/** Ticket with a check (or cross) and falling confetti, drawn in Compose so it follows the theme. */
@Composable
private fun Illustration(tone: Tone) {
    val c = Jt.colors
    val color = when (tone) {
        Tone.SUCCESS -> c.success
        Tone.FAILED -> c.danger
        Tone.PENDING -> c.warning
    }
    val confetti = listOf(Color(0xFF1463E6), Color(0xFFF59E0B), Color(0xFF16A34A), Color(0xFFE8143F), Color(0xFF38BDF8), Color(0xFFA855F7))
    val transition = rememberInfiniteTransition(label = "confetti")
    val fall by transition.animateFloat(0f, 1f, infiniteRepeatable(tween(2600, easing = LinearEasing), RepeatMode.Restart), label = "fall")
    Box(Modifier.fillMaxWidth().height(220.dp), contentAlignment = Alignment.Center) {
        Box(Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp).width(260.dp).height(36.dp).clip(CircleShape).background(c.line.copy(alpha = 0.7f)))
        if (tone == Tone.SUCCESS) {
            Canvas(Modifier.fillMaxSize()) {
                repeat(18) { i ->
                    val x = size.width * (0.08f + ((i * 47) % 84) / 100f)
                    val y0 = size.height * (((i * 29) % 60) / 100f)
                    val phase = (fall + (i % 6) * 0.13f) % 1f
                    val y = y0 + phase * size.height * 0.35f
                    drawRoundRect(confetti[i % confetti.size].copy(alpha = 1f - phase * 0.6f), Offset(x, y), Size(6.dp.toPx(), 12.dp.toPx()), CornerRadius(6f))
                }
            }
        }
        Box(Modifier.width(230.dp).height(120.dp).rotate(-12f).clip(JtShapes.xl2).background(color), contentAlignment = Alignment.Center) {
            Canvas(Modifier.fillMaxSize()) {
                // Notches on both sides and a dashed tear line, like a printed ticket.
                drawCircle(c.surface, 16.dp.toPx(), Offset(0f, size.height / 2))
                drawCircle(c.surface, 16.dp.toPx(), Offset(size.width, size.height / 2))
                val x = size.width * 0.3f
                drawLine(Color.White.copy(alpha = 0.5f), Offset(x, 16.dp.toPx()), Offset(x, size.height - 16.dp.toPx()), 2.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f)))
            }
            Box(Modifier.offset(x = 0.dp).size(64.dp).clip(CircleShape).background(Color.White.copy(alpha = 0.95f)), contentAlignment = Alignment.Center) {
                JtIcon(
                    when (tone) {
                        Tone.SUCCESS -> Lucide.Check
                        Tone.FAILED -> Lucide.CircleX
                        Tone.PENDING -> Lucide.Hourglass
                    },
                    size = 38.dp, tint = color, strokeWidth = if (tone == Tone.SUCCESS) 3.2f else 2f,
                )
            }
        }
    }
}

/** No such payment (or not this user's): the failed illustration with the way back. */
@Composable
private fun Unverified() {
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxWidth().padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Illustration(Tone.FAILED)
        Text("پرداخت ناموفق بود.", style = text(22f, W.Black), color = c.ink)
        Text("اطلاعات این پرداخت پیدا نشد. اگر مبلغی از حساب شما کسر شده است، طی ۷۲ ساعت بازمی‌گردد.", style = text(14.5f, lineHeight = 2f), color = c.ink2, textAlign = TextAlign.Center, modifier = Modifier.padding(vertical = 8.dp))
        JtButton("سفارش‌های من", { actions.replace(OrdersRoute) }, Modifier.padding(top = 8.dp), trailing = Lucide.ArrowLeft)
        JtButton("صفحه اصلی", { actions.replace(HomeRoute) }, Modifier.padding(top = 8.dp), variant = ButtonVariant.OUTLINE)
    }
}
