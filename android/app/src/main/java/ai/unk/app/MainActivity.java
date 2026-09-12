package ai.unk.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.media.MediaRecorder;
import android.os.Build;
import android.os.Bundle;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;
import java.io.File;
import java.io.FileInputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

/**
 * Capacitor WebView shell. Records speech on the gold-button tap so Gemini
 * can turn audio into text (Android SpeechRecognizer is not used).
 */
public class MainActivity extends BridgeActivity {
  private boolean webViewTuned = false;
  private boolean micBridgeAttached = false;
  private MediaRecorder speechRecorder;
  private File speechFile;

  private final ActivityResultLauncher<String> micPermissionLauncher =
    registerForActivityResult(
      new ActivityResultContracts.RequestPermission(),
      granted -> notifyMicPermission(Boolean.TRUE.equals(granted))
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

  private void requestRecordAudioPermission() {
    if (hasRecordAudioPermission()) {
      notifyMicPermission(true);
      return;
    }
    micPermissionLauncher.launch(Manifest.permission.RECORD_AUDIO);
  }

  private void notifyMicPermission(boolean granted) {
    if (bridge == null) {
      return;
    }
    WebView webView = bridge.getWebView();
    if (webView == null) {
      return;
    }
    String js =
      "window.dispatchEvent(new CustomEvent('unk-mic-permission',{detail:{granted:" +
      (granted ? "true" : "false") +
      "}}));";
    webView.post(() -> webView.evaluateJavascript(js, null));
  }

  private boolean startMicRecorder() throws Exception {
    stopMicRecorder();
    speechFile = new File(getCacheDir(), "unk-speech.m4a");
    if (speechFile.exists() && !speechFile.delete()) {
      speechFile = new File(getCacheDir(), "unk-speech-" + System.currentTimeMillis() + ".m4a");
    }
    MediaRecorder recorder = Build.VERSION.SDK_INT >= Build.VERSION_CODES.S
      ? new MediaRecorder(this)
      : new MediaRecorder();
    recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
    recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
    recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
    recorder.setAudioSamplingRate(16000);
    recorder.setAudioEncodingBitRate(64000);
    recorder.setOutputFile(speechFile.getAbsolutePath());
    recorder.prepare();
    recorder.start();
    speechRecorder = recorder;
    return true;
  }

  private String stopMicRecorder() {
    MediaRecorder recorder = speechRecorder;
    speechRecorder = null;
    if (recorder != null) {
      try {
        recorder.stop();
      } catch (RuntimeException ignored) {}
      try {
        recorder.release();
      } catch (RuntimeException ignored) {}
    }
    if (speechFile == null || !speechFile.exists() || speechFile.length() < 200) {
      return "";
    }
    byte[] bytes = new byte[(int) speechFile.length()];
    try (FileInputStream in = new FileInputStream(speechFile)) {
      int read = 0;
      while (read < bytes.length) {
        int n = in.read(bytes, read, bytes.length - read);
        if (n < 0) {
          break;
        }
        read += n;
      }
    } catch (Exception e) {
      return "";
    }
    return Base64.encodeToString(bytes, Base64.NO_WRAP);
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
      runOnUiThread(MainActivity.this::requestRecordAudioPermission);
    }

    @JavascriptInterface
    public boolean startRecording() {
      if (!hasRecordAudioPermission()) {
        return false;
      }
      AtomicBoolean ok = new AtomicBoolean(false);
      CountDownLatch latch = new CountDownLatch(1);
      runOnUiThread(() -> {
        try {
          ok.set(startMicRecorder());
        } catch (Exception e) {
          ok.set(false);
        }
        latch.countDown();
      });
      try {
        latch.await(2, TimeUnit.SECONDS);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return false;
      }
      return ok.get();
    }

    @JavascriptInterface
    public String stopRecording() {
      AtomicReference<String> out = new AtomicReference<>("");
      CountDownLatch latch = new CountDownLatch(1);
      runOnUiThread(() -> {
        out.set(stopMicRecorder());
        latch.countDown();
      });
      try {
        latch.await(3, TimeUnit.SECONDS);
      } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
        return "";
      }
      return out.get();
    }
  }
}
