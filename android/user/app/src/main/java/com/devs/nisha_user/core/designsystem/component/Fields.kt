package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextDirection
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.runtime.CompositionLocalProvider
import com.devs.nisha_user.core.designsystem.icon.JtIcon
import com.devs.nisha_user.core.designsystem.icon.Lucide
import com.devs.nisha_user.core.designsystem.icon.LucidePaths
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.core.designsystem.theme.JtShapes
import com.devs.nisha_user.core.designsystem.theme.W
import com.devs.nisha_user.core.designsystem.theme.text

/** Label above a control, with the required asterisk, plus the error (or hint) under it. */
@Composable
fun FieldFrame(
    label: String?,
    modifier: Modifier = Modifier,
    required: Boolean = false,
    error: String? = null,
    hint: String? = null,
    content: @Composable () -> Unit,
) {
    val c = Jt.colors
    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (label != null) {
            Row {
                Text(label, style = text(13.5f, W.Semibold), color = c.ink)
                if (required) Text(" *", style = text(13.5f, W.Bold), color = c.dangerFg)
            }
        }
        content()
        when {
            error != null -> Text(error, style = text(12.5f, W.Semibold), color = c.dangerFg)
            hint != null -> Text(hint, style = text(12.5f), color = c.muted)
        }
    }
}

/**
 * Text input (min-h-12 rounded-xl border bg-surface, brand border and ring when focused, danger border on error).
 * [ltr] is for numbers, mobiles, emails and codes, which read left to right.
 */
@Composable
fun JtTextField(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    placeholder: String? = null,
    required: Boolean = false,
    error: String? = null,
    hint: String? = null,
    enabled: Boolean = true,
    ltr: Boolean = false,
    singleLine: Boolean = true,
    minLines: Int = 1,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    leading: LucidePaths? = null,
    trailing: @Composable (() -> Unit)? = null,
    textStyle: TextStyle = text(14.5f),
    textAlign: TextAlign? = null,
    background: Color = Jt.colors.surface,
    height: Dp = 48.dp,
) {
    val c = Jt.colors
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val borderColor = when {
        error != null -> c.danger.copy(alpha = 0.6f)
        focused -> c.brand500.copy(alpha = 0.6f)
        else -> c.lineStrong
    }
    FieldFrame(label, modifier, required, error, hint) {
        val field: @Composable () -> Unit = {
            BasicTextField(
                value = value,
                onValueChange = onValueChange,
                enabled = enabled,
                singleLine = singleLine,
                minLines = minLines,
                keyboardOptions = keyboardOptions,
                keyboardActions = keyboardActions,
                interactionSource = interaction,
                cursorBrush = SolidColor(c.brand600),
                textStyle = textStyle.copy(
                    color = if (enabled) c.ink else c.muted,
                    textAlign = textAlign ?: (if (ltr) TextAlign.Left else TextAlign.Right),
                    textDirection = if (ltr) TextDirection.Ltr else TextDirection.ContentOrRtl,
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .semantics {
                        if (error != null) error(error)
                        if (label != null) contentDescription = label
                    },
                decorationBox = { inner ->
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .defaultMinSize(minHeight = height)
                            .then(if (focused) Modifier.border(BorderStroke(4.dp, (if (error != null) c.danger else c.brand500).copy(alpha = 0.10f)), JtShapes.xl) else Modifier)
                            .clip(JtShapes.xl)
                            .background(if (enabled) background else c.field)
                            .border(1.dp, borderColor, JtShapes.xl)
                            .padding(horizontal = 14.dp, vertical = if (singleLine) 0.dp else 12.dp),
                        verticalAlignment = if (singleLine) Alignment.CenterVertically else Alignment.Top,
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        if (leading != null) JtIcon(leading, size = 18.dp, tint = c.ink2)
                        Box(Modifier.weight(1f), contentAlignment = if (singleLine) Alignment.CenterStart else Alignment.TopStart) {
                            if (value.isEmpty() && placeholder != null) {
                                Text(
                                    placeholder,
                                    style = textStyle.copy(textAlign = textAlign ?: (if (ltr) TextAlign.Left else TextAlign.Right)),
                                    color = c.muted.copy(alpha = 0.8f),
                                    maxLines = if (singleLine) 1 else Int.MAX_VALUE,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.fillMaxWidth(),
                                )
                            }
                            inner()
                        }
                        trailing?.invoke()
                    }
                },
            )
        }
        // LTR fields keep their own direction so the caret and digits behave like the web's dir="ltr" inputs.
        if (ltr) CompositionLocalProvider(LocalLayoutDirection provides LayoutDirection.Ltr) { field() } else field()
    }
}

@Composable
fun JtCheckbox(checked: Boolean, onCheckedChange: (Boolean) -> Unit, modifier: Modifier = Modifier, error: Boolean = false, label: @Composable () -> Unit) {
    val c = Jt.colors
    Row(
        modifier
            .clip(JtShapes.lg)
            .clickable(role = Role.Checkbox, onClick = { onCheckedChange(!checked) })
            .semantics { stateDescription = if (checked) "انتخاب شده" else "انتخاب نشده" }
            .padding(vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Box(
            Modifier
                .size(22.dp)
                .clip(JtShapes.md)
                .background(if (checked) c.brand600 else c.surface)
                .border(1.5.dp, if (checked) c.brand600 else if (error) c.danger else c.lineStrong, JtShapes.md),
            contentAlignment = Alignment.Center,
        ) {
            if (checked) JtIcon(Lucide.Check, size = 16.dp, tint = Color.White, strokeWidth = 3f)
        }
        label()
    }
}

data class PickerOption<T>(val value: T, val label: String)

/**
 * The site's <Select>: a bordered control showing the current option; tapping it opens a bottom sheet with the
 * options (the native-feeling equivalent of a dropdown on phones).
 */
@Composable
fun <T> JtPicker(
    value: T,
    options: List<PickerOption<T>>,
    onSelect: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: String? = null,
    icon: LucidePaths? = null,
    sheetTitle: String = label ?: "انتخاب کنید",
    height: Dp = 48.dp,
    compactText: Boolean = false,
    /** Soft field-colored pill without a border (header city selector of the references). */
    filled: Boolean = false,
) {
    val c = Jt.colors
    var open by remember { mutableStateOf(false) }
    val shape = if (filled) RoundedCornerShape(14.dp) else JtShapes.xl
    val current = options.firstOrNull { it.value == value }?.label ?: options.firstOrNull()?.label.orEmpty()
    FieldFrame(label, modifier) {
        Row(
            Modifier
                .fillMaxWidth()
                .heightIn(min = height)
                .clip(shape)
                .background(if (filled) c.field else c.surface)
                .then(if (filled) Modifier else Modifier.border(1.dp, c.lineStrong, shape))
                .clickable(role = Role.DropdownList, onClickLabel = sheetTitle) { open = true }
                .padding(horizontal = 12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            if (icon != null) JtIcon(icon, size = 18.dp, tint = if (filled) c.ink else c.ink2)
            Text(current, style = text(if (compactText) 13.5f else 14f, W.Bold), color = c.ink, maxLines = 1, modifier = Modifier.weight(1f))
            JtIcon(Lucide.ChevronDown, size = 16.dp, tint = c.muted)
        }
    }
    if (open) {
        JtBottomSheet(onDismiss = { open = false }, title = sheetTitle) {
            LazyColumn(Modifier.fillMaxWidth().heightIn(max = 460.dp)) {
                items(options, key = { it.value.toString() + it.label }) { o ->
                    val selected = o.value == value
                    Row(
                        Modifier
                            .fillMaxWidth()
                            .clip(JtShapes.xl)
                            .clickable {
                                onSelect(o.value)
                                open = false
                            }
                            .background(if (selected) c.brand50 else Color.Transparent)
                            .heightIn(min = 52.dp)
                            .padding(horizontal = 14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(o.label, style = text(15f, if (selected) W.Bold else W.Normal), color = if (selected) c.brand600 else c.ink, modifier = Modifier.weight(1f))
                        if (selected) JtIcon(Lucide.Check, size = 20.dp, tint = c.brand600)
                    }
                }
            }
        }
    }
}

/** Digits typed with any keyboard, kept as Latin digits for the API. */
val NumberKeyboard = KeyboardOptions(keyboardType = KeyboardType.Number)
