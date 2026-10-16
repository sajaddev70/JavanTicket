package com.devs.nisha_user.ui.payment

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.CheckoutSteps
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.IconTile
import com.devs.nisha_user.core.designsystem.component.InlineError
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.PaymentMethod
import com.devs.nisha_user.ui.checkout.CheckoutSkeleton
import com.devs.nisha_user.ui.checkout.OrderUnavailable
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.OrderSummary
import com.devs.nisha_user.ui.common.SummaryVariant
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.GatewayRoute

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
    Column(Modifier.fillMaxSize()) {
        JtTopBar("پرداخت", onBack = actions.back)
        val order = s.order
        when {
            order != null && !order.payable -> OrderUnavailable(order)
            order != null && !order.needsBuyer -> Column(
                Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding(),
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                Text("اطلاعات سفارش خود را بررسی کرده و پرداخت را تکمیل کنید.", style = text(14f), color = c.ink2)
                CheckoutSteps(current = 2)
                JtCard(Modifier.fillMaxWidth()) {
                    CardTitle("انتخاب روش پرداخت", Lucide.CreditCard, iconSize = 24.dp)
                    Box(Modifier.padding(top = 16.dp)) {
                        when {
                            s.methodsError != null -> ErrorState(s.methodsError, onRetry = viewModel::loadMethods)
                            s.methods == null -> Skeleton(Modifier.fillMaxWidth().height(150.dp), JtShapes.xl2)
                            s.methods!!.isEmpty() -> EmptyState(
                                "در حال حاضر درگاه پرداخت فعالی در دسترس نیست.",
                                icon = Lucide.Landmark,
                                description = "سفارش شما تا پایان زمان نگهداری محفوظ است؛ لطفاً کمی بعد دوباره تلاش کنید.",
                            )
                            else -> Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                s.methods!!.forEach { m -> MethodCard(m, m.code == s.method?.code) { viewModel.choose(m.code) } }
                            }
                        }
                    }
                }
                if (security != null) {
                    JtCard(Modifier.fillMaxWidth(), background = c.brand50.copy(alpha = 0.5f)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            IconTile(Lucide.ShieldCheck, size = 64.dp, iconSize = 36.dp, background = c.surface, shape = JtShapes.xl2)
                            Column(Modifier.weight(1f)) {
                                Text(security.title.orEmpty(), style = text(16f, W.Black), color = c.ink)
                                security.subtitle?.let { Text(it, style = text(13.5f, lineHeight = 2f), color = c.ink2, modifier = Modifier.padding(top = 6.dp)) }
                            }
                        }
                    }
                }
                JtCard(Modifier.fillMaxWidth()) {
                    CardTitle("جزئیات پرداخت", Lucide.ReceiptText, iconSize = 24.dp)
                    Column(Modifier.padding(top = 8.dp)) {
                        DetailRow("مبلغ نهایی سفارش:") { Text(Fa.price(order.totalAmount), style = text(19f, W.Black), color = c.brand600) }
                        HDivider()
                        DetailRow("روش پرداخت:") { Text(s.method?.title ?: "—", style = text(14.5f, W.Bold), color = c.ink) }
                        HDivider()
                        DetailRow("زمان اعتبار سفارش:") { HoldTimer(order.secondsLeft, s.receivedAt, onExpire = viewModel::load) }
                    }
                    s.startError?.let { InlineError(it, Modifier.padding(top = 12.dp)) }
                    JtButton(
                        "اتصال به درگاه پرداخت",
                        viewModel::start,
                        Modifier.padding(top = 16.dp),
                        size = ButtonSize.XL,
                        block = true,
                        enabled = s.method != null,
                        loading = s.starting,
                        leading = Lucide.Lock,
                        trailing = Lucide.ArrowLeft,
                    )
                    s.method?.let {
                        Text("با زدن دکمه بالا، به صفحه امن ${it.title} منتقل خواهید شد.", style = text(12.5f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))
                    }
                    JtButton("بازگشت به اطلاعات خریدار", { actions.replace(CheckoutRoute(order = order.orderNumber)) }, Modifier.padding(top = 8.dp), variant = ButtonVariant.GHOST, block = true, leading = Lucide.ArrowRight)
                }
                OrderSummary(order, variant = SummaryVariant.PAYMENT) {
                    if (order.hasDiscount) {
                        Row(
                            Modifier.padding(top = 16.dp).fillMaxWidth().clip(JtShapes.xl2).background(c.successBg).padding(horizontal = 16.dp, vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            JtIcon(Lucide.CircleCheck, size = 24.dp, tint = c.successFg)
                            Text("کد تخفیف ${ltr(order.discountCode.orEmpty())} اعمال شد!", style = text(13.5f, W.Bold), color = c.successFg)
                        }
                    }
                }
            }
            s.error != null -> ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::load, message = if (s.error!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
            else -> CheckoutSkeleton()
        }
    }
}

@Composable
private fun DetailRow(label: String, value: @Composable () -> Unit) {
    Row(Modifier.fillMaxWidth().heightIn(min = 52.dp).padding(vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, style = text(14.5f), color = Jt.colors.ink2, modifier = Modifier.weight(1f))
        value()
    }
}

@Composable
private fun MethodCard(method: PaymentMethod, checked: Boolean, onSelect: () -> Unit) {
    val c = Jt.colors
    Row(
        Modifier
            .fillMaxWidth()
            .clip(JtShapes.xl2)
            .background(if (checked) c.brand50.copy(alpha = 0.4f) else c.surface)
            .border(2.dp, if (checked) c.brand600 else c.line, JtShapes.xl2)
            .semantics { selected = checked }
            .clickable(role = Role.RadioButton, onClick = onSelect)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        if (method.logoUrl != null) RemoteImage(method.logoUrl, Modifier.size(48.dp), contentScale = androidx.compose.ui.layout.ContentScale.Fit, placeholder = androidx.compose.ui.graphics.Color.Transparent)
        else IconTile(Lucide.Landmark, iconSize = 28.dp)
        Column(Modifier.weight(1f)) {
            Text(method.title, style = text(16f, W.Black), color = c.ink)
            method.description?.let { Text(it, style = text(12.5f, lineHeight = 1.9f), color = c.muted) }
        }
        Box(Modifier.size(22.dp).clip(CircleShape).border(2.dp, if (checked) c.brand600 else c.lineStrong, CircleShape), contentAlignment = Alignment.Center) {
            if (checked) Box(Modifier.size(11.dp).clip(CircleShape).background(c.brand600))
        }
    }
}
