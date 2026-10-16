package com.devs.nisha_user.ui.checkout

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.CheckoutSteps
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtCheckbox
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.TimerVariant
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.usecase.seatGroups
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.MetaRow
import com.devs.nisha_user.ui.common.OrderSummary
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.SeatsRoute

@Composable
fun CheckoutScreen(notice: PageBlock?, viewModel: CheckoutViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    LaunchedEffect(viewModel) {
        viewModel.events.collect { e -> if (e is CheckoutEvent.GoToPayment) actions.navigate(PaymentRoute(e.orderNumber)) }
    }
    Column(Modifier.fillMaxSize()) {
        JtTopBar("تکمیل خرید", onBack = actions.back)
        val order = s.order
        when {
            s.createError != null -> Column(Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                ErrorState(s.createError, message = s.createError!!.message)
                JtButton("بازگشت به انتخاب صندلی", actions.back, Modifier.padding(top = 16.dp), variant = ButtonVariant.OUTLINE, leading = Lucide.ArrowRight)
            }
            order != null -> if (order.payable) CheckoutForm(order, s, notice, viewModel) else OrderUnavailable(order)
            s.loadError != null -> ErrorState(s.loadError, Modifier.padding(16.dp), onRetry = viewModel::load, message = if (s.loadError!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
            else -> CheckoutSkeleton(if (s.creating) "در حال ثبت سفارش ..." else null)
        }
    }
}

/** A paid, cancelled or expired order cannot be checked out (shared with the payment screen). */
@Composable
fun OrderUnavailable(order: Order) {
    val actions = LocalAppActions.current
    Column(Modifier.padding(16.dp)) {
        if (order.status == OrderStatus.PAID) {
            EmptyState("این سفارش قبلاً پرداخت شده است.", action = { JtButton("مشاهده سفارش و بلیت‌ها", { actions.replace(OrderRoute(order.orderNumber)) }) })
        } else {
            EmptyState(
                if (order.status == OrderStatus.CANCELLED) "این سفارش لغو شده است." else "زمان تکمیل این سفارش به پایان رسیده است.",
                icon = Lucide.TimerOff,
                description = "صندلی‌ها آزاد شده‌اند؛ برای خرید دوباره انتخاب کنید.",
                action = {
                    JtButton("انتخاب دوباره", { actions.replace(if (order.quantity != null) EventDetailRoute(order.eventSlug) else SeatsRoute(order.sessionId)) })
                },
            )
        }
    }
}

@Composable
private fun CheckoutForm(order: Order, s: CheckoutUiState, notice: PageBlock?, vm: CheckoutViewModel) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val f = s.form
    val e = s.fieldErrors
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().padding(16.dp).navigationBarsPadding(),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        CheckoutSteps(current = 1)

        JtCard(Modifier.fillMaxWidth(), background = c.brand50.copy(alpha = 0.6f)) {
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                JtIcon(Lucide.Info, size = 20.dp, tint = c.brand600, modifier = Modifier.padding(top = 2.dp))
                Column {
                    Text("لطفاً اطلاعات خود را تکمیل کرده و سفارش را بررسی کنید.", style = text(14.5f, W.Bold), color = c.ink)
                    Text("پس از تکمیل، به درگاه پرداخت منتقل خواهید شد.", style = text(13f), color = c.ink2, modifier = Modifier.padding(top = 2.dp))
                }
            }
            Row(
                Modifier.padding(top = 12.dp).fillMaxWidth().clip(JtShapes.xl).background(c.surface).padding(horizontal = 16.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                JtIcon(Lucide.Clock, size = 28.dp, tint = c.brand600)
                Text("زمان باقی‌مانده برای تکمیل سفارش", style = text(12.5f), color = c.ink2, modifier = Modifier.weight(1f))
                HoldTimer(order.secondsLeft, s.receivedAt, variant = TimerVariant.LARGE, onExpire = vm::load)
            }
        }

        JtCard(Modifier.fillMaxWidth()) {
            CardTitle("۱. اطلاعات رویداد و صندلی‌ها", Lucide.CalendarDays, size = 17f, iconSize = 20.dp)
            Row(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                RemoteImage(order.bannerUrl, Modifier.width(100.dp).aspectRatio(0.75f).clip(JtShapes.xl), contentDescription = order.eventTitle)
                Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(order.eventTitle, style = text(16f, W.Black), color = c.ink)
                    MetaRow(Lucide.CalendarDays, Fa.fullDate(order.startTime))
                    MetaRow(Lucide.Clock, "ساعت ${Fa.time(order.startTime)}")
                    MetaRow(Lucide.MapPin, listOfNotNull(order.hallName, order.venueName).joinToString(" - "))
                }
            }
            Column(Modifier.padding(top = 16.dp).fillMaxWidth().clip(JtShapes.xl2).background(c.surface2).padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                CardTitle(if (order.quantity != null) "بلیت‌ها" else "صندلی‌های انتخاب شده", Lucide.Armchair, size = 14f, iconSize = 20.dp)
                if (order.quantity != null) {
                    Row(Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.surface).padding(horizontal = 12.dp, vertical = 10.dp)) {
                        Text("ورود عمومی", style = text(13.5f), color = c.ink2, modifier = Modifier.weight(1f))
                        Text("${Fa.number(order.quantity)} بلیت", style = text(13.5f, W.Black), color = c.ink)
                    }
                } else {
                    order.seatGroups().forEach { g ->
                        g.seats.forEach { seat ->
                            Row(Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.surface).padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text("${g.name}${seat.sectionName?.let { " - $it" } ?: ""}", style = text(13f), color = c.ink2, modifier = Modifier.weight(1f))
                                Text(
                                    "ردیف ${seat.rowLabel} • صندلی ${Fa.number(seat.seatNumber)}",
                                    style = text(13f, W.Black),
                                    color = c.brand600,
                                    modifier = Modifier.clip(JtShapes.lg).background(c.brand50).padding(horizontal = 12.dp, vertical = 4.dp),
                                )
                            }
                        }
                    }
                }
            }
        }

        JtCard(Modifier.fillMaxWidth()) {
            CardTitle("۲. اطلاعات خریدار", Lucide.UserRound, size = 17f, iconSize = 20.dp)
            Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                val next = KeyboardOptions(imeAction = ImeAction.Next)
                JtTextField(f.firstName, { v -> vm.edit { it.copy(firstName = v) } }, label = "نام", required = true, error = e["first_name"], keyboardOptions = next)
                JtTextField(f.lastName, { v -> vm.edit { it.copy(lastName = v) } }, label = "نام خانوادگی", required = true, error = e["last_name"], keyboardOptions = next)
                JtTextField(
                    f.mobile, { v -> vm.edit { it.copy(mobile = v) } }, label = "شماره موبایل", required = true, error = e["mobile"], ltr = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next),
                )
                JtTextField(
                    f.email, { v -> vm.edit { it.copy(email = v) } }, label = "ایمیل", error = e["email"], hint = "برای دریافت رسید (اختیاری)", ltr = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
                )
                JtTextField(
                    f.note, { v -> vm.edit { it.copy(note = v) } }, label = "یادداشت (اختیاری)", error = e["note"], singleLine = false, minLines = 2,
                    placeholder = "اگر نکته‌ای برای برگزاری رویداد دارید، اینجا بنویسید ...",
                )
            }
        }

        if (notice != null) {
            JtCard(Modifier.fillMaxWidth(), background = c.surface2.copy(alpha = 0.6f)) {
                CardTitle(notice.title ?: "نکات مهم خرید", Lucide.Info, size = 15f, iconSize = 20.dp)
                Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    notice.lines.forEach { line ->
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("•", style = text(13f, W.Black), color = c.brand600)
                            Text(line, style = text(13f, lineHeight = 1.9f), color = c.ink2)
                        }
                    }
                }
            }
        }

        DiscountBox(order, s, vm)

        OrderSummary(order)

        JtCard(Modifier.fillMaxWidth()) {
            JtCheckbox(f.terms, { v -> vm.edit { it.copy(terms = v) } }, error = e["terms"] != null) {
                Text(
                    buildAnnotatedString {
                        withLink(LinkAnnotation.Clickable("terms", TextLinkStyles(SpanStyle(color = c.brand600, fontWeight = W.Bold))) { actions.navigate(ContentRoute("terms")) }) {
                            append("قوانین و مقررات")
                        }
                        append(" خرید بلیت را مطالعه کرده و با آن موافقم.")
                    },
                    style = text(13.5f, lineHeight = 1.9f),
                    color = c.ink,
                )
            }
            e["terms"]?.let { Text(it, style = text(12.5f, W.Semibold), color = c.dangerFg) }
            JtButton("ادامه به پرداخت", vm::submit, Modifier.padding(top = 12.dp), size = ButtonSize.XL, block = true, loading = s.submitting, leading = Lucide.CreditCard, trailing = Lucide.ArrowLeft)
            JtButton(
                "بازگشت",
                actions.back,
                Modifier.padding(top = 8.dp),
                variant = ButtonVariant.OUTLINE,
                size = ButtonSize.LG,
                block = true,
                leading = Lucide.ArrowRight,
            )
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun DiscountBox(order: Order, s: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Jt.colors
    JtCard(Modifier.fillMaxWidth(), background = c.successBg.copy(alpha = 0.6f), borderColor = c.success.copy(alpha = 0.25f)) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            JtIcon(Lucide.Percent, size = 20.dp, tint = c.successFg)
            Text("کد تخفیف", style = text(15f, W.Black), color = c.successFg)
        }
        Spacer(Modifier.height(12.dp))
        if (order.hasDiscount) {
            Row(Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.surface).padding(start = 16.dp, end = 4.dp, top = 4.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    "کد ${ltr(order.discountCode.orEmpty())} اعمال شد؛ تخفیف: ${Fa.price(order.discountAmount)}",
                    style = text(13.5f, W.Semibold),
                    color = c.ink,
                    modifier = Modifier.weight(1f),
                )
                JtIconButton(Lucide.X, vm::remove, "حذف کد تخفیف", borderColor = null, tint = c.muted, enabled = !s.discountBusy)
            }
        } else {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.Top) {
                JtTextField(
                    s.code,
                    vm::setCode,
                    Modifier.weight(1f),
                    placeholder = "کد تخفیف را وارد کنید",
                    ltr = true,
                    textAlign = TextAlign.Center,
                    keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Done),
                    keyboardActions = KeyboardActions(onDone = { vm.apply() }),
                )
                JtButton("اعمال", vm::apply, variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, loading = s.discountBusy, enabled = s.code.isNotBlank())
            }
            s.discountError?.let {
                Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    JtIcon(Lucide.CircleAlert, size = 16.dp, tint = c.dangerFg)
                    Text(it, style = text(12.5f, W.Semibold), color = c.dangerFg)
                }
            }
        }
    }
}

@Composable
fun CheckoutSkeleton(label: String? = null) {
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Skeleton(Modifier.fillMaxWidth().height(64.dp), JtShapes.xl2)
        label?.let { Text(it, style = text(14f, W.Semibold), color = Jt.colors.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth()) }
        Skeleton(Modifier.fillMaxWidth().height(90.dp), JtShapes.card)
        Skeleton(Modifier.fillMaxWidth().height(210.dp), JtShapes.card)
        Skeleton(Modifier.fillMaxWidth().height(240.dp), JtShapes.card)
    }
}
