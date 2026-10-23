package com.devs.nisha_user.ui.seats

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.drawText
import androidx.compose.ui.text.rememberTextMeasurer
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Vazirmatn
import com.devs.nisha_user.core.designsystem.theme.JavanColors
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Seat
import com.devs.nisha_user.domain.model.SeatStatus
import com.devs.nisha_user.domain.model.SeatTier
import kotlin.math.hypot

/** Units per seat in the drawing (backend coordinates are in seat units), as the web's SVG. */
private const val U = 24f
private const val MIN_SCALE = 1f
private const val MAX_SCALE = 4f

/** Fill of a seat: its tier color while free (prices differ per tier), fixed colors for every other state. */
/** A VIP tier (by its code or name from the backend) is drawn gold with a crown while free, as on the web. */
fun isVipTier(code: String?, name: String?): Boolean = Regex("vip", RegexOption.IGNORE_CASE).containsMatchIn("${code.orEmpty()} ${name.orEmpty()}")

/** Fill and stroke of a seat per state (design package: assets/icons/seat). */
fun seatPaint(status: SeatStatus, vip: Boolean, c: JavanColors): Pair<Color, Color> = when (status) {
    SeatStatus.SELECTED -> c.seatSelected to c.seatSelected
    SeatStatus.SOLD -> c.seatSold to c.seatSoldStroke
    SeatStatus.LOCKED -> c.seatLocked to c.seatLockedStroke
    SeatStatus.B2B_RESERVED -> c.seatReserved to c.seatReservedStroke
    SeatStatus.DISABLED -> c.seatDisabled to c.seatSoldStroke
    SeatStatus.AVAILABLE -> if (vip) c.seatVip to c.seatVipStroke else c.seatFree to c.seatFreeStroke
}

private class Layout(seats: List<Seat>) {
    val minX = seats.minOf { it.x }.toFloat()
    val maxX = seats.maxOf { it.x }.toFloat()
    val minY = seats.minOf { it.y }.toFloat()
    val maxY = seats.maxOf { it.y }.toFloat()
    private val pad = 2.2f
    private val stage = 4.2f
    val vbX = (minX - pad) * U
    val vbY = (minY - pad - stage) * U
    val vbW = (maxX - minX + pad * 2) * U
    val vbH = (maxY - minY + pad * 2 + stage) * U
    val stageTop = (minY - pad - stage + 0.3f) * U
    val cx = (minX + maxX) / 2 * U

    /** Row labels only at the outer edges of the hall, as on printed seating plans. */
    val edgeRows: List<Pair<String, Float>> = seats.groupBy { it.rowIndex }.values.map { row -> row.first().rowLabel to row.maxOf { it.y }.toFloat() }
}

private data class View(val scale: Float, val x: Float, val y: Float)

/**
 * The hall map: pinch or the buttons to zoom, drag to pan, tap a free seat to pick it. Phones start zoomed in so
 * seats are big enough to tap; the reset button shows the whole hall.
 */
@Composable
fun SeatMap(
    seats: List<Seat>,
    tiers: List<SeatTier>,
    pending: Set<Long>,
    onToggle: (Seat) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Jt.colors
    val layout = remember(seats.map { it.id }) { Layout(seats) }
    val vipCodes = remember(tiers) { tiers.filter { isVipTier(it.code, it.name) }.map { it.code }.toSet() }
    val measurer = rememberTextMeasurer()
    val density = LocalDensity.current

    BoxWithConstraints(modifier.fillMaxWidth()) {
        val widthPx = with(density) { maxWidth.toPx() }
        val base = widthPx / layout.vbW
        val contentH = layout.vbH * base
        val boxH = with(density) { contentH.toDp() }.coerceIn(360.dp, 560.dp)
        val boxHPx = with(density) { boxH.toPx() }

        fun clamp(v: View): View {
            val scale = v.scale.coerceIn(MIN_SCALE, MAX_SCALE)
            fun fit(pos: Float, content: Float, container: Float) =
                if (content <= container) (container - content) / 2 else pos.coerceIn(container - content, 0f)
            return View(scale, fit(v.x, widthPx * scale, widthPx), fit(v.y, contentH * scale, boxHPx))
        }

        val initial = remember(widthPx, layout) {
            val seatPx = U * base
            val scale = (with(density) { 18.dp.toPx() } / seatPx).coerceIn(1f, MAX_SCALE)
            clamp(View(scale, (widthPx - widthPx * scale) / 2, 0f))
        }
        var view by remember(initial) { mutableStateOf(initial) }
        val animatedScale by animateFloatAsState(view.scale, label = "zoom")

        fun zoomAt(factor: Float, cx: Float = widthPx / 2, cy: Float = boxHPx / 2) {
            val scale = (view.scale * factor).coerceIn(MIN_SCALE, MAX_SCALE)
            val k = scale / view.scale
            view = clamp(View(scale, cx - (cx - view.x) * k, cy - (cy - view.y) * k))
        }

        Box(
            Modifier
                .fillMaxWidth()
                .height(boxH)
                .clip(JtShapes.xl2)
                .background(c.surface2)
                .semantics { contentDescription = "نقشه صندلی‌های سالن؛ برای انتخاب روی صندلی‌های آزاد بزنید." },
        ) {
            Canvas(
                Modifier
                    .fillMaxSize()
                    .pointerInput(layout, widthPx) {
                        detectTransformGestures { centroid, pan, zoom, _ ->
                            val scale = (view.scale * zoom).coerceIn(MIN_SCALE, MAX_SCALE)
                            val k = scale / view.scale
                            view = clamp(View(scale, centroid.x - (centroid.x - view.x) * k + pan.x, centroid.y - (centroid.y - view.y) * k + pan.y))
                        }
                    }
                    .pointerInput(seats, pending, layout, widthPx) {
                        detectTapGestures(
                            onDoubleTap = { p -> zoomAt(if (view.scale < MAX_SCALE) 1.6f else 1f / MAX_SCALE, p.x, p.y) },
                            onTap = { p ->
                                // Screen → drawing units, then the nearest seat within ~half a seat.
                                val ux = (p.x - view.x) / view.scale / base + layout.vbX
                                val uy = (p.y - view.y) / view.scale / base + layout.vbY
                                val hit = seats.minByOrNull { hypot(it.x.toFloat() * U - ux, it.y.toFloat() * U - uy) }
                                if (hit != null && hypot(hit.x.toFloat() * U - ux, hit.y.toFloat() * U - uy) < U * 0.62f) onToggle(hit)
                            },
                        )
                    },
            ) {
                withTransform({
                    translate(view.x, view.y)
                    scale(view.scale, view.scale, pivot = Offset.Zero)
                    scale(base, base, pivot = Offset.Zero)
                    translate(-layout.vbX, -layout.vbY)
                }) {
                    drawStage(layout, c, measurer)
                    drawRowLabels(layout, c, measurer)
                    seats.forEach { s -> drawSeat(s, s.tierCode in vipCodes, s.id in pending, c) }
                }
            }
            // Zoom controls (start side, as in the design).
            Column(
                Modifier.align(Alignment.CenterEnd).padding(12.dp).clip(JtShapes.xl).background(c.surface).border(1.dp, c.line, JtShapes.xl),
            ) {
                JtIconButton(Lucide.Plus, { zoomAt(1.35f) }, "بزرگ‌نمایی", borderColor = null, enabled = animatedScale < MAX_SCALE - 0.01f)
                JtIconButton(Lucide.Minus, { zoomAt(1 / 1.35f) }, "کوچک‌نمایی", borderColor = null, enabled = view.scale > 1.01f)
                JtIconButton(Lucide.Crosshair, { view = clamp(View(1f, 0f, 0f)) }, "نمای کامل سالن", borderColor = null)
            }
        }
        LaunchedEffect(boxHPx) { view = clamp(view) }
    }
}

/** Stage: a shallow arc across the front with two soft spotlights (web SeatMap.tsx). */
private fun DrawScope.drawStage(l: Layout, c: JavanColors, measurer: androidx.compose.ui.text.TextMeasurer) {
    val w = minOf(l.vbW * 0.72f, (l.maxX - l.minX + 2f) * U)
    val top = l.stageTop
    val path = Path().apply {
        moveTo(l.cx - w / 2, top + U * 0.9f)
        quadraticTo(l.cx, top - U * 0.7f, l.cx + w / 2, top + U * 0.9f)
        lineTo(l.cx + w / 2 - U * 0.4f, top + U * 2.9f)
        lineTo(l.cx - w / 2 + U * 0.4f, top + U * 2.9f)
        close()
    }
    drawPath(path, Brush.verticalGradient(listOf(c.navy800, c.stage), startY = top, endY = top + U * 2.9f))
    listOf(-0.22f, 0.22f).forEach { k ->
        val center = Offset(l.cx + w * k, top + U * 1.5f)
        drawOval(
            Brush.radialGradient(listOf(Color.White.copy(alpha = 0.4f), Color.Transparent), center = center, radius = U * 1.1f),
            topLeft = Offset(center.x - U * 0.55f, center.y - U * 1.1f),
            size = Size(U * 1.1f, U * 2.2f),
        )
    }
    val label = measurer.measure("صحنه", TextStyle(fontFamily = Vazirmatn, fontWeight = W.Extrabold, fontSize = androidx.compose.ui.unit.TextUnit(U * 0.8f / density / fontScale, androidx.compose.ui.unit.TextUnitType.Sp), color = Color.White))
    drawText(label, topLeft = Offset(l.cx - label.size.width / 2f, top + U * 1.9f - label.size.height / 2f))
}

/** Row letters on the start (right) side of the hall, as on the reference. */
private fun DrawScope.drawRowLabels(l: Layout, c: JavanColors, measurer: androidx.compose.ui.text.TextMeasurer) {
    val style = TextStyle(fontFamily = Vazirmatn, fontWeight = W.Bold, fontSize = androidx.compose.ui.unit.TextUnit(U * 0.48f / density / fontScale, androidx.compose.ui.unit.TextUnitType.Sp), color = c.muted)
    l.edgeRows.forEach { (label, y) ->
        val m = measurer.measure(label, style)
        val x = (l.maxX + 1.25f) * U
        drawText(m, topLeft = Offset(x - m.size.width / 2f, y * U - m.size.height / 2f))
    }
}

private val SW = 0.8f * U
private val SH = 0.8f * U

/** Rounded seat; a check when selected, × when sold, a crown on free VIP seats, a dot while someone else holds it. */
private fun DrawScope.drawSeat(s: Seat, vip: Boolean, busy: Boolean, c: JavanColors) {
    val x = s.x.toFloat() * U
    val y = s.y.toFloat() * U
    val (fill, stroke) = seatPaint(s.status, vip, c)
    val alpha = if (busy) 0.55f else 1f
    val topLeft = Offset(x - SW / 2, y - SH / 2)
    drawRoundRect(fill.copy(alpha = fill.alpha * alpha), topLeft, Size(SW, SH), CornerRadius(5f))
    drawRoundRect(
        stroke, topLeft, Size(SW, SH), CornerRadius(5f),
        style = Stroke(1.2f, pathEffect = if (s.status == SeatStatus.DISABLED) PathEffect.dashPathEffect(floatArrayOf(3f, 2f)) else null),
    )
    when {
        s.status == SeatStatus.SELECTED -> drawPath(
            Path().apply { moveTo(x - 4.5f, y + 0.3f); relativeLineTo(3.2f, 3.2f); relativeLineTo(6f, -6.4f) },
            Color.White, style = Stroke(2.2f, cap = StrokeCap.Round, join = StrokeJoin.Round),
        )
        s.status == SeatStatus.SOLD -> drawPath(
            Path().apply { moveTo(x - 3.6f, y - 3.6f); relativeLineTo(7.2f, 7.2f); moveTo(x + 3.6f, y - 3.6f); relativeLineTo(-7.2f, 7.2f) },
            c.seatSoldMark, style = Stroke(1.5f, cap = StrokeCap.Round),
        )
        s.status == SeatStatus.AVAILABLE && vip -> drawPath(
            Path().apply {
                moveTo(x - 5f, y + 3f); relativeLineTo(0.8f, -6f); relativeLineTo(2.6f, 2.4f); relativeLineTo(1.6f, -3.4f)
                relativeLineTo(1.6f, 3.4f); relativeLineTo(2.6f, -2.4f); relativeLineTo(0.8f, 6f); close()
            },
            Color.White,
        )
        s.status == SeatStatus.LOCKED -> drawCircle(c.muted, 2.4f, Offset(x, y))
    }
}

/** Seat as read out and listed in the cart: "سکشن ... - ردیف الف - صندلی ۷". */
fun seatTitle(seat: Seat, sectionName: String?): String =
    "${sectionName?.let { "سکشن $it - " } ?: ""}ردیف ${seat.rowLabel} - صندلی ${Fa.number(seat.seatNumber)}"
