package com.devs.nisha_user.core.designsystem.component

import com.devs.nisha_user.core.designsystem.theme.code
import com.devs.nisha_user.core.format.ltr
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/** shadow-card: a soft two-layer shadow tinted with the navy of the design. */
fun Modifier.cardShadow(shape: Shape, color: Color, elevation: Dp = 6.dp): Modifier =
    shadow(elevation, shape, clip = false, ambientColor = color.copy(alpha = 0.06f), spotColor = color.copy(alpha = 0.10f))

/** The site's `card` utility: white rounded panel with a 1px border and shadow-card. */
@Composable
fun JtCard(
    modifier: Modifier = Modifier,
    shape: Shape = JtShapes.card,
    background: Color = Jt.colors.surface,
    borderColor: Color = Jt.colors.line,
    padding: PaddingValues = PaddingValues(16.dp),
    onClick: (() -> Unit)? = null,
    shadow: Boolean = true,
    content: @Composable ColumnScope.() -> Unit,
) {
    val c = Jt.colors
    Column(
        modifier
            .then(if (shadow) Modifier.cardShadow(shape, c.shadow) else Modifier)
            .clip(shape)
            .background(background)
            .border(1.dp, borderColor, shape)
            .then(if (onClick != null) Modifier.clickable(onClick = onClick) else Modifier)
            .padding(padding),
        content = content,
    )
}

/** White section panel with a title and an optional "مشاهده همه" link (shared/SectionCard.tsx). */
@Composable
fun SectionCard(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    icon: LucidePaths? = null,
    moreLabel: String = "مشاهده همه",
    onMore: (() -> Unit)? = null,
    actions: @Composable RowScope.() -> Unit = {},
    contentPadding: PaddingValues = PaddingValues(16.dp),
    content: @Composable ColumnScope.() -> Unit,
) {
    JtCard(modifier.fillMaxWidth(), padding = contentPadding) {
        Row(Modifier.fillMaxWidth().padding(bottom = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Column(Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    if (icon != null) JtIcon(icon, size = 24.dp, tint = Jt.colors.brand600)
                    Text(title, style = text(18f, W.Black), color = Jt.colors.ink, modifier = Modifier.semantics { heading() })
                }
                if (subtitle != null) Text(subtitle, style = text(13f), color = Jt.colors.muted, modifier = Modifier.padding(top = 4.dp))
            }
            actions()
            if (onMore != null) TextLink(moreLabel, onMore, trailing = Lucide.ArrowLeft)
        }
        content()
    }
}

/** Title with an icon in brand blue, the heading style of the site's cards ("انتخاب سانس و خرید بلیت"). */
@Composable
fun CardTitle(title: String, icon: LucidePaths? = null, modifier: Modifier = Modifier, size: Float = 18f, iconSize: Dp = 22.dp) {
    Row(modifier.semantics { heading() }, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (icon != null) JtIcon(icon, size = iconSize, tint = Jt.colors.brand600)
        Text(title, style = text(size, W.Black), color = Jt.colors.ink)
    }
}

/** Animated placeholder block (components/ui/Skeleton.tsx shimmer). */
@Composable
fun Skeleton(modifier: Modifier = Modifier, shape: Shape = JtShapes.lg) {
    val c = Jt.colors
    val transition = rememberInfiniteTransition(label = "shimmer")
    val x = transition.animateFloat(-1f, 2f, infiniteRepeatable(tween(1400, easing = LinearEasing), RepeatMode.Restart), label = "x")
    Box(
        modifier
            .clip(shape)
            .background(c.skeleton)
            .drawWithContent {
                val w = size.width
                drawRect(
                    Brush.linearGradient(
                        listOf(Color.Transparent, Color.White.copy(alpha = if (c.isDark) 0.06f else 0.45f), Color.Transparent),
                        start = Offset(w * x.value - w * 0.6f, 0f),
                        end = Offset(w * x.value, 0f),
                    ),
                )
            },
    )
}

@Composable
fun HDivider(modifier: Modifier = Modifier, color: Color = Jt.colors.line, dashed: Boolean = false) {
    Box(
        modifier
            .fillMaxWidth()
            .height(1.dp)
            .drawWithContent {
                if (dashed) {
                    drawLine(color, Offset(0f, 0f), Offset(size.width, 0f), strokeWidth = size.height * 2, pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f)))
                } else {
                    drawRect(color)
                }
            },
    )
}

/** Label / value row of the site's definition lists (dl > div.flex.justify-between). */
@Composable
fun InfoRow(
    label: String,
    value: String,
    modifier: Modifier = Modifier,
    icon: LucidePaths? = null,
    labelColor: Color = Jt.colors.ink2,
    valueColor: Color = Jt.colors.ink,
    valueBold: Boolean = true,
    trailing: @Composable (() -> Unit)? = null,
) {
    Row(modifier.fillMaxWidth().padding(vertical = 10.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        if (icon != null) JtIcon(icon, size = 20.dp, tint = Jt.colors.brand600)
        Text(label, style = text(13.5f, if (icon != null) W.Bold else W.Normal), color = if (icon != null) Jt.colors.ink else labelColor)
        Spacer(Modifier.weight(1f).width(8.dp))
        if (trailing != null) trailing()
        Text(value, style = text(13.5f, if (valueBold) W.Bold else W.Normal), color = valueColor, overflow = TextOverflow.Ellipsis, maxLines = 2)
    }
}

/** Small rounded label (rounded-lg px-2.5 py-1 text-[12.5px] font-bold). */
@Composable
fun Badge(label: String, background: Color, color: Color, modifier: Modifier = Modifier, icon: LucidePaths? = null, large: Boolean = false) {
    Row(
        modifier.clip(if (large) JtShapes.xl else JtShapes.lg).background(background).padding(horizontal = if (large) 12.dp else 10.dp, vertical = if (large) 6.dp else 3.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (icon != null) JtIcon(icon, size = if (large) 20.dp else 16.dp, tint = color)
        Text(label, style = text(if (large) 14f else 12.5f, if (large) W.Black else W.Bold), color = color, maxLines = 1)
    }
}

/** Rounded icon tile (flex size-12 rounded-xl bg-brand-50 text-brand-600). */
@Composable
fun IconTile(icon: LucidePaths, modifier: Modifier = Modifier, size: Dp = 48.dp, iconSize: Dp = 24.dp, background: Color = Jt.colors.brand50, tint: Color = Jt.colors.brand600, shape: Shape = JtShapes.xl) {
    Box(modifier.width(size).height(size).clip(shape).background(background), contentAlignment = Alignment.Center) {
        JtIcon(icon, size = iconSize, tint = tint)
    }
}

/** A code (order / ticket / tracking number ...) in the code style, always read left to right. */
@Composable
fun CodeText(value: String, modifier: Modifier = Modifier, size: Float = 13.5f, color: Color = Jt.colors.ink, weight: FontWeight = W.Bold) {
    Text(ltr(value), style = code(size, weight), color = color, modifier = modifier)
}
