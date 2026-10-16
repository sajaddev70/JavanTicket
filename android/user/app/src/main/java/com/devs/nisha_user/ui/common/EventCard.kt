package com.devs.nisha_user.ui.common

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.Skeleton
import com.devs.nisha_user.core.designsystem.component.cardShadow
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.IranSans
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.domain.model.PublicEvent
import com.devs.nisha_user.ui.navigation.EventDetailRoute

/**
 * Event card used across the app (shared/EventCard.tsx):
 * - FEATURED: horizontal, poster on the start side (homepage rows, payment suggestions)
 * - GRID: poster on top (events screen)
 * - COMPACT: small horizontal card (homepage "رویدادهای این هفته")
 * - ROW: wide horizontal card (events screen, list view)
 */
enum class EventCardVariant { FEATURED, GRID, COMPACT, ROW }

data class EventWhen(val date: String, val time: String?)

fun eventWhen(e: PublicEvent): EventWhen {
    if (e.startDate != null && e.endDate != null && !Fa.sameDay(e.startDate, e.endDate)) {
        return EventWhen(Fa.dateRange(e.startDate, e.endDate), e.nextSessionAt?.let { Fa.time(it) })
    }
    val at = e.nextSessionAt ?: e.startDate
    return if (at != null) EventWhen(Fa.fullDate(at), Fa.time(at)) else EventWhen("زمان به‌زودی اعلام می‌شود", null)
}

fun eventPlace(e: PublicEvent, separator: String = " - "): String = listOfNotNull(e.cityName, e.hallName ?: e.venueName).joinToString(separator)

@Composable
fun FavoriteButton(eventId: Long, title: String, modifier: Modifier = Modifier, size: Dp = 36.dp) {
    val actions = LocalAppActions.current
    val on = actions.isFavorite(eventId)
    val c = Jt.colors
    Box(
        modifier
            .size(size)
            .clip(CircleShape)
            .background(c.surface.copy(alpha = 0.95f))
            .border(1.dp, c.line, CircleShape)
            .clickable(role = Role.Button, onClickLabel = if (on) "حذف $title از علاقه‌مندی‌ها" else "افزودن $title به علاقه‌مندی‌ها") { actions.toggleFavorite(eventId) },
        contentAlignment = Alignment.Center,
    ) {
        JtIcon(Lucide.Heart, size = 18.dp, tint = if (on) c.ticket else c.ink2, filled = on)
    }
}

/** "از ۴۵۰٬۰۰۰ تومان" with the number and unit in brand blue; "رایگان" for free events. */
@Composable
fun PriceText(price: Double?, modifier: Modifier = Modifier) {
    val c = Jt.colors
    val p = price ?: 0.0
    if (p <= 0.0) {
        Text(if (price == 0.0) "رایگان" else "", style = text(13f, W.Bold), color = c.successFg, modifier = modifier)
        return
    }
    Text(
        buildAnnotatedString {
            withStyle(SpanStyle(color = c.ink2)) { append("از ") }
            withStyle(SpanStyle(color = c.brand600, fontWeight = W.Black, fontSize = 14.sp)) { append(Fa.number(p)) }
            withStyle(SpanStyle(color = c.brand600, fontWeight = W.Bold)) { append(" تومان") }
        },
        style = text(13f).copy(fontFamily = IranSans),
        maxLines = 1,
        modifier = modifier,
    )
}

@Composable
private fun MetaLine(icon: LucidePaths, value: String, iconSize: Dp = 16.dp, size: Float = 12.5f) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
        JtIcon(icon, size = iconSize, tint = Jt.colors.muted)
        Text(value, style = text(size), color = Jt.colors.muted, maxLines = 1, overflow = TextOverflow.Ellipsis)
    }
}

@Composable
private fun SmallButton(label: String, onClick: () -> Unit) {
    Text(
        label,
        style = text(13f, W.Bold),
        color = Color.White,
        modifier = Modifier
            .clip(JtShapes.lg)
            .background(Jt.colors.brand600)
            .clickable(role = Role.Button, onClick = onClick)
            .heightIn(min = 40.dp)
            .padding(horizontal = 14.dp, vertical = 9.dp),
    )
}

@Composable
fun EventCard(event: PublicEvent, modifier: Modifier = Modifier, variant: EventCardVariant = EventCardVariant.GRID) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val open = { actions.navigate(EventDetailRoute(event.slug)) }
    val whenText = eventWhen(event)
    val place = eventPlace(event)
    val shape = JtShapes.xl2
    val frame = modifier
        .cardShadow(shape, c.shadow)
        .clip(shape)
        .background(c.surface)
        .border(1.dp, c.line, shape)
        .clickable(onClickLabel = event.title, onClick = open)

    when (variant) {
        EventCardVariant.COMPACT -> Row(frame.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            RemoteImage(event.bannerUrl, Modifier.width(104.dp).height(86.dp).clip(JtShapes.xl), fallback = event.categoryCoverUrl, contentDescription = event.title)
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(event.title, style = text(14f, W.Black, lineHeight = 1.7f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                if (place.isNotEmpty()) MetaLine(Lucide.MapPin, place, 14.dp, 12f)
                MetaLine(Lucide.CalendarDays, whenText.date, 14.dp, 12f)
            }
        }

        EventCardVariant.FEATURED, EventCardVariant.ROW -> Row(frame.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            RemoteImage(
                event.bannerUrl,
                Modifier.width(if (variant == EventCardVariant.ROW) 128.dp else 118.dp).then(if (variant == EventCardVariant.ROW) Modifier.aspectRatio(0.78f) else Modifier.height(168.dp)).clip(JtShapes.xl),
                fallback = event.categoryCoverUrl,
                contentDescription = event.title,
            )
            Column(Modifier.weight(1f).padding(vertical = 4.dp)) {
                Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        event.title,
                        style = text(15f, W.Black, lineHeight = 1.6f),
                        color = c.ink,
                        maxLines = 2,
                        minLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        modifier = Modifier.weight(1f),
                    )
                    FavoriteButton(event.id, event.title)
                }
                Column(Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    if (place.isNotEmpty()) MetaLine(Lucide.MapPin, place)
                    MetaLine(Lucide.CalendarDays, whenText.date)
                    whenText.time?.let { MetaLine(Lucide.Clock, it) }
                }
                Spacer(Modifier.weight(1f).heightIn(min = 12.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    PriceText(event.minPrice, Modifier.weight(1f))
                    SmallButton("خرید بلیت", open)
                }
            }
        }

        EventCardVariant.GRID -> Column(frame) {
            Box {
                RemoteImage(
                    event.bannerUrl,
                    Modifier.fillMaxWidth().aspectRatio(16f / 10f).clip(RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)),
                    fallback = event.categoryCoverUrl,
                    contentDescription = event.title,
                )
                FavoriteButton(event.id, event.title, Modifier.align(Alignment.TopEnd).padding(10.dp))
            }
            Column(Modifier.padding(12.dp)) {
                Text(event.title, style = text(15f, W.Black), color = c.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                if (place.isNotEmpty()) Box(Modifier.padding(top = 4.dp)) { MetaLine(Lucide.MapPin, eventPlace(event, "  |  ")) }
                Row(Modifier.fillMaxWidth().padding(top = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.weight(1f)) { MetaLine(Lucide.CalendarDays, whenText.date, size = 12f) }
                    whenText.time?.let { MetaLine(Lucide.Clock, it, size = 12f) }
                }
                Row(Modifier.fillMaxWidth().padding(top = 12.dp), verticalAlignment = Alignment.CenterVertically) {
                    PriceText(event.minPrice, Modifier.weight(1f))
                    SmallButton("مشاهده و خرید", open)
                }
            }
        }
    }
}

@Composable
fun EventCardSkeleton(modifier: Modifier = Modifier, variant: EventCardVariant = EventCardVariant.GRID) {
    val c = Jt.colors
    val frame = modifier.clip(JtShapes.xl2).background(c.surface).border(1.dp, c.line, JtShapes.xl2)
    if (variant == EventCardVariant.GRID) {
        Column(frame) {
            Skeleton(Modifier.fillMaxWidth().aspectRatio(16f / 10f), shape = RoundedCornerShape(0.dp))
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Skeleton(Modifier.fillMaxWidth(0.75f).height(16.dp))
                Skeleton(Modifier.fillMaxWidth(0.6f).height(12.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Skeleton(Modifier.width(96.dp).height(16.dp))
                    Skeleton(Modifier.width(96.dp).height(40.dp))
                }
            }
        }
    } else {
        val compact = variant == EventCardVariant.COMPACT
        Row(frame.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Skeleton(Modifier.width(if (compact) 104.dp else 118.dp).height(if (compact) 86.dp else 150.dp), shape = JtShapes.xl)
            Column(Modifier.weight(1f).fillMaxHeight().padding(vertical = 8.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Skeleton(Modifier.fillMaxWidth(0.8f).height(16.dp))
                Skeleton(Modifier.fillMaxWidth(0.6f).height(12.dp))
                Skeleton(Modifier.fillMaxWidth(0.5f).height(12.dp))
                if (!compact) Skeleton(Modifier.fillMaxWidth().height(36.dp))
            }
        }
    }
}
