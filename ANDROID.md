# UNK AI — Android app (Capacitor + Java WebView)

## Stack

- **Not** Flutter / React Native / Expo / pure Kotlin Compose UI
- **Capacitor 8** Android shell (`ai.unk.app`) with **Java** `MainActivity`
- UI/logic loads from a **remote HTTPS Next.js** site (Vercel)
- Sensitive APIs/secrets stay on the **server**, not in the APK

## Production / competition RELEASE APK

1. Set production HTTPS URL in `.env.local`:

```env
APP_URL=https://YOUR-PRODUCTION.vercel.app
CAPACITOR_SERVER_URL=https://YOUR-PRODUCTION.vercel.app
```

2. Create a signing keystore (once) and `android/keystore.properties`  
   (see `android/keystore.properties.example` — **never commit** these).

3. Build + inspect:

```bash
npm run android:release
```

Outputs:

- `releases/unk-ai-release-YYYY-MM-DD.apk` — distribute this
- `releases/mapping-release-YYYY-MM-DD.txt` — **keep private** (R8 deobfuscation)

Or manually:

```bash
npm run android:sync:prod
cd android && ./gradlew clean assembleRelease
```

APK path: `android/app/build/outputs/apk/release/app-release.apk`

AAB (Play Store):

```bash
cd android && ./gradlew bundleRelease
```

## Debug vs release

| | Debug | Release |
|---|---|---|
| R8 minify / shrink | off | on |
| Cleartext HTTP | allowed | blocked |
| WebView chrome debugging | on | off |
| Profileable | on | off |
| Backup | disabled in release manifest | disabled |

## App integrity (recommended, not fully wired)

- Sign every competition/production build with **your** upload/app signing key
- For Play distribution: enable **Play App Signing** + consider **Play Integrity API** checks on the backend for sensitive actions
- Keep verifying sessions/JWT/`AUTH_SECRET` only on the server

## Dev sync (local Next.js)

```bash
npm run android:sync
npm run android:open
```
