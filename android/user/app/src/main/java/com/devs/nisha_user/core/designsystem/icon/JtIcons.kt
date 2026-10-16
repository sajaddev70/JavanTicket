package com.devs.nisha_user.core.designsystem.icon

import androidx.compose.foundation.layout.size
import androidx.compose.material3.Icon
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.graphics.vector.addPathNodes
import androidx.compose.ui.graphics.vector.path
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.devs.nisha_user.core.designsystem.theme.Jt
import java.util.concurrent.ConcurrentHashMap

/**
 * The site's icons as Compose vectors: lucide stroke icons ([LucideData], generated from lucide-react) drawn with
 * round caps and joins like lucide's SVGs, at any stroke width (the site uses 1.8 / 2 / 2.2 / 3).
 */
object JtIcons {
    private val cache = ConcurrentHashMap<String, ImageVector>()

    fun vector(icon: LucidePaths, strokeWidth: Float = 2f, filled: Boolean = false): ImageVector =
        cache.getOrPut("${icon.name}/$strokeWidth/$filled") {
            ImageVector.Builder(name = icon.name, defaultWidth = 24.dp, defaultHeight = 24.dp, viewportWidth = 24f, viewportHeight = 24f)
                .apply {
                    icon.paths.forEach { d ->
                        addPath(
                            pathData = addPathNodes(d),
                            fill = if (filled) SolidColor(Color.Black) else null,
                            stroke = SolidColor(Color.Black),
                            strokeLineWidth = strokeWidth,
                            strokeLineCap = StrokeCap.Round,
                            strokeLineJoin = StrokeJoin.Round,
                        )
                    }
                }
                .build()
        }

    // Footer social icons of SiteFooter.tsx (not part of lucide).
    val Instagram: ImageVector by lazy {
        ImageVector.Builder("instagram", 24.dp, 24.dp, 24f, 24f).apply {
            addPath(addPathNodes("M8 3h8a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8a5 5 0 0 1 5-5Z"), stroke = SolidColor(Color.Black), strokeLineWidth = 1.8f)
            addPath(addPathNodes("M7.8 12a4.2 4.2 0 1 0 8.4 0a4.2 4.2 0 1 0-8.4 0"), stroke = SolidColor(Color.Black), strokeLineWidth = 1.8f)
            path(fill = SolidColor(Color.Black)) {
                moveTo(16.3f, 6.7f); arcToRelative(1f, 1f, 0f, true, false, 2f, 0f); arcToRelative(1f, 1f, 0f, true, false, -2f, 0f)
            }
        }.build()
    }

    val LinkedIn: ImageVector by lazy {
        ImageVector.Builder("linkedin", 24.dp, 24.dp, 24f, 24f).apply {
            addPath(
                addPathNodes(
                    "M6.94 8.5H3.56V20h3.38V8.5zM5.25 3.5a1.97 1.97 0 1 0 0 3.94 1.97 1.97 0 0 0 0-3.94zM20.44 13.3c0-3.1-1.65-4.55-3.86-4.55-1.78 0-2.58.98-3.02 1.67V8.5h-3.38V20h3.38v-6.1c0-1.6.3-3.15 2.29-3.15 1.96 0 1.99 1.83 1.99 3.25V20h3.38z",
                ),
                fill = SolidColor(Color.Black),
            )
        }.build()
    }

    val Aparat: ImageVector by lazy {
        ImageVector.Builder("aparat", 24.dp, 24.dp, 24f, 24f).apply {
            addPath(addPathNodes("M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0-17 0"), stroke = SolidColor(Color.Black), strokeLineWidth = 1.8f)
            listOf(12f to 7.8f, 12f to 16.2f, 7.8f to 12f, 16.2f to 12f).forEach { (cx, cy) ->
                path(fill = SolidColor(Color.Black)) {
                    moveTo(cx - 1.6f, cy); arcToRelative(1.6f, 1.6f, 0f, true, false, 3.2f, 0f); arcToRelative(1.6f, 1.6f, 0f, true, false, -3.2f, 0f)
                }
            }
        }.build()
    }
}

/** A lucide icon in [tint] (default: the current ink color), `size` like the site's `size-5` (20dp). */
@Composable
fun JtIcon(
    icon: LucidePaths,
    modifier: Modifier = Modifier,
    size: Dp = 20.dp,
    tint: Color = Jt.colors.ink,
    strokeWidth: Float = 2f,
    filled: Boolean = false,
    contentDescription: String? = null,
) {
    val vector = remember(icon, strokeWidth, filled) { JtIcons.vector(icon, strokeWidth, filled) }
    Icon(vector, contentDescription, modifier.size(size), tint = tint)
}

@Composable
fun JtIcon(vector: ImageVector, modifier: Modifier = Modifier, size: Dp = 20.dp, tint: Color = Jt.colors.ink, contentDescription: String? = null) {
    Icon(vector, contentDescription, modifier.size(size), tint = tint)
}

