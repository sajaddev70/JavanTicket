package com.devs.nisha_user.ui.seats

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.bottomFade
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.domain.model.SeatStatus
import com.devs.nisha_user.ui.common.AmountRow
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.CheckoutRoute

/** 08 انتخاب صندلی: عادی، صندلی انتخاب‌شده، صندلی رزروشده، اتمام زمان رزرو. */
@Composable
fun SeatsScreen(signedIn: Boolean, viewModel: SeatsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, e ->
            if (e == Lifecycle.Event.ON_RESUME) viewModel.startPolling()
            if (e == Lifecycle.Event.ON_PAUSE) viewModel.stopPolling()
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar("انتخاب صندلی", onBack = actions.back)
            val data = state.data
            when {
                data != null -> SeatSelection(data, state, viewModel) {
                    val target = CheckoutRoute(sessionId = viewModel.sessionId)
                    if (signedIn) actions.navigate(target) else actions.requireLogin(target.path())
                }
                state.error != null -> ErrorState(state.error, Modifier.padding(19.dp), onRetry = viewModel::load)
            }
        }
        if (state.data == null && state.error == null) LoadingOverlay("در حال بارگذاری", "نقشه سالن آماده می‌شود.")
    }
    when (state.dialog) {
        SeatDialog.TAKEN -> StateDialog(StateSymbol.WARNING, "صندلی دیگر در دسترس نیست", "این صندلی توسط کاربر دیگری رزرو شده است.", viewModel::dismissDialog, actionLabel = "تلاش مجدد")
        SeatDialog.EXPIRED -> StateDialog(StateSymbol.WAIT, "زمان رزرو به پایان رسید", "صندلی‌ها آزاد شدند؛ انتخاب را از نو آغاز کنید.", viewModel::dismissDialog)
        null -> Unit
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeatSelection(data: SeatMapData, state: SeatsUiState, vm: SeatsViewModel, proceed: () -> Unit) {
    val c = Jt.colors
    val session = data.session
    var cartOpen by remember { mutableStateOf(false) }
    val sections = remember(data.sections) { data.sections.associateBy { it.id } }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 96.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            if (!state.onSale) {
                item(key = "closed") {
                    Text(
                        "فروش این سانس فعال نیست؛ امکان انتخاب صندلی وجود ندارد.",
                        style = text(13f, W.Semibold),
                        color = c.ink,
                        modifier = Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.warningBg).padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                }
            }
            item(key = "title") {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("نمای سالن", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                    Text("برای بزرگ‌نمایی از دکمه‌های نقشه استفاده کنید", style = text(11f), color = c.muted)
                }
            }
            item(key = "map") {
                if (data.seats.isEmpty()) {
                    EmptyState("برای این سانس نقشه صندلی تعریف نشده است.", symbol = StateSymbol.TICKET)
                } else {
                    SeatMap(data.seats, session.tiers, state.pending, vm::toggle)
                }
            }
            item(key = "summary") {
                JtCard(Modifier.fillMaxWidth()) {
                    SeatLegend(data)
                    if (state.selected.isNotEmpty()) {
                        Text(
                            "صندلی‌های انتخابی: " + state.selected.joinToString(" ، ") { "${it.rowLabel}${Fa.number(it.seatNumber)}" },
                            style = text(13f),
                            color = c.ink,
                            modifier = Modifier.padding(top = 12.dp),
                        )
                    } else {
                        Text("برای انتخاب، روی صندلی‌های آزاد نقشه بزنید.", style = text(12f), color = c.muted, modifier = Modifier.padding(top = 12.dp))
                    }
                    Row(Modifier.fillMaxWidth().padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("مجموع: ${Fa.price(state.subtotal + state.fee)}", style = text(14f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                        HoldTimer(data.hold?.secondsLeft, state.receivedAt, onExpire = vm::onHoldExpired)
                    }
                    if (state.selected.isNotEmpty()) {
                        Text(
                            "مشاهده سبد خرید",
                            style = text(12f, W.Bold),
                            color = c.brand500,
                            modifier = Modifier.padding(top = 4.dp).clip(JtShapes.lg).clickable { cartOpen = true }.heightIn(min = 40.dp).padding(vertical = 10.dp),
                        )
                    }
                }
            }
        }
        Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().bottomFade().navigationBarsPadding().padding(start = 19.dp, end = 19.dp, top = 24.dp, bottom = 12.dp)) {
            JtButton(
                "ادامه خرید",
                proceed,
                size = ButtonSize.XL,
                block = true,
                enabled = state.selected.isNotEmpty() && state.pending.isEmpty(),
                trailing = Lucide.ArrowLeft,
            )
        }
    }

    if (cartOpen) {
        JtBottomSheet(
            onDismiss = { cartOpen = false },
            title = "سبد خرید بلیت",
            footer = { JtButton("ادامه و تکمیل سفارش", { cartOpen = false; proceed() }, block = true, size = ButtonSize.LG, enabled = state.selected.isNotEmpty()) },
        ) {
            Column(Modifier.heightIn(max = 520.dp).verticalScroll(rememberScrollState())) {
                Row(Modifier.fillMaxWidth().padding(bottom = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    CardTitle("بلیت‌های انتخاب‌شده", Lucide.ShoppingCart, size = 15f, iconSize = 20.dp, modifier = Modifier.weight(1f))
                    HoldTimer(data.hold?.secondsLeft, state.receivedAt)
                }
                state.selected.forEach { seat ->
                    val tier = session.tiers.firstOrNull { it.code == seat.tierCode }
                    Row(
                        Modifier.fillMaxWidth().padding(bottom = 8.dp).clip(JtShapes.xl).border(1.dp, c.line, JtShapes.xl).padding(12.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        Column(Modifier.weight(1f)) {
                            Text(seatTitle(seat, sections[seat.sectionId]?.name), style = text(13.5f, W.Bold), color = c.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("${tier?.name?.let { "$it • " } ?: ""}${Fa.price(state.priceOf(seat))}", style = text(12.5f), color = c.ink2)
                        }
                        JtIconButton(Lucide.X, { vm.toggle(seat) }, "حذف ${seatTitle(seat, null)}", size = 40.dp, iconSize = 16.dp, tint = c.muted, enabled = seat.id !in state.pending)
                    }
                }
                HDivider(Modifier.padding(vertical = 12.dp))
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    AmountRow("جمع مبلغ بلیت‌ها", Fa.price(state.subtotal))
                    if (state.fee > 0) AmountRow("هزینه خدمات سامانه (${Fa.number(state.feePercent)}٪)", Fa.price(state.fee))
                    HDivider()
                    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Text("جمع قابل پرداخت", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                        Text(Fa.price(state.subtotal + state.fee), style = text(19f, W.Black), color = c.ink)
                    }
                    Text("مبلغ نهایی و کد تخفیف در مرحله بعد توسط سامانه محاسبه می‌شود.", style = text(12f, lineHeight = 1.9f), color = c.muted)
                }
                if (state.selected.isNotEmpty()) {
                    JtButton("لغو انتخاب همه صندلی‌ها", vm::releaseAll, Modifier.padding(top = 8.dp), variant = ButtonVariant.GHOST, block = true, leading = Lucide.RotateCcw)
                }
                Row(Modifier.fillMaxWidth().padding(top = 8.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                    JtIcon(Lucide.ShieldCheck, size = 16.dp, tint = c.brand500)
                    Spacer(Modifier.width(6.dp))
                    Text("پرداخت امن در درگاه رسمی بانکی", style = text(12.5f), color = c.muted)
                }
            }
        }
    }
}

/** The design's legend chips: the seat states present in the hall, then each tier's price from the backend. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeatLegend(data: SeatMapData) {
    val c = Jt.colors
    val fallback = data.session.price
    val has = { st: SeatStatus -> data.seats.any { it.status == st } }
    Column {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            LegendItem(c.seatFree, c.seatFreeStroke, "آزاد")
            LegendItem(c.seatSelected, c.seatSelected, "انتخاب‌شده")
            LegendItem(c.seatSold, c.seatSoldStroke, "فروخته‌شده")
            if (data.session.tiers.any { isVipTier(it.code, it.name) }) LegendItem(c.seatVip, c.seatVipStroke, "VIP")
            if (has(SeatStatus.LOCKED)) LegendItem(c.seatLocked, c.seatLockedStroke, "در حال خرید")
            if (has(SeatStatus.B2B_RESERVED)) LegendItem(c.seatReserved, c.seatReservedStroke, "رزرو سازمانی")
        }
        val priced = data.session.tiers.filter { it.price != null || fallback > 0 }
        if (priced.size > 1) {
            FlowRow(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                priced.forEach { t ->
                    Text("${t.name}: ${Fa.price(t.price ?: fallback)}", style = text(11f), color = c.muted)
                }
            }
        }
    }
}

@Composable
private fun LegendItem(fill: Color, stroke: Color, label: String) {
    val c = Jt.colors
    Row(
        Modifier.clip(JtShapes.pill).background(c.field).border(1.dp, c.lineStrong, JtShapes.pill).padding(horizontal = 11.dp, vertical = 7.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Box(Modifier.size(12.dp).clip(JtShapes.md).background(fill).border(1.dp, stroke, JtShapes.md))
        Text(label, style = text(11f), color = c.ink)
    }
}
