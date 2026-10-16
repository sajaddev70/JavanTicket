package com.devs.nisha_user.ui.account

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.ui.app.ACCOUNT_LINKS
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.Route

/** Account pages' menu at phone width (features/account/AccountShell.tsx): one chip per page, the current one filled. */
@Composable
fun AccountTabs(current: Route, modifier: Modifier = Modifier) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    LazyRow(modifier, contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(ACCOUNT_LINKS, key = { it.second }) { (route, label, icon) ->
            val active = route == current
            Row(
                Modifier
                    .clip(JtShapes.xl)
                    .background(if (active) c.brand600 else c.surface)
                    .border(1.dp, if (active) c.brand600 else c.line, JtShapes.xl)
                    .semantics { selected = active }
                    .clickable(role = Role.Tab) { if (!active) actions.replace(route) }
                    .heightIn(min = 44.dp)
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                JtIcon(icon, size = 18.dp, tint = if (active) Color.White else c.ink2)
                Text(label, style = text(13.5f, W.Bold), color = if (active) Color.White else c.ink2)
            }
        }
    }
}
