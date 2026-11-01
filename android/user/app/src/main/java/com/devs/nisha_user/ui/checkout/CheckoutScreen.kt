package com.devs.nisha_user.ui.checkout

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
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
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CheckoutSteps
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.InfoBanner
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtCheckbox
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.component.TimerVariant
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.ltr
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.ui.common.AmountRow
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.OrderEventCard
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.SeatsRoute

/**
 * 09 اطلاعات خریدار (عادی، خطای اعتبارسنجی، کد تخفیف اعمال‌شده) and 10 خلاصه خرید (عادی، در حال پردازش، مهلت رزرو تمام شد):
 * two steps of one order, so the form, the timer and the backend's amounts stay together.
 */
@Composable
fun CheckoutScreen(notice: PageBlock?, viewModel: CheckoutViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    LaunchedEffect(viewModel) {
        viewModel.events.collect { e -> if (e is CheckoutEvent.GoToPayment) actions.navigate(PaymentRoute(e.orderNumber)) }
    }
    val summary = s.step == CheckoutStep.SUMMARY
    BackHandler(enabled = summary) { viewModel.backToBuyer() }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar(if (summary) "خلاصه خرید" else "اطلاعات خریدار", onBack = if (summary) viewModel::backToBuyer else actions.back)
            val order = s.order
            when {
                s.createError != null -> Column(Modifier.padding(19.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    ErrorState(s.createError, message = s.createError!!.message)
                    JtButton("بازگشت به انتخاب صندلی", actions.back, Modifier.padding(top = 16.dp), variant = ButtonVariant.OUTLINE, block = true, size = ButtonSize.LG)
                }
                order != null -> when {
                    !order.payable -> OrderUnavailable(order)
                    summary -> SummaryStep(order, s, viewModel)
                    else -> BuyerStep(order, s, notice, viewModel)
                }
                s.loadError != null -> ErrorState(s.loadError, Modifier.padding(19.dp), onRetry = viewModel::load, message = if (s.loadError!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
                else -> CheckoutSkeleton()
            }
        }
        if (s.creating) LoadingOverlay("در حال ثبت سفارش", "لطفاً صفحه را نبندید.")
        if (s.submitting) LoadingOverlay("در حال آماده‌سازی پرداخت", "لطفاً صفحه را نبندید.")
    }
    s.validation?.let { message ->
        StateDialog(StateSymbol.WARNING, "اطلاعات را بررسی کنید", message, viewModel::dismissValidation, actionLabel = "تلاش مجدد")
    }
    if (s.discountApplied) StateDialog(StateSymbol.CHECK, "تخفیف اعمال شد", "مبلغ تخفیف در خلاصه سفارش محاسبه شد.", viewModel::dismissDiscountApplied)
}

/** A paid order has its tickets; a cancelled or expired one has released its seats (10 "مهلت خرید تمام شد"). */
@Composable
fun OrderUnavailable(order: Order) {
    val actions = LocalAppActions.current
    if (order.status == OrderStatus.PAID) {
        EmptyState(
            "این سفارش قبلاً پرداخت شده است.",
            Modifier.padding(horizontal = 19.dp),
            symbol = StateSymbol.SUCCESS,
            action = { JtButton("مشاهده سفارش و بلیت‌ها", { actions.replace(OrderRoute(order.orderNumber)) }, block = true, size = ButtonSize.XL) },
        )
    } else {
        val again = { actions.replace(if (order.quantity != null) EventDetailRoute(order.eventSlug) else SeatsRoute(order.sessionId)) }
        if (order.status == OrderStatus.CANCELLED) {
            StateDialog(StateSymbol.WARNING, "این سفارش لغو شده است", "برای خرید دوباره، صندلی‌ها را از نو انتخاب کنید.", again)
        } else {
            StateDialog(StateSymbol.WAIT, "مهلت خرید تمام شد", "برای رزرو مجدد صندلی‌ها بازگردید.", again)
        }
    }
}

@Composable
private fun BuyerStep(order: Order, s: CheckoutUiState, notice: PageBlock?, vm: CheckoutViewModel) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val f = s.form
    val e = s.fieldErrors
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().navigationBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(11.dp),
    ) {
        CheckoutSteps(current = 1)
        InfoBanner(Lucide.Clock) {
            Text("زمان باقی‌مانده رزرو: ", style = text(13f), color = androidx.compose.ui.graphics.Color.White)
            HoldTimer(order.secondsLeft, s.receivedAt, variant = TimerVariant.TEXT, onExpire = vm::load)
        }
        Text("اطلاعات خریدار", style = text(15f, W.Black), color = c.ink, modifier = Modifier.padding(top = 6.dp))
        val next = KeyboardOptions(imeAction = ImeAction.Next)
        JtTextField(f.firstName, { v -> vm.edit { it.copy(firstName = v) } }, label = "نام", required = true, error = e["first_name"], keyboardOptions = next)
        JtTextField(f.lastName, { v -> vm.edit { it.copy(lastName = v) } }, label = "نام خانوادگی", required = true, error = e["last_name"], keyboardOptions = next)
        JtTextField(
            f.mobile, { v -> vm.edit { it.copy(mobile = v) } }, label = "شماره موبایل", required = true, error = e["mobile"], ltr = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Next),
        )
        JtTextField(
            f.email, { v -> vm.edit { it.copy(email = v) } }, label = "ایمیل (اختیاری)", error = e["email"], ltr = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Next),
        )
        JtTextField(
            f.note, { v -> vm.edit { it.copy(note = v) } }, label = "یادداشت (اختیاری)", error = e["note"], singleLine = false, minLines = 2,
            placeholder = "اگر نکته‌ای برای برگزاری رویداد دارید، اینجا بنویسید ...",
        )
        DiscountBox(order, s, vm)
        if (notice != null) {
            JtCard(Modifier.fillMaxWidth()) {
                Text(notice.title ?: "نکات مهم خرید", style = text(13f, W.Bold), color = c.ink)
                notice.lines.forEach { line -> Text("• $line", style = text(12f, lineHeight = 1.9f), color = c.muted, modifier = Modifier.padding(top = 4.dp)) }
            }
        }
        JtCheckbox(f.terms, { v -> vm.edit { it.copy(terms = v) } }, error = e["terms"] != null) {
            Text(
                buildAnnotatedString {
                    withLink(LinkAnnotation.Clickable("terms", TextLinkStyles(SpanStyle(color = c.brand500, fontWeight = W.Bold))) { actions.navigate(ContentRoute("terms")) }) {
                        append("قوانین و مقررات")
                    }
                    append(" خرید بلیت را مطالعه کرده و با آن موافقم.")
                },
                style = text(12.5f, lineHeight = 1.9f),
                color = c.ink,
            )
        }
        e["terms"]?.let { Text(it, style = text(12f, W.Semibold), color = c.dangerFg) }
        JtButton("ادامه به پرداخت", vm::submit, size = ButtonSize.XL, block = true, loading = s.submitting, trailing = Lucide.ArrowLeft)
        Spacer(Modifier.height(8.dp))
    }
}

/** The design's field with the inline "اعمال" action; once applied it shows the code and a remove button. */
@Composable
private fun DiscountBox(order: Order, s: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Jt.colors
    if (order.hasDiscount) {
        Row(
            Modifier.fillMaxWidth().clip(JtShapes.field).background(c.successBg).padding(start = 15.dp, end = 4.dp, top = 4.dp, bottom = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("کد ${ltr(order.discountCode.orEmpty())} اعمال شد؛ تخفیف: ${Fa.price(order.discountAmount)}", style = text(12.5f, W.Semibold), color = c.successFg, modifier = Modifier.weight(1f))
            JtIconButton(Lucide.X, vm::remove, "حذف کد تخفیف", borderColor = null, tint = c.successFg, enabled = !s.discountBusy)
        }
    } else {
        JtTextField(
            s.code,
            vm::setCode,
            placeholder = "کد تخفیف",
            error = s.discountError,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters, imeAction = ImeAction.Done),
            keyboardActions = KeyboardActions(onDone = { vm.apply() }),
            trailing = {
                JtButton("اعمال", vm::apply, variant = ButtonVariant.GHOST, size = ButtonSize.SM, loading = s.discountBusy, enabled = s.code.isNotBlank())
            },
        )
    }
}

/** 10 خلاصه خرید: the order as the backend calculated it, then on to the gateway. */
@Composable
private fun SummaryStep(order: Order, s: CheckoutUiState, vm: CheckoutViewModel) {
    val c = Jt.colors
    Column(
        Modifier.fillMaxSize().verticalScroll(rememberScrollState()).navigationBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        CheckoutSteps(current = 2)
        Text("خلاصه سفارش", style = text(15f, W.Black), color = c.ink, modifier = Modifier.padding(top = 6.dp))
        OrderEventCard(order)
        JtCard(Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                AmountRow("تعداد بلیت‌ها", "${Fa.number(order.ticketsCount)} عدد")
                AmountRow("مبلغ بلیت‌ها", Fa.price(order.subtotal))
                order.discountAmount?.takeIf { it > 0 }?.let { AmountRow("تخفیف${order.discountCode?.let { code -> " (${ltr(code)})" } ?: ""}", "- ${Fa.price(it)}", color = c.successFg) }
                if (order.serviceFee > 0) AmountRow("هزینه خدمات سامانه", Fa.price(order.serviceFee))
                HDivider()
                Text("مبلغ نهایی: ${Fa.price(order.totalAmount)}", style = text(17f, W.Black), color = c.ink)
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("زمان باقی‌مانده رزرو:", style = text(12f), color = c.muted)
                    HoldTimer(order.secondsLeft, s.receivedAt, onExpire = vm::load)
                }
            }
        }
        InfoBanner(Lucide.ShieldCheck) {
            Text("پرداخت امن و رمزنگاری‌شده", style = text(13f), color = androidx.compose.ui.graphics.Color.White)
        }
        JtButton("پرداخت و تکمیل خرید", vm::goToPayment, variant = ButtonVariant.SUCCESS, size = ButtonSize.XL, block = true, trailing = Lucide.ArrowLeft)
    }
}

@Composable
fun CheckoutSkeleton() {
    Column(Modifier.padding(19.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Skeleton(Modifier.fillMaxWidth().height(40.dp), JtShapes.xl)
        Skeleton(Modifier.fillMaxWidth().height(52.dp), JtShapes.xl)
        repeat(4) { Skeleton(Modifier.fillMaxWidth().height(64.dp), JtShapes.field) }
    }
}
