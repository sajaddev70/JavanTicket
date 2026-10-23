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
import com.devs.nisha_user.core.designsystem.icon.PackageIcons
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Vazirmatn
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
            .background(Color.Black.copy(alpha = 0.22f))
            .clickable(role = Role.Button, onClickLabel = if (on) "حذف $title از علاقه‌مندی‌ها" else "افزودن $title به علاقه‌مندی‌ها") { actions.toggleFavorite(eventId) },
        contentAlignment = Alignment.Center,
    ) {
        JtIcon(Lucide.Heart, size = 20.dp, tint = if (on) c.ticket else Color.White, filled = on)
    }
}

/** White date tile on the poster corner: "۲۸ / اردیبهشت" (next session, else the start date). */
@Composable
fun DateBadge(iso: String, modifier: Modifier = Modifier) {
    val c = Jt.colors
    Column(
        modifier.clip(JtShapes.xl).background(c.surface.copy(alpha = 0.95f)).padding(horizontal = 9.dp, vertical = 5.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Text(Fa.day(iso), style = text(17f, W.Black, lineHeight = 1.3f), color = c.ink)
        Text(Fa.month(iso), style = text(10.5f, W.Medium, lineHeight = 1.3f), color = c.ink2)
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
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        JtIcon(PackageIcons.Ticket, size = 18.dp, tint = c.brand600, strokeWidth = 1.8f)
        Text(
            buildAnnotatedString {
                withStyle(SpanStyle(color = c.brand600)) { append("از ") }
                withStyle(SpanStyle(color = c.brand600, fontWeight = W.Black, fontSize = 14.5.sp)) { append(Fa.number(p)) }
                withStyle(SpanStyle(color = c.brand600, fontWeight = W.Bold)) { append(" تومان") }
            },
            style = text(13f).copy(fontFamily = Vazirmatn),
            maxLines = 1,
        )
    }
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
            .clip(JtShapes.xl)
            .background(Jt.colors.brand600)
            .clickable(role = Role.Button, onClick = onClick)
            .heightIn(min = 44.dp)
            .padding(horizontal = 16.dp, vertical = 11.dp),
    )
}

@Composable
fun EventCard(event: PublicEvent, modifier: Modifier = Modifier, variant: EventCardVariant = EventCardVariant.GRID) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val open = { actions.navigate(EventDetailRoute(event.slug)) }
    val whenText = eventWhen(event)
    val place = eventPlace(event)
    val shape = JtShapes.event
    val badge = event.nextSessionAt ?: event.startDate
    val frame = modifier
        .cardShadow(shape, c.shadow)
        .clip(shape)
        .background(c.surface)
        .border(1.dp, c.line, shape)
        .clickable(onClickLabel = event.title, onClick = open)

    when (variant) {
        // Text on the start side, the portrait poster on the end side (reference 01, "پیشنهادهای این هفته").
        EventCardVariant.COMPACT -> Row(frame.padding(8.dp).heightIn(min = 140.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Column(Modifier.weight(1f).padding(vertical = 6.dp, horizontal = 4.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(event.title, style = text(14.5f, W.Black, lineHeight = 1.6f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                (event.hallName ?: event.venueName ?: event.cityName)?.let { MetaLine(PackageIcons.Location, it, 15.dp, 12.5f) }
                MetaLine(PackageIcons.Calendar, whenText.date, 15.dp, 12.5f)
                Spacer(Modifier.weight(1f))
                PriceText(event.minPrice)
            }
            Box(Modifier.width(120.dp).fillMaxHeight()) {
                RemoteImage(event.bannerUrl, Modifier.matchParentSize().clip(JtShapes.xl2), fallback = event.categoryCoverUrl, contentDescription = event.title)
                FavoriteButton(event.id, event.title, Modifier.align(Alignment.TopEnd).padding(6.dp), size = 36.dp)
            }
        }

        // Poster on top with the date badge, then title, venue and the starting price (reference 01, "رویدادهای ویژه").
        EventCardVariant.FEATURED -> Column(frame) {
            Box {
                RemoteImage(event.bannerUrl, Modifier.fillMaxWidth().aspectRatio(1.08f), fallback = event.categoryCoverUrl, contentDescription = event.title)
                FavoriteButton(event.id, event.title, Modifier.align(Alignment.TopEnd).padding(8.dp), size = 40.dp)
                badge?.let { DateBadge(it, Modifier.align(Alignment.BottomStart).padding(8.dp)) }
            }
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text(event.title, style = text(15f, W.Black), color = c.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                (event.hallName ?: event.venueName ?: event.cityName)?.let { MetaLine(PackageIcons.Location, it) }
                PriceText(event.minPrice)
            }
        }

        EventCardVariant.ROW -> Row(frame.padding(10.dp), horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            Box(Modifier.width(128.dp).aspectRatio(0.78f)) {
                RemoteImage(event.bannerUrl, Modifier.matchParentSize().clip(JtShapes.xl2), fallback = event.categoryCoverUrl, contentDescription = event.title)
                FavoriteButton(event.id, event.title, Modifier.align(Alignment.TopEnd).padding(6.dp), size = 36.dp)
            }
            Column(Modifier.weight(1f).padding(vertical = 4.dp)) {
                Text(event.title, style = text(15f, W.Black, lineHeight = 1.6f), color = c.ink, maxLines = 2, overflow = TextOverflow.Ellipsis)
                Column(Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    MetaLine(PackageIcons.Calendar, whenText.time?.let { "${whenText.date}، ساعت $it" } ?: whenText.date)
                    if (place.isNotEmpty()) MetaLine(PackageIcons.Location, place)
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
                RemoteImage(event.bannerUrl, Modifier.fillMaxWidth().aspectRatio(16f / 9f), fallback = event.categoryCoverUrl, contentDescription = event.title)
                FavoriteButton(event.id, event.title, Modifier.align(Alignment.TopEnd).padding(10.dp), size = 40.dp)
                badge?.let { DateBadge(it, Modifier.align(Alignment.BottomStart).padding(10.dp)) }
            }
            Column(Modifier.padding(14.dp)) {
                Text(event.title, style = text(16f, W.Black), color = c.ink, maxLines = 1, overflow = TextOverflow.Ellipsis)
                event.subtitle?.let { Text(it, style = text(12.5f), color = c.muted, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                Column(Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    MetaLine(PackageIcons.Calendar, whenText.time?.let { "${whenText.date}، ساعت $it" } ?: whenText.date)
                    if (place.isNotEmpty()) MetaLine(PackageIcons.Location, eventPlace(event, "، "))
                }
                Row(Modifier.fillMaxWidth().padding(top = 14.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    SmallButton("خرید بلیت ←", open)
                    Spacer(Modifier.weight(1f))
                    Box(Modifier.clip(JtShapes.xl).background(c.brand50).padding(horizontal = 10.dp, vertical = 8.dp)) { PriceText(event.minPrice) }
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
