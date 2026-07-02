# Setup

End-to-end setup, from a fresh clone to a scheduled production deploy. Plan for
about an hour if you have a Google Workspace (see the [production note](README.md#production-note)
in the README).

**Prerequisites**
- Node.js 20+ and npm
- A Google account — ideally on a **Google Workspace** org (see the production note)
- A [Supabase](https://supabase.com) account (free tier is fine)
- Optional for deploy: a [Vercel](https://vercel.com) account and any external cron service

Just want to see it run locally? Do steps 1–4 (you can skip 5–6). The dashboard shows
the sample data from `setup.sql` immediately; connecting a calendar and scheduling the
poll is only needed to send real emails.

## 1. Google Cloud project (OAuth + APIs)

1. Create (or pick) a project at <https://console.cloud.google.com>.
2. **Enable both APIs** — this is separate from OAuth scopes and easy to miss:
   - Google Calendar API
   - Gmail API
3. **OAuth consent screen**: set the user type.
   - Google Workspace org → **Internal** (recommended; no verification needed).
   - Otherwise → **External** (expect Google verification for the restricted scopes).
4. **Credentials → Create OAuth client ID → Web application.** Add these
   **Authorized redirect URIs** (use your real domain in production):
   - `http://localhost:3000/api/auth/callback/google` (NextAuth login, dev)
   - `http://localhost:3000/api/connect/google/callback` (calendar connect, dev)
   - `https://YOUR_DOMAIN/api/auth/callback/google`
   - `https://YOUR_DOMAIN/api/connect/google/callback`
5. Copy the **Client ID** and **Client secret**.

> Scopes used: `openid email profile` (login), `calendar.events.readonly` and
> `gmail.send` (offline access) for the connect flow.

## 2. Supabase

1. Create a project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste all of [`supabase/setup.sql`](supabase/setup.sql), and **Run**.
   - It creates `invites`, `responses`, and `calendar_connections`.
   - It also inserts a few **sample rows** so the dashboard isn't empty. Delete
     that block from the file first if you don't want seed data in your database.
3. From **Project Settings → API**, copy the **Project URL** and the
   **service_role** key (server-only — never ship it to the browser).

## 3. Environment variables

Copy the example and fill it in:

```bash
cd app
cp .env.example .env.local
```

| Variable | What it is |
| --- | --- |
| `AUTH_SECRET` | NextAuth signing secret — `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | from step 1 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | from step 2 |
| `APP_URL` | base URL, e.g. `http://localhost:3000` or your prod URL |
| `CRON_SECRET` | Bearer token guarding `/api/cron/poll` — `openssl rand -base64 32` |
| `TOKEN_ENC_KEY` | 32-byte base64 key encrypting stored refresh tokens — `openssl rand -base64 32` |
| `COMPANY_EMAIL_DOMAIN` | restrict logins to one domain (e.g. `acme.com`); empty = any Google account |
| `NEXT_PUBLIC_APP_NAME` | brand name shown in UI and emails |

## 4. Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

- `/signin` → sign in with Google. If `COMPANY_EMAIL_DOMAIN` is set, only that
  domain's accounts are allowed.
- `/dashboard` → click **Connect Google Calendar** and grant access.
- `/form?t=<token>` → the prospect-facing feedback form (tokens come from invites).

## 5. Deploy

Any Next.js host works; Vercel is the simplest.

1. Push this repo to GitHub and import it on Vercel. **Set the Root Directory to `app/`.**
2. Add every variable from step 3 to the host's environment (use the production
   `APP_URL`).
3. Make sure the **production** redirect URIs from step 1 are registered, and open
   the app at your **stable production URL** (per-deploy preview URLs will fail
   with `redirect_uri_mismatch`).

## 6. Schedule the poll

`POST /api/cron/poll` drives the whole pipeline. Call it every ~30 minutes with the
`CRON_SECRET` as a Bearer token. Any scheduler works:

```
POST https://YOUR_DOMAIN/api/cron/poll
Authorization: Bearer <CRON_SECRET>
```

- **cron-job.org / EasyCron** — free, arbitrary intervals.
- **GitHub Actions** — a scheduled workflow with a `curl` step (keep the secret in
  Actions secrets).
- **Vercel Cron** — note the Hobby plan only allows **daily** crons; Pro allows
  finer schedules.

A healthy response looks like `{ "connections": 1, "sent": 0, "skipped": 0, "errors": 0 }`.

## Troubleshooting

- **`redirect_uri_mismatch`** — the URL you opened isn't in the OAuth client's
  redirect list, or you're on a preview URL. Use the exact production domain.
- **Poll returns `errors > 0` right after connecting** — the Calendar API and/or
  Gmail API isn't enabled (step 1.2). Enabling scopes is not enough.
- **A connected rep stopped receiving invites** — their refresh token was revoked;
  the dashboard card shows "reconnect". Re-run the connect flow.
- **No email after a demo** — the poll only fires for events that **already ended**
  (within the last 2 hours) and have an external guest; cancelled events and guests
  who declined are skipped by design.
