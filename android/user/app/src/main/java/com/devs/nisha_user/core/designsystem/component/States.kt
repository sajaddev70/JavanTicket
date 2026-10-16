package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/**
 * API failure: Persian message and a retry button (never raw error text), like the web's ErrorState. Connectivity
 * failures show the offline illustration of the site's offline page instead.
 */
@Composable
fun ErrorState(error: AppError?, modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null, message: String? = null) {
    if (error?.offline == true) {
        OfflineState(modifier, onRetry)
        return
    }
    val c = Jt.colors
    Column(
        modifier
            .fillMaxWidth()
            .clip(JtShapes.xl2)
            .background(c.surface)
            .border(1.dp, c.line, JtShapes.xl2)
            .padding(horizontal = 16.dp, vertical = 40.dp)
            .semantics { liveRegion = LiveRegionMode.Polite },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(48.dp).clip(CircleShape).background(c.dangerBg), contentAlignment = Alignment.Center) {
            JtIcon(Lucide.TriangleAlert, size = 24.dp, tint = c.dangerFg)
        }
        Text(message ?: error?.message ?: AppError.GENERIC, style = text(14.5f, W.Semibold), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 420.dp))
        if (onRetry != null) {
            JtButton("تلاش مجدد", onRetry, variant = ButtonVariant.OUTLINE, leading = Lucide.RefreshCw, leadingTint = c.brand600)
        }
    }
}

/** The site's offline page: no connection, with a retry button. */
@Composable
fun OfflineState(modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null) {
    val c = Jt.colors
    Column(
        modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        SvgIcon("/assets/brand/javan-logo-mark.svg", size = 72.dp, tint = c.ink)
        IconTile(Lucide.WifiOff, size = 64.dp, iconSize = 32.dp, shape = JtShapes.xl2)
        Text("اتصال به اینترنت برقرار نیست", style = text(22f, W.Black), color = c.ink, textAlign = TextAlign.Center)
        Text("لطفاً اتصال اینترنت خود را بررسی کنید و دوباره تلاش کنید.", style = text(15f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 360.dp))
        if (onRetry != null) JtButton("تلاش مجدد", onRetry, size = ButtonSize.LG, leading = Lucide.RefreshCw)
    }
}

/** Nothing to show: icon, message, description and an optional action (dashed border). */
@Composable
fun EmptyState(
    message: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    icon: LucidePaths = Lucide.CalendarX2,
    action: @Composable (() -> Unit)? = null,
) {
    val c = Jt.colors
    Column(
        modifier
            .fillMaxWidth()
            .clip(JtShapes.xl2)
            .background(c.surface.copy(alpha = 0.6f))
            .drawBehind {
                drawRoundRect(
                    color = c.lineStrong,
                    cornerRadius = CornerRadius(16.dp.toPx()),
                    style = Stroke(width = 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(10f, 8f))),
                )
            }
            .padding(horizontal = 16.dp, vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(Modifier.size(56.dp).clip(CircleShape).background(c.brand50), contentAlignment = Alignment.Center) {
            JtIcon(icon, size = 28.dp, tint = c.brand600)
        }
        Text(message, style = text(15f, W.Bold), color = c.ink, textAlign = TextAlign.Center)
        if (description != null) Text(description, style = text(13.5f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 420.dp))
        action?.invoke()
    }
}

/** Inline alert box (rounded-xl bg-danger-bg px-4 py-3 text-danger-fg). */
@Composable
fun InlineError(message: String, modifier: Modifier = Modifier) {
    val c = Jt.colors
    Text(
        message,
        style = text(13.5f, W.Semibold),
        color = c.dangerFg,
        modifier = modifier.fillMaxWidth().clip(JtShapes.xl).background(c.dangerBg).padding(horizontal = 16.dp, vertical = 12.dp).semantics { liveRegion = LiveRegionMode.Assertive },
    )
}
