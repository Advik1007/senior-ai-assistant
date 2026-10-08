package ai.unk.app;

import android.net.Uri;
import android.os.Message;
import android.view.View;
import android.webkit.ConsoleMessage;
import android.webkit.GeolocationPermissions;
import android.webkit.JsPromptResult;
import android.webkit.JsResult;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

/**
 * Keeps Capacitor's WebChromeClient, and allows location when the website asks.
 */
final class GeoChromeClient extends WebChromeClient {
  interface LocationAccess {
    boolean allowed();
  }

  private final WebChromeClient inner;
  private final LocationAccess location;

  GeoChromeClient(WebChromeClient inner, LocationAccess location) {
    this.inner = inner;
    this.location = location;
  }

  @Override
  public void onGeolocationPermissionsShowPrompt(
    String origin,
    GeolocationPermissions.Callback callback
  ) {
    callback.invoke(origin, location != null && location.allowed(), false);
  }

  @Override
  public boolean onShowFileChooser(
    WebView webView,
    ValueCallback<Uri[]> filePathCallback,
    FileChooserParams fileChooserParams
  ) {
    if (inner != null) {
      return inner.onShowFileChooser(webView, filePathCallback, fileChooserParams);
    }
    return super.onShowFileChooser(webView, filePathCallback, fileChooserParams);
  }

  @Override
  public void onPermissionRequest(PermissionRequest request) {
    if (inner != null) {
      inner.onPermissionRequest(request);
    } else {
      super.onPermissionRequest(request);
    }
  }

  @Override
  public boolean onJsAlert(WebView view, String url, String message, JsResult result) {
    if (inner != null) {
      return inner.onJsAlert(view, url, message, result);
    }
    return super.onJsAlert(view, url, message, result);
  }

  @Override
  public boolean onJsConfirm(WebView view, String url, String message, JsResult result) {
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
    JsPromptResult result
  ) {
    if (inner != null) {
      return inner.onJsPrompt(view, url, message, defaultValue, result);
    }
    return super.onJsPrompt(view, url, message, defaultValue, result);
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
  public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
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

  @Override
  public boolean onCreateWindow(
    WebView view,
    boolean isDialog,
    boolean isUserGesture,
    Message resultMsg
  ) {
    if (inner != null) {
      return inner.onCreateWindow(view, isDialog, isUserGesture, resultMsg);
    }
    return super.onCreateWindow(view, isDialog, isUserGesture, resultMsg);
  }

  @Override
  public void onCloseWindow(WebView window) {
    if (inner != null) {
      inner.onCloseWindow(window);
    } else {
      super.onCloseWindow(window);
    }
  }
}
