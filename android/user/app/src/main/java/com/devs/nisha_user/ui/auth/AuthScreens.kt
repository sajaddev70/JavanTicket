package com.devs.nisha_user.ui.auth

import com.devs.nisha_user.core.format.ltr
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.LinkAnnotation
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextLinkStyles
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.withLink
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import coil.decode.SvgDecoder
import coil.request.ImageRequest
import com.devs.nisha_user.core.designsystem.component.BrandLogo
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.HDivider
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.JtCard
import com.devs.nisha_user.core.designsystem.component.JtIconButton
import com.devs.nisha_user.core.designsystem.component.LocalSiteSettings
import com.devs.nisha_user.core.designsystem.component.RemoteImage
import com.devs.nisha_user.core.designsystem.component.SvgIcon
import com.devs.nisha_user.core.designsystem.component.assetUrl
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.maskMobile
import com.devs.nisha_user.core.format.toEnDigits
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.domain.model.Feature
import com.devs.nisha_user.domain.model.PageBlock
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.VerifyRoute

/** Decorative background of the auth screens: the AUTH_HERO image faded towards the page, and the site's wave. */
@Composable
private fun AuthBackground(hero: PageBlock?) {
    val c = Jt.colors
    val context = LocalContext.current
    Box(Modifier.fillMaxSize()) {
        RemoteImage(hero?.imageUrl, Modifier.fillMaxSize(), alpha = if (c.isDark) 0.2f else 0.35f, placeholder = c.page)
        Box(Modifier.fillMaxSize().background(Brush.radialGradient(listOf(c.page, c.page.copy(alpha = 0.7f)), radius = 1400f)))
        AsyncImage(
            model = remember { ImageRequest.Builder(context).data(assetUrl("auth/login-wave.svg")).decoderFactory(SvgDecoder.Factory()).build() },
            contentDescription = null,
            alpha = if (c.isDark) 0.2f else 0.7f,
            modifier = Modifier.align(Alignment.BottomCenter).fillMaxWidth().aspectRatio(1200f / 320f),
        )
    }
}

@Composable
fun LoginScreen(hero: PageBlock?, features: List<Feature>, viewModel: LoginViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    val siteName = LocalSiteSettings.current?.siteName.orEmpty()
    val focus = remember { FocusRequester() }
    LaunchedEffect(viewModel) { viewModel.sent.collect { mobile -> actions.navigate(VerifyRoute(mobile, viewModel.next)) } }
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }

    Box(Modifier.fillMaxSize()) {
        AuthBackground(hero)
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().navigationBarsPadding()) {
            Row(Modifier.fillMaxWidth().padding(top = 40.dp, start = 8.dp)) { JtIconButton(Lucide.ArrowRight, actions.back, "بازگشت", borderColor = null) }
            JtCard(Modifier.padding(16.dp).fillMaxWidth(), padding = PaddingValues(horizontal = 20.dp, vertical = 32.dp)) {
                BrandLogo(Modifier.align(Alignment.CenterHorizontally).width(112.dp).height(96.dp))
                Text("ورود / ثبت‌نام", style = text(26f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 20.dp))
                Text("برای ادامه، شماره موبایل خود را وارد کنید.", style = text(15f), color = c.ink2, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth().padding(top = 8.dp))

                Text("شماره موبایل", style = text(15f, W.Bold), color = c.ink, modifier = Modifier.padding(top = 28.dp, bottom = 10.dp))
                CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .heightIn(min = 56.dp)
                            .clip(JtShapes.xl)
                            .background(c.surface)
                            .border(1.dp, if (s.error != null) c.danger.copy(alpha = 0.6f) else c.lineStrong, JtShapes.xl),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Row(Modifier.padding(horizontal = 16.dp).semantics { contentDescription = "پیش‌شماره ایران" }, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("🇮🇷", style = text(20f))
                            Text("+98", style = text(16f, W.Bold), color = c.ink)
                        }
                        Box(Modifier.width(1.dp).height(56.dp).background(c.line))
                        BasicTextField(
                            value = s.mobile,
                            onValueChange = { viewModel.setMobile(it.take(16)) },
                            singleLine = true,
                            textStyle = text(17f).copy(color = c.ink, textAlign = TextAlign.Left),
                            cursorBrush = SolidColor(c.brand600),
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Go),
                            keyboardActions = KeyboardActions(onGo = { viewModel.submit() }),
                            modifier = Modifier.weight(1f).padding(horizontal = 16.dp).focusRequester(focus).semantics { contentDescription = "شماره موبایل" },
                            decorationBox = { inner ->
                                Box {
                                    if (s.mobile.isEmpty()) Text("0912 345 6789", style = text(17f), color = c.muted.copy(alpha = 0.7f))
                                    inner()
                                }
                            },
                        )
                    }
                }
                Text(s.error ?: "کد تأیید به این شماره ارسال خواهد شد.", style = text(13f, if (s.error != null) W.Semibold else W.Normal), color = if (s.error != null) c.dangerFg else c.muted, modifier = Modifier.padding(top = 8.dp))
                JtButton(if (s.sending) "در حال ارسال کد ..." else "دریافت کد تأیید", viewModel::submit, Modifier.padding(top = 20.dp), size = ButtonSize.XL, block = true, loading = s.sending, trailing = if (s.sending) null else Lucide.ArrowLeft)

                val shown = features.take(3)
                if (shown.isNotEmpty()) {
                    Row(Modifier.fillMaxWidth().padding(vertical = 24.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        HDivider(Modifier.weight(1f))
                        Text("یا", style = text(13f), color = c.muted)
                        HDivider(Modifier.weight(1f))
                    }
                    Row(Modifier.fillMaxWidth()) {
                        shown.forEach { f ->
                            Column(Modifier.weight(1f).padding(horizontal = 6.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                                Box(Modifier.size(48.dp).clip(CircleShape).background(c.brand50), contentAlignment = Alignment.Center) { SvgIcon(f.iconUrl, size = 24.dp, tint = c.brand600) }
                                Text(f.title, style = text(13f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 8.dp))
                                f.description?.let { Text(it, style = text(11.5f, lineHeight = 1.7f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp)) }
                            }
                        }
                    }
                }
                val link = TextLinkStyles(SpanStyle(color = c.brand600, fontWeight = W.Bold))
                Text(
                    buildAnnotatedString {
                        append("با ورود یا ثبت‌نام، ")
                        withLink(LinkAnnotation.Clickable("terms", link) { actions.navigate(ContentRoute("terms")) }) { append("قوانین و مقررات") }
                        append(" و ")
                        withLink(LinkAnnotation.Clickable("privacy", link) { actions.navigate(ContentRoute("privacy")) }) { append("حریم خصوصی") }
                        append(" $siteName را می‌پذیرید.")
                    },
                    style = text(13f, lineHeight = 2f),
                    color = c.ink2,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
                )
            }
        }
    }
}

@Composable
fun VerifyScreen(hero: PageBlock?, viewModel: VerifyViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    LaunchedEffect(viewModel) { viewModel.done.collect { next -> actions.finishLogin(next) } }

    Box(Modifier.fillMaxSize()) {
        AuthBackground(hero)
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().navigationBarsPadding(), verticalArrangement = Arrangement.Center) {
            Row(Modifier.fillMaxWidth().padding(top = 40.dp, start = 8.dp)) { JtIconButton(Lucide.ArrowRight, actions.back, "بازگشت", borderColor = null) }
            JtCard(Modifier.padding(16.dp).fillMaxWidth(), padding = PaddingValues(horizontal = 20.dp, vertical = 36.dp)) {
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    BrandLogo(Modifier.width(110.dp).height(92.dp))
                    Text("کد تأیید را وارد کنید", style = text(24f, W.Black), color = c.ink, modifier = Modifier.padding(top = 20.dp))
                    Text(
                        "یک کد ${toFaDigits(VERIFY_LENGTH.toString())} رقمی به شماره ${ltr(maskMobile(viewModel.mobile))} ارسال شد.",
                        style = text(15f),
                        color = c.ink2,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 12.dp),
                    )
                    OtpInput(s.digits, viewModel::setDigits, enabled = !s.verifying, invalid = s.error != null, modifier = Modifier.padding(top = 28.dp))
                    Text(s.error.orEmpty(), style = text(14f, W.Semibold), color = c.dangerFg, textAlign = TextAlign.Center, modifier = Modifier.heightIn(min = 24.dp).padding(top = 12.dp))
                    Row(Modifier.padding(top = 8.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        JtIcon(Lucide.Clock, size = 20.dp, tint = c.ink2)
                        if (s.resendLeft > 0) {
                            Text("ارسال مجدد کد در", style = text(14.5f), color = c.ink2)
                            Text(Fa.clock(s.resendLeft.toLong()), style = text(14.5f, W.Black), color = c.brand600)
                        } else {
                            Text("کد را دریافت نکردید؟", style = text(14.5f), color = c.ink2)
                        }
                    }
                    Row(Modifier.padding(top = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        TextAction("ارسال مجدد کد", Lucide.RefreshCw, enabled = s.resendLeft == 0 && !s.resending, onClick = viewModel::resend)
                        Box(Modifier.width(1.dp).height(24.dp).background(c.lineStrong))
                        TextAction("تغییر شماره موبایل", Lucide.Pencil, enabled = true, onClick = actions.back)
                    }
                    JtButton(
                        if (s.verifying) "در حال بررسی ..." else "ورود به حساب",
                        viewModel::submit,
                        Modifier.padding(top = 24.dp),
                        size = ButtonSize.XL,
                        block = true,
                        enabled = s.complete,
                        loading = s.verifying,
                        trailing = if (s.verifying) null else Lucide.ChevronLeft,
                    )
                }
            }
        }
    }
}

private const val VERIFY_LENGTH = 4

@Composable
private fun TextAction(label: String, icon: LucidePaths, enabled: Boolean, onClick: () -> Unit) {
    val c = Jt.colors
    val color = if (enabled) c.brand600 else c.brand600.copy(alpha = 0.4f)
    Row(
        Modifier.clip(JtShapes.lg).clickable(enabled = enabled, onClick = onClick).heightIn(min = 44.dp).padding(horizontal = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        JtIcon(icon, size = 20.dp, tint = color)
        Text(label, style = text(14.5f, W.Bold), color = color)
    }
}

/**
 * Four single-digit boxes (components/auth/OtpInput.tsx) backed by one hidden field: typing advances, backspace goes
 * back, and a pasted / autofilled code fills every box. The keyboard's SMS-code suggestion fills it too.
 */
@Composable
fun OtpInput(digits: List<String>, onChange: (List<String>) -> Unit, modifier: Modifier = Modifier, enabled: Boolean = true, invalid: Boolean = false) {
    val c = Jt.colors
    val focus = remember { FocusRequester() }
    val value = digits.joinToString("")
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }
    CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
        BasicTextField(
            value = TextFieldValue(value, TextRange(value.length)),
            onValueChange = { v ->
                val clean = toEnDigits(v.text).filter { it.isDigit() }.take(digits.size)
                onChange(List(digits.size) { i -> clean.getOrNull(i)?.toString().orEmpty() })
            },
            enabled = enabled,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword, imeAction = ImeAction.Done),
            textStyle = text(1f).copy(color = Color.Transparent),
            cursorBrush = SolidColor(Color.Transparent),
            modifier = modifier.focusRequester(focus).semantics { contentDescription = "کد تأیید ${Fa.number(digits.size)} رقمی" },
            decorationBox = {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    digits.forEachIndexed { i, d ->
                        val active = enabled && i == value.length.coerceAtMost(digits.size - 1)
                        Box(
                            Modifier
                                .size(64.dp)
                                .then(if (active) Modifier.border(4.dp, c.brand500.copy(alpha = 0.10f), JtShapes.xl2) else Modifier)
                                .clip(JtShapes.xl2)
                                .background(c.surface)
                                .border(2.dp, if (invalid) c.danger.copy(alpha = 0.5f) else if (active) c.brand500 else if (d.isNotEmpty()) c.brand500.copy(alpha = 0.4f) else c.lineStrong, JtShapes.xl2),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(toFaDigits(d), style = text(30f, W.Black), color = c.ink)
                        }
                    }
                }
            },
        )
    }
}
