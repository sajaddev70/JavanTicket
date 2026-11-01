package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/** Symbols of the design's state boxes and empty states. */
object StateSymbol {
    const val WARNING = "⚠️"
    const val WAIT = "⌛"
    const val SUCCESS = "✅"
    const val CHECK = "✓"
    const val FAILED = "❌"
    const val TICKET = "🎟️"
    const val CALENDAR = "📅"
    const val SEARCH = "🔍"
    const val RECEIPT = "🧾"
    const val HEART = "♡"
    const val SHIELD = "🛡️"
    const val USER = "👤"
}

/** The design's .statebox: symbol or spinner, title, message and one button. */
@Composable
private fun StateBox(symbol: String?, title: String, message: String?, actionLabel: String?, onAction: (() -> Unit)?, secondaryLabel: String?, onSecondary: (() -> Unit)?) {
    val c = Jt.colors
    Column(
        Modifier
            .widthIn(max = 420.dp)
            .fillMaxWidth()
            .clip(JtShapes.state)
            .background(c.surfaceSolid)
            .border(1.dp, if (c.isDark) Color(0xFFBD87FF) else c.line, JtShapes.state)
            .padding(23.dp)
            .semantics { liveRegion = LiveRegionMode.Assertive },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        if (symbol != null) {
            Text(symbol, style = text(52f, lineHeight = 1.25f), color = c.ink)
        } else {
            CircularProgressIndicator(Modifier.size(44.dp), color = c.ink, trackColor = c.line, strokeWidth = 3.dp)
        }
        Text(title, style = text(20f, W.Black), color = c.ink, textAlign = TextAlign.Center)
        if (message != null) Text(message, style = text(13f, lineHeight = 2f), color = c.ink2, textAlign = TextAlign.Center)
        if (actionLabel != null && onAction != null) JtButton(actionLabel, onAction, Modifier.padding(top = 4.dp), size = ButtonSize.XL, block = true)
        if (secondaryLabel != null && onSecondary != null) JtButton(secondaryLabel, onSecondary, variant = ButtonVariant.GHOST, block = true)
    }
}

/**
 * The design's state dialog (warning, expiry, success ...) over the dimmed page. The button defaults to the design's
 * "متوجه شدم"; dismissing with back does the same as [onDismiss], which defaults to the button's action.
 */
@Composable
fun StateDialog(
    symbol: String,
    title: String,
    message: String?,
    onAction: () -> Unit,
    actionLabel: String = "متوجه شدم",
    onDismiss: () -> Unit = onAction,
    secondaryLabel: String? = null,
    onSecondary: (() -> Unit)? = null,
) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnClickOutside = false)) {
        Box(Modifier.fillMaxWidth().padding(horizontal = 28.dp), contentAlignment = Alignment.Center) {
            StateBox(symbol, title, message, actionLabel, onAction, secondaryLabel, onSecondary)
        }
    }
}

/** Work in progress: the state box with a spinner, drawn inside the screen so back keeps working. It has no button: there is nothing to confirm yet. */
@Composable
fun LoadingOverlay(title: String, message: String?, modifier: Modifier = Modifier) {
    Box(modifier.fillMaxSize().background(Color(0x80020B25)).padding(horizontal = 28.dp), contentAlignment = Alignment.Center) {
        StateBox(null, title, message, null, null, null, null)
    }
}
