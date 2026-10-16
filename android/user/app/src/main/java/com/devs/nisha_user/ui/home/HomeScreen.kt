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
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.common.Async
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.CategoryIcon
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.SectionCard
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.cardShadow
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.mix
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.usecase.GetHomeFeedUseCase
import com.devs.nisha_user.domain.usecase.HeroSlide
import com.devs.nisha_user.domain.usecase.HomeRow
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardSkeleton
import com.devs.nisha_user.ui.common.EventCardVariant
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.EventsRoute
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

/** Homepage: hero slider, categories, the admin's event rows (narrowed to the header city), cities and the footer. */
@OptIn(ExperimentalFoundationApi::class)
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
    val feed = state.feed.valueOrNull
    PullToRefreshBox(isRefreshing = state.refreshing, onRefresh = { viewModel.load(refresh = true) }, modifier = Modifier.fillMaxSize()) {
        LazyColumn(Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 24.dp)) {
            // The header stays at the top like the site's sticky header (it also covers the status bar).
            stickyHeader(key = "header") { header() }
            item(key = "hero") {
                Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp)) {
                    when {
                        feed != null -> HeroSlider(feed.slides)
                        state.feed is Async.Loading -> Skeleton(Modifier.fillMaxWidth().height(300.dp), JtShapes.hero)
                    }
                }
            }
            if (categories.isNotEmpty()) item(key = "categories") { Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp)) { CategoryStrip(categories) } }
            val s = state.feed
            when {
                feed != null -> feed.rows.forEachIndexed { i, row ->
                    item(key = "row-${row.section.id}") {
                        Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp)) { EventRow(row, cityName, onRetry = { viewModel.load() }) }
                    }
                }
                s is Async.Failure -> item(key = "error") { ErrorState(s.error, Modifier.padding(16.dp), onRetry = { viewModel.load() }) }
                else -> item(key = "rows-loading") { Skeleton(Modifier.padding(16.dp).fillMaxWidth().height(260.dp), JtShapes.card) }
            }
            if (cities.any { it.eventsCount > 0 }) item(key = "cities") { Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp)) { CitiesSection(cities) } }
            item(key = "footer") {
                Spacer(Modifier.height(24.dp))
                footer()
            }
        }
    }
}

private const val INTERVAL = 6500L

/** features/home/HeroSlider.tsx: auto-advancing slides with dots; swipe changes the slide. */
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
    val c = Jt.colors
    Box(Modifier.fillMaxWidth().cardShadow(JtShapes.hero, c.shadow, 14.dp).clip(JtShapes.hero).background(c.navy950)) {
        HorizontalPager(pager, Modifier.fillMaxWidth().semantics { contentDescription = "رویدادهای برگزیده" }) { i ->
            val slide = slides[i]
            Box(Modifier.fillMaxWidth().heightIn(min = 300.dp)) {
                RemoteImage(slide.image, Modifier.matchParentSize(), placeholder = c.navy950)
                Box(
                    Modifier.matchParentSize().background(
                        Brush.verticalGradient(0f to Color(0x40071834), 0.5f to Color(0xD9071834), 1f to Color(0xFF071834)),
                    ),
                )
                Column(Modifier.align(Alignment.BottomStart).fillMaxWidth().padding(start = 20.dp, end = 20.dp, top = 20.dp, bottom = 36.dp)) {
                    slide.kicker?.let { Text(it, style = text(13f, W.Medium), color = Color.White.copy(alpha = 0.8f)) }
                    Text(slide.title, style = text(24f, W.Black, lineHeight = 1.45f), color = Color.White, modifier = Modifier.padding(top = 4.dp).semantics { heading() })
                    slide.subtitle?.let { Text(it, style = text(14f, lineHeight = 2f), color = Color.White.copy(alpha = 0.85f), modifier = Modifier.padding(top = 8.dp)) }
                    if (slide.link != null && slide.button != null) {
                        JtButton(slide.button, { actions.openLink(slide.link) }, Modifier.padding(top = 20.dp), size = ButtonSize.LG, trailing = Lucide.ArrowLeft)
                    }
                }
            }
        }
        if (slides.size > 1) {
            Row(Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                slides.indices.forEach { i ->
                    val on = i == pager.currentPage
                    Box(
                        Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .clickable(role = Role.Tab, onClickLabel = "اسلاید ${Fa.number(i + 1)}") { scope.launch { pager.animateScrollToPage(i) } },
                        contentAlignment = Alignment.Center,
                    ) {
                        Box(
                            Modifier.size(10.dp).clip(CircleShape)
                                .then(if (on) Modifier.background(Color.White) else Modifier.border(1.dp, Color.White.copy(alpha = 0.7f), CircleShape)),
                        )
                    }
                }
            }
        }
    }
}

/** "دسته‌بندی رویدادها": pastel tiles in each category's admin-defined color. */
@Composable
fun CategoryStrip(categories: List<Category>) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    SectionCard("دسته‌بندی رویدادها", onMore = { actions.navigate(EventsRoute()) }) {
        LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            items(categories, key = { it.id }) { cat ->
                val color = parseHexColor(cat.color, c.brand500)
                Column(
                    Modifier
                        .width(112.dp)
                        .height(96.dp)
                        .clip(JtShapes.xl2)
                        .background(color.mix(c.surface, 0.10f))
                        .clickable(onClickLabel = cat.name) { actions.navigate(EventsRoute(category = cat.slug)) }
                        .padding(horizontal = 6.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
                ) {
                    CategoryIcon(cat.slug, cat.iconUrl, size = 32.dp, tint = color)
                    Text(cat.name, style = text(12.5f, W.Bold, lineHeight = 1.6f), color = c.ink, textAlign = TextAlign.Center, maxLines = 2, overflow = TextOverflow.Ellipsis)
                }
            }
        }
    }
}

/** One admin-defined row ("بخش‌های صفحه اصلی"), narrowed to the header city. */
@Composable
fun EventRow(row: HomeRow, cityName: String?, onRetry: () -> Unit) {
    val actions = LocalAppActions.current
    val compact = row.section.section == "this-week"
    val variant = if (compact) EventCardVariant.COMPACT else EventCardVariant.FEATURED
    SectionCard(row.section.title, subtitle = row.section.subtitle, onMore = { actions.navigate(eventsRouteOf(row)) }) {
        val events = row.events.getOrNull()
        when {
            row.events.isFailure -> ErrorState(null, onRetry = onRetry)
            events.isNullOrEmpty() -> EmptyState(if (cityName != null) "در حال حاضر رویدادی برای $cityName وجود ندارد." else "در حال حاضر رویدادی برای نمایش وجود ندارد.")
            else -> LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                items(events, key = { it.id }) { e ->
                    EventCard(e, Modifier.width(if (compact) 300.dp else 330.dp), variant)
                }
            }
        }
    }
}

private fun eventsRouteOf(row: HomeRow): EventsRoute {
    val f = GetHomeFeedUseCase.filtersOf(row.section)
    return EventsRoute(category = f.category.ifBlank { null }, type = f.type.api, whenFilter = f.whenFilter.api, sort = if (row.section.section == "latest") "newest" else null)
}

@Composable
fun HomeRowSkeleton() {
    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        items(3) { EventCardSkeleton(Modifier.width(330.dp), EventCardVariant.FEATURED) }
    }
}

/** "رویدادها در شهرهای مختلف": cities with upcoming events, opening the events of each city. */
@Composable
fun CitiesSection(cities: List<City>) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val shown = cities.filter { it.eventsCount > 0 }.sortedByDescending { it.eventsCount }
    val first = shown.take(6)
    val others = shown.drop(6)
    SectionCard("رویدادها در شهرهای مختلف", moreLabel = "مشاهده شهرها", onMore = { actions.navigate(EventsRoute()) }) {
        // null = the "سایر شهرها" tile after the cities.
        val tiles: List<City?> = first + listOf(null)
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            tiles.chunked(2).forEach { pair ->
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    pair.forEach { city -> CityTile(city, others.size, Modifier.weight(1f)) }
                    if (pair.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }
    }
}

@Composable
private fun CityTile(city: City?, othersCount: Int, modifier: Modifier) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    if (city != null) {
        Row(
            modifier.clip(JtShapes.xl2).background(c.surface).border(1.dp, c.line, JtShapes.xl2)
                .clickable(onClickLabel = city.name) { actions.navigate(EventsRoute(city = city.id)) }.padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            RemoteImage(city.imageUrl, Modifier.width(64.dp).height(52.dp).clip(JtShapes.xl), contentDescription = null)
            Column {
                Text(city.name, style = text(14.5f, W.Black), color = c.ink, maxLines = 1)
                Text("${Fa.number(city.eventsCount)} رویداد", style = text(12f), color = c.muted, modifier = Modifier.padding(top = 2.dp))
            }
        }
    } else {
        Row(
            modifier.clip(JtShapes.xl2).background(c.surface2).border(1.dp, c.line, JtShapes.xl2)
                .clickable { actions.navigate(EventsRoute()) }.heightIn(min = 68.dp).padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(Modifier.size(44.dp).clip(CircleShape).background(c.surface), contentAlignment = Alignment.Center) {
                JtIcon(Lucide.MapPin, size = 20.dp, tint = c.ink2)
            }
            Column {
                Text("سایر شهرها", style = text(14.5f, W.Black), color = c.ink)
                Text(if (othersCount > 0) "+ ${Fa.number(othersCount)} شهر" else "همه رویدادها", style = text(12f), color = c.muted)
            }
        }
    }
}
