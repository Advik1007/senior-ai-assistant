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
 * Capacitor shell tuned for smoother WebView scrolling on phones like S25.
 * Also auto-retries the remote app URL when a load fails.
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
          tuneWebView(webView);
        }

        @Override
        public void onReceivedError(WebView webView) {
          scheduleAutoReload();
        }

        @Override
        public void onReceivedHttpError(WebView webView) {
          scheduleAutoReload();
        }
      }
    );
  }

  /**
   * WebView (Chromium) draws our Next.js UI — these settings cut scroll jank
   * more than XML ConstraintLayout tips, which don't apply to this architecture.
   */
  private void tuneWebView(WebView webView) {
    if (webView == null || webViewTuned) {
      return;
    }
    webViewTuned = true;

    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
    webView.setNestedScrollingEnabled(true);
    webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

    WebSettings settings = webView.getSettings();
    settings.setDomStorageEnabled(true);
    settings.setDatabaseEnabled(true);
    settings.setLoadWithOverviewMode(true);
    settings.setUseWideViewPort(true);
    settings.setMediaPlaybackRequiresUserGesture(true);
    settings.setGeolocationEnabled(false);
    // Prefer cache for repeat visits to the remote Vercel shell.
    settings.setCacheMode(WebSettings.LOAD_DEFAULT);

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      settings.setOffscreenPreRaster(true);
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      webView.setRendererPriorityPolicy(WebView.RENDERER_PRIORITY_IMPORTANT, true);
    }
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
