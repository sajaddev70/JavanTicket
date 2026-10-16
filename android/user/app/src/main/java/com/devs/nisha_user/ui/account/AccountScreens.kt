package com.devs.nisha_user.ui.account

import com.devs.nisha_user.core.format.ltr
import com.devs.nisha_user.core.designsystem.component.CodeText
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.HoldTimer
import com.devs.nisha_user.core.designsystem.component.IconTile
import com.devs.nisha_user.core.designsystem.component.InlineError
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtPicker
import com.devs.nisha_user.core.designsystem.component.JtPillTabs
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LocalSiteSettings
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.PickerOption
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.TabItem
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.formatMobile
import com.devs.nisha_user.core.format.paragraphs
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardSkeleton
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.MetaRow
import com.devs.nisha_user.ui.common.OrderStatusBadge
import com.devs.nisha_user.ui.common.OrderSummary
import com.devs.nisha_user.ui.common.SummaryVariant
import com.devs.nisha_user.ui.common.seatText
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.FavoritesRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.ProfileRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute

private val ORDER_FILTERS = listOf(
    TabItem<OrderStatus?>(null, "همه سفارش‌ها"),
    TabItem<OrderStatus?>(OrderStatus.PAID, "پرداخت شده"),
    TabItem<OrderStatus?>(OrderStatus.PENDING, "در انتظار پرداخت"),
    TabItem<OrderStatus?>(OrderStatus.CANCELLED, "لغو شده"),
)

@Composable
fun OrdersScreen(viewModel: OrdersViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { list.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it >= list.layoutInfo.totalItemsCount - 3 } ?: false } }
    LaunchedEffect(nearEnd, s.items.size) { if (nearEnd) viewModel.loadMore() }
    Column(Modifier.fillMaxSize()) {
        JtTopBar("سفارش‌های من", onBack = actions.back)
        PullToRefreshBox(isRefreshing = s.refreshing, onRefresh = { viewModel.reload(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item(key = "account") { AccountTabs(OrdersRoute, Modifier.padding(top = 12.dp)) }
                item(key = "intro") { Text("همه خریدهای شما، با وضعیت پرداخت و بلیت‌های هر سفارش.", style = text(13.5f), color = c.ink2, modifier = Modifier.padding(horizontal = 16.dp)) }
                item(key = "filters") { JtPillTabs(ORDER_FILTERS, s.status, viewModel::select, Modifier.padding(horizontal = 16.dp)) }
                when {
                    s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, Modifier.padding(horizontal = 16.dp), onRetry = { viewModel.reload() }) }
                    s.loading -> items(4, key = { "sk$it" }) { Skeleton(Modifier.padding(horizontal = 16.dp).fillMaxWidth().height(120.dp), JtShapes.xl2) }
                    s.items.isEmpty() -> item(key = "empty") {
                        EmptyState("سفارشی برای نمایش وجود ندارد.", Modifier.padding(horizontal = 16.dp), icon = Lucide.Receipt, action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }) })
                    }
                    else -> {
                        items(s.items, key = { it.id }) { o -> OrderRow(o, Modifier.padding(horizontal = 16.dp)) }
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
private fun OrderRow(o: OrderListItem, modifier: Modifier) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.surface).border(1.dp, c.line, JtShapes.xl2).clickable { actions.navigate(OrderRoute(o.orderNumber)) }.padding(12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            CodeText(o.orderNumber, Modifier.weight(1f), size = 13f, color = c.brand600)
            OrderStatusBadge(o.status)
        }
        Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            RemoteImage(o.bannerUrl, Modifier.size(52.dp).clip(JtShapes.lg))
            Column(Modifier.weight(1f)) {
                Text(o.eventTitle, style = text(14.5f, W.Black), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Text(Fa.fullDate(o.startTime), style = text(12.5f), color = c.muted, modifier = Modifier.padding(top = 2.dp))
            }
        }
        Row(Modifier.fillMaxWidth().padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(Fa.price(o.totalAmount), style = text(14f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
            if (o.firstTicketId != null) {
                Row(
                    Modifier.clip(JtShapes.lg).background(c.brand50).clickable { actions.navigate(TicketRoute(o.firstTicketId)) }.heightIn(min = 36.dp).padding(horizontal = 12.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    JtIcon(Lucide.Ticket, size = 16.dp, tint = c.brand600)
                    Text("${Fa.number(o.ticketsCount)} بلیت", style = text(12.5f, W.Bold), color = c.brand600)
                }
            } else {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("جزئیات", style = text(12.5f, W.Bold), color = c.brand600)
                    JtIcon(Lucide.ChevronLeft, size = 16.dp, tint = c.brand600)
                }
            }
        }
    }
}

@Composable
fun OrderScreen(viewModel: OrderViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    Column(Modifier.fillMaxSize()) {
        JtTopBar("جزئیات سفارش", onBack = actions.back) { s.order?.let { OrderStatusBadge(it.status, Modifier.padding(end = 8.dp)) } }
        val o = s.order
        when {
            o != null -> OrderContent(o, s.receivedAt, viewModel::load)
            s.error != null -> ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::load, message = if (s.error!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
            else -> Skeleton(Modifier.padding(16.dp).fillMaxWidth().height(480.dp), JtShapes.card)
        }
    }
}

@Composable
private fun OrderContent(o: Order, receivedAt: Long, reload: () -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
        if (o.status == OrderStatus.PENDING) {
            JtCard(Modifier.fillMaxWidth(), background = c.warningBg, borderColor = c.warning.copy(alpha = 0.4f)) {
                if (o.payable) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("پرداخت این سفارش تکمیل نشده است.", style = text(14f, W.Bold), color = c.ink, modifier = Modifier.weight(1f))
                        HoldTimer(o.secondsLeft, receivedAt, onExpire = reload)
                    }
                    JtButton(
                        "ادامه پرداخت",
                        { actions.navigate(if (o.buyerFirstName != null) PaymentRoute(o.orderNumber) else CheckoutRoute(order = o.orderNumber)) },
                        Modifier.padding(top = 12.dp),
                        block = true,
                        leading = Lucide.CreditCard,
                    )
                } else {
                    Text("زمان پرداخت این سفارش به پایان رسیده و صندلی‌ها آزاد شده‌اند.", style = text(14f, W.Bold), color = c.ink)
                }
            }
        }
        JtCard(Modifier.fillMaxWidth()) {
            Text("اطلاعات سفارش", style = text(17f, W.Black), color = c.ink, modifier = Modifier.padding(bottom = 6.dp))
            InfoLine("شماره سفارش", o.orderNumber, copy = true)
            InfoLine("تاریخ ثبت", Fa.dateTime(o.createdAt))
            o.paidAt?.let { InfoLine("تاریخ پرداخت", Fa.dateTime(it)) }
            o.trackingCode?.let { InfoLine("کد پیگیری", it, copy = true) }
        }
        JtCard(Modifier.fillMaxWidth()) {
            Text(o.eventTitle, style = text(17f, W.Black), color = c.ink, modifier = Modifier.clickable { actions.navigate(EventDetailRoute(o.eventSlug)) })
            Column(Modifier.padding(top = 10.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                MetaRow(Lucide.CalendarDays, "${Fa.fullDate(o.startTime)} - ساعت ${Fa.time(o.startTime)}")
                MetaRow(Lucide.MapPin, listOfNotNull(o.hallName, o.venueName, o.cityName).joinToString(" - "))
                if (o.buyerFirstName != null || o.buyerMobile != null) {
                    MetaRow(Lucide.UserRound, listOfNotNull(listOfNotNull(o.buyerFirstName, o.buyerLastName).joinToString(" "), o.buyerMobile?.let { ltr(toFaDigits(it)) }).joinToString("  "))
                }
            }
        }
        if (o.tickets.isNotEmpty()) {
            JtCard(Modifier.fillMaxWidth()) {
                CardTitle("بلیت‌های این سفارش", Lucide.Ticket, size = 17f, iconSize = 20.dp)
                Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    o.tickets.forEach { t ->
                        Row(
                            Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.brand50.copy(alpha = 0.4f)).border(1.dp, c.brand500.copy(alpha = 0.4f), JtShapes.xl)
                                .clickable { actions.navigate(TicketRoute(t.id)) }.heightIn(min = 56.dp).padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            Column(Modifier.weight(1f)) {
                                Text(t.seatLabel.orEmpty(), style = text(14f, W.Bold), color = c.ink)
                                CodeText(t.ticketCode, size = 12f, color = c.muted, weight = W.Normal)
                            }
                            Text("مشاهده بلیت", style = text(13f, W.Bold), color = c.brand600)
                            JtIcon(Lucide.ChevronLeft, size = 16.dp, tint = c.brand600)
                        }
                    }
                }
            }
        } else if (o.seats.isNotEmpty()) {
            JtCard(Modifier.fillMaxWidth()) {
                Text("صندلی‌ها", style = text(17f, W.Black), color = c.ink)
                Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    o.seats.forEach { seat ->
                        Row(Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.surface2).padding(horizontal = 16.dp, vertical = 10.dp)) {
                            Text(seatText(seat), style = text(13.5f), color = c.ink, modifier = Modifier.weight(1f))
                            Text(Fa.price(seat.price), style = text(13.5f, W.Bold), color = c.ink)
                        }
                    }
                }
            }
        }
        OrderSummary(o, variant = SummaryVariant.PAYMENT)
    }
}

@Composable
private fun InfoLine(label: String, value: String, copy: Boolean = false) {
    val clipboard = LocalClipboardManager.current
    val toaster = LocalToaster.current
    Column {
        Row(Modifier.fillMaxWidth().heightIn(min = 48.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(label, style = text(14f), color = Jt.colors.ink2, modifier = Modifier.weight(1f))
            if (copy) {
                JtIconButton(Lucide.Copy, {
                    clipboard.setText(AnnotatedString(value))
                    toaster.success("$label کپی شد.")
                }, "کپی $label", size = 36.dp, iconSize = 16.dp, borderColor = null, tint = Jt.colors.muted)
            }
            if (copy) CodeText(value, size = 14f) else Text(value, style = text(14f, W.Bold), color = Jt.colors.ink)
        }
        HDivider()
    }
}

@Composable
fun ProfileScreen(cities: List<City>, onSignOut: () -> Unit, viewModel: ProfileViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize()) {
        JtTopBar("حساب کاربری", onBack = null)
        val p = s.profile
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().padding(bottom = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            AccountTabs(ProfileRoute, Modifier.padding(top = 12.dp))
            Text("اطلاعات شخصی شما برای خرید و دریافت بلیت.", style = text(13.5f), color = c.ink2, modifier = Modifier.padding(horizontal = 16.dp))
            when {
                p != null -> Column(Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        Stat(Lucide.Ticket, "بلیت‌های پیش رو", p.upcomingTicketsCount, Modifier.weight(1f)) { actions.replace(TicketsRoute) }
                        Stat(Lucide.Receipt, "سفارش‌های پرداخت‌شده", p.ordersCount, Modifier.weight(1f)) { actions.navigate(OrdersRoute) }
                        Stat(Lucide.Heart, "علاقه‌مندی‌ها", p.favoritesCount, Modifier.weight(1f)) { actions.navigate(FavoritesRoute) }
                    }
                    JtCard(Modifier.fillMaxWidth()) {
                        Text("ویرایش اطلاعات", style = text(17f, W.Black), color = c.ink, modifier = Modifier.padding(bottom = 16.dp))
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            val next = KeyboardOptions(imeAction = ImeAction.Next)
                            JtTextField(s.form.firstName, { v -> viewModel.edit { it.copy(firstName = v) } }, label = "نام", required = true, error = s.fieldErrors["first_name"], keyboardOptions = next)
                            JtTextField(s.form.lastName, { v -> viewModel.edit { it.copy(lastName = v) } }, label = "نام خانوادگی", required = true, error = s.fieldErrors["last_name"], keyboardOptions = next)
                            JtTextField(formatMobile(p.mobile), {}, label = "شماره موبایل", enabled = false, ltr = true, hint = "شماره موبایل همان شناسه ورود شماست و قابل تغییر نیست.")
                            JtTextField(
                                s.form.email, { v -> viewModel.edit { it.copy(email = v) } }, label = "ایمیل", error = s.fieldErrors["email"], ltr = true,
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Done),
                            )
                            JtPicker(
                                s.form.cityId,
                                listOf(PickerOption<Long?>(null, "انتخاب نشده")) + cities.map { PickerOption<Long?>(it.id, it.name) },
                                { v -> viewModel.edit { it.copy(cityId = v) } },
                                label = "شهر",
                                icon = Lucide.MapPin,
                            )
                            Text("عضو از ${Fa.date(p.createdAt)}", style = text(13f), color = c.muted)
                        }
                        s.saveError?.let { InlineError(it, Modifier.padding(top = 16.dp)) }
                        JtButton("ذخیره تغییرات", viewModel::save, Modifier.padding(top = 20.dp), size = ButtonSize.LG, block = true, loading = s.saving, enabled = s.dirty, leading = Lucide.Save)
                        JtButton("خروج از حساب", onSignOut, Modifier.padding(top = 8.dp), variant = ButtonVariant.DANGER_GHOST, block = true, leading = Lucide.LogOut)
                    }
                }
                s.error != null -> ErrorState(s.error, Modifier.padding(horizontal = 16.dp), onRetry = viewModel::load)
                else -> Skeleton(Modifier.padding(horizontal = 16.dp).fillMaxWidth().height(420.dp), JtShapes.card)
            }
        }
    }
}

@Composable
private fun Stat(icon: LucidePaths, label: String, value: Int, modifier: Modifier, onClick: () -> Unit) {
    val c = Jt.colors
    JtCard(modifier, padding = PaddingValues(12.dp), onClick = onClick) {
        IconTile(icon, size = 44.dp, iconSize = 22.dp)
        Text(Fa.number(value), style = text(22f, W.Black), color = c.ink, modifier = Modifier.padding(top = 8.dp))
        Text(label, style = text(12f, lineHeight = 1.6f), color = c.ink2, maxLines = 2)
    }
}

@Composable
fun FavoritesScreen(viewModel: FavoritesViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize()) {
        JtTopBar("علاقه‌مندی‌ها", onBack = actions.back)
        PullToRefreshBox(isRefreshing = s.refreshing, onRefresh = { viewModel.load(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item(key = "account") { AccountTabs(FavoritesRoute, Modifier.padding(top = 12.dp)) }
                item(key = "intro") { Text("رویدادهایی که نشان کرده‌اید.", style = text(13.5f), color = c.ink2, modifier = Modifier.padding(horizontal = 16.dp)) }
                val events = s.events
                when {
                    events == null && s.error != null -> item(key = "error") { ErrorState(s.error, Modifier.padding(horizontal = 16.dp), onRetry = { viewModel.load() }) }
                    events == null -> items(3, key = { "sk$it" }) { EventCardSkeleton(Modifier.padding(horizontal = 16.dp).fillMaxWidth()) }
                    events.isEmpty() -> item(key = "empty") {
                        EmptyState(
                            "هنوز رویدادی را به علاقه‌مندی‌ها اضافه نکرده‌اید.",
                            Modifier.padding(horizontal = 16.dp),
                            icon = Lucide.Heart,
                            description = "با زدن نماد قلب روی هر رویداد، آن را اینجا ذخیره کنید.",
                            action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }) },
                        )
                    }
                    else -> items(events, key = { it.id }) { e -> EventCard(e, Modifier.padding(horizontal = 16.dp).fillMaxWidth()) }
                }
            }
        }
    }
}

/** Pages written in the admin panel ("صفحات محتوایی"); the contact page also lists the site's contact details. */
@Composable
fun ContentScreen(viewModel: ContentViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val settings = LocalSiteSettings.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize()) {
        JtTopBar(s.page?.title ?: "", onBack = actions.back)
        val page = s.page
        when {
            page != null -> Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).navigationBarsPadding()) {
                JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(20.dp)) {
                    Text(page.title, style = text(26f, W.Black), color = c.ink)
                    page.updatedAt?.let { Text("آخرین به‌روزرسانی: ${Fa.date(it)}", style = text(12.5f), color = c.muted, modifier = Modifier.padding(top = 8.dp)) }
                    paragraphs(page.content).forEach { Text(it, style = text(15f, lineHeight = 2.1f), color = c.ink2, modifier = Modifier.padding(top = 16.dp)) }
                    if (viewModel.slug == "contact" && settings != null) {
                        Column(Modifier.padding(top = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            settings.contactPhone?.let { phone -> ContactCard(Lucide.Phone, ltr(toFaDigits(phone))) { actions.openLink("tel:" + phone.filter { ch -> ch.isDigit() || ch == '+' }) } }
                            settings.contactEmail?.let { email -> ContactCard(Lucide.Mail, email) { actions.openLink("mailto:$email") } }
                            settings.address?.let { ContactCard(Lucide.MapPin, it, null) }
                        }
                    }
                }
            }
            s.error?.isNotFound == true -> EmptyState(
                "این صفحه پیدا نشد",
                Modifier.padding(16.dp),
                description = "شاید آدرس اشتباه وارد شده یا این صفحه دیگر در دسترس نیست.",
                icon = Lucide.Ticket,
                action = { JtButton("مشاهده رویدادها", { actions.replace(EventsRoute()) }) },
            )
            s.error != null -> ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::load)
            else -> Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Skeleton(Modifier.fillMaxWidth(0.5f).height(32.dp))
                Skeleton(Modifier.fillMaxWidth().height(16.dp))
                Skeleton(Modifier.fillMaxWidth(0.85f).height(16.dp))
            }
        }
    }
}

@Composable
private fun ContactCard(icon: LucidePaths, value: String, onClick: (() -> Unit)?) {
    val c = Jt.colors
    Row(
        Modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.surface2).border(1.dp, c.line, JtShapes.xl2)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier).padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        IconTile(icon, size = 44.dp, iconSize = 20.dp)
        Text(value, style = text(14.5f, W.Bold), color = c.ink)
    }
}
