package com.devs.nisha_user.ui.events

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
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
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.EmptyState
import com.devs.nisha_user.core.designsystem.component.ErrorState
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtChip
import com.devs.nisha_user.core.designsystem.component.JtPicker
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.PickerOption
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.toEnDigits
import com.devs.nisha_user.domain.model.Category
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.EventSort
import com.devs.nisha_user.domain.model.EventType
import com.devs.nisha_user.domain.model.EventWhen
import com.devs.nisha_user.ui.app.SearchBox
import com.devs.nisha_user.ui.common.EventCard
import com.devs.nisha_user.ui.common.EventCardSkeleton

private enum class FilterSheet { CITY, WHEN, SORT, MORE }

/** 05 همه رویدادها: عادی، نتیجه جست‌وجو، بدون نتیجه، بارگذاری. */
@Composable
fun EventsScreen(
    categories: List<Category>,
    cities: List<City>,
    viewModel: EventsViewModel = hiltViewModel(),
) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val f = s.filters
    var sheet by rememberSaveable { mutableStateOf<FilterSheet?>(null) }
    val list = rememberLazyListState()
    val nearEnd by remember { derivedStateOf { list.layoutInfo.visibleItemsInfo.lastOrNull()?.index?.let { it >= list.layoutInfo.totalItemsCount - 4 } ?: false } }
    LaunchedEffect(nearEnd, s.items.size) { if (nearEnd) viewModel.loadMore() }
    val c = Jt.colors
    val searching = f.q.isNotBlank()
    val cityLabel = cities.firstOrNull { it.id == f.cityId }?.name ?: "همه شهرها"

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize()) {
            JtTopBar("همه رویدادها", onBack = null)
            LazyColumn(Modifier.fillMaxSize(), state = list, contentPadding = PaddingValues(start = 19.dp, end = 19.dp, bottom = 24.dp), verticalArrangement = Arrangement.spacedBy(11.dp)) {
                item(key = "search") {
                    SearchBox(f.q, Modifier.fillMaxWidth().padding(top = 6.dp)) { q -> viewModel.update { it.copy(q = q) } }
                }
                if (!searching) {
                    item(key = "categories") {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            item(key = "all") { JtChip("همه", f.category.isEmpty()) { viewModel.update { it.copy(category = "") } } }
                            items(categories, key = { it.id }) { cat ->
                                JtChip(cat.name, cat.slug == f.category) { viewModel.update { it.copy(category = cat.slug) } }
                            }
                        }
                    }
                    item(key = "filters") {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            item { FilterChip(cityLabel, Lucide.MapPin, f.cityId != null) { sheet = FilterSheet.CITY } }
                            item { FilterChip(if (f.whenFilter == EventWhen.ANY) "تاریخ" else f.whenFilter.label, Lucide.CalendarDays, f.whenFilter != EventWhen.ANY) { sheet = FilterSheet.WHEN } }
                            item { FilterChip(f.sort.label, Lucide.ArrowUpDown, false) { sheet = FilterSheet.SORT } }
                            item { FilterChip("فیلترها", Lucide.SlidersHorizontal, f.type != EventType.ANY || f.minPrice != null || f.maxPrice != null) { sheet = FilterSheet.MORE } }
                        }
                    }
                }
                when {
                    s.error != null && s.items.isEmpty() -> item(key = "error") { ErrorState(s.error, onRetry = viewModel::reload) }
                    s.loading && s.items.isEmpty() -> items(4, key = { "sk$it" }) { EventCardSkeleton(Modifier.fillMaxWidth()) }
                    s.items.isEmpty() -> item(key = "empty") {
                        EmptyState(
                            "نتیجه‌ای پیدا نشد",
                            description = "فیلترها را تغییر دهید یا عبارت دیگری جست‌وجو کنید.",
                            symbol = StateSymbol.SEARCH,
                            action = { JtButton("مشاهده رویدادها", viewModel::clear, block = true, size = ButtonSize.XL) },
                        )
                    }
                    else -> {
                        item(key = "count") {
                            Row(Modifier.fillMaxWidth().padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                                Text(if (searching) "نتایج جست‌وجو" else "${Fa.number(s.total)} رویداد", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                                if (!f.isDefault || s.cityOverridden) {
                                    JtButton("حذف فیلترها", viewModel::clear, variant = ButtonVariant.GHOST, size = ButtonSize.SM)
                                } else {
                                    Text("پیشنهادی برای شما", style = text(11f), color = c.muted)
                                }
                            }
                        }
                        items(s.items, key = { it.id }) { e -> EventCard(e, Modifier.fillMaxWidth()) }
                        if (s.loadingMore) item(key = "more") {
                            Box(Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator(Modifier.size(28.dp), color = c.brand500, strokeWidth = 3.dp) }
                        }
                        if (s.error != null) item(key = "more-error") { ErrorState(s.error, onRetry = viewModel::loadMore) }
                    }
                }
            }
        }
        if (s.loading && s.items.isNotEmpty()) LoadingOverlay("در حال بارگذاری", "لطفاً چند لحظه منتظر بمانید.")
    }

    when (sheet) {
        FilterSheet.CITY -> OptionSheet("شهر", listOf(PickerOption<Long?>(null, "همه شهرها")) + cities.map { PickerOption<Long?>(it.id, it.name) }, f.cityId, viewModel::setCity) { sheet = null }
        FilterSheet.WHEN -> OptionSheet("تاریخ برگزاری", EventWhen.entries.map { PickerOption(it, it.label) }, f.whenFilter, { v -> viewModel.update { it.copy(whenFilter = v) } }) { sheet = null }
        FilterSheet.SORT -> OptionSheet("مرتب‌سازی", EventSort.entries.map { PickerOption(it, it.label) }, f.sort, { v -> viewModel.update { it.copy(sort = v) } }) { sheet = null }
        FilterSheet.MORE -> JtBottomSheet(
            onDismiss = { sheet = null },
            title = "فیلتر رویدادها",
            footer = { JtButton("مشاهده ${Fa.number(s.total)} رویداد", { sheet = null }, block = true, size = ButtonSize.LG, loading = s.loading) },
        ) {
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                JtPicker(f.type, EventType.entries.map { PickerOption(it, it.label) }, { v -> viewModel.update { it.copy(type = v) } }, label = "نوع رویداد", icon = Lucide.Sparkles)
                PriceRange(f.minPrice, f.maxPrice) { min, max -> viewModel.update { it.copy(minPrice = min, maxPrice = max) } }
            }
        }
        null -> Unit
    }
}

@Composable
private fun FilterChip(label: String, icon: LucidePaths, on: Boolean, onClick: () -> Unit) {
    JtChip(label, on, leading = { JtIcon(icon, size = 15.dp, tint = Jt.colors.ink) }, onClick = onClick)
}

@Composable
private fun <T> OptionSheet(title: String, options: List<PickerOption<T>>, selected: T, onSelect: (T) -> Unit, onDismiss: () -> Unit) {
    val c = Jt.colors
    JtBottomSheet(onDismiss = onDismiss, title = title) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            options.forEach { o ->
                JtButton(
                    o.label,
                    {
                        onSelect(o.value)
                        onDismiss()
                    },
                    variant = if (o.value == selected) ButtonVariant.PRIMARY else ButtonVariant.OUTLINE,
                    size = ButtonSize.LG,
                    block = true,
                )
            }
        }
    }
}

/** Starting-price range in Toman; applied with the button or the keyboard's done key. */
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
