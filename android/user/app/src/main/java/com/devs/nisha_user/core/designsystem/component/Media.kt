package com.devs.nisha_user.core.designsystem.component

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import coil.decode.SvgDecoder
import coil.request.ImageRequest
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.domain.model.SiteSettings

/** Origin of the backend ("http://host:8081"), which serves /media and /uploads. */
val LocalMediaOrigin = staticCompositionLocalOf { "" }

/** Site settings (logo, contacts, fee ...) for components deep in the tree. */
val LocalSiteSettings = staticCompositionLocalOf<SiteSettings?> { null }

/** Resolves an image path stored in the database to a loadable URL, like the web's mediaUrl(). */
fun mediaUrl(origin: String, path: String?): String? {
    if (path.isNullOrBlank()) return null
    if (Regex("^(https?:|data:|file:)").containsMatchIn(path)) return path
    return origin + (if (path.startsWith("/")) "" else "/") + path
}

@Composable
fun rememberMediaUrl(path: String?): String? {
    val origin = LocalMediaOrigin.current
    return remember(origin, path) { mediaUrl(origin, path) }
}

/** The site's own files (frontend/user/public/assets/...), bundled under assets/web/. */
fun assetUrl(path: String): String = "file:///android_asset/web/${path.removePrefix("/assets/").removePrefix("/")}"

/**
 * Remote image that falls back to [fallback] (e.g. the category cover) and then to an empty field-colored box, like
 * the web's SmartImage.
 */
@Composable
fun RemoteImage(
    path: String?,
    modifier: Modifier = Modifier,
    fallback: String? = null,
    contentDescription: String? = null,
    contentScale: ContentScale = ContentScale.Crop,
    alpha: Float = 1f,
    placeholder: Color = Jt.colors.field,
) {
    val primary = rememberMediaUrl(path)
    val second = rememberMediaUrl(fallback)
    var failed by remember(primary) { mutableStateOf(false) }
    val url = if (failed || primary == null) second else primary
    Box(modifier.background(placeholder)) {
        if (url != null) {
            AsyncImage(
                model = url,
                contentDescription = contentDescription,
                contentScale = contentScale,
                alpha = alpha,
                onError = { if (url == primary) failed = true },
                modifier = Modifier.matchParentSize(),
            )
        }
    }
}

/**
 * Line icon (SVG) painted in [tint], like the web's SvgIcon CSS mask: backend paths (/media/...) or the site's own
 * files (/assets/...).
 */
@Composable
fun SvgIcon(src: String?, modifier: Modifier = Modifier, size: Dp = 20.dp, tint: Color = Jt.colors.ink) {
    val origin = LocalMediaOrigin.current
    val url = remember(origin, src) { if (src?.startsWith("/assets/") == true) assetUrl(src) else mediaUrl(origin, src) } ?: return
    val context = LocalContext.current
    val request = remember(url) { ImageRequest.Builder(context).data(url).decoderFactory(SvgDecoder.Factory()).build() }
    AsyncImage(model = request, contentDescription = null, colorFilter = ColorFilter.tint(tint), contentScale = ContentScale.Fit, modifier = modifier.size(size))
}

/** Line icons shipped with the site for the usual category kinds, used when a category has no icon of its own. */
private val CATEGORY_FALLBACKS = mapOf(
    "music" to "music", "concert" to "music", "theater" to "theater", "conference" to "conference", "workshop" to "education",
    "education" to "education", "sports" to "sports", "exhibition" to "exhibition", "kids" to "children", "children" to "children",
    "family" to "family", "business" to "business", "technology" to "technology",
)

fun categoryIconSrc(slug: String?, iconUrl: String?): String =
    iconUrl?.takeIf { it.isNotBlank() } ?: "/assets/icons/categories/${CATEGORY_FALLBACKS[slug.orEmpty()] ?: "other"}.svg"

@Composable
fun CategoryIcon(slug: String?, iconUrl: String?, modifier: Modifier = Modifier, size: Dp = 32.dp, tint: Color = Jt.colors.ink) =
    SvgIcon(categoryIconSrc(slug, iconUrl), modifier, size, tint)

enum class LogoVariant {
    /** Artwork for light surfaces. */
    DARK,

    /** Artwork for navy / dark surfaces. */
    LIGHT,

    /** Follows the theme. */
    AUTO,
}

/** Brand mark from the site settings; the site's bundled SVG logo until (or if) the settings have none. */
@Composable
fun BrandLogo(modifier: Modifier = Modifier, variant: LogoVariant = LogoVariant.AUTO) {
    val settings = LocalSiteSettings.current
    val onDarkSurface = when (variant) {
        LogoVariant.LIGHT -> true
        LogoVariant.DARK -> false
        LogoVariant.AUTO -> Jt.colors.isDark
    }
    val path = if (onDarkSurface) settings?.logoDarkUrl ?: settings?.logoUrl else settings?.logoUrl
    val url = rememberMediaUrl(path) ?: assetUrl(if (onDarkSurface) "brand/javan-logo-full-white.svg" else "brand/javan-logo-full.svg")
    val context = LocalContext.current
    val request = remember(url) {
        ImageRequest.Builder(context).data(url).apply { if (url.endsWith(".svg")) decoderFactory(SvgDecoder.Factory()) }.build()
    }
    AsyncImage(model = request, contentDescription = settings?.siteName, contentScale = ContentScale.Fit, alignment = Alignment.Center, modifier = modifier)
}
