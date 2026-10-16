package com.devs.nisha_user.ui.events

import androidx.compose.foundation.ExperimentalFoundationApi
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
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
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
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.CategoryIcon
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtButtonBase
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtPicker
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.PickerOption
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.parseHexColor
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.toEnDigits
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.EventSort
import com.devs.nisha_user.domain.model.EventType
import com.devs.nisha_user.domain.model.EventWhen
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardSkeleton
import com.devs.nisha_user.ui.common.EventCardVariant

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun EventsScreen(
    header: @Composable (onSearch: (String) -> Unit, query: String) -> Unit,
    hero: PageBlock?,
    categories: List<Category>,
    cities: List<City>,
    viewModel: EventsViewModel = hiltViewModel(),
) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val f = s.filters
    var filtersOpen by rememberSaveable { mutableStateOf(false) }
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { list.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it >= list.layoutInfo.totalItemsCount - 4 } ?: false } }
    LaunchedEffect(nearEnd, s.items.size) { if (nearEnd) viewModel.loadMore() }
    val c = Jt.colors

    LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(bottom = 24.dp)) {
        stickyHeader(key = "header") { header({ q -> viewModel.update { it.copy(q = q) } }, f.q) }
        item(key = "hero") { EventsHero(hero) }
        item(key = "tabs") {
            CategoryTabs(categories, f.category) { slug -> viewModel.update { it.copy(category = slug) } }
        }
        item(key = "controls") {
            JtCard(Modifier.padding(horizontal = 16.dp).fillMaxWidth(), padding = PaddingValues(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
                    JtPicker(
                        value = f.sort,
                        options = EventSort.entries.map { PickerOption(it, it.label) },
                        onSelect = { v -> viewModel.update { it.copy(sort = v) } },
                        icon = Lucide.ArrowUpDown,
                        sheetTitle = "مرتب‌سازی",
                        modifier = Modifier.weight(1f),
                    )
                    JtButtonBase({ filtersOpen = true }, Modifier.weight(1f), ButtonVariant.OUTLINE, ButtonSize.LG) {
                        JtIcon(Lucide.SlidersHorizontal, size = 20.dp, tint = c.ink)
                        Text("فیلترها", style = text(15f, W.Bold), color = c.ink)
                        if (f.activeCount > 0) {
                            Text(Fa.number(f.activeCount), style = text(12f, W.Bold), color = Color.White, modifier = Modifier.clip(JtShapes.pill).background(c.brand600).padding(horizontal = 8.dp))
                        }
                    }
                }
            }
        }
        item(key = "count") {
            Row(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                Text(
                    if (s.loading) buildAnnotatedString { append("در حال جستجو ...") } else buildAnnotatedString {
                        withStyle(SpanStyle(color = c.brand600, fontSize = 19.sp)) { append(Fa.number(s.total)) }
                        append(" رویداد یافت شد")
                    },
                    style = text(16f, W.Black),
                    color = c.ink,
                    modifier = Modifier.weight(1f),
                )
                if (!f.isDefault || s.cityOverridden) {
                    JtButton("حذف فیلترها", viewModel::clear, variant = ButtonVariant.DANGER_GHOST, size = ButtonSize.SM, leading = Lucide.X)
                }
                Row(Modifier.clip(JtShapes.xl).border(1.dp, c.line, JtShapes.xl).background(c.surface).padding(4.dp)) {
                    listOf(true to Lucide.LayoutGrid, false to Lucide.List).forEach { (grid, icon) ->
                        val on = s.grid == grid
                        Box(
                            Modifier.size(36.dp).clip(JtShapes.lg).background(if (on) c.brand50 else Color.Transparent)
                                .clickable(role = Role.Button, onClickLabel = if (grid) "نمایش شبکه‌ای" else "نمایش فهرستی") { if (!on) viewModel.toggleView() },
                            contentAlignment = Alignment.Center,
                        ) { JtIcon(icon, size = 20.dp, tint = if (on) c.brand600 else c.muted) }
                    }
                }
            }
        }
        when {
            s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, Modifier.padding(horizontal = 16.dp), onRetry = viewModel::reload) }
            s.loading -> items(4, key = { "sk$it" }) {
                EventCardSkeleton(Modifier.padding(horizontal = 16.dp, vertical = 6.dp).fillMaxWidth(), if (s.grid) EventCardVariant.GRID else EventCardVariant.ROW)
            }
            s.items.isEmpty() -> item(key = "empty") {
                EmptyState(
                    "رویدادی با این شرایط پیدا نشد.",
                    Modifier.padding(horizontal = 16.dp),
                    description = "فیلترها را تغییر دهید یا شهر دیگری را انتخاب کنید.",
                    action = { JtButton("مشاهده همه رویدادها", viewModel::clear, variant = ButtonVariant.SOFT) },
                )
            }
            else -> {
                items(s.items, key = { it.id }) { e ->
                    EventCard(e, Modifier.padding(horizontal = 16.dp, vertical = 6.dp).fillMaxWidth(), if (s.grid) EventCardVariant.GRID else EventCardVariant.ROW)
                }
                if (s.loadingMore) item(key = "more") {
                    Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(28.dp), color = c.brand600, strokeWidth = 3.dp) }
                }
                if (s.error != null) item(key = "more-error") { ErrorState(s.error, Modifier.padding(16.dp), onRetry = viewModel::loadMore) }
            }
        }
    }

    if (filtersOpen) {
        JtBottomSheet(
            onDismiss = { filtersOpen = false },
            title = "فیلتر رویدادها",
            footer = { JtButton("مشاهده ${Fa.number(s.total)} رویداد", { filtersOpen = false }, block = true, size = ButtonSize.LG, loading = s.loading) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                JtPicker(f.type, EventType.entries.map { PickerOption(it, it.label) }, { v -> viewModel.update { it.copy(type = v) } }, label = "نوع رویداد", icon = Lucide.Sparkles)
                JtPicker(
                    f.cityId,
                    listOf(PickerOption<Long?>(null, "همه شهرها")) + cities.map { PickerOption<Long?>(it.id, it.name) },
                    viewModel::setCity,
                    label = "شهر",
                    icon = Lucide.MapPin,
                )
                JtPicker(f.whenFilter, EventWhen.entries.map { PickerOption(it, it.label) }, { v -> viewModel.update { it.copy(whenFilter = v) } }, label = "تاریخ برگزاری", icon = Lucide.CalendarDays)
                PriceRange(f.minPrice, f.maxPrice) { min, max -> viewModel.update { it.copy(minPrice = min, maxPrice = max) } }
            }
        }
    }
}

/** EVENTS_HERO block: navy panel with the admin's image, title and subtitle. */
@Composable
private fun EventsHero(block: PageBlock?) {
    Box(Modifier.padding(start = 16.dp, end = 16.dp, top = 16.dp).fillMaxWidth().clip(JtShapes.header).background(Jt.colors.navy950)) {
        RemoteImage(block?.imageUrl, Modifier.matchParentSize(), alpha = 0.7f, placeholder = Jt.colors.navy950)
        Box(Modifier.matchParentSize().background(Brush.horizontalGradient(listOf(Color(0x4D071834), Color(0xCC071834), Color(0xFF071834)))))
        Column(Modifier.padding(horizontal = 20.dp, vertical = 24.dp)) {
            Text("خانه / رویدادها", style = text(12.5f), color = Color.White.copy(alpha = 0.7f))
            Text("رویدادها", style = text(26f, W.Black), color = Color.White, modifier = Modifier.padding(top = 6.dp))
            (block?.subtitle ?: block?.title)?.let { Text(it, style = text(14f, lineHeight = 1.9f), color = Color.White.copy(alpha = 0.85f), modifier = Modifier.padding(top = 4.dp)) }
        }
    }
}

@Composable
private fun CategoryTabs(categories: List<Category>, active: String, onChange: (String) -> Unit) {
    val c = Jt.colors
    LazyRow(Modifier.padding(vertical = 16.dp), contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        item(key = "all") { CategoryTab("همه رویدادها", null, null, null, active.isEmpty()) { onChange("") } }
        items(categories, key = { it.id }) { cat -> CategoryTab(cat.name, cat.slug, cat.iconUrl, cat.color, cat.slug == active) { onChange(cat.slug) } }
    }
}

@Composable
private fun CategoryTab(name: String, slug: String?, iconUrl: String?, color: String?, on: Boolean, onClick: () -> Unit) {
    val c = Jt.colors
    val tint = if (on) Color.White else parseHexColor(color, c.brand600)
    Column(
        Modifier
            .width(112.dp)
            .height(76.dp)
            .clip(JtShapes.xl2)
            .background(if (on) c.brand600 else c.surface)
            .border(1.dp, if (on) c.brand600 else c.line, JtShapes.xl2)
            .semantics { selected = on }
            .clickable(role = Role.Tab, onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(6.dp, Alignment.CenterVertically),
    ) {
        if (slug != null) CategoryIcon(slug, iconUrl, size = 28.dp, tint = tint) else JtIcon(Lucide.LayoutGrid, size = 28.dp, tint = tint)
        Text(name, style = text(13f, W.Bold), color = if (on) Color.White else c.ink, maxLines = 1, modifier = Modifier.padding(horizontal = 4.dp))
    }
}

/** Starting-price range in Toman; applied when the keyboard's done button is pressed. */
@Composable
private fun PriceRange(min: Long?, max: Long?, onChange: (Long?, Long?) -> Unit) {
    var from by rememberSaveable(min) { mutableStateOf(min?.toString().orEmpty()) }
    var to by rememberSaveable(max) { mutableStateOf(max?.toString().orEmpty()) }
    val parse = { v: String -> toEnDigits(v).filter { it.isDigit() }.takeIf { it.isNotEmpty() }?.toLongOrNull() }
    val commit = { onChange(parse(from), parse(to)) }
    Column {
        Text("محدوده قیمت (تومان)", style = text(13.5f, W.Semibold), color = Jt.colors.ink, modifier = Modifier.padding(bottom = 8.dp))
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            val options = KeyboardOptions(keyboardType = KeyboardType.Number, imeAction = ImeAction.Done)
            JtTextField(from, { from = it }, Modifier.weight(1f), placeholder = "از", textAlign = TextAlign.Center, keyboardOptions = options,
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { commit() }))
            Text("-", color = Jt.colors.muted)
            JtTextField(to, { to = it }, Modifier.weight(1f), placeholder = "تا", textAlign = TextAlign.Center, keyboardOptions = options,
                keyboardActions = androidx.compose.foundation.text.KeyboardActions(onDone = { commit() }))
        }
        JtButton("اعمال قیمت", commit, Modifier.padding(top = 10.dp), variant = ButtonVariant.SOFT, size = ButtonSize.SM)
    }
}
