# UNK AI — Capacitor / Android release ProGuard (R8)

# Capacitor plugin annotations & plugins (from @capacitor/android)
-keep @com.getcapacitor.annotation.CapacitorPlugin public class * {
     @com.getcapacitor.annotation.PermissionCallback <methods>;
     @com.getcapacitor.annotation.ActivityCallback <methods>;
     @com.getcapacitor.annotation.Permission <methods>;
     @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends com.getcapacitor.Plugin { *; }
-keep @com.getcapacitor.NativePlugin public class * {
  @com.getcapacitor.PluginMethod public <methods>;
}
-keep public class * extends org.apache.cordova.* {
  public <methods>;
  public <fields>;
}

# Keep Capacitor bridge entry points used via reflection / WebView
-keep class com.getcapacitor.** { *; }
-keepclassmembers class com.getcapacitor.** { *; }
-dontwarn com.getcapacitor.**

# Cordova compatibility layer (Capacitor still references these)
-keep class org.apache.cordova.** { *; }
-dontwarn org.apache.cordova.**

# App package
-keep class ai.unk.app.** { *; }

# WebView JS bridges
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Capgo speech recognition (native plugin)
-keep class app.capgo.** { *; }
-keep class ee.forgr.** { *; }
-dontwarn app.capgo.**

# Keep attributes needed for reflection / parcelables without shipping full source paths
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod,Exceptions
-renamesourcefileattribute SourceFile
# Keep line numbers in mapping.txt for crash symbolication; strip names from the APK via -renamesourcefileattribute
-keepattributes SourceFile,LineNumberTable

# Strip Android log calls from release bytecode (does not affect JS served from Vercel)
-assumenosideeffects class android.util.Log {
    public static *** v(...);
    public static *** d(...);
    public static *** i(...);
    public static *** w(...);
    public static *** e(...);
    public static *** wtf(...);
}

# OkHttp / AndroidX noise
-dontwarn okhttp3.**
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn org.codehaus.mojo.animal_sniffer.*
