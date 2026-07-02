-- Demo Feedback — database setup
-- Creates the invites + responses + calendar_connections tables the app reads.
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query → paste → Run).

-- ── Tables ─────────────────────────────────────────────────────────────────

create table if not exists public.invites (
  id                uuid primary key default gen_random_uuid(),
  token             text unique not null,
  calendar_event_id text unique not null,
  prospect_name     text not null,
  prospect_email    text not null,
  company           text,
  product           text not null,
  demo_owner        text not null,
  status            text not null default 'pending',
  created_at        timestamptz not null default now(),
  completed_at      timestamptz,
  email_sent_at     timestamptz
);

-- Track when the feedback email was sent (idempotent: safe on an existing database).
alter table public.invites add column if not exists email_sent_at timestamptz;

create table if not exists public.responses (
  id              uuid primary key default gen_random_uuid(),
  invite_id       uuid not null unique references public.invites(id) on delete cascade,
  relevance       int not null,
  satisfaction    int not null,
  clarity         int not null,
  nps             int not null,
  purchase_intent int not null,
  comment         text,
  score           int not null,
  signal          text not null,
  submitted_at    timestamptz not null default now()
);

-- Enforce one response per invite at the DB layer (idempotent: safe to re-run on an
-- existing database that was created before this constraint was added).
alter table public.responses drop constraint if exists responses_invite_id_key;
alter table public.responses add constraint responses_invite_id_key unique (invite_id);

-- ── Calendar connections (Google OAuth per rep) ─────────────────────────────
create table if not exists public.calendar_connections (
  email          text primary key,
  refresh_token  text not null,       -- AES-256-GCM encrypted (v1:iv:tag:ciphertext)
  scopes         text not null,
  status         text not null default 'active',  -- 'active' | 'needs_reconsent'
  connected_at   timestamptz not null default now(),
  last_polled_at timestamptz
);

-- ── Sample data (optional) ───────────────────────────────────────────────────
-- 4 invites: 3 completed (hot / warm / cold) + 1 pending, so the dashboard shows
-- data on first run. Safe to re-run (ON CONFLICT guards). DELETE this block before
-- deploying to production if you don't want seed data.

insert into public.invites
  (id, token, calendar_event_id, prospect_name, prospect_email, company, product, demo_owner, status, created_at, completed_at)
values
  ('11111111-1111-1111-1111-111111111111', 'tok-001', 'evt-001', 'Jordan Lee',   'jordan@acme.com',    null, 'generic', 'rep@example.com', 'completed', now() - interval '5 days',  now() - interval '4 days'),
  ('22222222-2222-2222-2222-222222222222', 'tok-002', 'evt-002', 'Sam Rivera',   'sam@initech.com',    null, 'generic', 'rep@example.com', 'completed', now() - interval '10 days', now() - interval '9 days'),
  ('33333333-3333-3333-3333-333333333333', 'tok-003', 'evt-003', 'Alex Chen',    'alex@umbrella.com',  null, 'generic', 'rep@example.com', 'completed', now() - interval '15 days', now() - interval '14 days'),
  ('44444444-4444-4444-4444-444444444444', 'tok-004', 'evt-004', 'Riley Morgan', 'riley@globex.com',   null, 'generic', 'rep@example.com', 'pending',   now() - interval '1 day',    null)
on conflict (calendar_event_id) do nothing;

insert into public.responses
  (invite_id, relevance, satisfaction, clarity, nps, purchase_intent, comment, score, signal, submitted_at)
values
  ('11111111-1111-1111-1111-111111111111', 5, 5, 4, 9, 5, 'Great demo, very interested.',       88, 'hot',  now() - interval '4 days'),
  ('22222222-2222-2222-2222-222222222222', 4, 3, 4, 7, 3, 'Good, but we need to check budget.', 62, 'warm', now() - interval '9 days'),
  ('33333333-3333-3333-3333-333333333333', 2, 2, 3, 4, 1, 'Not a fit right now.',               35, 'cold', now() - interval '14 days')
on conflict do nothing;
