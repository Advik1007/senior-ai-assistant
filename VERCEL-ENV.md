# Vercel environment variables

**App URL:** `https://senior-ai-assistant-git-main-advik1007.vercel.app`

## Required (UPPERCASE names)

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | your `re_…` key |
| `RESEND_FROM_EMAIL` | `UNK AI <onboarding@resend.dev>` until a domain is verified |
| `AUTH_SECRET` | your long secret |
| `APP_URL` | `https://senior-ai-assistant-git-main-advik1007.vercel.app` |
| `TURSO_DATABASE_URL` | `libsql://….turso.io` (from Turso) |
| `TURSO_AUTH_TOKEN` | database token from Turso |
| `GEMINI_API_KEY` | Google AI Studio key for Talk + Doctor AI |
| `AI_MODEL` | e.g. `gemini-2.0-flash` (optional) |

### Free: send to any email with Gmail

No domain and no Cloudflare. Uses `hello.unkai@gmail.com`.

| Name | Value |
|------|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | `hello.unkai@gmail.com` |
| `SMTP_FROM` | `UNK AI <hello.unkai@gmail.com>` |
| `SMTP_PASS` | 16-character [App Password](https://myaccount.google.com/apppasswords) (not the normal Gmail password) |

1. Turn on [2-Step Verification](https://myaccount.google.com/signinoptions/two-step-verification) for that Gmail.
2. Open [App passwords](https://myaccount.google.com/apppasswords) → create one named **UNK AI**.
3. Paste it as `SMTP_PASS` in Vercel Production → **Redeploy**.

Gmail’s free limit is about 500 emails per day.

Without Turso, **Create account** fails on Vercel (no writable local database).

## Create free Turso DB (2 minutes)

1. Sign up at [turso.tech](https://turso.tech)
2. Create a database (e.g. `unk-ai`)
3. Copy **Database URL** → `TURSO_DATABASE_URL`
4. Create a token → copy → `TURSO_AUTH_TOKEN`
5. Add both in Vercel → Environment Variables → Production
6. **Redeploy**

## Verify

- Email: `/api/auth/status` → `"emailReady": true` (needs `INBOX_SECRET` bearer in production)
- Signup / safety email should reach any address after Option A or B
