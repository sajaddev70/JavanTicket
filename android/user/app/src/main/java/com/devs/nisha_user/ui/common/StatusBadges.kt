package com.devs.nisha_user.ui.common

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.devs.nisha_user.core.designsystem.component.Badge
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.domain.model.OrderStatus
import com.devs.nisha_user.domain.model.TicketStatus

/** Order status labels and colors (orders/OrderStatusBadge.tsx). */
@Composable
fun OrderStatusBadge(status: OrderStatus, modifier: Modifier = Modifier) {
    val c = Jt.colors
    val (label, bg, fg) = when (status) {
        OrderStatus.PENDING -> Triple("در انتظار پرداخت", c.warningBg, c.pendingFg)
        OrderStatus.PAID -> Triple("پرداخت شده", c.successBg, c.successFg)
        OrderStatus.CANCELLED -> Triple("لغو شده", c.field, c.ink2)
        OrderStatus.REFUNDED -> Triple("مسترد شده", c.dangerBg, c.dangerFg)
    }
    Badge(label, bg, fg, modifier)
}

data class TicketState(val label: String, val background: Color, val color: Color, val icon: LucidePaths)

/** Ticket state (tickets/TicketStatusBadge.tsx): valid, used or cancelled (also when its session was cancelled). */
@Composable
fun ticketState(status: TicketStatus, sessionCancelled: Boolean = false): TicketState {
    val c = Jt.colors
    return when {
        status == TicketStatus.CANCELLED || sessionCancelled -> TicketState("لغو شده", c.dangerBg, c.dangerFg, Lucide.CircleX)
        status == TicketStatus.USED -> TicketState("استفاده شده", c.field, c.ink2, Lucide.ScanLine)
        else -> TicketState("معتبر", c.success, Color.White, Lucide.CircleCheck)
    }
}

@Composable
fun TicketStatusBadge(status: TicketStatus, modifier: Modifier = Modifier, sessionCancelled: Boolean = false, large: Boolean = false) {
    val s = ticketState(status, sessionCancelled)
    Badge(s.label, s.background, s.color, modifier, icon = if (large) s.icon else null, large = large)
}
