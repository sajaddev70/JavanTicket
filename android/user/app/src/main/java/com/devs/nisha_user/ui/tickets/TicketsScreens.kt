package com.devs.nisha_user.ui.tickets

import com.devs.nisha_user.core.designsystem.component.CodeText
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.derivedStateOf
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.Badge
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.CategoryIcon
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.IconTile
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtTabs
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.TabItem
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.groupCode
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.domain.model.TicketDetail
import com.devs.nisha_user.domain.model.TicketListItem
import com.devs.nisha_user.domain.model.TicketScope
import com.devs.nisha_user.ui.account.AccountTabs
import com.devs.nisha_user.ui.common.AmountRow
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.TicketStatusBadge
import com.devs.nisha_user.ui.common.ticketState
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute

@Composable
fun TicketsScreen(viewModel: TicketsViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { list.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it >= list.layoutInfo.totalItemsCount - 3 } ?: false } }
    LaunchedEffect(nearEnd, s.items.size) { if (nearEnd) viewModel.loadMore() }
    val c = Jt.colors
    Column(Modifier.fillMaxSize()) {
        JtTopBar("بلیت‌های من", onBack = null)
        PullToRefreshBox(isRefreshing = s.refreshing, onRefresh = { viewModel.reload(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item(key = "tabs-account") { AccountTabs(TicketsRoute, Modifier.padding(top = 12.dp)) }
                item(key = "intro") {
                    Text("بلیت‌های الکترونیک شما؛ برای ورود، کد QR هر بلیت را نشان دهید.", style = text(13.5f), color = c.ink2, modifier = Modifier.padding(horizontal = 16.dp))
                }
                item(key = "scope") {
                    Box(Modifier.padding(horizontal = 16.dp)) {
                        JtTabs(TicketScope.entries.map { TabItem(it, it.label, s.counts[it.api]) }, s.scope, viewModel::select)
                    }
                }
                when {
                    s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, Modifier.padding(horizontal = 16.dp), onRetry = { viewModel.reload() }) }
                    s.loading -> items(4, key = { "sk$it" }) { Skeleton(Modifier.padding(horizontal = 16.dp).fillMaxWidth().height(124.dp), JtShapes.xl2) }
                    s.items.isEmpty() -> item(key = "empty") {
                        EmptyState(
                            s.scope.empty,
                            Modifier.padding(horizontal = 16.dp),
                            icon = Lucide.Ticket,
                            action = if (s.scope == TicketScope.UPCOMING) ({ JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }) }) else null,
                        )
                    }
                    else -> {
                        items(s.items, key = { it.id }) { t -> TicketRow(t, Modifier.padding(horizontal = 16.dp)) { actions.navigate(TicketRoute(t.id)) } }
                        if (s.loadingMore) item(key = "more") {
                            Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(28.dp), color = c.brand600, strokeWidth = 3.dp) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun TicketRow(t: TicketListItem, modifier: Modifier, onClick: () -> Unit) {
    val c = Jt.colors
    val state = ticketState(t.status)
    Row(
        modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.surface).border(1.dp, c.line, JtShapes.xl2).clickable(onClick = onClick).padding(10.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        RemoteImage(t.bannerUrl, Modifier.width(96.dp).height(116.dp).clip(JtShapes.xl), contentDescription = null)
        Column(Modifier.weight(1f).padding(vertical = 4.dp)) {
            Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(t.eventTitle, style = text(15f, W.Black, lineHeight = 1.6f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.weight(1f))
                Badge(state.label, state.background, state.color)
            }
            Row(Modifier.padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                JtIcon(Lucide.CalendarDays, size = 16.dp, tint = c.ink2)
                Text("${Fa.fullDate(t.startTime)} - ${Fa.time(t.startTime)}", style = text(12.5f), color = c.ink2, maxLines = 1)
            }
            Row(Modifier.padding(top = 4.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                JtIcon(Lucide.MapPin, size = 16.dp, tint = c.ink2)
                Text(listOf(t.hallName, t.cityName).joinToString("، "), style = text(12.5f), color = c.ink2, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(t.seatLabel.orEmpty(), style = text(12.5f, W.Bold), color = c.brand600, maxLines = 1, modifier = Modifier.weight(1f))
                JtIcon(Lucide.ChevronLeft, size = 20.dp, tint = c.muted)
            }
        }
    }
}

@Composable
fun TicketScreen(guide: PageBlock?, viewModel: TicketViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    Column(Modifier.fillMaxSize()) {
        JtTopBar("بلیت الکترونیک", onBack = actions.back)
        val t = s.ticket
        when {
            t != null -> TicketContent(t, guide, s.sending, viewModel::sms)
            s.error != null -> ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::load, message = if (s.error!!.isNotFound) "بلیت موردنظر پیدا نشد." else null)
            else -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Skeleton(Modifier.fillMaxWidth().height(420.dp), JtShapes.card)
                Skeleton(Modifier.fillMaxWidth().height(260.dp), JtShapes.card)
            }
        }
    }
}

@Composable
private fun TicketContent(t: TicketDetail, guide: PageBlock?, sending: Boolean, onSms: () -> Unit) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val context = LocalContext.current
    val toaster = LocalToaster.current
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("لطفاً این بلیت را در زمان ورود به همراه داشته باشید.", style = text(13.5f), color = c.ink2)

        // The ticket itself: QR stub, details, and the poster with the category.
        JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(0.dp)) {
            Box(Modifier.fillMaxWidth().aspectRatio(16f / 7f)) {
                RemoteImage(t.bannerUrl, Modifier.matchParentSize(), contentDescription = null, placeholder = c.navy950)
                t.categoryName?.let { name ->
                    Row(
                        Modifier.align(Alignment.TopEnd).padding(12.dp).clip(JtShapes.xl).background(parseHexColor(t.categoryColor, Color(0xFF4F46E5))).padding(horizontal = 12.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(6.dp),
                    ) {
                        CategoryIcon(null, t.categoryIconUrl, size = 16.dp, tint = Color.White)
                        Text(name, style = text(13f, W.Bold), color = Color.White)
                    }
                }
            }
            Column(Modifier.padding(20.dp)) {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Text("بلیت الکترونیک", style = text(14f), color = c.muted, modifier = Modifier.weight(1f))
                    TicketStatusBadge(t.status, sessionCancelled = t.sessionStatus == "CANCELLED", large = true)
                }
                Text(t.eventTitle, style = text(22f, W.Black, lineHeight = 1.5f), color = c.ink, modifier = Modifier.padding(top = 8.dp))
                (t.sessionTitle ?: t.eventSubtitle)?.let { Text(it, style = text(14f), color = c.ink2, modifier = Modifier.padding(top = 4.dp)) }
                Row(Modifier.padding(top = 20.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    IconTile(Lucide.CalendarDays)
                    Column {
                        Text(Fa.fullDate(t.startTime), style = text(16f, W.Black), color = c.ink)
                        Text("ساعت ${Fa.time(t.startTime)} الی ${Fa.time(t.endTime)}", style = text(13.5f), color = c.ink2, modifier = Modifier.padding(top = 2.dp))
                    }
                }
                Row(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    IconTile(Lucide.MapPin)
                    Column {
                        Text(t.cityName, style = text(16f, W.Black), color = c.ink)
                        Text(listOfNotNull(t.venueName, t.hallName, t.hallAddress).joinToString("، "), style = text(13.5f, lineHeight = 1.8f), color = c.ink2, modifier = Modifier.padding(top = 2.dp))
                        t.sectionName?.let { Text("بخش $it", style = text(13.5f, W.Bold), color = c.brand600, modifier = Modifier.padding(top = 4.dp)) }
                    }
                }
                val cells = if (t.seatNumber != null) {
                    listOf("سالن" to t.hallName, "ردیف" to t.rowLabel.orEmpty(), "شماره صندلی" to Fa.number(t.seatNumber), "نوع بلیت" to (t.tierName ?: "عادی"))
                } else {
                    listOf("سالن" to t.hallName, "نوع بلیت" to (t.seatLabel ?: "ورود عمومی"))
                }
                Column(Modifier.padding(top = 20.dp).fillMaxWidth().clip(JtShapes.xl2).background(c.surface2)) {
                    cells.chunked(2).forEachIndexed { i, row ->
                        if (i > 0) HDivider()
                        Row(Modifier.fillMaxWidth()) {
                            row.forEach { (label, value) ->
                                Column(Modifier.weight(1f).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(label, style = text(12.5f), color = c.muted)
                                    Text(value, style = text(16f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                                }
                            }
                        }
                    }
                }
            }
            // Tear line with notches between the details and the QR stub.
            Box(
                Modifier.fillMaxWidth().height(24.dp).drawBehind {
                    drawLine(c.lineStrong, Offset(24.dp.toPx(), size.height / 2), Offset(size.width - 24.dp.toPx(), size.height / 2), 2.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(12f, 10f)))
                    drawCircle(c.page, 12.dp.toPx(), Offset(0f, size.height / 2))
                    drawCircle(c.page, 12.dp.toPx(), Offset(size.width, size.height / 2))
                },
            )
            Column(Modifier.fillMaxWidth().padding(start = 20.dp, end = 20.dp, bottom = 20.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                QrCode(t.qrCode, Modifier.size(196.dp).clip(JtShapes.lg).alpha(if (t.cancelled) 0.25f else 1f))
                CodeText(groupCode(t.qrCode), Modifier.padding(top = 12.dp), size = 17f, color = c.ink2)
                Text("این کد را در زمان ورود به اسکنر مجموعه نشان دهید.", style = text(12.5f, lineHeight = 1.9f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                Column(Modifier.padding(top = 12.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    HDivider(dashed = true, color = c.lineStrong)
                    t.buyerName?.let { LabelValue("نام خریدار", it, large = true) }
                    LabelValue("شماره سفارش", t.orderNumber, isCode = true)
                    LabelValue("شماره بلیت", t.ticketCode, isCode = true)
                    Text("تاریخ خرید: ${Fa.dateTime(t.paidAt ?: t.orderedAt)}", style = text(12f), color = c.muted)
                }
            }
        }

        JtCard(Modifier.fillMaxWidth()) {
            CardTitle("خلاصه خرید", Lucide.ShoppingCart, iconSize = 24.dp)
            Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                AmountRow("تعداد بلیت سفارش", "${Fa.number(t.orderTicketsCount)} عدد")
                AmountRow("مبلغ این بلیت", Fa.price(t.price))
                HDivider()
                Row(Modifier.fillMaxWidth()) {
                    Text("جمع کل سفارش", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                    Text(Fa.price(t.orderTotal), style = text(18f, W.Black), color = c.brand600)
                }
            }
            Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                JtButton("دانلود PDF / چاپ بلیت", { printTicket(context, t) }, size = ButtonSize.LG, block = true, enabled = !t.cancelled, leading = Lucide.Printer)
                JtButton("ارسال به موبایل", onSms, variant = ButtonVariant.SOFT, size = ButtonSize.LG, block = true, loading = sending, enabled = !t.cancelled, leading = Lucide.Smartphone)
                JtButton(
                    "اشتراک‌گذاری",
                    { actions.share(t.eventTitle, "${t.eventTitle} - ${Fa.fullDate(t.startTime)} ساعت ${Fa.time(t.startTime)} - ${listOf(t.hallName, t.cityName).joinToString("، ")}") },
                    variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, leading = Lucide.Share2,
                )
                JtButton(
                    "افزودن به تقویم",
                    { if (!addToCalendar(context, t)) toaster.error("برنامه تقویم روی این گوشی پیدا نشد.") },
                    variant = ButtonVariant.OUTLINE, size = ButtonSize.LG, block = true, enabled = !t.cancelled, leading = Lucide.CalendarPlus,
                )
                JtButton("بازگشت به رویداد", { actions.navigate(EventDetailRoute(t.eventSlug)) }, variant = ButtonVariant.GHOST, block = true, trailing = Lucide.ArrowLeft)
            }
        }

        if (guide != null) TicketGuide(guide)
    }
}

@Composable
private fun LabelValue(label: String, value: String, large: Boolean = false, isCode: Boolean = false) {
    Column(Modifier.fillMaxWidth()) {
        Text(label, style = text(13f), color = Jt.colors.muted)
        if (isCode) CodeText(value, color = Jt.colors.ink2) else Text(value, style = text(if (large) 15f else 13.5f, if (large) W.Black else W.Bold), color = if (large) Jt.colors.ink else Jt.colors.ink2)
    }
}

/** "راهنمای ورود به سالن" steps; each line of the content block is "عنوان: توضیح". */
@Composable
private fun TicketGuide(guide: PageBlock) {
    val c = Jt.colors
    JtCard(Modifier.fillMaxWidth()) {
        CardTitle(guide.title ?: "راهنمای ورود به سالن", Lucide.Info, iconSize = 24.dp)
        Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            guide.lines.forEachIndexed { i, line ->
                val head = line.substringBefore(":")
                val body = line.substringAfter(":", "").trim()
                Row(Modifier.fillMaxWidth().clip(JtShapes.xl2).border(1.dp, c.line, JtShapes.xl2).padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.size(32.dp).clip(CircleShape).background(c.brand600), contentAlignment = Alignment.Center) {
                        Text(Fa.number(i + 1), style = text(14f, W.Black), color = Color.White)
                    }
                    Column {
                        Text(if (body.isNotEmpty()) head else line, style = text(15f, W.Black), color = c.ink)
                        if (body.isNotEmpty()) Text(body, style = text(13f, lineHeight = 1.9f), color = c.ink2, modifier = Modifier.padding(top = 4.dp))
                    }
                }
            }
        }
    }
}
