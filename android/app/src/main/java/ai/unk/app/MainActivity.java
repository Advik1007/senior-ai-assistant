package ai.unk.app;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Capacitor WebView shell.
 *
 * Capgo speech uses the native SpeechRecognizer and asks for RECORD_AUDIO
 * from JavaScript on a tap. Do not request the mic in onCreate (Android Studio
 * shows that dialog too early and the result is often lost). Do not replace
 * Capacitor's WebChromeClient (that breaks plugin permission callbacks).
 */
public class MainActivity extends BridgeActivity {
  private boolean webViewTuned = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Chrome remote debugging only in debug builds — never in release.
    WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

    super.onCreate(savedInstanceState);
    if (bridge == null) {
      return;
    }

    tuneWebView(bridge.getWebView());

    bridge.addWebViewListener(
      new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
          lockZoomAndScale(webView);
          tuneWebView(webView);
        }

        // Do not auto-reload the remote site. Back / tel: / cache misses used
        // to call loadUrl() and show “webpage couldn’t be loaded”.
        @Override
        public void onReceivedError(WebView webView) {
          // offline.html already retries. Leave the current document in place.
        }

        // Intentionally no onReceivedHttpError reload.
        // Subresource/API HTTP errors must not recreate the app.
      }
    );
  }

  private void lockZoomAndScale(WebView webView) {
    if (webView == null) {
      return;
    }
    WebSettings settings = webView.getSettings();
    settings.setSupportZoom(false);
    settings.setBuiltInZoomControls(false);
    settings.setDisplayZoomControls(false);
    settings.setLoadWithOverviewMode(false);
    settings.setUseWideViewPort(true);
    settings.setTextZoom(100);
    webView.setInitialScale(100);
  }

  private void tuneWebView(WebView webView) {
    if (webView == null) {
      return;
    }

    lockZoomAndScale(webView);

    // Suppress Chrome/WebView “Enable autofill on this page” chrome.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      webView.setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
    }

    WebSettings settings = webView.getSettings();
    settings.setJavaScriptEnabled(true);
    settings.setDomStorageEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(false);
    settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

    if (webViewTuned) {
      return;
    }
    webViewTuned = true;
    webView.clearCache(true);

    // Page scroll must live in the WebView document (CSS), not a parent scroller.
    webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
    webView.setNestedScrollingEnabled(false);
    webView.setVerticalScrollBarEnabled(true);
    webView.setHorizontalScrollBarEnabled(false);
    webView.setFocusable(true);
    webView.setFocusableInTouchMode(true);
    webView.setLayerType(View.LAYER_TYPE_NONE, null);
    webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

    // Web SQL is unused; keep disabled to reduce attack surface.
    settings.setDatabaseEnabled(false);
    settings.setGeolocationEnabled(false);
    settings.setSaveFormData(false);
    // Allow file access only when loading local offline assets; remote HTTPS app
    // content does not need broad file:// access.
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(false);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
  }
}
