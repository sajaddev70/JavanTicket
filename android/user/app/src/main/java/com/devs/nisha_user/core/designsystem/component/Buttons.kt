package com.devs.nisha_user.core.designsystem.component

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.LocalContentColor
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/**
 * The site's Button variants (components/ui/Button.tsx): gradient pills of the Javan Light Redesign — violet (main
 * flow), magenta (event CTA), green (pay), orange (hero) — plus glass for the navy band.
 */
enum class ButtonVariant { PRIMARY, PINK, SUCCESS, ORANGE, GLASS, OUTLINE, SOFT, GHOST, DANGER_GHOST }

/** min-h-10 / 11 / 12 / 14 with the matching text sizes. */
enum class ButtonSize(val minHeight: Dp, val horizontal: Dp, val text: TextStyle) {
    SM(40.dp, 16.dp, text(13.5f, W.Black)),
    MD(48.dp, 20.dp, text(14.5f, W.Black)),
    LG(52.dp, 24.dp, text(16f, W.Black)),
    XL(56.dp, 28.dp, text(17f, W.Black)),
}

@Composable
fun JtButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.PRIMARY,
    size: ButtonSize = ButtonSize.MD,
    enabled: Boolean = true,
    loading: Boolean = false,
    block: Boolean = false,
    leading: LucidePaths? = null,
    trailing: LucidePaths? = null,
    leadingTint: Color? = null,
    shape: Shape = JtShapes.pill,
) {
    JtButtonBase(onClick, modifier, variant, size, enabled, loading, block, shape) {
        val iconSize = if (size == ButtonSize.SM) 18.dp else 20.dp
        if (loading) {
            CircularProgressIndicator(Modifier.size(18.dp), color = LocalContentColor.current, strokeWidth = 2.dp)
        } else if (leading != null) {
            JtIcon(leading, size = iconSize, tint = leadingTint ?: LocalContentColor.current)
        }
        Text(text, style = size.text, color = LocalContentColor.current, maxLines = 1)
        if (trailing != null && !loading) JtIcon(trailing, size = iconSize, tint = LocalContentColor.current)
    }
}

@Composable
fun JtButtonBase(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: ButtonVariant = ButtonVariant.PRIMARY,
    size: ButtonSize = ButtonSize.MD,
    enabled: Boolean = true,
    loading: Boolean = false,
    block: Boolean = false,
    shape: Shape = JtShapes.pill,
    content: @Composable RowScope.() -> Unit,
) {
    val c = Jt.colors
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scale by animateFloatAsState(if (pressed && enabled) 0.98f else 1f, label = "press")
    val brush = when (variant) {
        ButtonVariant.PRIMARY -> Jt.brushes.primary
        ButtonVariant.PINK -> Jt.brushes.pink
        ButtonVariant.SUCCESS -> Jt.brushes.success
        ButtonVariant.ORANGE -> Jt.brushes.orange
        else -> null
    }
    val glow = when (variant) {
        ButtonVariant.PRIMARY -> Color(0xFF6E32F5)
        ButtonVariant.PINK -> Color(0xFFDC0A78)
        ButtonVariant.SUCCESS -> Color(0xFF0AA028)
        ButtonVariant.ORANGE -> Color(0xFFFB8A06)
        else -> null
    }
    val (bg, fg, border) = when (variant) {
        ButtonVariant.PRIMARY, ButtonVariant.PINK, ButtonVariant.SUCCESS, ButtonVariant.ORANGE -> Triple(Color.Transparent, Color.White, null)
        ButtonVariant.GLASS -> Triple(Color.White.copy(alpha = if (pressed) 0.2f else 0.12f), Color.White, BorderStroke(1.dp, Color.White.copy(alpha = 0.14f)))
        ButtonVariant.OUTLINE -> Triple(c.surface, c.ink, BorderStroke(1.dp, if (pressed) c.brand500.copy(alpha = 0.5f) else c.lineStrong))
        ButtonVariant.SOFT -> Triple(if (pressed) c.brand100 else c.brand50, c.brand600, null)
        ButtonVariant.GHOST -> Triple(if (pressed) c.field else Color.Transparent, c.ink2, null)
        ButtonVariant.DANGER_GHOST -> Triple(if (pressed) c.dangerBg else Color.Transparent, c.dangerFg, null)
    }
    val active = enabled && !loading
    Row(
        modifier = modifier
            .then(if (block) Modifier.fillMaxWidth() else Modifier)
            .scale(scale)
            .then(if (glow != null && active) Modifier.shadow(10.dp, shape, ambientColor = glow.copy(0.3f), spotColor = glow.copy(0.45f)) else Modifier)
            .clip(shape)
            .background(bg)
            .then(if (brush != null) Modifier.background(brush).alpha(if (pressed) 0.92f else 1f) else Modifier)
            .then(if (border != null) Modifier.border(border, shape) else Modifier)
            .clickable(enabled = active, interactionSource = interaction, indication = null, role = Role.Button, onClick = onClick)
            .defaultMinSize(minHeight = size.minHeight)
            .alpha(if (enabled || loading) 1f else 0.5f)
            .padding(horizontal = size.horizontal),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalContentColor provides fg) { content() }
    }
}

/** Round icon button (size-11), bordered or filled; see [GlassIconButton] for the navy band. */
@Composable
fun JtIconButton(
    icon: LucidePaths,
    onClick: () -> Unit,
    contentDescription: String,
    modifier: Modifier = Modifier,
    size: Dp = 44.dp,
    iconSize: Dp = 20.dp,
    background: Color = Color.Transparent,
    tint: Color = Jt.colors.ink,
    borderColor: Color? = Jt.colors.line,
    shape: Shape = JtShapes.pill,
    enabled: Boolean = true,
    filledIcon: Boolean = false,
) {
    Box(
        modifier
            .size(size)
            .clip(shape)
            .background(background)
            .then(if (borderColor != null) Modifier.border(1.dp, borderColor, shape) else Modifier)
            .clickable(enabled = enabled, role = Role.Button, onClickLabel = contentDescription, onClick = onClick)
            .alpha(if (enabled) 1f else 0.4f),
        contentAlignment = Alignment.Center,
    ) {
        JtIcon(icon, size = iconSize, tint = tint, filled = filledIcon, contentDescription = contentDescription)
    }
}

/** Inline text link ("مشاهده همه ←"). */
@Composable
fun TextLink(text: String, onClick: () -> Unit, modifier: Modifier = Modifier, trailing: LucidePaths? = null, color: Color = Jt.colors.brand600, style: TextStyle = text(13.5f, W.Bold)) {
    Row(
        modifier
            .clip(JtShapes.lg)
            .clickable(role = Role.Button, onClick = onClick)
            .defaultMinSize(minHeight = 40.dp)
            .padding(PaddingValues(horizontal = 4.dp)),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        Text(text, style = style, color = color)
        if (trailing != null) JtIcon(trailing, size = 16.dp, tint = color)
    }
}

/** Round translucent button on the navy band (search, account, back, share) — references 01–06. */
@Composable
fun GlassIconButton(icon: LucidePaths, onClick: () -> Unit, contentDescription: String, modifier: Modifier = Modifier, iconSize: Dp = 21.dp, filledIcon: Boolean = false, tint: Color = Color.White) {
    JtIconButton(
        icon, onClick, contentDescription, modifier,
        iconSize = iconSize,
        background = Color.White.copy(alpha = 0.12f),
        tint = tint,
        borderColor = Color.White.copy(alpha = 0.14f),
        filledIcon = filledIcon,
    )
}
