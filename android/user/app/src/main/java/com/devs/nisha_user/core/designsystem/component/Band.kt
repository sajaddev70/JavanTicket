package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.ScrollState
import androidx.compose.foundation.lazy.LazyListState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.layout.positionInRoot
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.theme.Jt

/** Height of the navy band behind the top of every screen (the site's PageBand). */
val BandHeight: Dp = 340.dp

/**
 * Paints the page color and the navy → indigo band behind a scrolling container, in screen coordinates, so the band
 * scrolls away with the content and lines up exactly with the fixed band under the top bar (JavanAppRoot).
 * [scrolled] is how far the content has moved up, in px.
 */
fun Modifier.scrollingBand(scrolled: () -> Float): Modifier = composed {
    val c = Jt.colors
    var top by remember { mutableFloatStateOf(0f) }
    this
        .onGloballyPositioned { top = it.positionInRoot().y }
        .drawBehind {
            drawRect(c.page)
            val h = BandHeight.toPx()
            val y = -top - scrolled()
            if (y + h > 0f) drawRect(Jt.brushes.band(c.page, startY = y, endY = y + h), topLeft = Offset(0f, y), size = Size(size.width, h))
        }
}

/** [scrollingBand] for a LazyColumn: the band moves with the first item and is gone once it scrolls out. */
fun Modifier.scrollingBand(state: LazyListState): Modifier =
    scrollingBand { if (state.firstVisibleItemIndex == 0) state.firstVisibleItemScrollOffset.toFloat() else 100_000f }

/** [scrollingBand] for a Column with verticalScroll. */
fun Modifier.scrollingBand(state: ScrollState): Modifier = scrollingBand { state.value.toFloat() }
