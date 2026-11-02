package com.devs.nisha_user.ui.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.BrandRow
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CodeText
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PaymentResult
import com.devs.nisha_user.domain.model.PaymentStatus
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.seatText
import com.devs.nisha_user.ui.navigation.HomeRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute

/** 12 پرداخت موفق and 11's پرداخت ناموفق: what the bank answered, checked again by the backend. */
@Composable
fun PaymentResultScreen(viewModel: PaymentResultViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val result = s.result
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).statusBarsPadding().navigationBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp)) {
            BrandRow()
            when {
                result != null -> Result(result)
                s.error?.isNotFound == true -> Unverified()
                s.error != null -> ErrorState(s.error, onRetry = viewModel::load)
            }
        }
        if (result == null && s.error == null) LoadingOverlay("در حال بررسی پرداخت", "لطفاً صفحه را نبندید.")
    }
}

@Composable
private fun Result(p: PaymentResult) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val o = p.order
    var failureSeen by rememberSaveable { mutableStateOf(false) }
    val (symbol, title, message) = when (p.status) {
        PaymentStatus.SUCCESS -> Triple(StateSymbol.SUCCESS, "پرداخت موفق!", "خرید شما با موفقیت انجام شد و بلیت‌ها آماده‌اند.")
        PaymentStatus.INITIATED -> Triple(StateSymbol.WAIT, "در حال بررسی پرداخت", "اگر مبلغی از حساب شما کسر شده باشد، پس از تأیید بانک بلیت صادر می‌شود.")
        PaymentStatus.FAILED -> Triple(StateSymbol.FAILED, "پرداخت انجام نشد", p.failureReason ?: "در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد.")
    }
    Column(Modifier.fillMaxWidth().padding(top = 40.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(symbol, style = text(92f, lineHeight = 1.25f))
        Text(title, style = text(24f, W.Black), color = c.ink, textAlign = TextAlign.Center)
        Text(message, style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center)
        JtCard(Modifier.fillMaxWidth()) {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("شماره سفارش", style = text(11f), color = c.muted)
                CodeText(o.orderNumber, size = 19f, color = c.ink, weight = W.Black)
                Text(
                    when (p.status) {
                        PaymentStatus.SUCCESS -> "پرداخت‌شده"
                        PaymentStatus.INITIATED -> "در انتظار تأیید"
                        PaymentStatus.FAILED -> "پرداخت‌نشده"
                    },
                    style = text(10f),
                    color = if (p.status == PaymentStatus.SUCCESS) c.successFg else c.ink,
                    modifier = Modifier.clip(JtShapes.pill).background(if (p.status == PaymentStatus.SUCCESS) c.successBg else c.field).padding(horizontal = 11.dp, vertical = 5.dp),
                )
            }
        }
        when (p.status) {
            PaymentStatus.SUCCESS -> {
                JtButton("مشاهده بلیت‌ها", { actions.replace(TicketsRoute) }, size = ButtonSize.XL, block = true, trailing = Lucide.ArrowLeft)
                JtButton("بازگشت به صفحه اصلی", { actions.replace(HomeRoute) }, variant = ButtonVariant.OUTLINE, size = ButtonSize.XL, block = true)
            }
            PaymentStatus.FAILED -> {
                if (o.payable) JtButton("تلاش مجدد", { actions.replace(PaymentRoute(o.orderNumber)) }, size = ButtonSize.XL, block = true)
                JtButton("بازگشت به سفارش", { actions.replace(OrderRoute(o.orderNumber)) }, variant = ButtonVariant.OUTLINE, size = ButtonSize.XL, block = true)
            }
            PaymentStatus.INITIATED -> Unit
        }
        JtCard(Modifier.fillMaxWidth()) {
            p.trackingCode?.let { CopyRow("شماره پیگیری", it) }
            p.referenceId?.let { CopyRow("شماره تراکنش", it) }
            ResultRow(if (p.status == PaymentStatus.SUCCESS) "تاریخ و ساعت پرداخت" else "تاریخ و ساعت", Fa.dateTime(p.verifiedAt ?: p.createdAt))
            ResultRow("روش پرداخت", p.gatewayTitle)
            p.cardPan?.let { ResultRow("شماره کارت", it, isCode = true) }
            ResultRow("رویداد", o.eventTitle)
            ResultRow("تاریخ و ساعت اجرا", "${Fa.fullDate(o.startTime)} - ${Fa.time(o.startTime)}")
            ResultRow("محل برگزاری", listOfNotNull(o.hallName, o.venueName, o.cityName).joinToString(" - "))
            ResultRow(if (o.quantity != null) "بلیت‌ها" else "صندلی‌ها", if (o.quantity != null) "${Fa.number(o.quantity)} بلیت ورود عمومی" else o.seats.joinToString("، ") { seatText(it) })
            ResultRow(if (p.status == PaymentStatus.SUCCESS) "مبلغ کل پرداختی" else "مبلغ سفارش", Fa.price(p.amount), divider = false)
        }
    }
    if (p.status == PaymentStatus.FAILED && !failureSeen) {
        StateDialog(StateSymbol.FAILED, "پرداخت انجام نشد", "در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد.", { failureSeen = true; if (o.payable) actions.replace(PaymentRoute(o.orderNumber)) }, actionLabel = if (o.payable) "تلاش مجدد" else "متوجه شدم", onDismiss = { failureSeen = true })
    }
}

@Composable
private fun ResultRow(label: String, value: String, isCode: Boolean = false, divider: Boolean = true) {
    val c = Jt.colors
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 44.dp).padding(vertical = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(label, style = text(12f), color = c.muted)
            Box(Modifier.weight(1f), contentAlignment = Alignment.CenterStart) {
                if (isCode) CodeText(value, size = 13f) else Text(value, style = text(12.5f, W.Bold), color = c.ink, textAlign = TextAlign.Left, modifier = Modifier.fillMaxWidth())
            }
        }
        if (divider) HDivider()
    }
}

@Composable
private fun CopyRow(label: String, value: String) {
    val c = Jt.colors
    val clipboard = LocalClipboardManager.current
    val toaster = LocalToaster.current
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = text(12f), color = c.muted, modifier = Modifier.weight(1f))
            JtIconButton(Lucide.Copy, {
                clipboard.setText(AnnotatedString(value))
                toaster.success("$label کپی شد.")
            }, "کپی $label", size = 36.dp, iconSize = 16.dp, borderColor = null, tint = c.muted)
            CodeText(value, size = 13f)
        }
        HDivider()
    }
}

/** No such payment (or not this user's). */
@Composable
private fun Unverified() {
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxWidth().padding(top = 40.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(StateSymbol.FAILED, style = text(80f, lineHeight = 1.25f))
        Text("پرداخت انجام نشد", style = text(22f, W.Black), color = c.ink)
        Text("اطلاعات این پرداخت پیدا نشد. در صورت کسر وجه، مبلغ طبق روال بانک بازمی‌گردد.", style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center)
        JtButton("سفارش‌های من", { actions.replace(OrdersRoute) }, size = ButtonSize.XL, block = true, trailing = Lucide.ArrowLeft)
        JtButton("بازگشت به صفحه اصلی", { actions.replace(HomeRoute) }, variant = ButtonVariant.OUTLINE, size = ButtonSize.XL, block = true)
    }
}
