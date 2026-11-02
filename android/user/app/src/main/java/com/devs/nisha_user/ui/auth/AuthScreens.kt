package com.devs.nisha_user.ui.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
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
import com.devs.nisha_user.core.designsystem.component.BrandMark
import com.devs.nisha_user.core.designsystem.component.BrandRow
import com.devs.nisha_user.core.designsystem.component.ButtonSize
import com.devs.nisha_user.core.designsystem.component.JtButton
import com.devs.nisha_user.core.designsystem.component.LoadingOverlay
import com.devs.nisha_user.core.designsystem.component.LocalSiteSettings
import com.devs.nisha_user.core.designsystem.component.RoundButton
import com.devs.nisha_user.core.designsystem.component.StateDialog
import com.devs.nisha_user.core.designsystem.component.StateSymbol
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtBrushes
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text
import com.devs.nisha_user.core.format.Fa
import com.devs.nisha_user.core.format.ltr
import com.devs.nisha_user.core.format.maskMobile
import com.devs.nisha_user.core.format.toEnDigits
import com.devs.nisha_user.core.format.toFaDigits
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.ContentRoute
import com.devs.nisha_user.ui.navigation.VerifyRoute

/** 02 ورود و ثبت‌نام: عادی، شماره نامعتبر، در حال ارسال کد. */
@Composable
fun LoginScreen(viewModel: LoginViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    val siteName = LocalSiteSettings.current?.siteName.orEmpty()
    val focus = remember { FocusRequester() }
    LaunchedEffect(viewModel) { viewModel.sent.collect { mobile -> actions.navigate(VerifyRoute(mobile, viewModel.next)) } }
    LaunchedEffect(Unit) { runCatching { focus.requestFocus() } }

    Box(Modifier.fillMaxSize()) {
        Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().navigationBarsPadding().statusBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp)) {
            BrandRow { RoundButton(Lucide.ChevronLeft, actions.back, "بازگشت") }
            Column(Modifier.fillMaxWidth().padding(top = 56.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                BrandMark(Modifier.width(110.dp).height(88.dp))
                Text("ورود به حساب کاربری", style = text(24f, W.Black), color = c.ink, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 16.dp).semantics { heading() })
                Text("با شماره موبایل خود وارد شوید", style = text(12f, lineHeight = 2f), color = c.muted, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp))
            }
            Text("شماره موبایل", style = text(11f), color = c.muted, modifier = Modifier.padding(top = 40.dp, bottom = 7.dp))
            CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) {
                Row(
                    Modifier.fillMaxWidth().heightIn(min = 49.dp).clip(JtShapes.field).background(c.field).border(1.dp, c.lineStrong, JtShapes.field).padding(horizontal = 15.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    Text("+98", style = text(14f, W.Bold), color = c.ink, modifier = Modifier.semantics { contentDescription = "پیش‌شماره ایران" })
                    BasicTextField(
                        value = s.mobile,
                        onValueChange = { viewModel.setMobile(it.take(16)) },
                        singleLine = true,
                        textStyle = text(15f).copy(color = c.ink, textAlign = TextAlign.Left),
                        cursorBrush = SolidColor(c.brand500),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone, imeAction = ImeAction.Go),
                        keyboardActions = KeyboardActions(onGo = { viewModel.submit() }),
                        modifier = Modifier.weight(1f).focusRequester(focus).semantics { contentDescription = "شماره موبایل" },
                        decorationBox = { inner ->
                            Box {
                                if (s.mobile.isEmpty()) Text("0912 123 4567", style = text(15f), color = c.muted.copy(alpha = 0.7f))
                                inner()
                            }
                        },
                    )
                }
            }
            JtButton("دریافت کد تأیید", viewModel::submit, Modifier.padding(top = 16.dp), size = ButtonSize.XL, block = true, loading = s.sending, trailing = Lucide.ArrowLeft)
            val link = TextLinkStyles(SpanStyle(color = c.brand500, fontWeight = W.Bold))
            Text(
                buildAnnotatedString {
                    append("ورود به معنای پذیرش ")
                    withLink(LinkAnnotation.Clickable("terms", link) { actions.navigate(ContentRoute("terms")) }) { append("قوانین و مقررات") }
                    append(" و ")
                    withLink(LinkAnnotation.Clickable("privacy", link) { actions.navigate(ContentRoute("privacy")) }) { append("حریم خصوصی") }
                    append(" $siteName است.")
                },
                style = text(12f, lineHeight = 2f),
                color = c.muted,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(top = 16.dp),
            )
        }
        if (s.sending) LoadingOverlay("در حال ارسال پیامک", "کد تأیید برای شماره شما ارسال می‌شود.")
    }
    s.error?.let { error ->
        // Connection and server failures keep their own message; everything before the request is a bad number.
        StateDialog(
            StateSymbol.WARNING,
            if (error.status == null && !error.offline) "شماره موبایل نامعتبر است" else if (error.offline) "ارتباط برقرار نشد" else "ارسال کد انجام نشد",
            if (error.status == null && !error.offline) "شماره موبایل را با فرمت صحیح وارد کنید." else error.message,
            onAction = viewModel::dismissError,
            actionLabel = "تلاش مجدد",
        )
    }
}

/** 03 تأیید شماره موبایل: عادی، کد اشتباه، انقضای کد، تأیید موفق. */
@Composable
fun VerifyScreen(viewModel: VerifyViewModel = hiltViewModel()) {
    val s by viewModel.state.collectAsStateWithLifecycle()
    val actions = LocalAppActions.current
    val c = Jt.colors
    LaunchedEffect(viewModel) { viewModel.done.collect { next -> actions.finishLogin(next) } }

    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).imePadding().navigationBarsPadding().statusBarsPadding().padding(horizontal = 19.dp, vertical = 8.dp)) {
        BrandRow { RoundButton(Lucide.ChevronLeft, actions.back, "بازگشت") }
        Column(Modifier.fillMaxWidth().padding(top = 40.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(StateSymbol.SHIELD, style = text(70f, lineHeight = 1.25f))
            Text("تأیید شماره موبایل", style = text(22f, W.Black), color = c.ink, modifier = Modifier.padding(top = 12.dp).semantics { heading() })
            Text(
                "کد ${toFaDigits(VERIFY_LENGTH.toString())} رقمی ارسال‌شده به ${ltr(maskMobile(viewModel.mobile))} را وارد کنید.",
                style = text(12f, lineHeight = 2f),
                color = c.muted,
                textAlign = TextAlign.Center,
                modifier = Modifier.padding(top = 8.dp),
            )
            OtpInput(s.digits, viewModel::setDigits, enabled = !s.verifying, invalid = s.problem != null, modifier = Modifier.padding(top = 20.dp))
            if (s.resendLeft > 0) {
                Text("ارسال مجدد کد در ${Fa.clock(s.resendLeft.toLong())}", style = text(12f), color = c.muted, modifier = Modifier.padding(top = 18.dp))
            } else {
                Text(
                    "ارسال مجدد کد",
                    style = text(13f, W.Bold),
                    color = c.brand500,
                    modifier = Modifier.padding(top = 10.dp).clip(JtShapes.lg).clickable(enabled = !s.resending, onClick = viewModel::resend).heightIn(min = 44.dp).padding(horizontal = 12.dp, vertical = 10.dp),
                )
            }
            Row(
                Modifier.padding(top = 4.dp).clip(JtShapes.lg).clickable(onClick = actions.back).heightIn(min = 44.dp).padding(horizontal = 12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text("ویرایش شماره موبایل", style = text(13f), color = c.ink)
                JtIcon(Lucide.Pencil, size = 14.dp, tint = c.ink)
            }
            JtButton("تأیید و ورود", viewModel::submit, Modifier.padding(top = 12.dp), size = ButtonSize.XL, block = true, enabled = s.complete, loading = s.verifying, trailing = if (s.verifying) null else Lucide.ArrowLeft)
            Spacer(Modifier.height(16.dp))
        }
    }

    when (val p = s.problem) {
        is VerifyProblem.Wrong -> StateDialog(StateSymbol.WARNING, "کد واردشده صحیح نیست", "لطفاً کد پیامک‌شده را دوباره بررسی کنید.", viewModel::dismissProblem, actionLabel = "تلاش مجدد")
        is VerifyProblem.Expired -> StateDialog(StateSymbol.WAIT, "زمان اعتبار کد تمام شد", "برای دریافت کد جدید اقدام کنید.", viewModel::dismissProblem)
        is VerifyProblem.Other -> StateDialog(StateSymbol.WARNING, "تأیید انجام نشد", p.message, viewModel::dismissProblem, actionLabel = "تلاش مجدد")
        null -> Unit
    }
    if (s.verified) {
        StateDialog(StateSymbol.SUCCESS, "شماره تأیید شد", "اکنون می‌توانید وارد حساب خود شوید.", viewModel::finish)
    }
}

private const val VERIFY_LENGTH = 4

/**
 * Round digit chips (the first filled or current one in the gradient) backed by one hidden field: typing advances,
 * backspace goes back, and a pasted or SMS-suggested code fills every chip.
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
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    digits.forEachIndexed { i, d ->
                        val active = enabled && i == value.length.coerceAtMost(digits.size - 1)
                        Box(
                            Modifier
                                .size(56.dp)
                                .clip(CircleShape)
                                .then(if (active) Modifier.background(JtBrushes.chip) else Modifier.background(c.field).border(1.dp, if (invalid) c.danger else c.lineStrong, CircleShape)),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(toFaDigits(d), style = text(22f, W.Black), color = if (active) Color.White else c.ink)
                        }
                    }
                }
            },
        )
    }
}
