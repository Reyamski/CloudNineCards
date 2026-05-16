# Admin credential rotation — vuln audit HIGH-1 + F12

Closes the brute-forceable-admin finding (weak `cnc2026` + no rate-limit)
and the F12 secret rotation in one step.

⚠ The actual new `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` values are NOT
stored in this file (committing live secrets to the repo is the exact leak
class we're fixing). They were delivered to the operator out-of-band (chat)
and are already written to local `preview/.env` (gitignored). If you no
longer have them, regenerate:

```
node -e "console.log('ADMIN_PASSWORD=' + require('crypto').randomBytes(18).toString('base64url')); console.log('ADMIN_SESSION_SECRET=' + require('crypto').randomBytes(48).toString('base64url'))"
```

## Steps

1. Vercel → CloudNineCards → Settings → Environment Variables.
2. Edit `ADMIN_PASSWORD` → paste the new 24-char value → all 3 envs →
   Save → mark **Sensitive**.
3. Edit `ADMIN_SESSION_SECRET` → paste the new 48-byte value → all 3 →
   Save → mark **Sensitive**.
4. Deployments → ⋯ → Redeploy.
5. All existing admin sessions invalidate (new secret). Re-login at
   `/admin` with the new password. Store it in a password manager.

## What also shipped (code, auto-deploys on push)

- `/api/admin-auth` per-IP rate limit: 5 failed attempts / 15 min → HTTP
  429 + `Retry-After`. Serverless memory is per-instance → strong
  speed-bump, not absolute. Back with Vercel KV / Upstash later for hard
  guarantees (follow-up).
- `/api/admin-auth` CORS tightened from `*` to same-origin.
