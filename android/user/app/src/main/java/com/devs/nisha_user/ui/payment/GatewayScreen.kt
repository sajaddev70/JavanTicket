package com.devs.nisha_user.ui.payment

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import com.devs.nisha_user.core.designsystem.component.JtTopBar
import com.devs.nisha_user.core.designsystem.theme.Jt
import com.devs.nisha_user.ui.common.LocalAppActions
import com.devs.nisha_user.ui.navigation.PaymentResultRoute
import java.net.URI

/**
 * The bank's payment page inside the app. The gateway returns the buyer to the user site's /payment/result?id=...
 * (the backend's callback verifies the payment first); that address is caught here and opens the result screen.
 */
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun GatewayScreen(url: String, paymentId: Long) {
    val actions = LocalAppActions.current
    var loading by remember { mutableStateOf(true) }
    var done by remember { mutableStateOf(false) }

    fun finish(target: String): Boolean {
        val uri = runCatching { URI(target) }.getOrNull() ?: return false
        if (!uri.path.orEmpty().endsWith("/payment/result")) return false
        if (!done) {
            done = true
            val id = uri.rawQuery.orEmpty().split('&').firstOrNull { it.startsWith("id=") }?.removePrefix("id=")?.toLongOrNull() ?: paymentId
            actions.replace(PaymentResultRoute(id))
        }
        return true
    }

    // Leaving the bank page: the payment is checked on the result screen (it may still be in progress).
    BackHandler { if (!done) { done = true; actions.replace(PaymentResultRoute(paymentId)) } }

    Column(Modifier.fillMaxSize()) {
        JtTopBar("درگاه پرداخت", onBack = { if (!done) { done = true; actions.replace(PaymentResultRoute(paymentId)) } })
        Box(Modifier.fillMaxSize()) {
            AndroidView(
                factory = { context ->
                    WebView(context).apply {
                        settings.javaScriptEnabled = true
                        settings.domStorageEnabled = true
                        webViewClient = object : WebViewClient() {
                            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean = finish(request.url.toString())

                            override fun onPageStarted(view: WebView, url: String, favicon: Bitmap?) {
                                loading = true
                                if (finish(url)) view.stopLoading()
                            }

                            override fun onPageFinished(view: WebView, url: String) {
                                loading = false
                            }
                        }
                        loadUrl(url)
                    }
                },
                onRelease = { it.destroy() },
                modifier = Modifier.fillMaxSize(),
            )
            if (loading) LinearProgressIndicator(Modifier.fillMaxWidth().height(3.dp), color = Jt.colors.brand600, trackColor = Jt.colors.brand100)
        }
    }
}
