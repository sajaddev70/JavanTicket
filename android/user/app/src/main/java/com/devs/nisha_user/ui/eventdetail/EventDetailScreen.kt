package com.devs.nisha_user.ui.eventdetail

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.CategoryIcon
import com.devs.nisha_user.core.designsystem.component.Dot
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.InfoRow
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.SvgIcon
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.mix
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.paragraphs
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.model.EventSession
import com.devs.nisha_user.domain.usecase.AvailabilityTone
import com.devs.nisha_user.domain.usecase.availability
import com.devs.nisha_user.domain.usecase.lowestPrice
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.CheckoutRoute
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.SeatsRoute
import kotlinx.coroutines.launch

@Composable
fun EventDetailScreen(viewModel: EventDetailViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val event = state.event.valueOrNull
    Column(Modifier.fillMaxSize()) {
        JtTopBar(event?.title ?: "رویداد", onBack = actions.back) {
            if (event != null) {
                JtIconButton(Lucide.Share2, {
                    actions.share(event.title, "${event.title}\n${actions.siteUrl}${EventDetailRoute(event.slug).path()}")
                }, "اشتراک‌گذاری", borderColor = null, tint = Jt.colors.brand600)
            }
        }
        when {
            event != null -> EventDetailContent(event, state.selectedSessionId, viewModel::select)
            state.event is Async.Failure -> {
                val error = (state.event as Async.Failure).error
                if (error.isNotFound) {
                    EmptyState(
                        "این رویداد پیدا نشد",
                        Modifier.padding(16.dp),
                        description = "شاید آدرس اشتباه است یا رویداد دیگر در دسترس نیست.",
                        icon = Lucide.Ticket,
                        action = { JtButton("مشاهده رویدادها", { actions.replace(EventsRoute()) }) },
                    )
                } else {
                    ErrorState(error, Modifier.padding(16.dp), onRetry = viewModel::load)
                }
            }
            else -> EventDetailSkeleton()
        }
    }
}

private data class SectionTab(val key: String, val label: String)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun EventDetailContent(event: EventDetail, selectedId: Long?, onSelect: (Long) -> Unit) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val selected = event.sessions.firstOrNull { it.id == selectedId }
    val bookable = event.sessions.filter { it.availability(Fa::number).bookable }
    val minPrice = event.lowestPrice()
    val about = paragraphs(event.description)
    val favorite = actions.isFavorite(event.id)
    var quantityFor by remember { mutableStateOf<EventSession?>(null) }
    var galleryIndex by rememberSaveable { mutableStateOf<Int?>(null) }
    val list = rememberLazyListState()
    val scope = rememberCoroutineScope()

    fun buy() {
        val s = selected ?: return
        if (s.hasSeatMap) actions.navigate(SeatsRoute(s.id)) else quantityFor = s
    }

    val hasAbout = about.isNotEmpty() || event.topics.isNotEmpty() || event.stats.isNotEmpty()
    val tabs = listOfNotNull(
        SectionTab("about", "درباره رویداد").takeIf { hasAbout },
        SectionTab("speakers", "سخنرانان").takeIf { event.speakers.isNotEmpty() },
        SectionTab("gallery", "گالری").takeIf { event.gallery.isNotEmpty() },
        SectionTab("faq", "سوالات متداول").takeIf { event.faqs.isNotEmpty() },
    )

    // Keys of the list in display order, so a section tab can scroll to its item.
    val itemKeys = listOfNotNull(
        "poster", "head", "sessions", "price",
        "organizer".takeIf { event.organizerName != null },
        "tabs".takeIf { tabs.size > 1 },
        "about".takeIf { hasAbout },
        "speakers".takeIf { event.speakers.isNotEmpty() },
        "gallery".takeIf { event.gallery.isNotEmpty() },
        "faq".takeIf { event.faqs.isNotEmpty() },
    )

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(start = 16.dp, end = 16.dp, top = 16.dp, bottom = 110.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            item(key = "poster") {
                RemoteImage(event.bannerUrl, Modifier.fillMaxWidth().aspectRatio(16f / 9f).clip(JtShapes.header), fallback = event.categoryCoverUrl, contentDescription = event.title, placeholder = c.navy950)
            }
            item(key = "head") {
                Column {
                    if (event.categoryName != null) {
                        val color = parseHexColor(event.categoryColor, Color(0xFF7C3AED))
                        Row(
                            Modifier.clip(JtShapes.pill).background(color.mix(c.surface, 0.12f))
                                .clickable { actions.navigate(EventsRoute(category = event.categorySlug)) }
                                .padding(horizontal = 12.dp, vertical = 4.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                        ) {
                            CategoryIcon(event.categorySlug, event.categoryIconUrl, size = 16.dp, tint = color)
                            Text(event.categoryName, style = text(12.5f, W.Bold), color = color)
                        }
                    }
                    Text(event.title, style = text(24f, W.Black, lineHeight = 1.5f), color = c.ink, modifier = Modifier.padding(top = 10.dp))
                    event.subtitle?.let { Text(it, style = text(15f), color = c.ink2, modifier = Modifier.padding(top = 4.dp)) }
                    if (event.cancelled) {
                        Text("این رویداد لغو شده است.", style = text(13.5f, W.Bold), color = c.dangerFg, modifier = Modifier.padding(top = 12.dp).clip(JtShapes.xl).background(c.dangerBg).padding(horizontal = 12.dp, vertical = 8.dp))
                    }
                    Row(Modifier.padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                        JtButton(if (favorite) "در علاقه‌مندی‌ها" else "افزودن به علاقه‌مندی", { actions.toggleFavorite(event.id) }, variant = ButtonVariant.OUTLINE, leading = Lucide.Heart, leadingTint = c.ticket)
                        JtButton("اشتراک‌گذاری", { actions.share(event.title, "${event.title}\n${actions.siteUrl}${EventDetailRoute(event.slug).path()}") }, variant = ButtonVariant.OUTLINE, leading = Lucide.Share2, leadingTint = c.brand600)
                    }
                    about.firstOrNull()?.let { Text(it, style = text(14.5f, lineHeight = 2.1f), color = c.ink2, maxLines = 3, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 16.dp)) }
                    event.notice?.let {
                        Row(Modifier.padding(top = 16.dp).fillMaxWidth().clip(JtShapes.xl).background(c.warningBg).padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            JtIcon(Lucide.Info, size = 16.dp, tint = c.warning, modifier = Modifier.padding(top = 4.dp))
                            Text(it, style = text(13.5f, lineHeight = 2f), color = c.ink)
                        }
                    }
                }
            }
            item(key = "sessions") {
                JtCard(Modifier.fillMaxWidth()) {
                    CardTitle("انتخاب سانس و خرید بلیت", Lucide.CalendarDays, iconSize = 24.dp)
                    Spacer(Modifier.height(16.dp))
                    if (event.sessions.isEmpty()) {
                        EmptyState("سانسی برای این رویداد ثبت نشده است.", description = "زمان برگزاری به‌زودی اعلام می‌شود.")
                    } else {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(event.sessions, key = { it.id }) { s -> SessionCard(s, s.id == selectedId) { onSelect(s.id) } }
                        }
                    }
                }
            }
            item(key = "price") {
                JtCard(Modifier.fillMaxWidth()) {
                    Column(Modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.surface2).padding(16.dp)) {
                        Text("قیمت بلیت از", style = text(14f), color = c.ink2)
                        Text(
                            buildAnnotatedString {
                                append(if (minPrice > 0) Fa.number(minPrice) else "رایگان")
                                if (minPrice > 0) withStyle(SpanStyle(fontSize = 16.sp, fontWeight = W.Bold)) { append(" تومان") }
                            },
                            style = text(28f, W.Black),
                            color = c.brand600,
                            textAlign = TextAlign.Left,
                            modifier = Modifier.fillMaxWidth().padding(top = 4.dp),
                        )
                    }
                    JtButton(
                        if (selected?.hasSeatMap == false) "انتخاب تعداد و خرید بلیت" else "انتخاب صندلی و خرید بلیت",
                        ::buy,
                        Modifier.padding(top = 12.dp),
                        size = ButtonSize.XL,
                        block = true,
                        enabled = selected != null && !event.cancelled,
                        leading = if (selected?.hasSeatMap == false) Lucide.Ticket else Lucide.Armchair,
                    )
                    if (bookable.isEmpty()) {
                        Text(
                            if (event.cancelled) "فروش این رویداد متوقف شده است." else "در حال حاضر سانس فعالی برای خرید وجود ندارد.",
                            style = text(13f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                        )
                    }
                    Column(Modifier.padding(top = 8.dp)) {
                        val info = listOfNotNull(
                            event.cityName?.let { Triple(Lucide.MapPin, "شهر", it) },
                            listOfNotNull(event.venueName, event.hallName).joinToString(" - ").takeIf { it.isNotBlank() }?.let { Triple(Lucide.Building2, "مکان برگزاری", it) },
                            event.firstStart?.let { Triple(Lucide.CalendarDays, "تاریخ برگزاری", Fa.dateRange(it, event.lastEnd)) },
                            selected?.let { Triple(Lucide.Clock, "ساعت برگزاری", Fa.timeRange(it.startTime, it.endTime)) },
                            event.categoryName?.let { Triple(Lucide.Tag, "دسته‌بندی", it) },
                            event.soldCount.takeIf { it > 0 }?.let { Triple(Lucide.BarChart3, "تعداد فروش رفته", "${Fa.number(it)} بلیت") },
                        )
                        info.forEachIndexed { i, (icon, label, value) ->
                            if (i > 0) HDivider()
                            InfoRow(label, value, icon = icon, valueBold = false, valueColor = c.ink2)
                        }
                    }
                }
            }
            event.organizerName?.let { organizer ->
                item(key = "organizer") {
                    JtCard(Modifier.fillMaxWidth()) {
                        CardTitle("برگزارکنندگان", Lucide.Users, size = 16f, iconSize = 20.dp)
                        Text(organizer, style = text(14f, W.Bold), color = c.ink, modifier = Modifier.padding(top = 12.dp))
                        Text("برگزارکننده رویداد", style = text(12.5f), color = c.muted)
                        event.websiteUrl?.let { url ->
                            Text(url.removePrefix("https://").removePrefix("http://"), style = text(13f, W.Bold), color = c.brand600, modifier = Modifier.padding(top = 8.dp).clickable { actions.openLink(url) })
                        }
                    }
                }
            }
            if (tabs.size > 1) {
                item(key = "tabs") {
                    JtCard(Modifier.fillMaxWidth(), padding = PaddingValues(horizontal = 8.dp)) {
                        LazyRow {
                            items(tabs, key = { it.key }) { tab ->
                                Text(
                                    tab.label,
                                    style = text(14f, W.Bold),
                                    color = c.ink2,
                                    modifier = Modifier.clip(JtShapes.lg).clickable {
                                        scope.launch {
                                            val index = itemKeys.indexOf(tab.key)
                                            if (index >= 0) list.animateScrollToItem(index)
                                        }
                                    }.heightIn(min = 48.dp).padding(horizontal = 16.dp, vertical = 14.dp),
                                )
                            }
                        }
                    }
                }
            }
            if (hasAbout) {
                item(key = "about") {
                    JtCard(Modifier.fillMaxWidth()) {
                        if (about.isNotEmpty()) {
                            CardTitle("درباره رویداد", Lucide.Info, iconSize = 20.dp)
                            about.forEach { Text(it, style = text(14.5f, lineHeight = 2.1f), color = c.ink2, modifier = Modifier.padding(top = 12.dp)) }
                        }
                        if (event.topics.isNotEmpty()) {
                            FlowRow(
                                Modifier.padding(top = 16.dp).fillMaxWidth().clip(JtShapes.xl2).background(c.surface2).padding(12.dp),
                                maxItemsInEachRow = 2,
                                horizontalArrangement = Arrangement.spacedBy(8.dp),
                                verticalArrangement = Arrangement.spacedBy(8.dp),
                            ) {
                                event.topics.forEach { t ->
                                    Column(Modifier.weight(1f).padding(vertical = 8.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                        val color = parseHexColor(t.color, c.brand600)
                                        if (t.iconUrl != null) SvgIcon(t.iconUrl, size = 32.dp, tint = color) else JtIcon(Lucide.Sparkles, size = 32.dp, tint = color)
                                        Text(t.title, style = text(13f, W.Bold), color = c.ink, textAlign = TextAlign.Center)
                                    }
                                }
                            }
                        }
                        if (event.stats.isNotEmpty()) {
                            FlowRow(Modifier.padding(top = 16.dp).fillMaxWidth(), maxItemsInEachRow = 2, horizontalArrangement = Arrangement.spacedBy(12.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                                event.stats.forEach { s ->
                                    Column(Modifier.weight(1f).clip(JtShapes.xl2).border(1.dp, c.line, JtShapes.xl2).padding(12.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                        Text(s.value, style = text(20f, W.Black), color = parseHexColor(s.color, c.brand600))
                                        Text(s.label, style = text(12.5f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (event.speakers.isNotEmpty()) {
                item(key = "speakers") {
                    JtCard(Modifier.fillMaxWidth()) {
                        CardTitle("سخنرانان", Lucide.Mic, iconSize = 20.dp)
                        Spacer(Modifier.height(16.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                            items(event.speakers, key = { it.fullName }) { s ->
                                Column(Modifier.width(120.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(Modifier.size(96.dp).border(4.dp, c.brand50, CircleShape).padding(4.dp).clip(CircleShape).background(c.field), contentAlignment = Alignment.Center) {
                                        JtIcon(Lucide.UserRound, size = 40.dp, tint = c.muted)
                                        RemoteImage(s.photoUrl, Modifier.matchParentSize(), contentDescription = s.fullName, placeholder = Color.Transparent)
                                    }
                                    Text(s.fullName, style = text(14f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 10.dp))
                                    listOfNotNull(s.jobTitle, s.organization).joinToString("، ").takeIf { it.isNotEmpty() }?.let {
                                        Text(it, style = text(12f, lineHeight = 1.7f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 2.dp))
                                    }
                                    if (s.keynote) {
                                        Text("سخنران اصلی", style = text(11.5f, W.Bold), color = c.brand600, modifier = Modifier.padding(top = 6.dp).clip(JtShapes.pill).background(c.brand50).padding(horizontal = 10.dp, vertical = 2.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (event.gallery.isNotEmpty()) {
                item(key = "gallery") {
                    JtCard(Modifier.fillMaxWidth()) {
                        CardTitle("گالری رویداد", Lucide.Images, iconSize = 20.dp)
                        Spacer(Modifier.height(16.dp))
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            itemsIndexed(event.gallery, key = { _, g -> g.imageUrl }) { i, g ->
                                RemoteImage(
                                    g.imageUrl,
                                    Modifier.width(240.dp).aspectRatio(4f / 3f).clip(JtShapes.xl).clickable(onClickLabel = g.caption ?: "تصویر ${event.title}") { galleryIndex = i },
                                    contentDescription = g.caption ?: "تصویر ${event.title}",
                                )
                            }
                        }
                    }
                }
            }
            if (event.faqs.isNotEmpty()) {
                item(key = "faq") {
                    JtCard(Modifier.fillMaxWidth()) {
                        CardTitle("سوالات متداول", Lucide.CircleHelp, iconSize = 20.dp)
                        Column(Modifier.padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            event.faqs.forEach { FaqItem(it.question, it.answer) }
                        }
                    }
                }
            }
        }

        // Price and buy button stay on screen (the web's fixed bottom bar on phones).
        Column(Modifier.align(Alignment.BottomCenter).fillMaxWidth().background(c.surface.copy(alpha = 0.97f))) {
            HDivider()
            Row(Modifier.fillMaxWidth().navigationBarsPadding().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Column {
                    Text("قیمت از", style = text(12f), color = c.muted)
                    Text(if (minPrice > 0) Fa.price(minPrice) else "رایگان", style = text(16f, W.Black), color = c.brand600)
                }
                JtButton(
                    if (selected?.hasSeatMap == false) "خرید بلیت" else "انتخاب صندلی",
                    ::buy,
                    Modifier.weight(1f),
                    size = ButtonSize.LG,
                    enabled = selected != null && !event.cancelled,
                )
            }
        }
    }

    quantityFor?.let { s ->
        QuantitySheet(s, onDismiss = { quantityFor = null }) { quantity ->
            quantityFor = null
            actions.navigate(CheckoutRoute(sessionId = s.id, quantity = quantity))
        }
    }
    galleryIndex?.let { start -> GalleryViewer(event, start) { galleryIndex = null } }
}

@Composable
private fun SessionCard(s: EventSession, selected: Boolean, onSelect: () -> Unit) {
    val c = Jt.colors
    val a = s.availability(Fa::number)
    Column(
        Modifier
            .width(250.dp)
            .then(if (selected) Modifier.border(4.dp, c.brand500.copy(alpha = 0.2f), JtShapes.xl2) else Modifier)
            .clip(JtShapes.xl2)
            .background(c.surface)
            .border(1.dp, if (selected) c.brand600 else c.line, JtShapes.xl2)
            .padding(14.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            JtIcon(Lucide.CalendarDays, size = 20.dp, tint = c.brand600)
            Text(Fa.fullDate(s.startTime), style = text(14.5f, W.Black), color = c.ink)
        }
        s.title?.let { Text(it, style = text(12.5f), color = c.ink2, maxLines = 1, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 4.dp)) }
        Text(Fa.timeRange(s.startTime, s.endTime), style = text(13f), color = c.muted, modifier = Modifier.padding(top = 6.dp))
        Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            val tone = when (a.tone) {
                AvailabilityTone.OK -> c.success to c.successFg
                AvailabilityTone.LOW -> c.warning to c.warning
                AvailabilityTone.NONE -> c.muted to c.muted
            }
            Dot(tone.first)
            Text(a.label, style = text(12.5f, W.Semibold), color = tone.second)
        }
        Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(
                buildAnnotatedString {
                    append("از ")
                    withStyle(SpanStyle(fontWeight = W.Black, color = c.ink, fontSize = 14.sp)) { append(Fa.number(s.fromPrice)) }
                    append(" تومان")
                },
                style = text(12.5f),
                color = c.ink2,
                modifier = Modifier.weight(1f),
            )
            JtButton(
                if (selected) "انتخاب شد" else "انتخاب سانس",
                onSelect,
                variant = if (selected) ButtonVariant.PRIMARY else ButtonVariant.SOFT,
                size = ButtonSize.SM,
                enabled = a.bookable,
                shape = JtShapes.lg,
            )
        }
    }
}

@Composable
private fun FaqItem(question: String, answer: String) {
    val c = Jt.colors
    var open by rememberSaveable(question) { mutableStateOf(false) }
    Column(
        Modifier.fillMaxWidth().clip(JtShapes.xl).background(if (open) c.surface2 else c.surface).border(1.dp, c.line, JtShapes.xl).animateContentSize()
            .semantics { stateDescription = if (open) "باز" else "بسته" },
    ) {
        Row(Modifier.fillMaxWidth().clickable(role = Role.Button) { open = !open }.heightIn(min = 48.dp).padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
            Text(question, style = text(14f, W.Bold), color = c.ink, modifier = Modifier.weight(1f))
            JtIcon(Lucide.ChevronDown, size = 20.dp, tint = c.muted, modifier = Modifier.rotate(if (open) 180f else 0f))
        }
        if (open) Text(answer, style = text(13.5f, lineHeight = 2f), color = c.ink2, modifier = Modifier.padding(start = 16.dp, end = 16.dp, bottom = 16.dp))
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

/** Full-screen gallery with swipe between the images. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun GalleryViewer(event: EventDetail, start: Int, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false, decorFitsSystemWindows = false)) {
        val pager = rememberPagerState(initialPage = start) { event.gallery.size }
        Box(Modifier.fillMaxSize().background(Color.Black)) {
            HorizontalPager(pager, Modifier.fillMaxSize()) { i ->
                val g = event.gallery[i]
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    RemoteImage(g.imageUrl, Modifier.fillMaxWidth().aspectRatio(4f / 3f), contentScale = ContentScale.Fit, placeholder = Color.Black, contentDescription = g.caption)
                    g.caption?.let { Text(it, style = text(14f, W.Semibold), color = Color.White, modifier = Modifier.align(Alignment.BottomCenter).navigationBarsPadding().padding(24.dp)) }
                }
            }
            JtIconButton(Lucide.X, onDismiss, "بستن", Modifier.align(Alignment.TopEnd).statusBarsPadding().padding(12.dp), tint = Color.White, borderColor = Color.White.copy(alpha = 0.3f))
            Text("${Fa.number(pager.currentPage + 1)} از ${Fa.number(event.gallery.size)}", style = text(13f, W.Bold), color = Color.White, modifier = Modifier.align(Alignment.TopStart).statusBarsPadding().padding(24.dp))
        }
    }
}

@Composable
private fun EventDetailSkeleton() {
    Column(Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Skeleton(Modifier.fillMaxWidth().aspectRatio(16f / 9f), JtShapes.header)
        Skeleton(Modifier.fillMaxWidth(0.5f).height(16.dp))
        Skeleton(Modifier.fillMaxWidth(0.8f).height(28.dp))
        Skeleton(Modifier.width(240.dp).height(44.dp), JtShapes.xl)
        Skeleton(Modifier.fillMaxWidth().height(220.dp), JtShapes.card)
    }
}
