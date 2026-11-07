# UNK AI + Trust AI

This repo hosts **UNK AI** (senior accessibility companion) and the new **Trust AI**
chat slice — a personal work-organizing assistant with a local PyTorch path on
Apple Silicon (MPS).

## Trust AI (chat + local inference)

Product: own organizer AI (not a Gemini clone). Gemini is only a future bridge
to Google after the user confirms. Student mode hooks exist; v1 ships the chat
shell + precise plan/prioritize/clarify brain + local torch device wiring.

### Architecture

| Piece | Role | Port |
|-------|------|------|
| Next.js app (`/trust`) | Brand-first chat UI, streaming proxy | `43141` |
| `python -m trust_ai.server` | PyTorch + SmolLM2 on `device` from `device.py`; organizer replies | `8742` |

**Reply source:** structured organizer (`trust_ai_v1` JSON + sharp markdown).
**Model role:** `HuggingFaceTB/SmolLM2-135M-Instruct` loaded on MPS/CPU to prove
the local inference path (affinity + warm generate). UI labels this clearly.

### Run on Advik’s Mac

```bash
# 1) Python env (already created in this checkout)
source venv/bin/activate
pip install -r requirements-trust.txt   # first time / after pull

# 2) Local inference (loads torch + MPS model — first run downloads weights)
python -m trust_ai.server
# → http://127.0.0.1:8742/health

# 3) Web app (separate terminal)
npm install
npm run dev
# → http://127.0.0.1:43141/trust
```

Health check:

```bash
curl -s http://127.0.0.1:8742/health | python -m json.tool
```

Expect `"device": "mps"` on Apple Silicon when Metal is available.

### Organizer intelligence

Replies follow `plan / prioritize / clarify / confirm-before-Google` patterns:
ranked scores, time-boxed blocks with success criteria, ≤3 clarifying questions,
and Calendar/Gmail payloads that stay `awaiting_confirmation` until the user
confirms. Trust AI never claims Google success without a host bridge result.

---

## UNK AI (existing product)

UNK AI is a mobile-first accessibility app for older adults. See screens under
`/home`, `/family`, `/talk`, etc.

### Stack

- **Next.js (App Router) + TypeScript**
- **Tailwind CSS + shadcn/ui**
- Capacitor Android shell (see `ANDROID.md`)

### Run UNK locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43141](http://127.0.0.1:43141).

### Email (Gmail SMTP)

Copy `.env.example` to `.env.local` and configure SMTP vars. Never commit secrets.

### Deploy

Frontend + API routes deploy as one Next.js app on Vercel. Local Trust AI
inference (`trust_ai.server`) is Mac-only for now — Vercel will not run the
PyTorch process; point `TRUST_AI_INFER_URL` at a reachable host if needed.
