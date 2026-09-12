package ai.unk.app;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.RecognizerIntent;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
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
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.json.JSONObject;

/**
 * Capacitor WebView shell. The in-page gold button opens Android's Speak now popup.
 * Replies are spoken with Google's text-to-speech engine.
 */
public class MainActivity extends BridgeActivity {
  private boolean webViewTuned = false;
  private boolean micBridgeAttached = false;
  private String pendingSpeakNowLang = "en-IN";

  private TextToSpeech tts;
  private boolean ttsReady = false;
  private int ttsGeneration = 0;
  private String pendingTtsText;
  private String pendingTtsLang = "en-IN";
  private float pendingTtsRate = 0.9f;

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

    initTts(true);
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

  @Override
  public void onDestroy() {
    if (tts != null) {
      tts.stop();
      tts.shutdown();
      tts = null;
    }
    ttsReady = false;
    super.onDestroy();
  }

  private void initTts(boolean preferGoogle) {
    TextToSpeech.OnInitListener ready = status -> {
      if (status != TextToSpeech.SUCCESS) {
        if (preferGoogle) {
          if (tts != null) {
            tts.shutdown();
            tts = null;
          }
          initTts(false);
        }
        return;
      }
      if (tts == null) {
        return;
      }
      tts.setAudioAttributes(
        new AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_MEDIA)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build()
      );
      tts.setOnUtteranceProgressListener(
        new UtteranceProgressListener() {
          @Override
          public void onStart(String utteranceId) {}

          @Override
          public void onDone(String utteranceId) {
            if ("unk-tts-last".equals(utteranceId)) {
              notifyTtsEnd(ttsGeneration);
            }
          }

          @Override
          @Deprecated
          public void onError(String utteranceId) {
            if ("unk-tts-last".equals(utteranceId)) {
              notifyTtsEnd(ttsGeneration);
            }
          }
        }
      );
      ttsReady = true;
      if (pendingTtsText != null) {
        String text = pendingTtsText;
        String lang = pendingTtsLang;
        float rate = pendingTtsRate;
        pendingTtsText = null;
        startTts(text, lang, rate);
      }
    };

    if (preferGoogle) {
      tts = new TextToSpeech(this, ready, "com.google.android.tts");
    } else {
      tts = new TextToSpeech(this, ready);
    }
  }

  private void startTts(String text, String language, float rate) {
    String spoken = text == null ? "" : text.trim();
    if (spoken.isEmpty()) {
      notifyTtsEnd(ttsGeneration);
      return;
    }
    if (tts == null || !ttsReady) {
      pendingTtsText = spoken;
      pendingTtsLang = language;
      pendingTtsRate = rate;
      return;
    }

    ttsGeneration += 1;
    requestPlaybackFocus();
    applyGoodVoice(language);
    float clamped = Math.max(0.7f, Math.min(rate, 1.05f));
    tts.setSpeechRate(clamped);
    tts.setPitch(1.04f);

    List<String> chunks = splitForTts(spoken);
    for (int i = 0; i < chunks.size(); i++) {
      String id = i == chunks.size() - 1 ? "unk-tts-last" : "unk-tts-" + i;
      int queue = i == 0 ? TextToSpeech.QUEUE_FLUSH : TextToSpeech.QUEUE_ADD;
      tts.speak(chunks.get(i), queue, null, id);
    }
  }

  private void stopTts() {
    ttsGeneration += 1;
    pendingTtsText = null;
    if (tts != null) {
      tts.stop();
    }
  }

  private void applyGoodVoice(String language) {
    if (tts == null) {
      return;
    }
    String tag = language == null || language.isEmpty() ? "en-IN" : language;
    Locale locale = Locale.forLanguageTag(tag);
    int available = tts.setLanguage(locale);
    if (
      available == TextToSpeech.LANG_MISSING_DATA ||
      available == TextToSpeech.LANG_NOT_SUPPORTED
    ) {
      locale = Locale.forLanguageTag("en-IN");
      tts.setLanguage(locale);
    }

    Set<Voice> voices = tts.getVoices();
    if (voices == null || voices.isEmpty()) {
      return;
    }
    String lang = locale.getLanguage().toLowerCase(Locale.ROOT);
    String country = locale.getCountry().toLowerCase(Locale.ROOT);
    Voice best = null;
    int bestScore = -1;
    for (Voice voice : voices) {
      Locale voiceLocale = voice.getLocale();
      if (voiceLocale == null || !voiceLocale.getLanguage().equalsIgnoreCase(lang)) {
        continue;
      }
      int score = 10 + voice.getQuality();
      if (voiceLocale.getCountry().equalsIgnoreCase(country)) {
        score += 40;
      }
      if (!voice.isNetworkConnectionRequired()) {
        score += 25;
      }
      String name = voice.getName().toLowerCase(Locale.ROOT);
      if (
        name.contains("ene") ||
        name.contains("hie") ||
        name.contains("female") ||
        name.contains("vaani")
      ) {
        score += 18;
      }
      if (name.contains("local")) {
        score += 8;
      }
      if (name.contains("male") && !name.contains("female")) {
        score -= 10;
      }
      if (score > bestScore) {
        bestScore = score;
        best = voice;
      }
    }
    if (best != null) {
      tts.setVoice(best);
    }
  }

  private List<String> splitForTts(String text) {
    List<String> chunks = new ArrayList<>();
    if (text.length() <= 3500) {
      chunks.add(text);
      return chunks;
    }
    String[] parts = text.split("(?<=[.!?।])\\s+");
    StringBuilder buf = new StringBuilder();
    for (String part : parts) {
      if (buf.length() + part.length() + 1 > 3500 && buf.length() > 0) {
        chunks.add(buf.toString().trim());
        buf.setLength(0);
      }
      if (buf.length() > 0) {
        buf.append(' ');
      }
      buf.append(part);
    }
    if (buf.length() > 0) {
      chunks.add(buf.toString().trim());
    }
    if (chunks.isEmpty()) {
      chunks.add(text);
    }
    return chunks;
  }

  private void requestPlaybackFocus() {
    AudioManager manager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
    if (manager == null) {
      return;
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      manager.requestAudioFocus(
        new android.media.AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
          .setAudioAttributes(
            new AudioAttributes.Builder()
              .setUsage(AudioAttributes.USAGE_MEDIA)
              .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
              .build()
          )
          .build()
      );
    } else {
      manager.requestAudioFocus(
        null,
        AudioManager.STREAM_MUSIC,
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      );
    }
  }

  private void notifyTtsEnd(int generation) {
    if (generation != ttsGeneration) {
      return;
    }
    dispatchRaw("window.dispatchEvent(new CustomEvent('unk-tts-end'));");
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
    stopTts();
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

    @JavascriptInterface
    public void speak(String text, String language, String rateText) {
      float rate = 0.9f;
      try {
        if (rateText != null && !rateText.isEmpty()) {
          rate = Float.parseFloat(rateText);
        }
      } catch (Exception ignored) {}
      final float speechRate = rate;
      final String lang = language == null || language.isEmpty() ? "en-IN" : language;
      final String spoken = text == null ? "" : text;
      runOnUiThread(() -> startTts(spoken, lang, speechRate));
    }

    @JavascriptInterface
    public void stopSpeak() {
      runOnUiThread(MainActivity.this::stopTts);
    }
  }
}
