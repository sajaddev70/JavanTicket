package com.devs.nisha_user.ui.account

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CodeText
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
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.LocalSiteSettings
import com.devs.nisha_user.core.designsystem.component.LocalToaster
import com.devs.nisha_user.core.designsystem.component.PickerOption
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.component.TabItem
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.formatMobile
import com.devs.nisha_user.core.format.ltr
import com.devs.nisha_user.core.format.paragraphs
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderListItem
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.UserProfile
import com.devs.nisha_user.ui.common.AmountRow
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardSkeleton
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.common.OrderEventCard
import com.devs.nisha_user.ui.common.OrderStatusBadge
import com.devs.nisha_user.ui.common.seatText
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.FavoritesRoute
import com.devs.nisha_user.ui.navigation.OrderRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.PaymentRoute
import com.devs.nisha_user.ui.navigation.TicketRoute
import com.devs.nisha_user.ui.navigation.TicketsRoute

private val ORDER_FILTERS = listOf(
    TabItem<OrderStatus?>(null, "همه سفارش‌ها"),
    TabItem<OrderStatus?>(OrderStatus.PAID, "پرداخت‌شده"),
    TabItem<OrderStatus?>(OrderStatus.PENDING, "در انتظار"),
    TabItem<OrderStatus?>(OrderStatus.CANCELLED, "لغوشده"),
)

/** 15 سفارش‌های من: عادی، بدون سفارش. (سفارش لغوشده's box appears when such an order is opened.) */
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
            LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item(key = "filters") { JtPillTabs(ORDER_FILTERS, s.status, viewModel::select) }
                when {
                    s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, onRetry = { viewModel.reload() }) }
                    s.loading -> items(4, key = { "sk$it" }) { Skeleton(Modifier.fillMaxWidth().height(130.dp), JtShapes.card) }
                    s.items.isEmpty() -> item(key = "empty") {
                        EmptyState(
                            "هنوز سفارشی ثبت نکرده‌اید",
                            description = "با انتخاب یک رویداد، خرید را آغاز کنید.",
                            symbol = StateSymbol.RECEIPT,
                            action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }, block = true, size = ButtonSize.XL) },
                        )
                    }
                    else -> {
                        items(s.items, key = { it.id }) { o -> OrderRow(o) }
                        if (s.loadingMore) item(key = "more") {
                            Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(28.dp), color = c.brand500, strokeWidth = 3.dp) }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun OrderRow(o: OrderListItem) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    JtCard(Modifier.fillMaxWidth(), onClick = { actions.navigate(OrderRoute(o.orderNumber)) }) {
        CodeText(o.orderNumber, size = 14f, color = c.ink)
        Text(o.eventTitle, style = text(12f, lineHeight = 2f), color = c.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
        Box(Modifier.padding(top = 2.dp)) { OrderStatusBadge(o.status) }
        Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(Fa.price(o.totalAmount), style = text(13f), color = c.ink, modifier = Modifier.weight(1f))
            if (o.firstTicketId != null) {
                Text(
                    "${Fa.number(o.ticketsCount)} بلیت",
                    style = text(12f, W.Bold),
                    color = c.brand500,
                    modifier = Modifier.padding(end = 12.dp).clip(JtShapes.lg).clickable { actions.navigate(TicketRoute(o.firstTicketId)) }.heightIn(min = 36.dp).padding(horizontal = 6.dp, vertical = 8.dp),
                )
            }
            JtIcon(Lucide.ChevronLeft, size = 14.dp, tint = c.ink)
            Text("جزئیات", style = text(12f), color = c.ink)
        }
    }
}

/** 16 جزئیات سفارش: عادی، در انتظار پرداخت، سفارش لغوشده. */
@Composable
fun OrderScreen(viewModel: OrderViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar("جزئیات سفارش", onBack = actions.back)
            val o = s.order
            when {
                o != null -> OrderContent(o, s.receivedAt, viewModel::load)
                s.error != null -> ErrorState(s.error, Modifier.padding(19.dp), onRetry = viewModel::load, message = if (s.error!!.isNotFound) "سفارش موردنظر پیدا نشد." else null)
            }
        }
        if (s.order == null && s.error == null) LoadingOverlay("در حال بارگذاری", "لطفاً چند لحظه منتظر بمانید.")
    }
}

@Composable
private fun OrderContent(o: Order, receivedAt: Long, reload: () -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    var noticeSeen by rememberSaveable { mutableStateOf(false) }
    val pay = { actions.navigate(if (o.buyerFirstName != null) PaymentRoute(o.orderNumber) else CheckoutRoute(order = o.orderNumber)) }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 19.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            Text("اطلاعات سفارش", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
            OrderStatusBadge(o.status)
        }
        JtCard(Modifier.fillMaxWidth()) {
            InfoLine("شماره سفارش", o.orderNumber, copy = true)
            InfoLine("تاریخ", Fa.dateTime(o.createdAt))
            o.paidAt?.let { InfoLine("تاریخ پرداخت", Fa.dateTime(it)) }
            o.trackingCode?.let { InfoLine("کد پیگیری", it, copy = true) }
            val buyer = listOfNotNull(o.buyerFirstName, o.buyerLastName).joinToString(" ")
            if (buyer.isNotBlank()) InfoLine("نام خریدار", buyer)
            o.buyerMobile?.let { InfoLine("موبایل خریدار", ltr(toFaDigits(it))) }
        }
        OrderEventCard(o)
        JtCard(Modifier.fillMaxWidth()) {
            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                AmountRow("تعداد بلیت", Fa.number(o.ticketsCount))
                AmountRow("مبلغ بلیت‌ها", Fa.price(o.subtotal))
                o.discountAmount?.takeIf { it > 0 }?.let { AmountRow("تخفیف", "- ${Fa.price(it)}", color = c.successFg) }
                if (o.serviceFee > 0) AmountRow("هزینه خدمات سامانه", Fa.price(o.serviceFee))
                AmountRow("مبلغ کل", Fa.price(o.totalAmount))
            }
            if (o.status == OrderStatus.PENDING && o.payable) {
                Row(Modifier.padding(top = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("زمان باقی‌مانده پرداخت:", style = text(12f), color = c.muted)
                    HoldTimer(o.secondsLeft, receivedAt, onExpire = reload)
                }
            }
        }
        if (o.tickets.isNotEmpty()) {
            JtButton(
                "مشاهده بلیت‌ها",
                { if (o.tickets.size == 1) actions.navigate(TicketRoute(o.tickets.first().id)) else actions.navigate(TicketsRoute) },
                size = ButtonSize.XL,
                block = true,
                trailing = Lucide.ArrowLeft,
            )
            o.tickets.forEach { t ->
                Row(
                    Modifier.fillMaxWidth().clip(JtShapes.xl).background(c.field).border(1.dp, c.line, JtShapes.xl).clickable { actions.navigate(TicketRoute(t.id)) }.heightIn(min = 52.dp).padding(horizontal = 14.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(Modifier.weight(1f)) {
                        Text(t.seatLabel.orEmpty(), style = text(13f, W.Bold), color = c.ink)
                        CodeText(t.ticketCode, size = 11f, color = c.muted, weight = W.Normal)
                    }
                    JtIcon(Lucide.ChevronLeft, size = 16.dp, tint = c.ink)
                }
            }
        } else if (o.seats.isNotEmpty()) {
            JtCard(Modifier.fillMaxWidth()) {
                Text("صندلی‌ها", style = text(15f, W.Black), color = c.ink)
                o.seats.forEach { seat ->
                    Row(Modifier.fillMaxWidth().padding(top = 8.dp)) {
                        Text(seatText(seat), style = text(12.5f), color = c.ink2, modifier = Modifier.weight(1f))
                        Text(Fa.price(seat.price), style = text(12.5f, W.Bold), color = c.ink)
                    }
                }
            }
        }
        if (o.status == OrderStatus.PENDING && o.payable) JtButton("ادامه پرداخت", pay, variant = ButtonVariant.SUCCESS, size = ButtonSize.XL, block = true, trailing = Lucide.ArrowLeft)
        Spacer(Modifier.height(8.dp))
    }
    if (!noticeSeen) {
        when {
            o.status == OrderStatus.PENDING && o.payable -> StateDialog(StateSymbol.WAIT, "سفارش در انتظار پرداخت است", "برای نهایی‌سازی، پرداخت را تکمیل کنید.", { noticeSeen = true })
            o.status == OrderStatus.CANCELLED -> StateDialog(StateSymbol.WARNING, "این سفارش لغو شده است", "جزئیات سفارش و وضعیت پرداخت را بررسی کنید.", { noticeSeen = true })
        }
    }
}

@Composable
private fun InfoLine(label: String, value: String, copy: Boolean = false) {
    val clipboard = LocalClipboardManager.current
    val toaster = LocalToaster.current
    val c = Jt.colors
    Row(Modifier.fillMaxWidth().heightIn(min = 36.dp), verticalAlignment = Alignment.CenterVertically) {
        Text("$label:", style = text(13f), color = c.ink2, modifier = Modifier.weight(1f))
        if (copy) {
            JtIconButton(Lucide.Copy, {
                clipboard.setText(AnnotatedString(value))
                toaster.success("$label کپی شد.")
            }, "کپی $label", size = 32.dp, iconSize = 14.dp, borderColor = null, tint = c.muted)
            CodeText(value, size = 13f)
        } else {
            Text(value, style = text(13f, W.Bold), color = c.ink)
        }
    }
}

private enum class ProfilePage { MENU, EDIT, DISCOUNTS, SETTINGS }

/** 17 پروفایل: عادی، حالت ویرایش، ذخیره موفق; plus the menu's کدهای تخفیف and تنظیمات و امنیت pages. */
@Composable
fun ProfileScreen(cities: List<City>, dark: Boolean, onToggleTheme: () -> Unit, onSignOut: () -> Unit, viewModel: ProfileViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    var page by rememberSaveable { mutableStateOf(ProfilePage.MENU) }
    BackHandler(enabled = page != ProfilePage.MENU) { page = ProfilePage.MENU }
    val p = s.profile
    Column(Modifier.fillMaxSize()) {
        JtTopBar("پروفایل", onBack = if (page == ProfilePage.MENU) null else ({ page = ProfilePage.MENU }))
        when {
            p == null && s.error != null -> ErrorState(s.error, Modifier.padding(19.dp), onRetry = viewModel::load)
            p == null -> Skeleton(Modifier.padding(19.dp).fillMaxWidth().height(420.dp), JtShapes.card)
            page == ProfilePage.EDIT -> ProfileEdit(p, s, cities, viewModel)
            page == ProfilePage.DISCOUNTS -> DiscountsPage()
            page == ProfilePage.SETTINGS -> SettingsPage(dark, onToggleTheme, onSignOut)
            else -> ProfileMenu(p) { page = it }
        }
    }
    if (s.saved) {
        StateDialog(StateSymbol.SUCCESS, "تغییرات ذخیره شد", "اطلاعات حساب شما با موفقیت به‌روز شد.", {
            viewModel.dismissSaved()
            page = ProfilePage.MENU
        })
    }
}

@Composable
private fun ProfileMenu(p: UserProfile, open: (ProfilePage) -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val name = listOfNotNull(p.firstName, p.lastName).joinToString(" ").ifBlank { "کاربر" }
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 19.dp, vertical = 6.dp)) {
        Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(StateSymbol.USER, style = text(64f, lineHeight = 1.25f))
            Text(name, style = text(19f, W.Black), color = c.ink, modifier = Modifier.padding(top = 4.dp))
            Text(ltr(formatMobile(p.mobile)), style = text(12f, lineHeight = 2f), color = c.muted)
        }
        Column(Modifier.padding(top = 12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            MenuRow("اطلاعات کاربری") { open(ProfilePage.EDIT) }
            MenuRow("سفارش‌های من", p.ordersCount) { actions.navigate(OrdersRoute) }
            MenuRow("بلیت‌های من", p.upcomingTicketsCount) { actions.navigate(TicketsRoute) }
            MenuRow("علاقه‌مندی‌ها", p.favoritesCount) { actions.navigate(FavoritesRoute) }
            MenuRow("کدهای تخفیف") { open(ProfilePage.DISCOUNTS) }
            MenuRow("تنظیمات و امنیت") { open(ProfilePage.SETTINGS) }
        }
        Spacer(Modifier.height(16.dp))
    }
}

@Composable
private fun MenuRow(label: String, count: Int? = null, danger: Boolean = false, onClick: () -> Unit) {
    val c = Jt.colors
    Row(
        Modifier.fillMaxWidth().clip(JtShapes.card).background(JtBrushes.glass).border(1.dp, c.line, JtShapes.card).clickable(role = Role.Button, onClick = onClick).heightIn(min = 56.dp).padding(horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(label, style = text(13f, W.Medium), color = if (danger) c.dangerFg else c.ink, modifier = Modifier.weight(1f))
        count?.takeIf { it > 0 }?.let { Text(Fa.number(it), style = text(12f, W.Bold), color = c.muted, modifier = Modifier.padding(end = 8.dp)) }
        JtIcon(Lucide.ChevronLeft, size = 16.dp, tint = c.ink)
    }
}

@Composable
private fun ProfileEdit(p: UserProfile, s: ProfileUiState, cities: List<City>, viewModel: ProfileViewModel) {
    val c = Jt.colors
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().padding(horizontal = 19.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
        Text("ویرایش پروفایل", style = text(15f, W.Black), color = c.ink)
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
        s.saveError?.let { InlineError(it) }
        JtButton("ذخیره تغییرات", viewModel::save, size = ButtonSize.XL, block = true, loading = s.saving, enabled = s.dirty)
        Spacer(Modifier.height(16.dp))
    }
}

/**
 * The backend keeps no per-user list of discount codes (they are campaign codes checked at purchase), so this page
 * explains where a code is used instead of showing a made-up list.
 */
@Composable
private fun DiscountsPage() {
    val actions = LocalAppActions.current
    EmptyState(
        "کد تخفیف را هنگام خرید وارد کنید",
        Modifier.padding(horizontal = 19.dp),
        description = "اگر کد تخفیف دارید، آن را در مرحله «اطلاعات خریدار» وارد کنید تا مبلغ سفارش دوباره محاسبه شود.",
        symbol = "🏷️",
        action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }, block = true, size = ButtonSize.XL) },
    )
}

@Composable
private fun SettingsPage(dark: Boolean, onToggleTheme: () -> Unit, onSignOut: () -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(horizontal = 19.dp, vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("تنظیمات و امنیت", style = text(15f, W.Black), color = c.ink)
        Row(
            Modifier.fillMaxWidth().clip(JtShapes.card).background(JtBrushes.glass).border(1.dp, c.line, JtShapes.card).clickable(role = Role.Switch, onClick = onToggleTheme).heightIn(min = 56.dp).padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("حالت نمایش", style = text(13f, W.Medium), color = c.ink, modifier = Modifier.weight(1f))
            Text(if (dark) "تیره" else "روشن", style = text(12f, W.Bold), color = c.muted)
        }
        MenuRow("قوانین و مقررات") { actions.navigate(ContentRoute("terms")) }
        MenuRow("حریم خصوصی") { actions.navigate(ContentRoute("privacy")) }
        MenuRow("خروج از حساب", danger = true, onClick = onSignOut)
        Text("ورود شما فقط با کد پیامکی انجام می‌شود و رمز عبوری ذخیره نمی‌شود.", style = text(12f, lineHeight = 2f), color = c.muted)
    }
}

/** 18 علاقه‌مندی‌ها: عادی، بدون علاقه‌مندی. */
@Composable
fun FavoritesScreen(viewModel: FavoritesViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    Column(Modifier.fillMaxSize()) {
        JtTopBar("علاقه‌مندی‌ها", onBack = actions.back)
        PullToRefreshBox(isRefreshing = s.refreshing, onRefresh = { viewModel.load(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                val events = s.events
                when {
                    events == null && s.error != null -> item(key = "error") { ErrorState(s.error, onRetry = { viewModel.load() }) }
                    events == null -> items(3, key = { "sk$it" }) { EventCardSkeleton(Modifier.fillMaxWidth()) }
                    events.isEmpty() -> item(key = "empty") {
                        EmptyState(
                            "هنوز رویدادی ذخیره نکرده‌اید",
                            description = "رویدادهای موردعلاقه را با قلب نشان‌دار کنید.",
                            symbol = StateSymbol.HEART,
                            action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }, block = true, size = ButtonSize.XL) },
                        )
                    }
                    else -> {
                        item(key = "title") { Text("رویدادهای ذخیره‌شده", style = text(15f, W.Black), color = c.ink) }
                        items(events, key = { it.id }) { e -> EventCard(e, Modifier.fillMaxWidth()) }
                    }
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
                symbol = StateSymbol.WARNING,
                action = { JtButton("مشاهده رویدادها", { actions.replace(EventsRoute()) }, block = true, size = ButtonSize.XL) },
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
