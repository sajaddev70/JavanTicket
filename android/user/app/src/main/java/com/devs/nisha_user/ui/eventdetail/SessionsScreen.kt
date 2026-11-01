package com.devs.nisha_user.ui.eventdetail

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.bottomFade
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.EventSession
import com.devs.nisha_user.domain.usecase.AvailabilityTone
import com.devs.nisha_user.domain.usecase.availability
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.SeatsRoute

/** "دوشنبه ۱۱ آبان": the session's day as the design titles it. */
internal fun sessionDay(s: EventSession): String = Fa.fullDate(s.startTime)

/** "ظرفیت مناسب" / "ظرفیت محدود" / "تکمیل ظرفیت". */
internal fun capacityLabel(s: EventSession): String = when (s.availability(Fa::number).tone) {
    AvailabilityTone.OK -> "ظرفیت مناسب"
    AvailabilityTone.LOW -> "ظرفیت محدود"
    AvailabilityTone.NONE -> s.availability(Fa::number).label
}

/** 07 انتخاب سانس: عادی، سانس انتخاب‌شده، سانس تکمیل. */
@Composable
fun SessionsScreen(signedIn: Boolean, viewModel: SessionsViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val event = state.event.valueOrNull
    Column(Modifier.fillMaxSize()) {
        JtTopBar("انتخاب سانس", onBack = actions.back)
        when {
            event != null -> SessionsContent(event, state.selectedSessionId, viewModel::select, signedIn)
            state.event is Async.Failure -> ErrorState((state.event as Async.Failure).error, Modifier.padding(19.dp), onRetry = viewModel::load)
            else -> Column(Modifier.padding(19.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Skeleton(Modifier.fillMaxWidth().height(130.dp), JtShapes.hero)
                repeat(3) { Skeleton(Modifier.fillMaxWidth().height(110.dp), JtShapes.card) }
            }
        }
    }
}

@Composable
private fun SessionsContent(event: EventDetail, selectedId: Long?, onSelect: (Long) -> Unit, signedIn: Boolean) {
    val actions = LocalAppActions.current
    val toaster = LocalToaster.current
    val c = Jt.colors
    var full by remember { mutableStateOf(false) }
    var quantityFor by remember { mutableStateOf<EventSession?>(null) }
    val chosen = event.sessions.firstOrNull { it.id == selectedId }

    fun proceed() {
        val s = chosen ?: return
        if (s.hasSeatMap) actions.navigate(SeatsRoute(s.id)) else quantityFor = s
    }

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 96.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item(key = "hero") { EventHero(event.title, listOfNotNull(event.hallName, event.venueName, event.cityName).joinToString(" "), banner = event.bannerUrl, fallback = event.categoryCoverUrl) }
            item(key = "title") { Text("تاریخ و سانس موردنظر", style = text(15f, W.Black), color = c.ink, modifier = Modifier.padding(top = 6.dp)) }
            if (event.sessions.isEmpty()) {
                item(key = "empty") { EmptyState("سانسی برای این رویداد ثبت نشده است.", description = "زمان برگزاری به‌زودی اعلام می‌شود.", symbol = StateSymbol.CALENDAR) }
            }
            items(event.sessions, key = { it.id }) { s ->
                val a = s.availability(Fa::number)
                val on = s.id == selectedId
                Column(
                    Modifier
                        .fillMaxWidth()
                        .clip(JtShapes.card)
                        .background(JtBrushes.glass)
                        .border(if (on) 2.dp else 1.dp, if (on) c.brand700 else c.line, JtShapes.card)
                        .semantics { selected = on }
                        .clickable(role = Role.RadioButton) {
                            if (a.bookable) {
                                onSelect(s.id)
                                toaster.success("سانس انتخاب شد: ${sessionDay(s)}، ساعت ${Fa.time(s.startTime)}")
                            } else {
                                full = true
                            }
                        }
                        .alpha(if (a.bookable) 1f else 0.6f)
                        .padding(16.dp),
                ) {
                    Text(sessionDay(s), style = text(14f, W.Bold), color = c.ink)
                    s.title?.let { Text(it, style = text(12f), color = c.muted) }
                    Text("${Fa.time(s.startTime)} · ${capacityLabel(s)}", style = text(12f, lineHeight = 2f), color = c.muted, modifier = Modifier.padding(top = 2.dp))
                    Row(Modifier.fillMaxWidth().padding(top = 6.dp), horizontalArrangement = Arrangement.Start) {
                        Text("از ${Fa.price(s.fromPrice)}", style = text(10f), color = c.successFg, modifier = Modifier.clip(JtShapes.pill).background(c.successBg).padding(horizontal = 11.dp, vertical = 5.dp))
                    }
                }
            }
        }
        Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().bottomFade().padding(start = 19.dp, end = 19.dp, top = 24.dp, bottom = 12.dp)) {
            JtButton(
                if (chosen?.hasSeatMap == false) "ادامه و انتخاب تعداد" else "ادامه و انتخاب صندلی",
                ::proceed,
                size = ButtonSize.XL,
                block = true,
                enabled = chosen != null && !event.cancelled,
                trailing = Lucide.ArrowLeft,
            )
        }
    }

    if (full) StateDialog(StateSymbol.WAIT, "ظرفیت این سانس تکمیل است", "لطفاً سانس دیگری انتخاب کنید.", { full = false })
    quantityFor?.let { s ->
        QuantitySheet(s, onDismiss = { quantityFor = null }) { quantity ->
            quantityFor = null
            val target = CheckoutRoute(sessionId = s.id, quantity = quantity)
            if (signedIn) actions.navigate(target) else actions.requireLogin(target.path())
        }
    }
}

/** Ticket count for sessions without a seat map (general admission). The backend prices and validates it. */
@Composable
private fun QuantitySheet(session: EventSession, onDismiss: () -> Unit, onConfirm: (Int) -> Unit) {
    val c = Jt.colors
    val max = minOf(10, session.availableSeats)
    var quantity by rememberSaveable { mutableIntStateOf(1) }
    JtBottomSheet(
        onDismiss = onDismiss,
        title = "تعداد بلیت",
        description = "این سانس بدون صندلی شماره‌دار است؛ تعداد بلیت موردنیاز را انتخاب کنید.",
        footer = { JtButton("ادامه خرید", { onConfirm(quantity) }, block = true, size = ButtonSize.LG) },
    ) {
        Row(Modifier.fillMaxWidth().clip(JtShapes.xl2).border(1.dp, c.line, JtShapes.xl2).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Text("بلیت ورود", style = text(14f, W.Bold), color = c.ink)
                Text("${Fa.price(session.price)} برای هر نفر", style = text(13f), color = c.muted, modifier = Modifier.padding(top = 4.dp))
            }
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                JtIconButton(Lucide.Plus, { quantity = minOf(max, quantity + 1) }, "افزایش تعداد", enabled = quantity < max, borderColor = c.lineStrong)
                Text(Fa.number(quantity), style = text(20f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.width(32.dp).semantics { contentDescription = "تعداد: ${Fa.number(quantity)}" })
                JtIconButton(Lucide.Minus, { quantity = maxOf(1, quantity - 1) }, "کاهش تعداد", enabled = quantity > 1, borderColor = c.lineStrong)
            }
        }
        Text("مبلغ نهایی در مرحله بعد توسط سامانه محاسبه می‌شود.", style = text(12.5f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 12.dp))
    }
}
