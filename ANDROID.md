# UNK AI — Android app (Vercel)

The Android app loads your **Vercel-hosted** UNK AI site in a full-screen WebView.
No local dev server is required for the APK once it points at production.

## 1. Vercel environment variables

In the [Vercel dashboard](https://vercel.com) → your project → **Settings → Environment Variables**, set:

| Variable | Example | Notes |
|----------|---------|--------|
| `APP_URL` | `https://your-project.vercel.app` | **Required** — email login links, device alerts |
| `AUTH_SECRET` | (random string) | Session cookies |
| `RESEND_API_KEY` | | Email |
| `RESEND_FROM_EMAIL` | | Email |

`APP_URL` must be your **public https Vercel URL** (custom domain or `*.vercel.app`).
Redeploy after changing env vars.

## 2. Point the Android app at Vercel

In **`.env.local`** on your computer (for building the APK):

```env
APP_URL=https://your-project.vercel.app
CAPACITOR_SERVER_URL=https://your-project.vercel.app
```

Replace `your-project.vercel.app` with your real deployment URL.

## 3. Build the Android app

```bash
npm install
npm run android:sync:prod
npm run android:open
```

In Android Studio: **Run ▶** on a device/emulator, or **Build → Generate Signed Bundle / APK**.

`android:sync:prod` checks that the URL is `https://` and bakes it into the APK.

### If you see “Log in to Vercel” (not UNK AI)

Preview deployment URLs are often **password-protected by Vercel**. The Android app and users will see Vercel’s login, not UNK AI.

**Fix (choose one):**

1. **Use the production URL** — In Vercel → **Settings → Domains**, copy the main URL (usually `https://your-project.vercel.app` without the long random segment). Set that as `APP_URL` and `CAPACITOR_SERVER_URL`, then `npm run android:sync:prod`.

2. **Turn off deployment protection** — Vercel → **Settings → Deployment Protection** → set **Production** (and **Preview** if you need the preview URL) to **None** or allow public access → redeploy.

## 4. What works on Vercel + Android

- Persistent login (httpOnly session cookie over https)
- Full flow: language → login → verify email → setup wizard → home
- Voice / microphone (allow when prompted)
- `tel:` links for family calls

## 5. Email verify links on a phone

Magic links in email open in the **browser** by default. After verifying, open the **UNK AI** app — your session cookie is on the same Vercel domain, so you stay signed in when the app loads that URL.

## Troubleshooting

| Problem | Fix |
|--------|-----|
| **“Log in to Vercel”** when opening the app or site | You are using a **protected preview URL** (long URL with random letters, e.g. `…-9zbi9d1x1-advik1007.vercel.app`). Use your **production** URL instead, or disable protection (below). |
| App blank or offline page | Run `npm run android:sync:prod` with correct `CAPACITOR_SERVER_URL` |
| Login email links go to wrong host | Set `APP_URL` on Vercel to your https URL and redeploy |
| Session not sticking | Ensure Vercel uses `https`; `AUTH_SECRET` is set |
| Local dev on emulator | Use `CAPACITOR_SERVER_URL=http://10.0.2.2:43141` and `npm run android:sync` |

## Commands

```bash
npm run android:sync:prod   # Vercel / https production URL
npm run android:sync        # Uses .env.local (local or prod)
npm run android:open        # Open Android Studio
```
