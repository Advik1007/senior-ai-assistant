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
- `onboarding@resend.dev` works for Resend test mode. For production, verify your own domain at [resend.com/domains](https://resend.com/domains) and use an address on that domain.
- `CONTACT_EMAIL` receives messages submitted on the Help page.
- `EMAIL_TEST_RECIPIENT` receives development test emails.
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

## Deploy frontend to Vercel

UNK AI’s **frontend + API routes** run as one Next.js app on Vercel (not separate
static hosting).

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), import the repo (Framework: **Next.js**).
3. Set environment variables (Production):
   - `APP_URL` = `https://senior-ai-assistant.vercel.app` (your production domain)
   - `AUTH_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `CONTACT_EMAIL`
4. Redeploy after changing env vars.

Use **`senior-ai-assistant.vercel.app`** (production domain). Avoid long preview
URLs — those can show “Log in to Vercel” instead of UNK AI.

## Android app

The Android shell loads the same Vercel frontend URL. See **[ANDROID.md](./ANDROID.md)**.

## First version screens

- Home — large buttons for talk, family, help, and services
- Call family — confirm, then open the phone dialer
- Help — UNK greets you and listens
- Talk to UNK — voice plus typing
- Settings — text size, language, voice speed, contrast, contacts
- Service pages — forms that collect details, search through a server API, and require two confirmations. They stay **API connection required** until you add real credentials. Nothing is shown as booked without a provider confirmation id.
