package com.devs.nisha_user.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxScope
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.cardShadow
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.icon.PackageIcons
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.OnLight
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.ui.navigation.EventDetailRoute

data class EventWhen(val date: String, val time: String?)

fun eventWhen(e: PublicEvent): EventWhen {
    if (e.startDate != null && e.endDate != null && !Fa.sameDay(e.startDate, e.endDate)) {
        return EventWhen(Fa.dateRange(e.startDate, e.endDate), e.nextSessionAt?.let { Fa.time(it) })
    }
    val at = e.nextSessionAt ?: e.startDate
    return if (at != null) EventWhen(Fa.fullDate(at), Fa.time(at)) else EventWhen("زمان به‌زودی اعلام می‌شود", null)
}

fun eventPlace(e: PublicEvent, separator: String = "، "): String = listOfNotNull(e.cityName, e.hallName ?: e.venueName).joinToString(separator)

@Composable
fun FavoriteButton(eventId: Long, title: String, modifier: Modifier = Modifier, size: Dp = 32.dp) {
    val actions = LocalAppActions.current
    val on = actions.isFavorite(eventId)
    val c = Jt.colors
    Box(
        modifier
            .size(size)
            .clip(CircleShape)
            .background(Color.Black.copy(alpha = 0.3f))
            .clickable(role = Role.Button, onClickLabel = if (on) "حذف $title از علاقه‌مندی‌ها" else "افزودن $title به علاقه‌مندی‌ها") { actions.toggleFavorite(eventId) },
        contentAlignment = Alignment.Center,
    ) {
        JtIcon(Lucide.Heart, size = 17.dp, tint = if (on) c.ticket else Color.White, filled = on)
    }
}

/** "از ۱۵۰٬۰۰۰ تومان" in the design's .price; "رایگان" for free events. */
@Composable
fun PriceText(price: Double?, modifier: Modifier = Modifier) {
    val c = Jt.colors
    val p = price ?: 0.0
    when {
        p > 0.0 -> Text("از ${Fa.price(p)}", style = text(13f, W.Black), color = c.brand600, maxLines = 1, modifier = modifier)
        price == 0.0 -> Text("رایگان", style = text(13f, W.Black), color = c.successFg, modifier = modifier)
    }
}

@Composable
private fun MetaLine(icon: LucidePaths, value: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        JtIcon(icon, size = 13.dp, tint = Jt.colors.muted)
        Text(value, style = text(10f), color = Jt.colors.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

/** The design's .thumb: the event poster over the brand gradient (the gradient shows while it loads or if there is none). */
@Composable
fun EventThumb(banner: String?, fallback: String? = null, modifier: Modifier = Modifier, contentDescription: String? = null) {
    Box(modifier.clip(JtShapes.field).background(JtBrushes.thumb)) {
        RemoteImage(banner, Modifier.matchParentSize(), fallback = fallback, contentDescription = contentDescription, placeholder = Color.Transparent)
    }
}

/**
 * The design's .event: a light card with the poster, title, date and place. The same card appears on the home, events,
 * favorites, tickets, checkout, payment and order screens; [footer] is what differs (price, seat ...).
 */
@Composable
fun EventSummaryCard(
    banner: String?,
    title: String,
    date: String,
    place: String,
    modifier: Modifier = Modifier,
    fallback: String? = null,
    onClick: (() -> Unit)? = null,
    overlay: @Composable (BoxScope.() -> Unit)? = null,
    footer: @Composable ColumnScope.() -> Unit = {},
) {
    OnLight {
        val c = Jt.colors
        Row(
            modifier
                .cardShadow(JtShapes.event, Color.Black, 8.dp)
                .clip(JtShapes.event)
                .background(c.surface)
                .then(if (onClick != null) Modifier.clickable(onClickLabel = title, onClick = onClick) else Modifier)
                .heightIn(min = 113.dp)
                .padding(10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Box(Modifier.width(104.dp).height(94.dp)) {
                EventThumb(banner, fallback, Modifier.matchParentSize(), contentDescription = title)
                overlay?.invoke(this)
            }
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(title, style = text(13f, W.Bold, lineHeight = 1.7f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                MetaLine(PackageIcons.Clock, date)
                if (place.isNotEmpty()) MetaLine(PackageIcons.Location, place)
                footer()
            }
        }
    }
}

@Composable
fun EventCard(event: PublicEvent, modifier: Modifier = Modifier) {
    val actions = LocalAppActions.current
    EventSummaryCard(
        event.bannerUrl,
        event.title,
        eventWhen(event).date,
        eventPlace(event),
        modifier,
        fallback = event.categoryCoverUrl,
        onClick = { actions.navigate(EventDetailRoute(event.slug)) },
        overlay = { Box(Modifier.matchParentSize().padding(4.dp), contentAlignment = Alignment.TopEnd) { FavoriteButton(event.id, event.title) } },
    ) {
        PriceText(event.minPrice)
    }
}

@Composable
fun EventCardSkeleton(modifier: Modifier = Modifier) {
    Row(modifier.clip(JtShapes.event).background(Jt.colors.surface).padding(10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        Skeleton(Modifier.width(104.dp).height(94.dp), shape = JtShapes.field)
        Column(Modifier.weight(1f).padding(vertical = 6.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Skeleton(Modifier.fillMaxWidth(0.8f).height(14.dp))
            Skeleton(Modifier.fillMaxWidth(0.6f).height(10.dp))
            Skeleton(Modifier.fillMaxWidth(0.5f).height(10.dp))
        }
    }
}
