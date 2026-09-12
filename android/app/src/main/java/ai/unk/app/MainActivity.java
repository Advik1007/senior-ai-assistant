package ai.unk.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.ArrayList;
import org.json.JSONObject;

/**
 * Capacitor WebView shell. The in-page gold button opens Android's Speak now popup.
 */
public class MainActivity extends BridgeActivity {
  private boolean webViewTuned = false;
  private boolean micBridgeAttached = false;
  private String pendingSpeakNowLang = "en-IN";

  private final ActivityResultLauncher<String> micPermissionLauncher =
    registerForActivityResult(
      new ActivityResultContracts.RequestPermission(),
      granted -> {
        notifyMicPermission(Boolean.TRUE.equals(granted));
        if (Boolean.TRUE.equals(granted)) {
          launchSpeakNow(pendingSpeakNowLang);
        } else {
          notifySpeakNow(null, "denied");
        }
      }
    );

  private final ActivityResultLauncher<Intent> speakNowLauncher =
    registerForActivityResult(
      new ActivityResultContracts.StartActivityForResult(),
      result -> {
        if (result.getResultCode() != Activity.RESULT_OK || result.getData() == null) {
          notifySpeakNow(null, "canceled");
          return;
        }
        ArrayList<String> matches = result.getData().getStringArrayListExtra(
          RecognizerIntent.EXTRA_RESULTS
        );
        String text = matches != null && !matches.isEmpty() ? matches.get(0) : "";
        if (text == null || text.trim().isEmpty()) {
          notifySpeakNow(null, "no-speech");
        } else {
          notifySpeakNow(text.trim(), null);
        }
      }
    );

  @Override
  public void onCreate(Bundle savedInstanceState) {
    WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

    super.onCreate(savedInstanceState);
    if (bridge == null) {
      return;
    }

    tuneWebView(bridge.getWebView());
    attachMicBridge(bridge.getWebView());
    if (bridge.getWebView() != null) {
      bridge.getWebView().clearCache(true);
    }

    bridge.addWebViewListener(
      new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
          lockZoomAndScale(webView);
          tuneWebView(webView);
          attachMicBridge(webView);
        }

        @Override
        public void onReceivedError(WebView webView) {}
      }
    );
  }

  private void attachMicBridge(WebView webView) {
    if (webView == null || micBridgeAttached) {
      return;
    }
    webView.addJavascriptInterface(new UnkMicBridge(), "UnkMic");
    micBridgeAttached = true;
  }

  private boolean hasRecordAudioPermission() {
    return ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) ==
      PackageManager.PERMISSION_GRANTED;
  }

  private void launchSpeakNow(String language) {
    Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
    intent.putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak now");
    intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
    if (language != null && !language.isEmpty()) {
      intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
      intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
    }
    try {
      speakNowLauncher.launch(intent);
    } catch (Exception e) {
      notifySpeakNow(null, "unavailable");
    }
  }

  private void notifyMicPermission(boolean granted) {
    dispatchRaw(
      "window.dispatchEvent(new CustomEvent('unk-mic-permission',{detail:{granted:" +
      (granted ? "true" : "false") +
      "}}));"
    );
  }

  private void notifySpeakNow(String text, String error) {
    try {
      JSONObject detail = new JSONObject();
      if (text != null) {
        detail.put("ok", true);
        detail.put("text", text);
      } else {
        detail.put("ok", false);
        detail.put("error", error == null ? "canceled" : error);
      }
      dispatchRaw(
        "window.dispatchEvent(new CustomEvent('unk-speak-now',{detail:" +
        detail +
        "}));"
      );
    } catch (Exception e) {
      dispatchRaw(
        "window.dispatchEvent(new CustomEvent('unk-speak-now',{detail:{ok:false,error:\"failed\"}}));"
      );
    }
  }

  private void dispatchRaw(String js) {
    if (bridge == null) {
      return;
    }
    WebView webView = bridge.getWebView();
    if (webView == null) {
      return;
    }
    webView.post(() -> webView.evaluateJavascript(js, null));
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

    webView.setOverScrollMode(View.OVER_SCROLL_IF_CONTENT_SCROLLS);
    webView.setNestedScrollingEnabled(false);
    webView.setVerticalScrollBarEnabled(true);
    webView.setHorizontalScrollBarEnabled(false);
    webView.setFocusable(true);
    webView.setFocusableInTouchMode(true);
    webView.setLayerType(View.LAYER_TYPE_NONE, null);
    webView.setScrollBarStyle(View.SCROLLBARS_INSIDE_OVERLAY);

    settings.setDatabaseEnabled(false);
    settings.setGeolocationEnabled(false);
    settings.setSaveFormData(false);
    settings.setAllowFileAccess(true);
    settings.setAllowContentAccess(false);
    settings.setAllowFileAccessFromFileURLs(false);
    settings.setAllowUniversalAccessFromFileURLs(false);
  }

  private class UnkMicBridge {
    @JavascriptInterface
    public boolean hasMicPermission() {
      return hasRecordAudioPermission();
    }

    @JavascriptInterface
    public void requestMicPermission() {
      runOnUiThread(() -> {
        if (hasRecordAudioPermission()) {
          notifyMicPermission(true);
          return;
        }
        micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
      });
    }

    @JavascriptInterface
    public void startSpeakNow(String language) {
      runOnUiThread(() -> {
        pendingSpeakNowLang = language == null || language.isEmpty() ? "en-IN" : language;
        if (!hasRecordAudioPermission()) {
          micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
          return;
        }
        launchSpeakNow(pendingSpeakNowLang);
      });
    }
  }
}
