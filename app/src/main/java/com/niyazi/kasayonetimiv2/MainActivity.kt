package com.niyazi.kasayonetimiv2

import android.app.Activity
import android.os.Bundle
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient

class MainActivity : Activity() {

    private lateinit var webView: WebView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        webView = WebView(this)

        webView.settings.apply {

            javaScriptEnabled = true

            domStorageEnabled = true

            databaseEnabled = true

            cacheMode = WebSettings.LOAD_DEFAULT

            builtInZoomControls = true

            displayZoomControls = false

            setSupportZoom(true)

            loadWithOverviewMode = true

            useWideViewPort = true
        }

        webView.webViewClient = WebViewClient()

        webView.webChromeClient = WebChromeClient()

        webView.loadUrl(
            "file:///android_asset/index.html"
        )

        setContentView(webView)
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {

        if (webView.canGoBack()) {

            webView.goBack()

        } else {

            super.onBackPressed()
        }
    }
}
