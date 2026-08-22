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

For voice, use Chrome or Edge and allow the microphone. Add family phone
numbers in **Settings** before calling.

## First version screens

- Home — large buttons for talk, family, help, and services
- Call family — confirm, then open the phone dialer
- Help — UNK greets you and listens
- Talk to UNK — voice plus typing
- Settings — text size, language, voice speed, contrast, contacts
- Service pages — clearly marked **API connection required**
