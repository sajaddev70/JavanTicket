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
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.semantics.Role
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
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.domain.model.SeatStatus
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.SeatMapData
import com.devs.nisha_user.ui.common.AmountRow
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.MetaRow
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute

@Composable
fun SeatsScreen(hero: PageBlock?, signedIn: Boolean, viewModel: SeatsViewModel = hiltViewModel()) {
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
    val title = hero?.title ?: "انتخاب صندلی"
    Column(Modifier.fillMaxSize()) {
        JtTopBar(title, onBack = actions.back)
        val data = state.data
        when {
            data != null -> SeatSelection(data, state, hero, viewModel) {
                val target = CheckoutRoute(sessionId = viewModel.sessionId)
                if (signedIn) actions.navigate(target) else actions.requireLogin(target.path())
            }
            state.error != null -> ErrorState(state.error, Modifier.padding(16.dp), onRetry = viewModel::load)
            else -> Column(Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                CircularProgressIndicator(Modifier.size(40.dp), color = Jt.colors.brand600, trackColor = Jt.colors.brand100, strokeWidth = 4.dp)
                Text("در حال بارگذاری نقشه سالن ...", style = text(14f), color = Jt.colors.muted, modifier = Modifier.padding(top = 12.dp))
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeatSelection(data: SeatMapData, state: SeatsUiState, hero: PageBlock?, vm: SeatsViewModel, proceed: () -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val session = data.session
    var cartOpen by remember { mutableStateOf(false) }
    val prices = session.tiers.map { it.price ?: session.price }.filter { it > 0 }
    val minPrice = prices.minOrNull() ?: session.price
    val maxPrice = prices.maxOrNull() ?: session.price
    val sections = remember(data.sections) { data.sections.associateBy { it.id } }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 120.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            hero?.subtitle?.let { item(key = "hint") { Text(it, style = text(14f), color = c.ink2) } }
            item(key = "session") {
                JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(12.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        RemoteImage(session.bannerUrl, Modifier.width(96.dp).height(96.dp).clip(JtShapes.xl), contentDescription = session.eventTitle)
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                            Text(
                                session.eventTitle,
                                style = text(17f, W.Black),
                                color = c.ink,
                                modifier = Modifier.clickable { actions.navigate(EventDetailRoute(session.eventSlug)) },
                            )
                            session.title?.let { Text(it, style = text(13f), color = c.ink2) }
                            MetaRow(Lucide.Building2, listOfNotNull(session.hallName, session.venueName).joinToString(" "), size = 13f)
                            MetaRow(Lucide.MapPin, session.cityName, size = 13f)
                        }
                    }
                    HDivider(Modifier.padding(vertical = 12.dp))
                    Row {
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            MetaRow(Lucide.CalendarDays, Fa.fullDate(session.startTime), size = 13.5f)
                            MetaRow(Lucide.Clock, "ساعت ${Fa.time(session.startTime)}", size = 13.5f)
                        }
                        Column(Modifier.weight(1f).padding(start = 12.dp)) {
                            Text("محدوده قیمت بلیت", style = text(12.5f), color = c.muted)
                            Text(
                                if (minPrice == maxPrice) Fa.price(minPrice) else "${Fa.number(minPrice)} تا ${Fa.price(maxPrice)}",
                                style = text(13.5f, W.Black),
                                color = c.ink,
                                modifier = Modifier.padding(top = 4.dp),
                            )
                        }
                    }
                }
            }
            if (!state.onSale) {
                item(key = "closed") {
                    Text(
                        "فروش این سانس فعال نیست؛ امکان انتخاب صندلی وجود ندارد.",
                        style = text(14f, W.Semibold),
                        color = c.ink,
                        modifier = Modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.warningBg).padding(horizontal = 16.dp, vertical = 12.dp),
                    )
                }
            }
            item(key = "map") {
                JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(12.dp)) {
                    if (data.seats.isEmpty()) {
                        EmptyState("برای این سانس نقشه صندلی تعریف نشده است.")
                    } else {
                        SeatMap(data.seats, session.tiers, state.pending, vm::toggle)
                    }
                    Column(Modifier.padding(top = 12.dp).fillMaxWidth().clip(JtShapes.xl).border(1.dp, c.line, JtShapes.xl).padding(14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            JtIcon(Lucide.Info, size = 16.dp, tint = c.brand600, modifier = Modifier.padding(top = 3.dp))
                            Text("برای انتخاب یا لغو انتخاب صندلی، روی صندلی‌ها بزنید. با دو انگشت بزرگ‌نمایی کنید.", style = text(12.5f, lineHeight = 1.9f), color = c.muted)
                        }
                        SeatLegend(data)
                    }
                }
            }
        }

        // Selection summary and the next step stay on screen.
        Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(c.surface.copy(alpha = 0.97f))) {
            HDivider()
            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column(Modifier.weight(1f).clip(JtShapes.lg).clickable(role = Role.Button, onClickLabel = "مشاهده سبد خرید") { cartOpen = true }) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("${Fa.number(state.selected.size)} صندلی", style = text(12.5f), color = c.muted)
                        HoldTimer(data.hold?.secondsLeft, state.receivedAt, onExpire = vm::onHoldExpired)
                    }
                    Text(Fa.price(state.subtotal + state.fee), style = text(16f, W.Black), color = c.ink)
                    Text("مشاهده سبد خرید", style = text(12f, W.Bold), color = c.brand600)
                }
                JtButton("ادامه خرید", proceed, size = ButtonSize.LG, enabled = state.selected.isNotEmpty() && state.pending.isEmpty(), trailing = Lucide.ArrowLeft)
            }
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
                if (state.selected.isEmpty()) {
                    Text(
                        "برای انتخاب، روی صندلی‌های آزاد در نقشه سالن بزنید.",
                        style = text(13f, lineHeight = 2f),
                        color = c.muted,
                        modifier = Modifier.fillMaxWidth().clip(JtShapes.xl).border(1.dp, c.lineStrong, JtShapes.xl).padding(20.dp),
                    )
                } else {
                    state.selected.forEach { seat ->
                        val tier = session.tiers.firstOrNull { it.code == seat.tierCode }
                        Row(
                            Modifier.fillMaxWidth().padding(bottom = 8.dp).clip(JtShapes.xl).border(1.dp, c.line, JtShapes.xl).padding(12.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Box(Modifier.size(12.dp).clip(JtShapes.pill).background(c.brand600))
                            Column(Modifier.weight(1f)) {
                                Text(seatTitle(seat, sections[seat.sectionId]?.name), style = text(13.5f, W.Bold), color = c.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                                Text("${tier?.name?.let { "$it • " } ?: ""}${Fa.price(state.priceOf(seat))}", style = text(12.5f), color = c.ink2)
                            }
                            JtIconButton(Lucide.X, { vm.toggle(seat) }, "حذف ${seatTitle(seat, null)}", size = 40.dp, iconSize = 16.dp, tint = c.muted, enabled = seat.id !in state.pending)
                        }
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
                    JtIcon(Lucide.ShieldCheck, size = 16.dp, tint = c.brand600)
                    Spacer(Modifier.width(6.dp))
                    Text("پرداخت امن در درگاه رسمی بانکی", style = text(12.5f), color = c.muted)
                }
            }
        }
    }
}

/** Legend (web SeatLegend): the seat states present in the hall, then each tier's price from the backend. */
@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun SeatLegend(data: SeatMapData) {
    val c = Jt.colors
    val fallback = data.session.price
    val has = { st: SeatStatus -> data.seats.any { it.status == st } }
    Column(Modifier.fillMaxWidth().clip(JtShapes.xl2).border(1.dp, c.line, JtShapes.xl2).background(c.surface).padding(12.dp)) {
        FlowRow(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            LegendItem(c.seatFree, c.seatFreeStroke, "صندلی آزاد")
            LegendItem(c.seatSelected, c.seatSelected, "صندلی انتخاب‌شده")
            LegendItem(c.seatSold, c.seatSoldStroke, "صندلی فروخته شده")
            if (data.session.tiers.any { isVipTier(it.code, it.name) }) LegendItem(c.seatVip, c.seatVipStroke, "صندلی VIP")
            if (has(SeatStatus.LOCKED)) LegendItem(c.seatLocked, c.seatLockedStroke, "در حال خرید")
            if (has(SeatStatus.B2B_RESERVED)) LegendItem(c.seatReserved, c.seatReservedStroke, "رزرو سازمانی")
        }
        val priced = data.session.tiers.filter { it.price != null || fallback > 0 }
        if (priced.size > 1) {
            HDivider(Modifier.padding(vertical = 10.dp))
            FlowRow(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                priced.forEach { t ->
                    Text(
                        "${t.name}: ${Fa.price(t.price ?: fallback)}",
                        style = text(12f, W.Semibold),
                        color = c.ink2,
                        modifier = Modifier.clip(JtShapes.lg).background(c.surface2).padding(horizontal = 10.dp, vertical = 4.dp),
                    )
                }
            }
        }
    }
}

@Composable
private fun LegendItem(fill: Color, stroke: Color, label: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        Box(Modifier.size(20.dp).clip(JtShapes.md).background(fill).border(1.2.dp, stroke, JtShapes.md))
        Text(label, style = text(12.5f), color = Jt.colors.ink2)
    }
}
