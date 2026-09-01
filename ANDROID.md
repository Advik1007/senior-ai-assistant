# UNK AI — Android app

The Android app is a **Capacitor shell** that loads your **Vercel-hosted UNK AI
frontend** in a full-screen WebView. Login, setup wizard, and voice all use the
same Next.js app on Vercel — no separate backend host.

## 1. Vercel (frontend)

Production frontend URL:

**`https://senior-ai-assistant.vercel.app`**

In Vercel → **Settings → Environment Variables**:

| Variable | Value |
|----------|--------|
| `APP_URL` | `https://senior-ai-assistant.vercel.app` |
| `AUTH_SECRET` | (random secret) |
| `RESEND_API_KEY` | |
| `RESEND_FROM_EMAIL` | |

Redeploy after changes.

> Do **not** use preview URLs (`…-9zbi9d1x1-….vercel.app`) — they may show
> Vercel’s login instead of UNK AI.

## 2. Point Android at the Vercel frontend

`.env.local` (for building the APK):

```env
APP_URL=https://senior-ai-assistant.vercel.app
CAPACITOR_SERVER_URL=https://senior-ai-assistant.vercel.app
```

```bash
npm run android:sync:prod
npm run android:open
```

## 3. Easier — no Android Studio

On your phone: open **`https://senior-ai-assistant.vercel.app`** in Chrome →
**Add to Home screen**.

## Commands

```bash
npm run android:sync:prod   # Vercel production frontend
npm run android:sync        # Local dev (emulator)
npm run android:open
```
