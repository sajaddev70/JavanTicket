package com.devs.nisha_user

import android.graphics.Color
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.devs.nisha_user.core.designsystem.theme.JavanTheme
import com.devs.nisha_user.core.designsystem.theme.isDarkTheme
import com.devs.nisha_user.ui.app.AppViewModel
import com.devs.nisha_user.ui.app.JavanAppRoot
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val app: AppViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        // The splash stays until the site content (logo, menus, categories) has answered once.
        installSplashScreen().setKeepOnScreenCondition { !app.ready.value }
        super.onCreate(savedInstanceState)
        setContent {
            val mode by app.themeMode.collectAsStateWithLifecycle()
            val dark = isDarkTheme(mode)
            // Status / navigation bar icons follow the app theme, not only the system one.
            DisposableEffect(dark) {
                val style = if (dark) SystemBarStyle.dark(Color.TRANSPARENT) else SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                enableEdgeToEdge(statusBarStyle = style, navigationBarStyle = style)
                onDispose {}
            }
            JavanTheme(dark) { JavanAppRoot(app, dark) }
        }
    }
}
