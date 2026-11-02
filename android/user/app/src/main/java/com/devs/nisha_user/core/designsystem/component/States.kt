package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/**
 * API failure: Persian message and a retry button (never raw error text). Connectivity failures use the design's
 * "ارتباط برقرار نشد" wording.
 */
@Composable
fun ErrorState(error: AppError?, modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null, message: String? = null) {
    if (error?.offline == true) {
        OfflineState(modifier, onRetry)
        return
    }
    EmptyState(
        message ?: error?.message ?: AppError.GENERIC,
        modifier,
        symbol = StateSymbol.WARNING,
        action = onRetry?.let { retry -> { JtButton("تلاش مجدد", retry, block = true, size = ButtonSize.XL, leading = Lucide.RefreshCw) } },
    )
}

@Composable
fun OfflineState(modifier: Modifier = Modifier, onRetry: (() -> Unit)? = null) {
    EmptyState(
        "ارتباط برقرار نشد",
        modifier,
        description = "اتصال اینترنت را بررسی و دوباره تلاش کنید.",
        symbol = StateSymbol.WARNING,
        action = onRetry?.let { retry -> { JtButton("تلاش مجدد", retry, block = true, size = ButtonSize.XL) } },
    )
}

/** The design's .empty block: a large symbol, title, description and an action. */
@Composable
fun EmptyState(
    message: String,
    modifier: Modifier = Modifier,
    description: String? = null,
    symbol: String = StateSymbol.CALENDAR,
    action: @Composable (() -> Unit)? = null,
) {
    val c = Jt.colors
    Column(
        modifier.fillMaxWidth().padding(start = 12.dp, end = 12.dp, top = 45.dp, bottom = 28.dp).semantics { liveRegion = LiveRegionMode.Polite },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Text(symbol, style = text(68f, lineHeight = 1.25f), color = c.ink)
        Text(message, style = text(19f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.semantics { heading() })
        if (description != null) Text(description, style = text(13f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.widthIn(max = 420.dp))
        if (action != null) Box(Modifier.fillMaxWidth().padding(top = 8.dp), contentAlignment = Alignment.Center) { action() }
    }
}

/** Inline alert box. */
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
