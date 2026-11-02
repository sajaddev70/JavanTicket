package com.devs.nisha_user.ui.payment

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.ui.checkout.CheckoutSkeleton
import com.devs.nisha_user.ui.checkout.OrderUnavailable
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.OrderEventCard
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.GatewayRoute

/** 11 پرداخت: عادی، درگاه در دسترس نیست. (پرداخت ناموفق is shown by the result screen after the bank answers.) */
@Composable
fun PaymentScreen(security: PageBlock?, viewModel: PaymentViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    LaunchedEffect(viewModel) {
        viewModel.events.collect { e ->
            when (e) {
                is PaymentEvent.OpenGateway -> actions.navigate(GatewayRoute(e.url, e.paymentId, viewModel.number))
                PaymentEvent.NeedsBuyer -> actions.replace(CheckoutRoute(order = viewModel.number))
            }
        }
    }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar("پرداخت", onBack = actions.back)
            val order = s.order
            when {
                order != null && !order.payable -> OrderUnavailable(order)
                order != null && !order.needsBuyer -> Column(
                    Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("پرداخت سفارش", style = text(15f, W.Black), color = c.ink)
                    OrderEventCard(order)
                    JtCard(Modifier.fillMaxWidth()) {
                        Text("تعداد بلیت: ${Fa.number(order.ticketsCount)}", style = text(13f), color = c.ink)
                        Text("مبلغ قابل پرداخت", style = text(13f), color = c.ink, modifier = Modifier.padding(top = 8.dp))
                        Text(Fa.price(order.totalAmount), style = text(30f, W.Black), color = c.brand500, modifier = Modifier.padding(top = 4.dp))
                        Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("زمان اعتبار سفارش:", style = text(12f), color = c.muted)
                            HoldTimer(order.secondsLeft, s.receivedAt, onExpire = viewModel::load)
                        }
                    }
                    Text("روش پرداخت", style = text(15f, W.Black), color = c.ink, modifier = Modifier.padding(top = 6.dp))
                    when {
                        s.methodsError != null -> ErrorState(s.methodsError, onRetry = viewModel::loadMethods)
                        s.methods.isNullOrEmpty() -> Unit
                        else -> s.methods!!.forEach { m -> MethodCard(m, m.code == s.method?.code) { viewModel.choose(m.code) } }
                    }
                    if (security != null) {
                        JtCard(Modifier.fillMaxWidth()) {
                            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                                JtIcon(Lucide.ShieldCheck, size = 22.dp, tint = c.brand500)
                                Column(Modifier.weight(1f)) {
                                    Text(security.title.orEmpty(), style = text(13f, W.Bold), color = c.ink)
                                    security.subtitle?.let { Text(it, style = text(12f, lineHeight = 1.9f), color = c.muted) }
                                }
                            }
                        }
                    }
                    Text("پس از پرداخت به اپلیکیشن بازگردانده می‌شوید.", style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    JtButton(
                        "پرداخت ${Fa.price(order.totalAmount)}",
                        viewModel::start,
                        variant = ButtonVariant.SUCCESS,
                        size = ButtonSize.XL,
                        block = true,
                        enabled = s.method != null,
                        loading = s.starting,
                        trailing = Lucide.ArrowLeft,
                    )
                    JtButton("بازگشت به اطلاعات خریدار", { actions.replace(CheckoutRoute(order = order.orderNumber)) }, variant = ButtonVariant.GHOST, block = true)
                }
                s.error != null -> ErrorState(s.error, Modifier.padding(19.dp), onRetry = viewModel::load, message = if (s.error!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
                else -> CheckoutSkeleton()
            }
        }
        if (s.starting) LoadingOverlay("در حال آماده‌سازی پرداخت", "لطفاً صفحه را نبندید.")
    }
    val noGateway = s.order?.payable == true && s.methods?.isEmpty() == true
    if ((noGateway && !s.gatewayNoticeDismissed) || s.startError != null) {
        StateDialog(
            StateSymbol.WARNING,
            "درگاه پرداخت در دسترس نیست",
            s.startError ?: "لطفاً بعداً دوباره تلاش کنید.",
            viewModel::retryGateway,
            actionLabel = "تلاش مجدد",
            onDismiss = viewModel::dismissGatewayError,
        )
    }
}

/** The design's method row: an icon or the gateway's logo, its name and the "انتخاب‌شده" badge. */
@Composable
private fun MethodCard(method: PaymentMethod, checked: Boolean, onSelect: () -> Unit) {
    val c = Jt.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clip(JtShapes.card)
            .background(JtBrushes.glass)
            .border(if (checked) 2.dp else 1.dp, if (checked) c.brand700 else c.line, JtShapes.card)
            .semantics { selected = checked }
            .clickable(role = Role.RadioButton, onClick = onSelect)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        if (method.logoUrl != null) RemoteImage(method.logoUrl, Modifier.size(28.dp), contentScale = ContentScale.Fit, placeholder = Color.Transparent)
        else JtIcon(Lucide.Landmark, size = 22.dp, tint = c.ink)
        Column(Modifier.weight(1f)) {
            Text(method.title, style = text(13f, W.Bold), color = c.ink)
            method.description?.let { Text(it, style = text(11f, lineHeight = 1.8f), color = c.muted) }
        }
        if (checked) Text("انتخاب‌شده", style = text(10f), color = c.successFg, modifier = Modifier.clip(JtShapes.pill).background(c.successBg).padding(horizontal = 11.dp, vertical = 5.dp))
    }
}
