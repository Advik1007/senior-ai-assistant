package ai.unk.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

/**
 * Capacitor WebView shell.
 *
 * Microphone: OS RECORD_AUDIO + WebChromeClient grant so the loaded site
 * (and Capgo speech) can use the mic.
 */
public class MainActivity extends BridgeActivity {
  private static final int MIC_PERMISSION_REQUEST = 101;

  private boolean webViewTuned = false;
  private PermissionRequest pendingWebMicRequest;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    // Chrome remote debugging only in debug builds — never in release.
    WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

    super.onCreate(savedInstanceState);
    if (bridge == null) {
      return;
    }

    tuneWebView(bridge.getWebView());
    allowWebViewMicrophone(bridge.getWebView());
    requestMicrophonePermission();

    bridge.addWebViewListener(
      new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
          lockZoomAndScale(webView);
          tuneWebView(webView);
          allowWebViewMicrophone(webView);
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

  private void requestMicrophonePermission() {
    if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
      != PackageManager.PERMISSION_GRANTED) {
      ActivityCompat.requestPermissions(
        this,
        new String[] { Manifest.permission.RECORD_AUDIO },
        MIC_PERMISSION_REQUEST
      );
    }
  }

  /**
   * Keep Capacitor’s chrome client (file picker, dialogs) and grant mic/camera
   * when the website asks via getUserMedia.
   */
  private void allowWebViewMicrophone(WebView webView) {
    if (webView == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return;
    }
    WebChromeClient current = webView.getWebChromeClient();
    if (current instanceof MicGrantChromeClient) {
      return;
    }
    webView.setWebChromeClient(new MicGrantChromeClient(current));
  }

  @Override
  public void onRequestPermissionsResult(
    int requestCode,
    @NonNull String[] permissions,
    @NonNull int[] grantResults
  ) {
    super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    if (requestCode != MIC_PERMISSION_REQUEST) {
      return;
    }
    boolean granted =
      grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
    if (granted && pendingWebMicRequest != null) {
      pendingWebMicRequest.grant(pendingWebMicRequest.getResources());
      pendingWebMicRequest = null;
    } else if (!granted && pendingWebMicRequest != null) {
      pendingWebMicRequest.deny();
      pendingWebMicRequest = null;
    }
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
    // Required for getUserMedia / Web Speech in the WebView.
    settings.setMediaPlaybackRequiresUserGesture(false);

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

    // Web SQL is unused; keep disabled to reduce attack surface.
    settings.setDatabaseEnabled(false);
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

  private final class MicGrantChromeClient extends WebChromeClient {
    private final WebChromeClient inner;

    MicGrantChromeClient(WebChromeClient inner) {
      this.inner = inner;
    }

    @Override
    public void onPermissionRequest(PermissionRequest request) {
      runOnUiThread(() -> {
        if (request == null) {
          return;
        }
        if (
          ContextCompat.checkSelfPermission(
            MainActivity.this,
            Manifest.permission.RECORD_AUDIO
          )
          == PackageManager.PERMISSION_GRANTED
        ) {
          request.grant(request.getResources());
          return;
        }
        pendingWebMicRequest = request;
        requestMicrophonePermission();
      });
    }

    @Override
    public boolean onJsAlert(
      WebView view,
      String url,
      String message,
      android.webkit.JsResult result
    ) {
      if (inner != null) {
        return inner.onJsAlert(view, url, message, result);
      }
      return super.onJsAlert(view, url, message, result);
    }

    @Override
    public boolean onJsConfirm(
      WebView view,
      String url,
      String message,
      android.webkit.JsResult result
    ) {
      if (inner != null) {
        return inner.onJsConfirm(view, url, message, result);
      }
      return super.onJsConfirm(view, url, message, result);
    }

    @Override
    public boolean onJsPrompt(
      WebView view,
      String url,
      String message,
      String defaultValue,
      android.webkit.JsPromptResult result
    ) {
      if (inner != null) {
        return inner.onJsPrompt(view, url, message, defaultValue, result);
      }
      return super.onJsPrompt(view, url, message, defaultValue, result);
    }

    @Override
    public boolean onShowFileChooser(
      WebView webView,
      android.webkit.ValueCallback<android.net.Uri[]> filePathCallback,
      FileChooserParams fileChooserParams
    ) {
      if (inner != null) {
        return inner.onShowFileChooser(webView, filePathCallback, fileChooserParams);
      }
      return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
    }

    @Override
    public void onGeolocationPermissionsShowPrompt(
      String origin,
      android.webkit.GeolocationPermissions.Callback callback
    ) {
      if (inner != null) {
        inner.onGeolocationPermissionsShowPrompt(origin, callback);
        return;
      }
      super.onGeolocationPermissionsShowPrompt(origin, callback);
    }

    @Override
    public void onProgressChanged(WebView view, int newProgress) {
      if (inner != null) {
        inner.onProgressChanged(view, newProgress);
      } else {
        super.onProgressChanged(view, newProgress);
      }
    }

    @Override
    public void onReceivedTitle(WebView view, String title) {
      if (inner != null) {
        inner.onReceivedTitle(view, title);
      } else {
        super.onReceivedTitle(view, title);
      }
    }

    @Override
    public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
      if (inner != null) {
        return inner.onConsoleMessage(consoleMessage);
      }
      return super.onConsoleMessage(consoleMessage);
    }

    @Override
    public void onShowCustomView(View view, CustomViewCallback callback) {
      if (inner != null) {
        inner.onShowCustomView(view, callback);
      } else {
        super.onShowCustomView(view, callback);
      }
    }

    @Override
    public void onHideCustomView() {
      if (inner != null) {
        inner.onHideCustomView();
      } else {
        super.onHideCustomView();
      }
    }
  }
}
