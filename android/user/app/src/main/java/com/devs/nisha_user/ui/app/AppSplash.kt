package com.devs.nisha_user.ui.app

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.common.AppError
import com.devs.nisha_user.core.designsystem.component.BrandMark
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.heroBackground
import com.devs.nisha_user.core.designsystem.theme.text
import kotlinx.coroutines.delay

private const val MIN_SPLASH_MS = 1200L
private const val LOADING_AFTER_MS = 1500L

/**
 * 01 صفحه آغازین: عادی، بارگذاری، خطای اتصال. Shown until the site content (logo, menus, categories) has answered once;
 * [error] with no content at all means the very first start had no connection, so the retry box stays up.
 */
@Composable
fun AppSplash(ready: Boolean, error: AppError?, onRetry: () -> Unit, onDone: () -> Unit) {
    val c = Jt.colors
    var minimumPassed by remember { mutableStateOf(false) }
    var slow by remember { mutableStateOf(false) }
    val done by rememberUpdatedState(onDone)
    LaunchedEffect(Unit) {
        delay(MIN_SPLASH_MS)
        minimumPassed = true
        delay(LOADING_AFTER_MS - MIN_SPLASH_MS)
        slow = true
    }
    LaunchedEffect(ready, minimumPassed) { if (ready && minimumPassed) done() }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().statusBarsPadding().padding(horizontal = 19.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            BrandMark(Modifier.padding(top = 120.dp).width(155.dp).height(100.dp))
            Text("جوان", style = text(36f, W.Black, lineHeight = 1.5f), color = c.ink, modifier = Modifier.padding(top = 12.dp).semantics { heading() })
            Text("سامانه رزرو و خرید بلیت رویدادها", style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center)
            Column(
                Modifier.padding(top = 56.dp).fillMaxWidth().heightIn(min = 200.dp).clip(JtShapes.hero).heroBackground().padding(18.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Text("دنیایی از تجربه‌های تازه", style = text(20f, W.Black, lineHeight = 1.8f), color = Color.White, textAlign = TextAlign.Center)
                Text("همایش‌ها • نمایشگاه‌ها • کنسرت‌ها", style = text(11f), color = Color.White, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
            }
        }
        if (error == null && slow && !ready) LoadingOverlay("در حال بارگذاری", "لطفاً چند لحظه منتظر بمانید.")
    }
    if (error != null && !ready) {
        StateDialog(StateSymbol.WARNING, "ارتباط برقرار نشد", "اتصال اینترنت را بررسی و دوباره تلاش کنید.", onRetry, actionLabel = "تلاش مجدد")
    }
}
