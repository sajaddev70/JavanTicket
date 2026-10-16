package com.devs.nisha_user.ui.common

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.component.CardTitle
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.Order
import com.devs.nisha_user.domain.model.OrderSeat
import com.devs.nisha_user.domain.usecase.seatGroups

fun seatText(s: OrderSeat): String = "${s.sectionName?.let { "$it - " } ?: ""}ردیف ${s.rowLabel} - صندلی ${Fa.number(s.seatNumber)}"

@Composable
fun MetaRow(icon: LucidePaths, value: String, modifier: Modifier = Modifier, size: Float = 13.5f) {
    Row(modifier, verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        JtIcon(icon, size = 18.dp, tint = Jt.colors.ink2, modifier = Modifier.padding(top = 2.dp))
        Text(value, style = text(size), color = Jt.colors.ink2)
    }
}

enum class SummaryVariant { CHECKOUT, PAYMENT }

/** Sidebar "خلاصه سفارش": event, seats and the amounts exactly as the backend calculated them. */
@Composable
fun OrderSummary(order: Order, modifier: Modifier = Modifier, variant: SummaryVariant = SummaryVariant.CHECKOUT, extra: @Composable ColumnScope.() -> Unit = {}) {
    val c = Jt.colors
    val discount = order.discountAmount ?: 0.0
    JtCard(modifier.fillMaxWidth()) {
        CardTitle("خلاصه سفارش", Lucide.ShoppingCart)
        Row(Modifier.fillMaxWidth().padding(top = 16.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            RemoteImage(order.bannerUrl, Modifier.width(if (variant == SummaryVariant.CHECKOUT) 104.dp else 96.dp).aspectRatio(if (variant == SummaryVariant.CHECKOUT) 0.75f else 1f).clip(JtShapes.xl), contentDescription = order.eventTitle)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(order.eventTitle, style = text(16f, W.Black), color = c.ink)
                order.categoryName?.let { MetaRow(Lucide.Tag, it) }
                MetaRow(Lucide.CalendarDays, Fa.fullDate(order.startTime))
                MetaRow(Lucide.Clock, "ساعت ${Fa.time(order.startTime)}")
                MetaRow(Lucide.MapPin, listOfNotNull(order.hallName, order.venueName).joinToString(" - "))
            }
        }

        if (variant == SummaryVariant.CHECKOUT) {
            val tiers = order.seats.mapNotNull { it.tierName }.distinct().joinToString("، ")
            val sections = order.seats.mapNotNull { it.sectionName }.distinct().joinToString("، ")
            Column(Modifier.fillMaxWidth().padding(top = 16.dp).clip(JtShapes.xl2).background(c.surface2).padding(horizontal = 16.dp)) {
                SummaryRow(Lucide.Users, "تعداد بلیت‌ها", "${Fa.number(order.ticketsCount)} عدد")
                if (tiers.isNotEmpty()) {
                    HDivider()
                    SummaryRow(Lucide.Layers, "بخش سالن", listOf(tiers, sections).filter { it.isNotEmpty() }.joinToString(" - "))
                }
                if (order.seats.isNotEmpty()) {
                    HDivider()
                    SummaryRow(Lucide.Armchair, "شماره صندلی‌ها", order.seats.joinToString("، ") { "${it.rowLabel}${Fa.number(it.seatNumber)}" })
                }
            }
        } else {
            Column(Modifier.fillMaxWidth().padding(top = 16.dp)) {
                HDivider()
                Column(Modifier.padding(vertical = 14.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                    if (order.quantity != null) {
                        LineItem("× ${Fa.number(order.quantity)} بلیت ورود عمومی", null, Fa.price(order.unitPrice * order.quantity))
                    } else {
                        order.seatGroups().forEach { g ->
                            LineItem("× ${Fa.number(g.seats.size)} بلیت - ${g.name}", g.seats.joinToString("، ") { seatText(it) }, Fa.price(g.total))
                        }
                    }
                }
                HDivider()
            }
        }

        Column(Modifier.fillMaxWidth().padding(top = 16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            AmountRow("مبلغ بلیت‌ها", Fa.price(order.subtotal))
            if (discount > 0) AmountRow("تخفیف${order.discountCode?.let { " (${ltr(it)})" } ?: ""}", "- ${Fa.price(discount)}", color = c.successFg)
            if (order.serviceFee > 0) AmountRow("هزینه خدمات سامانه", Fa.price(order.serviceFee))
            Row(
                Modifier.fillMaxWidth().clip(JtShapes.xl2).background(c.brand50).padding(horizontal = 16.dp, vertical = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("جمع کل قابل پرداخت", style = text(15f, W.Black), color = c.ink, modifier = Modifier.weight(1f))
                Text(Fa.price(order.totalAmount), style = text(19f, W.Black), color = c.brand600)
            }
        }
        extra()
    }
}

@Composable
private fun SummaryRow(icon: LucidePaths, label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(vertical = 12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        JtIcon(icon, size = 20.dp, tint = Jt.colors.ink2)
        Text(label, style = text(14f), color = Jt.colors.ink2)
        Text(value, style = text(14f, W.Bold), color = Jt.colors.ink, modifier = Modifier.weight(1f), textAlign = androidx.compose.ui.text.style.TextAlign.Left)
    }
}

@Composable
private fun LineItem(title: String, detail: String?, amount: String) {
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(Modifier.weight(1f)) {
            Text(title, style = text(14f, W.Bold), color = Jt.colors.ink)
            if (detail != null) Text(detail, style = text(12.5f), color = Jt.colors.muted, modifier = Modifier.padding(top = 2.dp))
        }
        Text(amount, style = text(14f, W.Bold), color = Jt.colors.ink)
    }
}

@Composable
fun AmountRow(label: String, value: String, color: androidx.compose.ui.graphics.Color = Jt.colors.ink, labelColor: androidx.compose.ui.graphics.Color? = null) {
    Row(Modifier.fillMaxWidth()) {
        Text(label, style = text(14f), color = labelColor ?: if (color == Jt.colors.ink) Jt.colors.ink2 else color, modifier = Modifier.weight(1f))
        Text(value, style = text(14f, W.Bold), color = color)
    }
}
