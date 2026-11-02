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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtChip
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.RoundButton
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.component.SvgIcon
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.bottomFade
import com.devs.nisha_user.core.designsystem.theme.heroBackground
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.paragraphs
import com.devs.nisha_user.domain.model.EventDetail
import com.devs.nisha_user.domain.usecase.availability
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.EventDetailRoute
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.SessionsRoute
import kotlinx.coroutines.launch

/** 06 جزئیات رویداد: عادی، رویداد لغوشده، ظرفیت تکمیل. */
@Composable
fun EventDetailScreen(viewModel: EventDetailViewModel = hiltViewModel()) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val event = state.event.valueOrNull
    Column(Modifier.fillMaxSize()) {
        JtTopBar("جزئیات رویداد", onBack = actions.back) {
            if (event != null) {
                RoundButton(Lucide.Share2, { actions.share(event.title, "${event.title}\n${actions.siteUrl}${EventDetailRoute(event.slug).path()}") }, "اشتراک‌گذاری")
                JtIconButton(
                    Lucide.Heart, { actions.toggleFavorite(event.id) }, "علاقه‌مندی", Modifier.padding(start = 8.dp), size = 40.dp, iconSize = 18.dp,
                    background = Jt.colors.field, tint = if (actions.isFavorite(event.id)) Jt.colors.ticket else Jt.colors.ink, filledIcon = actions.isFavorite(event.id),
                )
            }
        }
        when {
            event != null -> EventDetailContent(event)
            state.event is Async.Failure -> {
                val error = (state.event as Async.Failure).error
                if (error.isNotFound) {
                    EmptyState(
                        "این رویداد پیدا نشد",
                        Modifier.padding(19.dp),
                        description = "شاید آدرس اشتباه است یا رویداد دیگر در دسترس نیست.",
                        symbol = StateSymbol.TICKET,
                        action = { JtButton("مشاهده رویدادها", { actions.replace(EventsRoute()) }, block = true, size = ButtonSize.XL) },
                    )
                } else {
                    ErrorState(error, Modifier.padding(19.dp), onRetry = viewModel::load)
                }
            }
            else -> EventDetailSkeleton()
        }
    }
}

/** The design's .hero with the event's title and line (date · place) over its poster. */
@Composable
internal fun EventHero(title: String, line: String?, modifier: Modifier = Modifier, banner: String? = null, fallback: String? = null, height: Dp = 130.dp) {
    Box(modifier.fillMaxWidth().heightIn(min = height).clip(JtShapes.hero).heroBackground()) {
        RemoteImage(banner, Modifier.matchParentSize(), fallback = fallback, alpha = 0.55f, placeholder = Color.Transparent)
        Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(Color(0x000B1854), Color(0xB30B1854)))))
        Column(Modifier.fillMaxWidth().padding(18.dp)) {
            Text(title, style = text(20f, W.Black, lineHeight = 1.7f), color = Color.White)
            line?.takeIf { it.isNotBlank() }?.let { Text(it, style = text(11f, lineHeight = 1.8f), color = Color.White.copy(alpha = 0.9f), modifier = Modifier.padding(top = 4.dp)) }
        }
    }
}

private data class SectionTab(val key: String, val label: String)

@OptIn(ExperimentalLayoutApi::class)
@Composable
private fun EventDetailContent(event: EventDetail) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val bookable = event.sessions.filter { it.availability(Fa::number).bookable }
    val about = paragraphs(event.description)
    var galleryIndex by rememberSaveable { mutableStateOf<Int?>(null) }
    // The state boxes appear once per visit: cancelled first, otherwise sold out.
    var stateSeen by rememberSaveable { mutableStateOf(false) }
    val list = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val hasAbout = about.isNotEmpty() || event.topics.isNotEmpty() || event.stats.isNotEmpty()
    val tabs = listOfNotNull(
        SectionTab("about", "معرفی").takeIf { hasAbout },
        SectionTab("sessions", "سانس‌ها"),
        SectionTab("speakers", "سخنرانان").takeIf { event.speakers.isNotEmpty() },
        SectionTab("gallery", "گالری").takeIf { event.gallery.isNotEmpty() },
        SectionTab("faq", "سوالات متداول").takeIf { event.faqs.isNotEmpty() },
    )
    var activeTab by rememberSaveable { mutableStateOf(tabs.first().key) }
    // Keys of the list in display order, so a section tab can scroll to its item.
    val itemKeys = listOfNotNull(
        "hero", "chips", "about".takeIf { hasAbout }, "sessions",
        "organizer".takeIf { event.organizerName != null },
        "speakers".takeIf { event.speakers.isNotEmpty() },
        "gallery".takeIf { event.gallery.isNotEmpty() },
        "faq".takeIf { event.faqs.isNotEmpty() },
    )

    Box(Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(start = 19.dp, end = 19.dp, top = 6.dp, bottom = 96.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            item(key = "hero") {
                EventHero(
                    event.title,
                    listOfNotNull(event.firstStart?.let { Fa.dateRange(it, event.lastEnd) }, event.cityName).joinToString(" · "),
                    banner = event.bannerUrl,
                    fallback = event.categoryCoverUrl,
                    height = 168.dp,
                )
            }
            item(key = "chips") {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(tabs, key = { it.key }) { tab ->
                        JtChip(tab.label, tab.key == activeTab) {
                            activeTab = tab.key
                            scope.launch {
                                val index = itemKeys.indexOf(tab.key)
                                if (index >= 0) list.animateScrollToItem(index)
                            }
                        }
                    }
                }
            }
            if (hasAbout) {
                item(key = "about") {
                    Column {
                        Text("درباره رویداد", style = text(15f, W.Black), color = c.ink)
                        event.subtitle?.let { Text(it, style = text(12f, W.Bold, lineHeight = 2f), color = c.ink2, modifier = Modifier.padding(top = 4.dp)) }
                        about.forEach { Text(it, style = text(12f, lineHeight = 2f), color = c.muted, modifier = Modifier.padding(top = 6.dp)) }
                        event.notice?.let {
                            Row(Modifier.padding(top = 12.dp).fillMaxWidth().clip(JtShapes.xl).background(c.warningBg).padding(horizontal = 16.dp, vertical = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                JtIcon(Lucide.Info, size = 16.dp, tint = c.warning, modifier = Modifier.padding(top = 4.dp))
                                Text(it, style = text(12.5f, lineHeight = 2f), color = c.ink)
                            }
                        }
                        if (event.topics.isNotEmpty()) {
                            FlowRow(Modifier.padding(top = 12.dp).fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                event.topics.forEach { t ->
                                    val color = parseHexColor(t.color, c.brand500)
                                    Row(Modifier.clip(JtShapes.pill).background(c.field).border(1.dp, c.line, JtShapes.pill).padding(horizontal = 12.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                                        if (t.iconUrl != null) SvgIcon(t.iconUrl, size = 16.dp, tint = color) else JtIcon(Lucide.Sparkles, size = 16.dp, tint = color)
                                        Text(t.title, style = text(12f), color = c.ink)
                                    }
                                }
                            }
                        }
                        if (event.stats.isNotEmpty()) {
                            FlowRow(Modifier.padding(top = 12.dp).fillMaxWidth(), maxItemsInEachRow = 2, horizontalArrangement = Arrangement.spacedBy(10.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                event.stats.forEach { s ->
                                    JtCard(Modifier.weight(1f), padding = PaddingValues(12.dp)) {
                                        Text(s.value, style = text(20f, W.Black), color = c.brand500, modifier = Modifier.align(Alignment.CenterHorizontally))
                                        Text(s.label, style = text(11f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.align(Alignment.CenterHorizontally))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            item(key = "sessions") {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("سانس‌های موجود", style = text(15f, W.Black), color = c.ink)
                    if (event.sessions.isEmpty()) {
                        Text("سانسی برای این رویداد ثبت نشده است؛ زمان برگزاری به‌زودی اعلام می‌شود.", style = text(12f, lineHeight = 2f), color = c.muted)
                    }
                    event.sessions.forEach { s ->
                        JtCard(Modifier.fillMaxWidth()) {
                            Text(sessionDay(s), style = text(14f, W.Bold), color = c.ink)
                            Text("${Fa.time(s.startTime)} · ${capacityLabel(s)} · از ${Fa.price(s.fromPrice)}", style = text(12f, lineHeight = 2f), color = c.muted, modifier = Modifier.padding(top = 2.dp))
                        }
                    }
                }
            }
            event.organizerName?.let { organizer ->
                item(key = "organizer") {
                    JtCard(Modifier.fillMaxWidth()) {
                        Text("برگزارکننده", style = text(15f, W.Black), color = c.ink)
                        Text(organizer, style = text(13f, W.Bold), color = c.ink2, modifier = Modifier.padding(top = 6.dp))
                        event.websiteUrl?.let { url ->
                            Text(url.removePrefix("https://").removePrefix("http://"), style = text(12f, W.Bold), color = c.brand500, modifier = Modifier.padding(top = 4.dp).clickable { actions.openLink(url) })
                        }
                    }
                }
            }
            if (event.speakers.isNotEmpty()) {
                item(key = "speakers") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("سخنرانان", style = text(15f, W.Black), color = c.ink)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(event.speakers, key = { it.fullName }) { s ->
                                Column(Modifier.width(112.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                    Box(Modifier.size(84.dp).clip(CircleShape).background(c.field).border(1.dp, c.lineStrong, CircleShape), contentAlignment = Alignment.Center) {
                                        JtIcon(Lucide.UserRound, size = 36.dp, tint = c.muted)
                                        RemoteImage(s.photoUrl, Modifier.matchParentSize(), contentDescription = s.fullName, placeholder = Color.Transparent)
                                    }
                                    Text(s.fullName, style = text(12.5f, W.Bold), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                                    listOfNotNull(s.jobTitle, s.organization).joinToString("، ").takeIf { it.isNotEmpty() }?.let {
                                        Text(it, style = text(11f, lineHeight = 1.7f), color = c.muted, textAlign = TextAlign.Center)
                                    }
                                    if (s.keynote) {
                                        Text("سخنران اصلی", style = text(10f, W.Bold), color = c.successFg, modifier = Modifier.padding(top = 4.dp).clip(JtShapes.pill).background(c.successBg).padding(horizontal = 10.dp, vertical = 2.dp))
                                    }
                                }
                            }
                        }
                    }
                }
            }
            if (event.gallery.isNotEmpty()) {
                item(key = "gallery") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("گالری رویداد", style = text(15f, W.Black), color = c.ink)
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                            itemsIndexed(event.gallery, key = { _, g -> g.imageUrl }) { i, g ->
                                RemoteImage(
                                    g.imageUrl,
                                    Modifier.width(220.dp).aspectRatio(4f / 3f).clip(JtShapes.xl).clickable(onClickLabel = g.caption ?: "تصویر ${event.title}") { galleryIndex = i },
                                    contentDescription = g.caption ?: "تصویر ${event.title}",
                                )
                            }
                        }
                    }
                }
            }
            if (event.faqs.isNotEmpty()) {
                item(key = "faq") {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("سوالات متداول", style = text(15f, W.Black), color = c.ink)
                        event.faqs.forEach { FaqItem(it.question, it.answer) }
                    }
                }
            }
        }

        Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().bottomFade().padding(start = 19.dp, end = 19.dp, top = 24.dp, bottom = 12.dp)) {
            JtButton(
                "انتخاب سانس",
                { actions.navigate(SessionsRoute(event.slug)) },
                size = ButtonSize.XL,
                block = true,
                enabled = !event.cancelled && event.sessions.isNotEmpty(),
                trailing = Lucide.ArrowLeft,
            )
        }
    }

    if (!stateSeen) {
        if (event.cancelled) {
            StateDialog(StateSymbol.WARNING, "این رویداد لغو شده است", "برای اطلاعات بیشتر با پشتیبانی تماس بگیرید.", { stateSeen = true })
        } else if (event.sessions.isNotEmpty() && bookable.isEmpty()) {
            StateDialog(StateSymbol.TICKET, "ظرفیت رویداد تکمیل است", "می‌توانید سایر سانس‌ها را بررسی کنید.", { stateSeen = true })
        }
    }
    galleryIndex?.let { start -> GalleryViewer(event, start) { galleryIndex = null } }
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
        Skeleton(Modifier.fillMaxWidth().height(168.dp), JtShapes.hero)
        Skeleton(Modifier.fillMaxWidth(0.6f).height(40.dp), JtShapes.pill)
        Skeleton(Modifier.fillMaxWidth().height(90.dp), JtShapes.card)
        Skeleton(Modifier.fillMaxWidth().height(90.dp), JtShapes.card)
    }
}
