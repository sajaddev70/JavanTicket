package com.devs.nisha_user.core.designsystem.component

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.invisibleToUser
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.receiveAsFlow

/** Bottom sheet with the site's Dialog look: title, close button, content and an optional sticky footer. */
@Composable
fun JtBottomSheet(
    onDismiss: () -> Unit,
    title: String? = null,
    description: String? = null,
    footer: (@Composable () -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Jt.colors
    val state = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = state,
        containerColor = c.surfaceSolid,
        contentColor = c.ink,
        shape = RoundedCornerShape(topStart = 24.dp, topEnd = 24.dp),
        dragHandle = { Box(Modifier.padding(top = 10.dp).width(40.dp).height(4.dp).clip(JtShapes.pill).background(c.lineStrong)) },
        contentWindowInsets = { WindowInsets(0) },
    ) {
        Column(Modifier.fillMaxWidth().navigationBarsPadding()) {
            if (title != null) {
                Row(Modifier.fillMaxWidth().padding(start = 20.dp, end = 12.dp, top = 8.dp, bottom = 4.dp), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text(title, style = text(18f, W.Black), color = c.ink)
                        if (description != null) Text(description, style = text(13.5f, lineHeight = 1.9f), color = c.muted, modifier = Modifier.padding(top = 4.dp))
                    }
                    JtIconButton(Lucide.X, onDismiss, "بستن", borderColor = null, tint = c.muted)
                }
            }
            Column(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 12.dp), content = content)
            if (footer != null) {
                HDivider()
                Box(Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 14.dp)) { footer() }
            }
        }
    }
}

// ---------------------------------------------------------------- toasts

enum class ToastTone { SUCCESS, ERROR, INFO }

data class ToastMessage(val text: String, val tone: ToastTone)

/** App-wide toasts (components/feedback/Toaster.tsx): `toaster.success("...")` from any screen or ViewModel. */
@Singleton
class Toaster @Inject constructor() {
    private val channel = Channel<ToastMessage>(Channel.BUFFERED)
    val messages = channel.receiveAsFlow()
    fun success(text: String) = channel.trySend(ToastMessage(text, ToastTone.SUCCESS))
    fun error(text: String) = channel.trySend(ToastMessage(text, ToastTone.ERROR))
    fun info(text: String) = channel.trySend(ToastMessage(text, ToastTone.INFO))
}

val LocalToaster = staticCompositionLocalOf { Toaster() }

/** Shows toasts at the top of the screen, one at a time, for ~3.5 s each. */
@Composable
fun ToastHost(toaster: Toaster, modifier: Modifier = Modifier) {
    var current by remember { mutableStateOf<ToastMessage?>(null) }
    var visible by remember { mutableStateOf(false) }
    LaunchedEffect(toaster) {
        toaster.messages.collect { m ->
            current = m
            visible = true
            delay(3500)
            visible = false
            delay(250)
        }
    }
    val c = Jt.colors
    Box(modifier.fillMaxWidth().statusBarsPadding().padding(horizontal = 16.dp, vertical = 8.dp), contentAlignment = Alignment.TopCenter) {
        AnimatedVisibility(visible, enter = slideInVertically { -it } + fadeIn(), exit = slideOutVertically { -it } + fadeOut()) {
            val m = current ?: return@AnimatedVisibility
            val (icon, tint) = when (m.tone) {
                ToastTone.SUCCESS -> Lucide.CircleCheck to c.success
                ToastTone.ERROR -> Lucide.CircleAlert to c.dangerFg
                ToastTone.INFO -> Lucide.Info to c.brand600
            }
            Row(
                Modifier
                    .widthIn(max = 520.dp)
                    .cardShadow(JtShapes.xl2, c.shadow, 14.dp)
                    .clip(JtShapes.xl2)
                    .background(c.surfaceSolid)
                    .border(1.dp, c.line, JtShapes.xl2)
                    .padding(horizontal = 16.dp, vertical = 12.dp)
                    .semantics { liveRegion = LiveRegionMode.Polite },
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                JtIcon(icon, size = 22.dp, tint = tint)
                Text(m.text, style = text(14f, W.Semibold), color = c.ink)
            }
        }
    }
}

// ---------------------------------------------------------------- top bar of inner screens

/** The design's mark: pink dot over four spreading lines (brand svg of the screens). */
@Composable
fun BrandMark(modifier: Modifier = Modifier) {
    val c = Jt.colors
    val lines = if (c.isDark) Color(0xFF8ED4FF) else c.navy900
    Canvas(modifier.semantics { invisibleToUser() }) {
        val k = minOf(size.width / 50f, size.height / 40f)
        withTransform({ translate((size.width - 50f * k) / 2, (size.height - 40f * k) / 2); scale(k, k, pivot = Offset.Zero) }) {
            drawCircle(Color(0xFFFF4F94), 5f, Offset(25f, 6f))
            listOf(3f to 34f, 47f to 34f, 15f to 35f, 35f to 35f).forEach { (x, y) ->
                drawLine(lines, Offset(25f, 13f), Offset(x, y), strokeWidth = 3f, cap = StrokeCap.Round)
            }
        }
    }
}

/** The design's .top row: the mark and short site name on the start side, [actions] on the end side. */
@Composable
fun BrandRow(modifier: Modifier = Modifier, actions: @Composable RowScope.() -> Unit = {}) {
    val c = Jt.colors
    val settings = LocalSiteSettings.current
    val name = settings?.shortName?.trim()?.ifBlank { null } ?: settings?.siteName?.trim().orEmpty()
    Row(modifier.fillMaxWidth().heightIn(min = 44.dp), verticalAlignment = Alignment.CenterVertically) {
        BrandMark(Modifier.width(45.dp).height(36.dp))
        Spacer(Modifier.width(8.dp))
        Text(name, style = text(16f, W.Black), color = c.ink, maxLines = 1, modifier = Modifier.weight(1f))
        actions()
    }
}

/** Round glass button of the design's header (.round). */
@Composable
fun RoundButton(icon: LucidePaths, onClick: () -> Unit, contentDescription: String, modifier: Modifier = Modifier) {
    val c = Jt.colors
    JtIconButton(icon, onClick, contentDescription, modifier, size = 40.dp, iconSize = 18.dp, background = c.field, tint = c.ink, borderColor = c.line, shape = JtShapes.xl)
}

/** Header of every screen in the design: brand row (back button at the far end), the large title and the site name under it. */
@Composable
fun JtTopBar(title: String, onBack: (() -> Unit)?, modifier: Modifier = Modifier, subtitle: String? = LocalSiteSettings.current?.siteName, actions: @Composable RowScope.() -> Unit = {}) {
    val c = Jt.colors
    Column(modifier.fillMaxWidth().statusBarsPadding().padding(start = 19.dp, end = 19.dp, top = 8.dp, bottom = 6.dp)) {
        BrandRow {
            actions()
            if (onBack != null) RoundButton(Lucide.ChevronLeft, onBack, "بازگشت", Modifier.padding(start = 8.dp))
        }
        Text(title, style = text(24f, W.Black, lineHeight = 1.4f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis, modifier = Modifier.padding(top = 10.dp).semantics { heading() })
        if (!subtitle.isNullOrBlank()) Text(subtitle, style = text(12f, lineHeight = 1.8f), color = c.muted, maxLines = 1)
    }
}

// ---------------------------------------------------------------- tabs

data class TabItem<T>(val value: T, val label: String, val badge: Int? = null)

/** Chip tabs with counts ("آینده (۲)"). */
@Composable
fun <T> JtTabs(items: List<TabItem<T>>, selected: T, onSelect: (T) -> Unit, modifier: Modifier = Modifier) = JtPillTabs(items, selected, onSelect, modifier)

/** The design's .chip row: glass pills, the selected one in the magenta gradient. */
@Composable
fun <T> JtPillTabs(items: List<TabItem<T>>, selected: T, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    LazyRow(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(items.size) { i ->
            val item = items[i]
            JtChip(
                item.label + (item.badge?.takeIf { it > 0 }?.let { " (${Fa.number(it)})" } ?: ""),
                item.value == selected,
            ) { onSelect(item.value) }
        }
    }
}

/** One .chip / .chip.active. */
@Composable
fun JtChip(label: String, on: Boolean, modifier: Modifier = Modifier, leading: (@Composable () -> Unit)? = null, onClick: () -> Unit) {
    val c = Jt.colors
    Row(
        modifier
            .clip(JtShapes.pill)
            .then(if (on) Modifier.background(JtBrushes.chip) else Modifier.background(c.field).border(1.dp, c.lineStrong, JtShapes.pill))
            .clickableTab(on, onClick)
            .heightIn(min = 40.dp)
            .padding(horizontal = 13.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        leading?.invoke()
        Text(label, style = text(12f, if (on) W.Bold else W.Medium), color = if (on) Color.White else c.ink, maxLines = 1)
    }
}

private fun Modifier.clickableTab(selected: Boolean, onClick: () -> Unit): Modifier =
    semantics { this.selected = selected }.clickable(role = Role.Tab, onClick = onClick)

@Composable
fun Dot(color: Color, size: Dp = 10.dp) {
    Box(Modifier.size(size).clip(JtShapes.pill).background(color))
}
