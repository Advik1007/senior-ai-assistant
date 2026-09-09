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

    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    webView.setNestedScrollingEnabled(false);
    webView.setLayerType(View.LAYER_TYPE_NONE, null);
    webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

    WebSettings settings = webView.getSettings();
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setMediaPlaybackRequiresUserGesture(true);
    settings.setGeolocationEnabled(false);
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);
    settings.setSaveFormData(false);
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
