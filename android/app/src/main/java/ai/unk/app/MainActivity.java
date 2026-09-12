package ai.unk.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.view.View;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Button;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.util.ArrayList;
import java.util.Locale;
import org.json.JSONObject;

/**
 * Capacitor WebView plus a native mic bar.
 * Website taps are unreliable in this WebView; SpeechRecognizer is started
 * from the Android button so UNK can actually hear the user.
 */
public class MainActivity extends BridgeActivity {
  private static final int MIC_PERMISSION_REQUEST = 102;

  private boolean webViewTuned = false;
  private boolean listening = false;
  private Button micButton;
  private SpeechRecognizer speechRecognizer;

  @Override
  public void onCreate(Bundle savedInstanceState) {
    WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);

    super.onCreate(savedInstanceState);
    if (bridge == null) {
      return;
    }

    tuneWebView(bridge.getWebView());
    if (bridge.getWebView() != null) {
      bridge.getWebView().clearCache(true);
    }

    micButton = findViewById(R.id.unk_mic_button);
    if (micButton != null) {
      micButton.setOnClickListener((view) -> onMicTapped());
    }

    bridge.addWebViewListener(
      new WebViewListener() {
        @Override
        public void onPageLoaded(WebView webView) {
          lockZoomAndScale(webView);
          tuneWebView(webView);
          markNativeMic(webView);
        }

        @Override
        public void onReceivedError(WebView webView) {}
      }
    );
  }

  private void onMicTapped() {
    if (listening) {
      stopNativeListen();
      return;
    }
    if (
      ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
      != PackageManager.PERMISSION_GRANTED
    ) {
      ActivityCompat.requestPermissions(
        this,
        new String[] { Manifest.permission.RECORD_AUDIO },
        MIC_PERMISSION_REQUEST
      );
      return;
    }
    startNativeListen();
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
    if (
      grantResults.length > 0 &&
      grantResults[0] == PackageManager.PERMISSION_GRANTED
    ) {
      startNativeListen();
    }
  }

  private void startNativeListen() {
    if (!SpeechRecognizer.isRecognitionAvailable(this)) {
      sendJsEvent("unk-native-error", "unavailable");
      return;
    }

    runOnUiThread(() -> {
      ensureRecognizer();
      Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
      intent.putExtra(
        RecognizerIntent.EXTRA_LANGUAGE_MODEL,
        RecognizerIntent.LANGUAGE_MODEL_FREE_FORM
      );
      intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault().toLanguageTag());
      intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, false);
      intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3);
      setListeningUi(true);
      sendJsEvent("unk-native-listening", "");
      try {
        speechRecognizer.startListening(intent);
      } catch (Exception ex) {
        setListeningUi(false);
        sendJsEvent("unk-native-error", "failed");
      }
    });
  }

  private void stopNativeListen() {
    runOnUiThread(() -> {
      if (speechRecognizer != null) {
        try {
          speechRecognizer.stopListening();
        } catch (Exception ignored) {}
      }
      setListeningUi(false);
      sendJsEvent("unk-native-idle", "");
    });
  }

  private void ensureRecognizer() {
    if (speechRecognizer != null) {
      return;
    }
    speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this);
    speechRecognizer.setRecognitionListener(
      new RecognitionListener() {
        @Override
        public void onReadyForSpeech(Bundle params) {}

        @Override
        public void onBeginningOfSpeech() {}

        @Override
        public void onRmsChanged(float rmsdB) {}

        @Override
        public void onBufferReceived(byte[] buffer) {}

        @Override
        public void onEndOfSpeech() {}

        @Override
        public void onError(int error) {
          setListeningUi(false);
          sendJsEvent("unk-native-error", String.valueOf(error));
        }

        @Override
        public void onResults(Bundle results) {
          ArrayList<String> matches =
            results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
          String text =
            matches != null && !matches.isEmpty() && matches.get(0) != null
              ? matches.get(0).trim()
              : "";
          setListeningUi(false);
          sendTranscript(text);
        }

        @Override
        public void onPartialResults(Bundle partialResults) {}

        @Override
        public void onEvent(int eventType, Bundle params) {}
      }
    );
  }

  private void setListeningUi(boolean next) {
    listening = next;
    if (micButton == null) {
      return;
    }
    if (next) {
      micButton.setBackgroundResource(R.drawable.unk_mic_listen);
      micButton.setText(R.string.unk_mic_listen);
      micButton.setTextColor(0xFFFFFFFF);
    } else {
      micButton.setBackgroundResource(R.drawable.unk_mic_idle);
      micButton.setText(R.string.unk_mic_idle);
      micButton.setTextColor(0xFF0B1F3A);
    }
  }

  private void sendTranscript(String text) {
    if (text.isEmpty()) {
      sendJsEvent("unk-native-error", "no-speech");
      return;
    }
    sendJsEvent("unk-native-transcript", text);
  }

  private void sendJsEvent(String name, String detail) {
    if (bridge == null || bridge.getWebView() == null) {
      return;
    }
    String payload = JSONObject.quote(detail == null ? "" : detail);
    String js =
      "(function(){try{window.__UNK_NATIVE_MIC=true;window.dispatchEvent(new CustomEvent(" +
      JSONObject.quote(name) +
      ",{detail:{text:" +
      payload +
      "}}));}catch(e){}})();";
    bridge.getWebView().evaluateJavascript(js, null);
  }

  private void markNativeMic(WebView webView) {
    if (webView == null) {
      return;
    }
    webView.evaluateJavascript(
      "(function(){window.__UNK_NATIVE_MIC=true;document.body&&(document.body.style.paddingBottom='8px');})();",
      null
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

  @Override
  public void onDestroy() {
    if (speechRecognizer != null) {
      try {
        speechRecognizer.destroy();
      } catch (Exception ignored) {}
      speechRecognizer = null;
    }
    super.onDestroy();
  }
}
