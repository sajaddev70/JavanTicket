package com.devs.nisha_user.ui.app

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
import com.devs.nisha_user.core.designsystem.icon.PackageIcons
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.invisibleToUser
import androidx.compose.ui.graphics.drawscope.withTransform
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.draw.shadow
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.component.BrandLogo
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.JtBottomSheet
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.GlassIconButton
import com.devs.nisha_user.core.designsystem.component.JtPicker
import com.devs.nisha_user.core.designsystem.component.JtTextField
import com.devs.nisha_user.core.designsystem.component.LogoVariant
import com.devs.nisha_user.core.designsystem.component.PickerOption
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.JtIcons
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.maskMobile
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.domain.model.AuthUser
import com.devs.nisha_user.domain.model.City
import com.devs.nisha_user.domain.model.Navigation
import com.devs.nisha_user.domain.model.SiteSettings
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.EventsRoute
import com.devs.nisha_user.ui.navigation.FavoritesRoute
import com.devs.nisha_user.ui.navigation.LoginRoute
import com.devs.nisha_user.ui.navigation.OrdersRoute
import com.devs.nisha_user.ui.navigation.ProfileRoute
import com.devs.nisha_user.ui.navigation.Route
import com.devs.nisha_user.ui.navigation.TicketsRoute
import kotlinx.coroutines.launch

/** Account links of the menu and the profile screen (layout/UserMenu.tsx ACCOUNT_LINKS). */
val ACCOUNT_LINKS: List<Triple<Route, String, LucidePaths>> = listOf(
    Triple(ProfileRoute, "حساب کاربری", Lucide.UserRound),
    Triple(TicketsRoute, "بلیت‌های من", Lucide.Ticket),
    Triple(OrdersRoute, "سفارش‌های من", Lucide.Receipt),
    Triple(FavoritesRoute, "علاقه‌مندی‌ها", Lucide.Heart),
)

/** Stroke colors of the official mark variants (file/Javan_SVG_Assets/logos/svg). */
enum class BrandTone(val a: Long, val b: Long, val c: Long, val dot: Boolean) {
    /** javan_logo_icon.svg — for light surfaces */
    COLOR(0xFF163C8C, 0xFF2F80FF, 0xFF6EB8FF, true),
    /** light-cyan rendering on the navy band (references) */
    LIGHT(0xFFFFFFFF, 0xFF9FD0FF, 0xFF6EB8FF, true),
    /** javan_logo_icon_mono_light.svg */
    WHITE(0xFFFFFFFF, 0xFFFFFFFF, 0xFFFFFFFF, false),
    /** javan_logo_icon_mono_dark.svg */
    NAVY(0xFF163C8C, 0xFF163C8C, 0xFF163C8C, false),
}

/** The Javan mark (javan_logo_icon.svg) drawn natively: six strokes fanning out under the red dot. */
@Composable
fun BrandMark(modifier: Modifier = Modifier, tone: BrandTone = BrandTone.LIGHT) {
    Canvas(modifier.semantics { invisibleToUser() }) {
        // viewBox "40 36 176 162" of the icon, scaled into the canvas keeping the aspect ratio.
        val k = minOf(size.width / 176f, size.height / 162f)
        withTransform({ translate((size.width - 176f * k) / 2, (size.height - 162f * k) / 2); scale(k, k, pivot = Offset.Zero); translate(-40f, -36f) }) {
            val colors = listOf(Color(tone.a), Color(tone.b), Color(tone.c))
            listOf(
                Triple(floatArrayOf(118f, 66.32f, 94f, 98.32f, 70f, 132.32f, 48f, 174.08f), 0, 1f),
                Triple(floatArrayOf(128f, 72.32f, 114f, 102.32f, 110f, 142.32f, 110f, 189.44f), 1, 1f),
                Triple(floatArrayOf(138f, 66.32f, 162f, 98.32f, 186f, 132.32f, 208f, 174.08f), 2, 1f),
                Triple(floatArrayOf(128f, 72.32f, 142f, 102.32f, 146f, 142.32f, 146f, 189.44f), 1, 0.95f),
                Triple(floatArrayOf(122f, 64.32f, 123f, 76.32f, 125f, 86.32f, 128f, 92.32f), 0, 0.95f),
                Triple(floatArrayOf(134f, 64.32f, 133f, 76.32f, 131f, 86.32f, 128f, 92.32f), 2, 0.95f),
            ).forEach { (p, ci, alpha) ->
                drawPath(
                    Path().apply { moveTo(p[0], p[1]); cubicTo(p[2], p[3], p[4], p[5], p[6], p[7]) },
                    colors[ci].copy(alpha = alpha),
                    style = Stroke(11.52f, cap = StrokeCap.Round),
                )
            }
            if (tone.dot) drawCircle(Color(0xFFFF5A75), 15.36f, Offset(128f, 56.32f))
        }
    }
}

/**
 * Horizontal lockup (javan_logo_horizontal_*): the mark on the start side, then the site name from the admin settings
 * ("مرکز همایش و نمایش" / "جوان"). [onBand] = the white version used on the navy header band of the references.
 */
@Composable
fun AppLogo(settings: SiteSettings?, modifier: Modifier = Modifier, onBand: Boolean = true) {
    val ink = if (onBand || Jt.colors.isDark) Color.White else Jt.colors.navy800
    val name = settings?.shortName?.trim()?.ifBlank { null } ?: settings?.siteName?.trim().orEmpty()
    val full = settings?.siteName?.trim().orEmpty()
    val kicker = if (name.isNotEmpty() && full.contains(name) && full != name) full.replace(name, "").trim() else null
    Row(modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        BrandMark(Modifier.width(52.dp).height(48.dp), tone = if (onBand || Jt.colors.isDark) BrandTone.LIGHT else BrandTone.COLOR)
        if (name.isNotEmpty()) {
            Column {
                kicker?.let { Text(it, style = text(10f, W.Bold, lineHeight = 1.3f), color = ink.copy(alpha = 0.92f), maxLines = 1) }
                Text(name, style = text(24f, W.Black, lineHeight = 1.15f), color = ink)
            }
        }
    }
}

/**
 * Header on the navy band (references 01, 02): the white logo on the start side, a glass city pill, round glass
 * account and menu buttons on the end side, then (on the events screen) the glass search field. Every event list
 * follows the city picked here.
 */
@Composable
fun SiteHeader(
    user: AuthUser?,
    cities: List<City>,
    cityId: Long?,
    onCity: (Long?) -> Unit,
    dark: Boolean,
    onToggleTheme: () -> Unit,
    onMenu: () -> Unit,
    modifier: Modifier = Modifier,
    initialQuery: String = "",
    onSearch: ((String) -> Unit)? = null,
    showSearch: Boolean = true,
) {
    val actions = LocalAppActions.current
    val settings = com.devs.nisha_user.core.designsystem.component.LocalSiteSettings.current
    Column(modifier.fillMaxWidth().statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(76.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.clip(JtShapes.lg).clickable(role = Role.Button, onClickLabel = "صفحه اصلی") { actions.openLink("/") }.heightIn(min = 44.dp), contentAlignment = Alignment.Center) {
                AppLogo(settings)
            }
            Spacer(Modifier.weight(1f))
            JtPicker(
                value = cityId,
                options = listOf(PickerOption<Long?>(null, "همه شهرها")) + cities.map { PickerOption<Long?>(it.id, it.name) },
                onSelect = onCity,
                icon = PackageIcons.Location,
                sheetTitle = "انتخاب شهر",
                height = 44.dp,
                compactText = true,
                glass = true,
                modifier = Modifier.widthIn(min = 92.dp, max = 140.dp),
            )
            Spacer(Modifier.width(8.dp))
            if (!showSearch) {
                GlassIconButton(PackageIcons.Search, { actions.navigate(EventsRoute()) }, "جستجو در رویدادها")
                Spacer(Modifier.width(8.dp))
            }
            GlassIconButton(Lucide.Menu, onMenu, "باز کردن منو")
        }
        if (showSearch) {
            Box(Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 12.dp)) {
                SearchBox(initialQuery, Modifier.fillMaxWidth()) { q -> onSearch?.invoke(q) ?: actions.navigate(EventsRoute(q = q.ifBlank { null })) }
            }
        }
    }
}

/** layout/SearchBox.tsx: search the events by title. */
@Composable
fun SearchBox(initial: String, modifier: Modifier = Modifier, onSubmit: (String) -> Unit) {
    var q by rememberSaveable(initial) { mutableStateOf(initial) }
    val focus = LocalFocusManager.current
    JtTextField(
        value = q,
        onValueChange = { q = it },
        placeholder = "جستجو در رویدادها و نمایشگاه‌ها...",
        leading = PackageIcons.Search,
        height = 50.dp,
        glass = true,
        textStyle = text(14f),
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
        keyboardActions = KeyboardActions(onSearch = {
            focus.clearFocus()
            onSubmit(q.trim())
        }),
        modifier = modifier,
    )
}

/** ui/ThemeToggle.tsx: sun in dark mode, moon in light mode. */
@Composable
fun ThemeToggle(dark: Boolean, onToggle: () -> Unit) {
    JtIconButton(if (dark) Lucide.Sun else Lucide.Moon, onToggle, if (dark) "حالت روشن" else "حالت تیره", tint = Jt.colors.ink2)
}

/** Phone menu (the header's drawer): header links, account links, sign in / out, contacts and socials. */
@Composable
fun MenuSheet(
    navigation: Navigation?,
    settings: SiteSettings?,
    user: AuthUser?,
    onSignOut: () -> Unit,
    onDismiss: () -> Unit,
    dark: Boolean = false,
    onToggleTheme: (() -> Unit)? = null,
) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    JtBottomSheet(onDismiss = onDismiss, title = "منو") {
        if (onToggleTheme != null) {
            Row(Modifier.fillMaxWidth().heightIn(min = 52.dp), verticalAlignment = Alignment.CenterVertically) {
                Text("حالت نمایش (روشن / تیره)", style = text(15f, W.Semibold), color = c.ink, modifier = Modifier.weight(1f))
                ThemeToggle(dark, onToggleTheme)
            }
            HDivider(color = c.line.copy(alpha = 0.7f))
        }
        navigation?.header?.forEach { link ->
            Row(
                Modifier
                    .fillMaxWidth()
                    .clickable {
                        onDismiss()
                        actions.openLink(link.url)
                    }
                    .heightIn(min = 52.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(link.title, style = text(15f, W.Semibold), color = c.ink, modifier = Modifier.weight(1f))
                JtIcon(Lucide.ChevronLeft, size = 18.dp, tint = c.muted)
            }
            HDivider(color = c.line.copy(alpha = 0.7f))
        }
        Spacer(Modifier.height(16.dp))
        if (user != null) {
            Text(ltr(maskMobile(user.mobile)), style = text(12.5f), color = c.muted, modifier = Modifier.padding(bottom = 4.dp))
            ACCOUNT_LINKS.forEach { (route, label, icon) ->
                MenuItem(label, icon) {
                    onDismiss()
                    actions.navigate(route)
                }
            }
            MenuItem("خروج از حساب", Lucide.LogOut, danger = true) {
                onDismiss()
                onSignOut()
            }
        } else {
            JtButton("ورود / ثبت‌نام", { onDismiss(); actions.navigate(LoginRoute()) }, block = true, size = ButtonSize.LG, leading = Lucide.LogIn)
        }
        if (settings != null) {
            Spacer(Modifier.height(20.dp))
            ContactList(settings, onDark = false)
            Spacer(Modifier.height(12.dp))
            SocialLinks(settings, onDark = false)
        }
        Spacer(Modifier.height(8.dp))
    }
}

@Composable
private fun MenuItem(label: String, icon: LucidePaths, danger: Boolean = false, onClick: () -> Unit) {
    val c = Jt.colors
    Row(
        Modifier.fillMaxWidth().clip(JtShapes.xl).clickable(onClick = onClick).heightIn(min = 48.dp).padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        JtIcon(icon, size = 20.dp, tint = if (danger) c.dangerFg else c.ink2)
        Text(label, style = text(14.5f, W.Semibold), color = if (danger) c.dangerFg else c.ink)
    }
}

@Composable
fun ContactList(settings: SiteSettings, onDark: Boolean) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val color = if (onDark) Color.White.copy(alpha = 0.8f) else c.ink2
    val iconColor = if (onDark) Color.White.copy(alpha = 0.7f) else c.muted
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        settings.contactPhone?.let { phone ->
            ContactLine(Lucide.Phone, ltr(toFaDigits(phone)), color, iconColor) { actions.openLink("tel:" + phone.filter { it.isDigit() || it == '+' }) }
        }
        settings.contactEmail?.let { email -> ContactLine(Lucide.Mail, email, color, iconColor) { actions.openLink("mailto:$email") } }
        settings.address?.let { ContactLine(Lucide.MapPin, it, color, iconColor, null) }
    }
}

@Composable
private fun ContactLine(icon: LucidePaths, value: String, color: Color, iconColor: Color, onClick: (() -> Unit)?) {
    Row(
        Modifier.then(if (onClick != null) Modifier.clip(JtShapes.lg).clickable(onClick = onClick) else Modifier),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        JtIcon(icon, size = 17.dp, tint = iconColor, modifier = Modifier.padding(top = 2.dp))
        Text(value, style = text(13f, lineHeight = 1.9f), color = color)
    }
}

@Composable
fun SocialLinks(settings: SiteSettings, onDark: Boolean) {
    val actions = LocalAppActions.current
    val c = Jt.colors
    val socials: List<Triple<String, String, ImageVector>> = listOfNotNull(
        settings.telegramUrl?.let { Triple(it, "تلگرام", JtIcons.vector(Lucide.Send, 1.8f)) },
        settings.instagramUrl?.let { Triple(it, "اینستاگرام", JtIcons.Instagram) },
        settings.linkedinUrl?.let { Triple(it, "لینکدین", JtIcons.LinkedIn) },
        settings.aparatUrl?.let { Triple(it, "آپارات", JtIcons.Aparat) },
    )
    if (socials.isEmpty()) return
    Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        socials.forEach { (url, label, icon) ->
            Box(
                Modifier
                    .size(40.dp)
                    .clip(CircleShape)
                    .border(1.dp, if (onDark) Color.White.copy(alpha = 0.25f) else c.lineStrong, CircleShape)
                    .clickable(role = Role.Button, onClickLabel = label) { actions.openLink(url) },
                contentAlignment = Alignment.Center,
            ) {
                JtIcon(icon, size = 18.dp, tint = if (onDark) Color.White.copy(alpha = 0.9f) else c.ink2, contentDescription = label)
            }
        }
    }
}

/** layout/SiteFooter.tsx: newsletter, socials, contacts, link columns, footer text, logo and copyright. */
@Composable
fun SiteFooter(settings: SiteSettings?, navigation: Navigation?, onSubscribe: suspend (String) -> String?, modifier: Modifier = Modifier) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    val scope = rememberCoroutineScope()
    var email by rememberSaveable { mutableStateOf("") }
    var status by remember { mutableStateOf<Pair<Boolean, String>?>(null) }
    var sending by remember { mutableStateOf(false) }
    Column(modifier.fillMaxWidth().clip(JtShapes.sheet).background(Jt.brushes.bandSolid)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 32.dp), verticalArrangement = Arrangement.spacedBy(28.dp)) {
            Column {
                Text(settings?.newsletterTitle ?: "خبرنامه", style = text(15f, W.Extrabold), color = Color.White)
                Row(
                    Modifier.padding(top = 14.dp).fillMaxWidth().height(48.dp).clip(JtShapes.xl).background(Color.White).padding(4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    JtTextField(
                        value = email,
                        onValueChange = { email = it; status = null },
                        placeholder = "ایمیل خود را وارد کنید",
                        ltr = true,
                        textAlign = TextAlign.Right,
                        height = 40.dp,
                        background = Color.White,
                        textStyle = text(13f).copy(color = Color(0xFF0F1B33)),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email, imeAction = ImeAction.Send),
                        modifier = Modifier.weight(1f),
                    )
                    JtButton(
                        "عضویت",
                        onClick = {
                            scope.launch {
                                sending = true
                                val error = onSubscribe(email)
                                sending = false
                                status = if (error == null) true to "عضویت شما در خبرنامه ثبت شد." else false to error
                                if (error == null) email = ""
                            }
                        },
                        size = ButtonSize.SM,
                        loading = sending,
                        shape = JtShapes.lg,
                    )
                }
                status?.let { (ok, msg) ->
                    Text(msg, style = text(12f), color = if (ok) Color(0xFF4ADE80) else Color(0xFFFB7185), modifier = Modifier.padding(top = 8.dp))
                }
                if (settings != null) {
                    Spacer(Modifier.height(12.dp))
                    SocialLinks(settings, onDark = true)
                }
            }
            if (settings != null && (settings.contactPhone != null || settings.contactEmail != null || settings.address != null)) {
                Column {
                    Text("تماس با ما", style = text(15f, W.Extrabold), color = Color.White, modifier = Modifier.padding(bottom = 14.dp))
                    ContactList(settings, onDark = true)
                }
            }
            navigation?.footer?.forEach { col ->
                Column {
                    Text(col.title, style = text(15f, W.Extrabold), color = Color.White, modifier = Modifier.padding(bottom = 8.dp))
                    col.links.forEach { l ->
                        Text(
                            l.title,
                            style = text(13f),
                            color = Color.White.copy(alpha = 0.75f),
                            modifier = Modifier.clip(JtShapes.md).clickable { actions.openLink(l.url) }.heightIn(min = 34.dp).padding(vertical = 6.dp),
                        )
                    }
                }
            }
            settings?.footerText?.let { Text(it, style = text(13f, lineHeight = 2.1f), color = Color.White.copy(alpha = 0.75f)) }
            BrandLogo(Modifier.width(104.dp).height(90.dp), variant = LogoVariant.LIGHT)
        }
        HDivider(color = Color.White.copy(alpha = 0.1f))
        settings?.siteName?.let {
            Text(
                "تمامی حقوق برای $it محفوظ است. © ${Fa.year()}",
                style = text(12.5f),
                color = Color.White.copy(alpha = 0.55f),
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
            )
        }
    }
}

enum class Tab { HOME, EVENTS, TICKETS, ACCOUNT }

/** Bottom navigation of the references: خانه، رویدادها، بلیت‌های من، پروفایل; the active tab in violet on a soft pill. */
@Composable
fun BottomTabBar(current: Tab?, signedIn: Boolean, onSelect: (Tab) -> Unit) {
    val c = Jt.colors
    val tabs = listOf(
        Triple(Tab.HOME, "خانه", PackageIcons.Home),
        Triple(Tab.EVENTS, "رویدادها", PackageIcons.Events),
        Triple(Tab.TICKETS, "بلیت‌های من", PackageIcons.MyTickets),
        Triple(Tab.ACCOUNT, "پروفایل", PackageIcons.Profile),
    )
    Column(
        Modifier
            .fillMaxWidth()
            .shadow(16.dp, JtShapes.sheet, ambientColor = c.shadow.copy(alpha = 0.08f), spotColor = c.shadow.copy(alpha = 0.08f))
            .clip(JtShapes.sheet)
            .background(c.surface)
            .border(1.dp, c.line, JtShapes.sheet),
    ) {
        Row(Modifier.fillMaxWidth().navigationBarsPadding().height(66.dp)) {
            tabs.forEach { (tab, label, icon) ->
                val active = tab == current
                Box(
                    Modifier.weight(1f).fillMaxHeight().clickable(role = Role.Tab, onClickLabel = label) { onSelect(tab) }
                        .semantics { selected = active },
                    contentAlignment = Alignment.Center,
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Box(
                            Modifier.width(48.dp).height(32.dp).clip(CircleShape).background(if (active) c.purpleBg else Color.Transparent),
                            contentAlignment = Alignment.Center,
                        ) {
                            JtIcon(icon, size = 23.dp, tint = if (active) c.purple else c.ink2, strokeWidth = if (active) 2.1f else 1.8f)
                        }
                        Text(label, style = text(11.5f, if (active) W.Black else W.Bold), color = if (active) c.purple else c.ink2)
                    }
                }
            }
        }
    }
}
