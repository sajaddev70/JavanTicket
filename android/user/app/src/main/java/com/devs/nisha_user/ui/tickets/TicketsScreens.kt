package com.devs.nisha_user.ui.tickets

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CodeText
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.InfoBanner
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtTabs
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.component.TabItem
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.groupCode
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketListItem
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.domain.model.TicketStatus
import com.devs.nisha_user.ui.common.EventSummaryCard
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.TicketStatusBadge
import com.devs.nisha_user.ui.eventdetail.EventHero
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import java.time.Instant

/** 13 بلیت‌های من: عادی، بدون بلیت، بلیت استفاده‌شده. */
@Composable
fun TicketsScreen(viewModel: TicketsViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { list.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it >= list.layoutInfo.totalItemsCount - 3 } ?: false } }
    LaunchedEffect(nearEnd, s.items.size) { if (nearEnd) viewModel.loadMore() }
    val c = Jt.colors
    var usedTicket by remember { mutableStateOf<Long?>(null) }
    Column(Modifier.fillMaxSize()) {
        JtTopBar("بلیت‌های من", onBack = null)
        PullToRefreshBox(isRefreshing = s.refreshing, onRefresh = { viewModel.reload(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                item(key = "scope") { JtTabs(TicketScope.entries.map { TabItem(it, it.label, s.counts[it.api]) }, s.scope, viewModel::select) }
                when {
                    s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, onRetry = { viewModel.reload() }) }
                    s.loading -> items(4, key = { "sk$it" }) { Skeleton(Modifier.fillMaxWidth().height(113.dp), JtShapes.event) }
                    s.items.isEmpty() -> item(key = "empty") {
                        if (s.scope == TicketScope.UPCOMING) {
                            EmptyState(
                                "هنوز بلیتی ندارید",
                                description = "از بخش رویدادها اولین بلیت خود را تهیه کنید.",
                                symbol = StateSymbol.TICKET,
                                action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }, block = true, size = ButtonSize.XL) },
                            )
                        } else {
                            EmptyState(s.scope.empty, symbol = StateSymbol.TICKET)
                        }
                    }
                    else -> {
                        items(s.items, key = { it.id }) { t ->
                            TicketRow(t) { if (t.status == TicketStatus.USED) usedTicket = t.id else actions.navigate(TicketRoute(t.id)) }
                        }
                        if (s.loadingMore) item(key = "more") {
                            Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(28.dp), color = c.brand500, strokeWidth = 3.dp) }
                        }
                    }
                }
            }
        }
    }
    usedTicket?.let { id ->
        StateDialog(
            StateSymbol.CHECK,
            "این بلیت استفاده شده است",
            "این بلیت قبلاً در ورودی ثبت شده است.",
            onAction = { usedTicket = null; actions.navigate(TicketRoute(id)) },
            onDismiss = { usedTicket = null },
        )
    }
}

/** The event card; a ticket still valid also gets the design's glass row with the QR button. */
@Composable
private fun TicketRow(t: TicketListItem, onOpen: () -> Unit) {
    val c = Jt.colors
    val when_ = "${Fa.fullDate(t.startTime)} · ساعت ${Fa.time(t.startTime)}"
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        EventSummaryCard(t.bannerUrl, t.eventTitle, when_, listOf(t.cityName, t.hallName).filter { it.isNotBlank() }.joinToString("، "), Modifier.fillMaxWidth(), onClick = onOpen) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                t.seatLabel?.let { Text(it, style = text(11f, W.Bold), color = Jt.colors.brand600, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f, fill = false)) }
                TicketStatusBadge(t.status)
            }
        }
        if (t.status == TicketStatus.VALID) {
            JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(14.dp)) {
                Text("بلیت الکترونیکی", style = text(13f, W.Bold), color = c.ink)
                Text(when_, style = text(12f, lineHeight = 2f), color = c.muted)
                JtButton("نمایش QR بلیت", onOpen, Modifier.padding(top = 6.dp), size = ButtonSize.LG, block = true)
            }
        }
    }
}

/** 14 بلیت الکترونیکی: عادی، بلیت منقضی، خطای نمایش کد. */
@Composable
fun TicketScreen(guide: PageBlock?, viewModel: TicketViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar("بلیت الکترونیکی", onBack = actions.back)
            val t = s.ticket
            when {
                t != null -> TicketContent(t, guide, s.sending, viewModel::sms)
                s.error?.isNotFound == true -> EmptyState("بلیت موردنظر پیدا نشد.", Modifier.padding(horizontal = 19.dp), symbol = StateSymbol.TICKET)
            }
        }
        if (s.ticket == null && s.error == null) LoadingOverlay("در حال بارگذاری", "لطفاً چند لحظه منتظر بمانید.")
    }
    val e = s.error
    if (e != null && !e.isNotFound && s.ticket == null) {
        StateDialog(StateSymbol.WARNING, "نمایش کد امکان‌پذیر نیست", "برای دریافت مجدد اطلاعات بلیت تلاش کنید.", viewModel::load, actionLabel = "تلاش مجدد", onDismiss = actions.back)
    }
}

@Composable
private fun TicketContent(t: TicketDetail, guide: PageBlock?, sending: Boolean, onSms: () -> Unit) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val context = LocalContext.current
    val toaster = LocalToaster.current
    val qrOk = remember(t.qrCode) { runCatching { qrMatrix(t.qrCode) }.isSuccess }
    val ended = remember(t.endTime) { Fa.instant(t.endTime).isBefore(Instant.now()) }
    var noticeSeen by rememberSaveable { mutableStateOf(false) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 19.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        EventHero(t.eventTitle, t.sessionTitle ?: t.eventSubtitle, banner = t.bannerUrl, height = 96.dp)
        JtCard(Modifier.fillMaxWidth()) {
            Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("بلیت الکترونیکی", style = text(17f, W.Black), color = c.ink)
                    TicketStatusBadge(t.status, sessionCancelled = t.sessionStatus == "CANCELLED")
                }
                if (qrOk) {
                    Box(Modifier.padding(top = 14.dp).clip(JtShapes.field).background(Color.White).padding(12.dp)) {
                        QrCode(t.qrCode, Modifier.size(180.dp).alpha(if (t.cancelled) 0.25f else 1f), foreground = Color(0xFF142452))
                    }
                }
                Row(Modifier.padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text("کد بلیت:", style = text(14f, W.Bold), color = c.ink)
                    CodeText(groupCode(t.qrCode), size = 14f, color = c.ink)
                }
                Text(
                    listOfNotNull(
                        Fa.fullDate(t.startTime),
                        Fa.time(t.startTime),
                        t.rowLabel?.let { "ردیف $it" }?.let { r -> t.seatNumber?.let { "$r صندلی ${Fa.number(it)}" } ?: r } ?: t.seatLabel,
                    ).joinToString(" · "),
                    style = text(12f, lineHeight = 2f),
                    color = c.muted,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.padding(top = 2.dp),
                )
                Text(listOfNotNull(t.hallName.ifBlank { null }, t.venueName, t.cityName.ifBlank { null }).joinToString("، "), style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center)
            }
        }
        InfoBanner(null, centered = true) { Text("این کد را هنگام ورود نشان دهید", style = text(13f), color = Color.White) }

        JtButton("دانلود PDF / چاپ بلیت", { printTicket(context, t) }, size = ButtonSize.LG, block = true, enabled = !t.cancelled)
        JtButton("ارسال به موبایل", onSms, variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, loading = sending, enabled = !t.cancelled)
        JtButton(
            "اشتراک‌گذاری",
            { actions.share(t.eventTitle, "${t.eventTitle} - ${Fa.fullDate(t.startTime)} ساعت ${Fa.time(t.startTime)} - ${listOf(t.hallName, t.cityName).joinToString("، ")}") },
            variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true,
        )
        JtButton(
            "افزودن به تقویم",
            { if (!addToCalendar(context, t)) toaster.error("برنامه تقویم روی این گوشی پیدا نشد.") },
            variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, enabled = !t.cancelled,
        )
        JtButton("بازگشت به رویداد", { actions.navigate(EventDetailRoute(t.eventSlug)) }, variant = ButtonVariant.GHOST, block = true, trailing = Lucide.ArrowLeft)
        if (guide != null) TicketGuide(guide)
    }
    when {
        !qrOk -> StateDialog(StateSymbol.WARNING, "نمایش کد امکان‌پذیر نیست", "برای دریافت مجدد اطلاعات بلیت تلاش کنید.", actions.back, actionLabel = "بازگشت")
        ended && t.status == TicketStatus.VALID && !noticeSeen -> StateDialog(StateSymbol.WAIT, "اعتبار بلیت به پایان رسیده", "تاریخ برگزاری این رویداد گذشته است.", { noticeSeen = true })
    }
}

/** "راهنمای ورود به سالن" steps; each line of the content block is "عنوان: توضیح". */
@Composable
private fun TicketGuide(guide: PageBlock) {
    val c = Jt.colors
    JtCard(Modifier.fillMaxWidth()) {
        Text(guide.title ?: "راهنمای ورود به سالن", style = text(15f, W.Black), color = c.ink)
        guide.lines.forEachIndexed { i, line ->
            val head = line.substringBefore(":")
            val body = line.substringAfter(":", "").trim()
            Text("${Fa.number(i + 1)}. ${if (body.isNotEmpty()) head else line}", style = text(13f, W.Bold), color = c.ink, modifier = Modifier.padding(top = 10.dp))
            if (body.isNotEmpty()) Text(body, style = text(12f, lineHeight = 1.9f), color = c.muted)
        }
    }
}
