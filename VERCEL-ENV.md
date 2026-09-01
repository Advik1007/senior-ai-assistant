# Vercel environment variables

Add these in **Vercel → senior-ai-assistant → Settings → Environment Variables**  
for **Production**, then **Redeploy**.

Copy the values from your local `.env.local` (same keys):

| Name | Notes |
|------|--------|
| `RESEND_API_KEY` | Your `re_…` key from Resend |
| `RESEND_FROM_EMAIL` | `UNK AI <onboarding@resend.dev>` |
| `AUTH_SECRET` | Long random string (same as local) |
| `APP_URL` | `https://senior-ai-assistant-git-main-advik1007.vercel.app` |

Optional:

| Name | Value |
|------|--------|
| `CAPACITOR_SERVER_URL` | Same as `APP_URL` |

## Verify

After redeploy, open:

`https://senior-ai-assistant-git-main-advik1007.vercel.app/api/auth/status`

Expected:

```json
{ "emailReady": true, "missing": [] }
```

## CLI (optional)

If you have Vercel CLI linked:

```bash
npm run vercel:env
```

Then redeploy.

## Deployment protection

If users see **“Log in to Vercel”**, turn off **Deployment Protection** for Production  
in Vercel project settings.
