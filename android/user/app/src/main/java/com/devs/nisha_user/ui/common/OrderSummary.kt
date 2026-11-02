package com.devs.nisha_user.ui.common

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderSeat

fun seatText(s: OrderSeat): String = "${s.sectionName?.let { "$it - " } ?: ""}ردیف ${s.rowLabel} - صندلی ${Fa.number(s.seatNumber)}"

@Composable
fun MetaRow(icon: LucidePaths, value: String, modifier: Modifier = Modifier, size: Float = 13.5f) {
    Row(modifier, verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        JtIcon(icon, size = 18.dp, tint = Jt.colors.ink2, modifier = Modifier.padding(top = 2.dp))
        Text(value, style = text(size), color = Jt.colors.ink2)
    }
}

/** The order's event as the design's light card, with the amount the backend calculated. */
@Composable
fun OrderEventCard(order: Order, modifier: Modifier = Modifier) {
    EventSummaryCard(
        order.bannerUrl,
        order.eventTitle,
        "${Fa.fullDate(order.startTime)} · ساعت ${Fa.time(order.startTime)}",
        listOf(order.cityName, order.hallName).filter { it.isNotBlank() }.joinToString("، "),
        modifier.fillMaxWidth(),
    ) {
        val seats = if (order.quantity != null) "${Fa.number(order.quantity)} بلیت ورود عمومی" else order.seats.joinToString("، ") { "${it.rowLabel}${Fa.number(it.seatNumber)}" }
        if (seats.isNotEmpty()) Text(seats, style = text(11f), color = Jt.colors.muted, maxLines = 1)
        Text(Fa.price(order.totalAmount), style = text(13f, W.Black), color = Jt.colors.brand600)
    }
}

@Composable
fun AmountRow(label: String, value: String, color: androidx.compose.ui.graphics.Color = Jt.colors.ink, labelColor: androidx.compose.ui.graphics.Color? = null) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, style = text(14f), color = labelColor ?: if (color == Jt.colors.ink) Jt.colors.ink2 else color, modifier = Modifier.weight(1f))
        Text(value, style = text(14f, W.Bold), color = color)
    }
}
