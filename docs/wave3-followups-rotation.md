# Wave 3 follow-ups — ADMIN_SESSION_SECRET rotation (F12)

## New secret value

```
CxdBgIN5Dccjw9tI9ukQRBdFoiwR9symBYRcrRkKh19KBJbXb_yMCpjheWXe_qH2
```

This is a fresh 64-char base64url string generated locally via
`crypto.randomBytes(48).toString('base64url')`. Do not commit anywhere
public other than this rotation doc; treat as a secret going forward.

## Rotation steps

1. **Vercel** — open the CloudNineCards project → Settings → Environment
   Variables → `ADMIN_SESSION_SECRET` → Edit → paste the new value above →
   Save → redeploy the current Production deployment so the new env var
   takes effect.
2. **Local `.env`** — update `preview/.env` (or wherever `ADMIN_SESSION_SECRET`
   lives in your local copy). Restart the local dev server.
3. **Sign back into /admin** — all active admin sessions are now invalid
   (JWTs were signed with the old secret). The admin password gate will
   issue a fresh token signed with the new secret on next login.

## Effect

- All admin-side endpoints (`/api/admin/*`) refuse old tokens with 401.
- Customer-facing flows are unaffected; only the admin auth layer is keyed
  off this secret.
- No code change required — only env var rotation + redeploy.

## Why now

The old secret (`knx8WQIZtIiA5v3mun4LUmDvNC2bR6e5CKzofuOrJ8HFKvhgkqsMoI51wWHLig1R`)
was visible in earlier conversation history. Rotating closes that exposure
window. Going forward, treat the secret as opaque and never paste it into
chat / commit messages / non-secret files.
