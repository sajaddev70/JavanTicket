package com.devs.nisha_user.core.designsystem.component

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
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
        containerColor = c.surface,
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
                    .background(c.surface)
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

/** Header of inner screens: back button, title and optional actions, on the site's translucent surface. */
@Composable
fun JtTopBar(title: String, onBack: (() -> Unit)?, modifier: Modifier = Modifier, actions: @Composable () -> Unit = {}) {
    val c = Jt.colors
    Column(modifier.fillMaxWidth().background(c.surface.copy(alpha = 0.97f)).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(60.dp).padding(horizontal = 8.dp), verticalAlignment = Alignment.CenterVertically) {
            if (onBack != null) JtIconButton(Lucide.ArrowRight, onBack, "بازگشت", borderColor = null)
            else Spacer(Modifier.width(8.dp))
            Text(title, style = text(17f, W.Black), color = c.ink, maxLines = 1, modifier = Modifier.weight(1f).padding(horizontal = 4.dp))
            actions()
        }
        HDivider(color = c.line.copy(alpha = 0.8f))
    }
}

// ---------------------------------------------------------------- tabs

data class TabItem<T>(val value: T, val label: String, val badge: Int? = null)

/** Underlined tabs with counts ("آینده ۶"), like components/ui/Tabs.tsx. */
@Composable
fun <T> JtTabs(items: List<TabItem<T>>, selected: T, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    val c = Jt.colors
    Column(modifier.fillMaxWidth()) {
        Row(Modifier.fillMaxWidth()) {
            items.forEach { item ->
                val on = item.value == selected
                Column(
                    Modifier
                        .weight(1f)
                        .clip(JtShapes.lg)
                        .clickableTab(on) { onSelect(item.value) },
                    horizontalAlignment = Alignment.CenterHorizontally,
                ) {
                    Row(Modifier.height(48.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(item.label, style = text(14.5f, W.Bold), color = if (on) c.brand600 else c.ink2)
                        if (item.badge != null) {
                            Text(
                                Fa.number(item.badge),
                                style = text(12f, W.Black),
                                color = if (on) Color.White else c.ink2,
                                modifier = Modifier.clip(JtShapes.pill).background(if (on) c.brand600 else c.field).padding(horizontal = 8.dp, vertical = 1.dp),
                            )
                        }
                    }
                    Box(Modifier.fillMaxWidth().height(3.dp).clip(JtShapes.pill).background(if (on) c.brand600 else Color.Transparent))
                }
            }
        }
        HDivider()
    }
}

/** Pill tabs (variant="pill"): rounded chips, the selected one filled in brand blue. */
@Composable
fun <T> JtPillTabs(items: List<TabItem<T>>, selected: T, onSelect: (T) -> Unit, modifier: Modifier = Modifier) {
    val c = Jt.colors
    LazyRow(modifier, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(items.size) { i ->
            val item = items[i]
            val on = item.value == selected
            Text(
                item.label,
                style = text(13.5f, W.Bold),
                color = if (on) Color.White else c.ink2,
                modifier = Modifier
                    .clip(JtShapes.xl)
                    .background(if (on) c.brand600 else c.surface)
                    .border(1.dp, if (on) c.brand600 else c.line, JtShapes.xl)
                    .clickableTab(on) { onSelect(item.value) }
                    .padding(horizontal = 16.dp, vertical = 10.dp),
            )
        }
    }
}

private fun Modifier.clickableTab(selected: Boolean, onClick: () -> Unit): Modifier =
    semantics { this.selected = selected }.clickable(role = Role.Tab, onClick = onClick)

@Composable
fun Dot(color: Color, size: Dp = 10.dp) {
    Box(Modifier.size(size).clip(JtShapes.pill).background(color))
}
