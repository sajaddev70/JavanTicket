package com.devs.nisha_user.ui.home

import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.CategoryIcon
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtChip
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.SectionCard
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.heroBackground
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.usecase.GetHomeFeedUseCase
import com.devs.nisha_user.domain.usecase.HeroSlide
import com.devs.nisha_user.domain.usecase.HomeRow
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.EventsRoute
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** 04 خانه: عادی، در حال بارگذاری، بدون رویداد. Hero, categories, the admin's event rows, cities and the footer. */
@Composable
fun HomeScreen(
    header: @Composable () -> Unit,
    footer: @Composable () -> Unit,
    categories: List<Category>,
    cities: List<City>,
    cityName: String?,
    viewModel: HomeViewModel = hiltViewModel(),
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val feed = state.feed.valueOrNull
    val noEvents = feed != null && feed.rows.all { it.events.getOrNull().isNullOrEmpty() && it.events.isSuccess }
    Box(Modifier.fillMaxSize()) {
        PullToRefreshBox(isRefreshing = state.refreshing, onRefresh = { viewModel.load(refresh = true) }, modifier = Modifier.fillMaxSize()) {
            LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
                item(key = "header") { header() }
                if (noEvents) {
                    item(key = "empty") {
                        EmptyState(
                            "رویدادی برای نمایش نیست",
                            Modifier.padding(horizontal = 19.dp),
                            description = if (cityName != null) "فعلاً رویدادی برای $cityName نداریم؛ به‌زودی رویدادهای تازه اضافه می‌شوند." else "به‌زودی رویدادهای تازه اضافه می‌شوند.",
                            symbol = StateSymbol.CALENDAR,
                            action = { JtButton("مشاهده رویدادها", { actions.navigate(EventsRoute()) }, block = true, size = ButtonSize.XL) },
                        )
                    }
                } else {
                    item(key = "hero") {
                        Box(Modifier.padding(start = 19.dp, end = 19.dp, top = 12.dp)) {
                            if (feed != null) HeroSlider(feed.slides) else Box(Modifier.fillMaxWidth().height(168.dp).clip(JtShapes.hero).heroBackground())
                        }
                    }
                    if (categories.isNotEmpty()) item(key = "categories") { Box(Modifier.padding(start = 19.dp, end = 19.dp, top = 19.dp)) { CategoryStrip(categories) } }
                    val s = state.feed
                    when {
                        feed != null -> feed.rows.forEach { row ->
                            item(key = "row-${row.section.id}") {
                                Box(Modifier.padding(start = 19.dp, end = 19.dp, top = 19.dp)) { EventRow(row, cityName, onRetry = { viewModel.load() }) }
                            }
                        }
                        s is Async.Failure -> item(key = "error") { ErrorState(s.error, Modifier.padding(horizontal = 19.dp), onRetry = { viewModel.load() }) }
                    }
                    if (cities.any { it.eventsCount > 0 }) item(key = "cities") { Box(Modifier.padding(start = 19.dp, end = 19.dp, top = 19.dp)) { CitiesSection(cities) } }
                }
                item(key = "footer") {
                    Spacer(Modifier.height(24.dp))
                    footer()
                }
            }
        }
        if (feed == null && state.feed is Async.Loading) LoadingOverlay("در حال دریافت اطلاعات", "رویدادها در حال بارگذاری هستند.")
    }
}

private const val INTERVAL = 6500L

/** The design's .hero: gradient panel, title, date line and a small button; admin slides auto-advance with dots. */
@OptIn(ExperimentalFoundationApi::class)
@Composable
fun HeroSlider(slides: List<HeroSlide>) {
    if (slides.isEmpty()) return
    val actions = LocalAppActions.current
    val pager = rememberPagerState { slides.size }
    val scope = rememberCoroutineScope()
    LaunchedEffect(pager.currentPage, pager.isScrollInProgress, slides.size) {
        if (slides.size < 2 || pager.isScrollInProgress) return@LaunchedEffect
        delay(INTERVAL)
        pager.animateScrollToPage((pager.currentPage + 1) % slides.size)
    }
    Box(Modifier.fillMaxWidth().clip(JtShapes.hero).heroBackground()) {
        HorizontalPager(pager, Modifier.fillMaxWidth().semantics { contentDescription = "رویدادهای برگزیده" }) { i ->
            val slide = slides[i]
            Box(Modifier.fillMaxWidth().heightIn(min = 168.dp)) {
                RemoteImage(slide.image, Modifier.matchParentSize(), alpha = 0.55f, placeholder = Color.Transparent)
                Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(Color(0x000B1854), Color(0xB30B1854)))))
                Column(Modifier.fillMaxWidth().padding(start = 18.dp, end = 18.dp, top = 18.dp, bottom = 26.dp)) {
                    Text(slide.title, style = text(20f, W.Black, lineHeight = 1.8f), color = Color.White, modifier = Modifier.semantics { heading() })
                    (slide.subtitle ?: slide.kicker)?.let { Text(it, style = text(11f, lineHeight = 1.8f), color = Color.White.copy(alpha = 0.9f), modifier = Modifier.padding(top = 4.dp)) }
                    if (slide.link != null && slide.button != null) {
                        JtButton(slide.button, { actions.openLink(slide.link) }, Modifier.padding(top = 10.dp), size = ButtonSize.SM)
                    }
                }
            }
        }
        if (slides.size > 1) {
            Row(Modifier.align(Alignment.BottomCenter).padding(bottom = 4.dp), horizontalArrangement = Arrangement.spacedBy(2.dp)) {
                slides.indices.forEach { i ->
                    val on = i == pager.currentPage
                    Box(
                        Modifier.size(24.dp).clip(CircleShape).clickable(role = Role.Tab, onClickLabel = "اسلاید ${Fa.number(i + 1)}") { scope.launch { pager.animateScrollToPage(i) } },
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(Modifier.size(8.dp).clip(CircleShape).then(if (on) Modifier.background(Color.White) else Modifier.border(1.dp, Color.White.copy(alpha = 0.7f), CircleShape)))
                    }
                }
            }
        }
    }
}

/** "دسته‌بندی رویدادها": chips with each category's admin-defined icon and color. */
@Composable
fun CategoryStrip(categories: List<Category>) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    SectionCard("دسته‌بندی رویدادها") {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(categories, key = { it.id }) { cat ->
                JtChip(cat.name, false, leading = { CategoryIcon(cat.slug, cat.iconUrl, size = 16.dp, tint = parseHexColor(cat.color, c.brand500)) }) {
                    actions.navigate(EventsRoute(category = cat.slug))
                }
            }
        }
    }
}

/** One admin-defined row ("بخش‌های صفحه اصلی"), narrowed to the header city, as a vertical list of event cards. */
@Composable
fun EventRow(row: HomeRow, cityName: String?, onRetry: () -> Unit) {
    val actions = LocalAppActions.current
    SectionCard(row.section.title, subtitle = row.section.subtitle, onMore = { actions.navigate(eventsRouteOf(row)) }) {
        val events = row.events.getOrNull()
        when {
            row.events.isFailure -> ErrorState(null, onRetry = onRetry)
            events.isNullOrEmpty() -> Text(
                if (cityName != null) "در حال حاضر رویدادی برای $cityName وجود ندارد." else "در حال حاضر رویدادی برای نمایش وجود ندارد.",
                style = text(12f, lineHeight = 2f),
                color = Jt.colors.muted,
            )
            else -> Column(verticalArrangement = Arrangement.spacedBy(11.dp)) {
                events.take(MAX_ROW_EVENTS).forEach { e -> EventCard(e, Modifier.fillMaxWidth()) }
            }
        }
    }
}

private const val MAX_ROW_EVENTS = 4

private fun eventsRouteOf(row: HomeRow): EventsRoute {
    val f = GetHomeFeedUseCase.filtersOf(row.section)
    return EventsRoute(category = f.category.ifBlank { null }, type = f.type.api, whenFilter = f.whenFilter.api, sort = if (row.section.section == "latest") "newest" else null)
}

/** "رویدادها در شهرهای مختلف": cities with upcoming events, opening the events of each city. */
@Composable
fun CitiesSection(cities: List<City>) {
    val shown = cities.filter { it.eventsCount > 0 }.sortedByDescending { it.eventsCount }.take(6)
    val actions = LocalAppActions.current
    val c = Jt.colors
    SectionCard("رویدادها در شهرهای مختلف", onMore = { actions.navigate(EventsRoute()) }) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            shown.chunked(2).forEach { pair ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    pair.forEach { city ->
                        Row(
                            Modifier.weight(1f).clip(JtShapes.xl).background(c.surface).border(1.dp, c.line, JtShapes.xl)
                                .clickable(onClickLabel = city.name) { actions.navigate(EventsRoute(city = city.id)) }.heightIn(min = 56.dp).padding(horizontal = 12.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            JtIcon(Lucide.MapPin, size = 18.dp, tint = c.brand500)
                            Column {
                                Text(city.name, style = text(13f, W.Bold), color = c.ink, maxLines = 1)
                                Text("${Fa.number(city.eventsCount)} رویداد", style = text(11f), color = c.muted)
                            }
                        }
                    }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}
