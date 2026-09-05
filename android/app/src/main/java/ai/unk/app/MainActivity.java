package ai.unk.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Auto-retries the remote app URL when the WebView fails to load,
 * so seniors never sit on Chrome's "webpage could not be loaded" screen.
 */
public class MainActivity extends BridgeActivity {
  private final Handler handler = new Handler(Looper.getMainLooper());
  private int retryAttempt = 0;
  private boolean reloadPending = false;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    if (bridge == null) {
      return;
    }

    bridge.addWebViewListener(
      new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
          retryAttempt = 0;
          reloadPending = false;
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
