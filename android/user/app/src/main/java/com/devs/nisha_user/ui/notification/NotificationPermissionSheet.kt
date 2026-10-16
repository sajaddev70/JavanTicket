package com.devs.nisha_user.ui.notification

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.ButtonVariant
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

@Composable
fun NotificationPermissionSheet(
    onRequestPermission: () -> Unit,
    onDismiss: () -> Unit,
) {
    val c = Jt.colors

    JtBottomSheet(
        onDismiss = onDismiss,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            Box(
                modifier = Modifier
                    .size(64.dp)
                    .clip(JtShapes.xl2)
                    .background(c.brand50),
                contentAlignment = Alignment.Center,
            ) {
                JtIcon(Lucide.Bell, size = 32.dp, tint = c.brand600)
            }

            Spacer(Modifier.height(16.dp))

            Text(
                text = "از اعلان‌های برنامه باخبر شو",
                style = text(18f, W.Black),
                color = c.ink,
                textAlign = TextAlign.Center,
            )

            Spacer(Modifier.height(8.dp))

            Text(
                text = "برای اطلاع از وضعیت درخواست‌ها و دریافت به‌روزرسانی‌های مهم، اجازه ارسال اعلان را فعال کن.",
                style = text(14f, W.Medium, lineHeight = 1.8f),
                color = c.muted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(horizontal = 8.dp),
            )

            Spacer(Modifier.height(24.dp))

            JtButton(
                text = "فعال‌سازی اعلان‌ها",
                onClick = onRequestPermission,
                variant = ButtonVariant.PRIMARY,
                size = ButtonSize.LG,
                block = true,
                leading = Lucide.Bell,
            )

            Spacer(Modifier.height(8.dp))

            JtButton(
                text = "فعلاً نه",
                onClick = onDismiss,
                variant = ButtonVariant.GHOST,
                size = ButtonSize.MD,
                block = true,
            )
        }
    }
}
