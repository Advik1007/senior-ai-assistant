package ai.unk.app;

import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Capacitor WebView shell.
 *
 * Critical: do NOT auto-reload on HTTP errors. API 401/404/5xx used to call
 * loadUrl(server) and wipe in-progress login / scroll / auth state.
 */
public class MainActivity extends BridgeActivity {
  private final Handler handler = new Handler(Looper.getMainLooper());
  private int retryAttempt = 0;
  private boolean reloadPending = false;
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
          retryAttempt = 0;
          reloadPending = false;
          lockZoomAndScale(webView);
          tuneWebView(webView);
        }

        @Override
        public void onReceivedError(WebView webView) {
          // Main-document network failure only — offline.html also retries.
          scheduleAutoReload();
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

    if (webViewTuned) {
      return;
    }
    webViewTuned = true;

    // Page scroll must live in the WebView document (CSS), not a parent scroller.
    webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
    webView.setNestedScrollingEnabled(false);
    webView.setVerticalScrollBarEnabled(true);
    webView.setHorizontalScrollBarEnabled(false);
    webView.setFocusable(true);
    webView.setFocusableInTouchMode(true);
    webView.setLayerType(View.LAYER_TYPE_NONE, null);
    webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

    WebSettings settings = webView.getSettings();
    settings.setDomStorageEnabled(true);
    // Web SQL is unused; keep disabled to reduce attack surface.
    settings.setDatabaseEnabled(false);
    settings.setMediaPlaybackRequiresUserGesture(true);
    settings.setGeolocationEnabled(false);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setSaveFormData(false);
    // Allow file access only when loading local offline assets; remote HTTPS app
    // content does not need broad file:// access.
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(false);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
  }

  private void scheduleAutoReload() {
    if (reloadPending || bridge == null) {
      return;
    }
    reloadPending = true;
    long delayMs = Math.min(8000L, 1000L + (retryAttempt * 750L));
    retryAttempt += 1;

    handler.postDelayed(
      () -> {
        reloadPending = false;
        if (bridge == null || bridge.getWebView() == null) {
          return;
        }
        String url = bridge.getServerUrl();
        if (url == null || url.trim().isEmpty()) {
          url = bridge.getAppUrl();
        }
        if (url != null && !url.trim().isEmpty()) {
          bridge.getWebView().loadUrl(url);
        }
      },
      delayMs
    );
  }
}
