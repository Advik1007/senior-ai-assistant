# Vercel environment variables

**Your app URL is only this:**

`https://senior-ai-assistant-pmvo6m8h7-advik1007.vercel.app`

There is **no** `app.unk.com` / `app.unk` domain for this project.

## Production env vars (UPPERCASE names)

| Name | Value |
|------|--------|
| `RESEND_API_KEY` | your `re_…` key |
| `RESEND_FROM_EMAIL` | `UNK AI <onboarding@resend.dev>` |
| `AUTH_SECRET` | your long secret |
| `APP_URL` | `https://senior-ai-assistant-pmvo6m8h7-advik1007.vercel.app` |

Delete any lowercase vars like `app_url` / `resend_api_key`.  
Delete any `APP_URL` set to `https://app.unk.com`.

Then **Redeploy**.

## Verify

`https://senior-ai-assistant-pmvo6m8h7-advik1007.vercel.app/api/auth/status`

Expected: `"emailReady": true`
