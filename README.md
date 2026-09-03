# UNK AI

UNK AI is a mobile-first accessibility app for older adults. It helps with
family calling, voice conversation, and everyday services. Paid services are
never completed unless an authorized provider API confirms them, and never
without the user confirming twice.

## Stack (and why)

- **Next.js (App Router) + TypeScript** — one project for the phone-sized
  website and a secure backend. Cursor works well with this. Later the same
  UI can be wrapped with Capacitor for an app store build.
- **Tailwind CSS + shadcn/ui** — fast layout, with large custom buttons on
  top of simple UI primitives.
- **On-device storage (for this first version)** — family contacts and
  accessibility settings stay on the phone/browser. No PINs, OTPs, or CVVs.
- **Web Speech API** — real listening and speaking in the browser. No call
  recording.
- **`tel:` links** — real phone calls on a phone. On a desktop they open
  whatever calling app the computer has, if any.

Service files under `src/lib/services/` are **interfaces only**. They throw
until you connect a licensed API. The app will not show a fake “Booked”
state.

## Run locally

```bash
npm install
npm run dev -- --port 43141 --hostname 127.0.0.1
```

Then open [http://127.0.0.1:43141](http://127.0.0.1:43141).

## Android app

UNK AI can run as an Android app (Capacitor WebView shell). See **[ANDROID.md](./ANDROID.md)** for setup, emulator, and APK build steps.

For voice, use Chrome or Edge and allow the microphone. Add family phone
numbers in **Settings** before calling.

## Resend email

Copy `.env.example` to `.env.local` and configure:

```env
RESEND_API_KEY=
RESEND_FROM_EMAIL="UNK AI <onboarding@resend.dev>"
CONTACT_EMAIL=
EMAIL_TEST_RECIPIENT=
APP_URL=http://127.0.0.1:43141
```

- Use a newly created Resend key for `RESEND_API_KEY`.
- `CONTACT_EMAIL` receives messages submitted on the Help page.
- `EMAIL_TEST_RECIPIENT` receives development test emails.
- `onboarding@resend.dev` is suitable for Resend testing. Use an address on
  your verified domain for production.
- `.env.local` is ignored by Git and must never be committed.

Restart the development server after changing environment variables. To test
each reusable template while the server is running:

```bash
curl -X POST http://127.0.0.1:43141/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"kind":"welcome"}'

curl -X POST http://127.0.0.1:43141/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"kind":"verification"}'

curl -X POST http://127.0.0.1:43141/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"kind":"password-reset"}'
```

The test endpoint is disabled in production. Production authentication code
should call the server-only functions in `src/lib/email/service.ts` after it
creates and stores expiring, single-use verification or password-reset tokens.

## Deploy to Vercel

1. Push this repository to GitHub. The Next.js app lives in `src/app/` at the
   project root (same folder as `package.json`).
2. In Vercel, import the GitHub repo and use these defaults:
   - **Framework:** Next.js
   - **Root Directory:** `.` (repository root)
   - **Build Command:** `npm run build`
   - **Output:** automatic
3. Add environment variables in the Vercel dashboard (never commit secrets):
   `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL`, `AUTH_SECRET`, and
   **`APP_URL`** = `https://senior-ai-assistant-pmvo6m8h7-advik1007.vercel.app` (required for login emails and Android).
4. Redeploy after changing environment variables.

## Android app (Vercel)

If the site is on Vercel, the Android APK should load that same https URL. See
**[ANDROID.md](./ANDROID.md)** — set `CAPACITOR_SERVER_URL` in `.env.local` and run
`npm run android:sync:prod`.

## First version screens

- Home — large buttons for talk, family, help, and services
- Call family — confirm, then open the phone dialer
- Help — UNK greets you and listens
- Talk to UNK — voice plus typing
- Settings — text size, language, voice speed, contrast, contacts
- Service pages — forms that collect details, search through a server API, and require two confirmations. They stay **API connection required** until you add real credentials. Nothing is shown as booked without a provider confirmation id.
