# Demo Feedback

**Automatic post-demo feedback for sales teams.** It watches a rep's Google
Calendar, notices when a demo call with an external guest has just ended, emails
the prospect a short feedback form, scores the reply (0–100) into a **hot / warm /
cold** signal, and surfaces everything on an internal dashboard — with **zero
manual work** beyond a one-time "Connect Google Calendar" click.

Next.js 15 (App Router) · NextAuth · Supabase · Google Calendar + Gmail APIs.
No email provider, no third-party SDKs, no background-worker infrastructure.

---

## What this project shows

It's a small product built end to end — the design and the engineering are both mine.

**Design & product**
- A **one-question-at-a-time stepper** form instead of a wall of fields: auto-advance
  on select, a comment step, and a review-before-submit screen. Designed to feel like
  30 seconds of work, because reply rate is the whole point.
- A small **brand system** — one accent color and two typefaces (Sora + DM Sans) as
  design tokens, so the entire app re-skins from three values.
- **Accessibility and motion as defaults, not afterthoughts**: focus moves to each new
  step for screen-reader/keyboard users, progress is announced, and every animation has
  a `prefers-reduced-motion` fallback.
- Real-world polish from real bugs: the NPS 0–10 scale reflows into a tidy grid on
  mobile, and a "tap twice to advance" sticky-hover bug on touch devices is fixed at the
  CSS layer.

**Engineering**
- **OAuth + encrypted token storage**: refresh tokens are encrypted at rest with
  AES-256-GCM before they touch the database, and never reach the client.
- **An idempotent pipeline**: `calendar_event_id` uniqueness and an `email_sent_at`
  guard mean the poller can run every 30 minutes without ever double-emailing, and one
  rep's failure never blocks another's.
- **Thoughtful edge cases**: only timed events that have actually ended fire; cancelled
  events and guests who declined are skipped.
- **Test-driven**: 136 unit tests (Vitest) covering scoring, detection, crypto, the
  Google API layer, the poller, and the UI. `tsc` clean.

---

## How it works

```
Rep clicks "Connect Google Calendar" in the dashboard
        │  OAuth (calendar.events.readonly + gmail.send, offline)
        ▼
Encrypted refresh token stored in Supabase (calendar_connections)
        │
A scheduler calls POST /api/cron/poll every ~30 min  (Bearer CRON_SECRET)
        ▼
runPoll(): for each connected rep
   ├─ refresh access token
   ├─ list primary-calendar events that ended in the last 2h
   ├─ detect demos (external guest + "demo" in the title) → create an invite
   └─ send the feedback email from the rep's own Gmail, with a /form?t=<token> link
        ▼
Prospect submits the form  → POST /api/submit
   ├─ score 0–100 → hot / warm / cold
   ├─ save to Supabase, mark the invite completed
   └─ notify the demo owner by email (best-effort)
        ▼
Sales reads results on the dashboard (Google login, optionally domain-restricted)
```

### Production note

Feedback emails are sent **from each rep's own Gmail** via the restricted `gmail.send`
scope. On a **Google Workspace** org you set the OAuth app to *Internal* and no Google
verification is needed (~30-min setup). With a personal Gmail account the app must be
*External*, which triggers Google's OAuth verification for the restricted scopes — so
this is designed for the Workspace case. (Calling that out is half the point: the
interesting constraint here was delivery, not code.)

## Stack

- **App / API / form** — Next.js 15 App Router (TypeScript), deployable on Vercel
- **Auth** — NextAuth v5 (Google), optionally restricted to one email domain
- **Database** — Supabase (Postgres)
- **Calendar + email** — Google Calendar & Gmail REST APIs via plain `fetch`
- **Secrets** — refresh tokens encrypted at rest (AES-256-GCM)
- **Scheduler** — any cron that can POST with a Bearer header

## Quick start

```bash
cd app
cp .env.example .env.local   # fill in the values — see SETUP.md
npm install
npm run dev                  # http://localhost:3000
```

Full walkthrough (Google Cloud, Supabase, secrets, deploy, cron) → **[SETUP.md](SETUP.md)**.

## Make it yours

Most of the branding lives in one file: [`app/lib/config.ts`](app/lib/config.ts).

| What | Where |
| --- | --- |
| Login email-domain restriction | `COMPANY_EMAIL_DOMAIN` env |
| App / brand name (UI, emails, logo) | `NEXT_PUBLIC_APP_NAME` env |
| Product names shown per demo | `PRODUCT_KEYWORDS` in `config.ts` |
| Brand color | `brand` tokens in `app/tailwind.config.ts` |
| Form questions & scoring weights | `FeedbackForm.tsx`, `app/lib/scoring.ts` |
| Fonts | `app/app/layout.tsx` |

The logo is a text wordmark ([`Logo.tsx`](app/app/_components/Logo.tsx)) so no image asset
is required; swap in an `<Image>` if you have one.

## Project layout

```
app/
  app/            Next.js routes: dashboard, form, signin, api/*
  lib/            config, auth, scoring, Google API, Supabase, poll, email…
  *.test.ts(x)    Vitest unit tests, co-located with the code
supabase/
  setup.sql       schema + optional sample data (run in the Supabase SQL Editor)
```

## Testing

```bash
cd app
npm test          # vitest — 136 tests
npx tsc --noEmit  # typecheck
```

## License

MIT — see [LICENSE](LICENSE).
