# Vercel environment variables

**App URL:** `https://senior-ai-assistant-git-main-advik1007.vercel.app`

## Required (UPPERCASE names)

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | your `re_…` key |
| `RESEND_FROM_EMAIL` | `UNK AI <onboarding@resend.dev>` |
| `AUTH_SECRET` | your long secret |
| `APP_URL` | `https://senior-ai-assistant-git-main-advik1007.vercel.app` |
| `TURSO_DATABASE_URL` | `libsql://….turso.io` (from Turso) |
| `TURSO_AUTH_TOKEN` | token from Turso |

Without Turso, **Create account** fails on Vercel (no writable local database).

## Create free Turso DB (2 minutes)

1. Sign up at [turso.tech](https://turso.tech)
2. Create a database (e.g. `unk-ai`)
3. Copy **Database URL** → `TURSO_DATABASE_URL`
4. Create a token → copy → `TURSO_AUTH_TOKEN`
5. Add both in Vercel → Environment Variables → Production
6. **Redeploy**

## Verify

- Email: `/api/auth/status` → `"emailReady": true`
- Signup: Create account should succeed after Turso is set
