package com.devs.nisha_user.ui.app

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
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

/**
 * Header of the main screens (layout/SiteHeader.tsx at phone width): logo, theme toggle, account and menu, then the
 * search box and the city picker. Every event list follows the city picked here.
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
) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    Column(modifier.fillMaxWidth().background(c.surface).statusBarsPadding()) {
        Row(Modifier.fillMaxWidth().height(64.dp).padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.clip(JtShapes.lg).clickable(role = Role.Button, onClickLabel = "صفحه اصلی") { actions.openLink("/") }) {
                BrandLogo(Modifier.height(44.dp).width(76.dp))
            }
            Spacer(Modifier.weight(1f))
            ThemeToggle(dark, onToggleTheme)
            Spacer(Modifier.width(6.dp))
            JtIconButton(
                Lucide.UserRound,
                onClick = { if (user != null) actions.navigate(ProfileRoute) else actions.navigate(LoginRoute()) },
                contentDescription = if (user != null) "حساب کاربری" else "ورود / ثبت‌نام",
                background = c.brand600,
                tint = Color.White,
                borderColor = null,
            )
            Spacer(Modifier.width(6.dp))
            JtIconButton(Lucide.Menu, onMenu, "باز کردن منو")
        }
        Row(Modifier.fillMaxWidth().padding(start = 16.dp, end = 16.dp, bottom = 12.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            SearchBox(initialQuery, Modifier.weight(1f)) { q -> onSearch?.invoke(q) ?: actions.navigate(EventsRoute(q = q.ifBlank { null })) }
            JtPicker(
                value = cityId,
                options = listOf(PickerOption<Long?>(null, "همه شهرها")) + cities.map { PickerOption<Long?>(it.id, it.name) },
                onSelect = onCity,
                icon = Lucide.MapPin,
                sheetTitle = "انتخاب شهر",
                height = 44.dp,
                compactText = true,
                modifier = Modifier.width(142.dp),
            )
        }
        HDivider(color = c.line.copy(alpha = 0.8f))
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
        placeholder = "جستجو در رویدادها ...",
        leading = Lucide.Search,
        height = 44.dp,
        background = Jt.colors.field,
        textStyle = text(13.5f),
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
) {
    val c = Jt.colors
    val actions = LocalAppActions.current
    JtBottomSheet(onDismiss = onDismiss, title = "منو") {
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
    Column(modifier.fillMaxWidth().background(c.navy950)) {
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

/** layout/MobileTabBar.tsx: خانه، رویدادها، بلیت‌های من، حساب من / ورود. */
@Composable
fun BottomTabBar(current: Tab?, signedIn: Boolean, onSelect: (Tab) -> Unit) {
    val c = Jt.colors
    val tabs = listOf(
        Triple(Tab.HOME, "خانه", Lucide.House),
        Triple(Tab.EVENTS, "رویدادها", Lucide.CalendarDays),
        Triple(Tab.TICKETS, "بلیت‌های من", Lucide.Ticket),
        Triple(Tab.ACCOUNT, if (signedIn) "حساب من" else "ورود", Lucide.UserRound),
    )
    Column(Modifier.fillMaxWidth().background(c.surface.copy(alpha = 0.97f))) {
        HDivider()
        Row(Modifier.fillMaxWidth().navigationBarsPadding().height(64.dp)) {
            tabs.forEach { (tab, label, icon) ->
                val active = tab == current
                Column(
                    Modifier.weight(1f).fillMaxWidth().clickable(role = Role.Tab, onClickLabel = label) { onSelect(tab) }.padding(top = 10.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(4.dp),
                ) {
                    JtIcon(icon, size = 22.dp, tint = if (active) c.brand600 else c.muted, strokeWidth = if (active) 2.2f else 1.8f)
                    Text(label, style = text(11.5f, W.Semibold), color = if (active) c.brand600 else c.muted)
                }
            }
        }
    }
}
