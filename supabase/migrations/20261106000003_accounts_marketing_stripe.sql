-- =====================================================================
-- Accounts, marketing and international payments
-- =====================================================================

-- One-time password reset tokens for staff and customers (only the hash is stored).
create table public.password_resets (
  id            uuid primary key default gen_random_uuid(),
  subject_type  text not null check (subject_type in ('staff','customer')),
  subject_id    uuid not null,
  token_hash    text not null unique,
  expires_at    timestamptz not null,
  used_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index password_resets_subject_idx on public.password_resets(subject_type, subject_id);

-- Newsletter list (the footer sign-up). Kept in sync with customers.accepts_marketing.
create table public.newsletter_subscribers (
  id                 uuid primary key default gen_random_uuid(),
  email              citext not null unique,
  status             text not null default 'subscribed' check (status in ('subscribed','unsubscribed')),
  source             text not null default 'footer',
  unsubscribe_token  text not null unique,
  subscribed_at      timestamptz not null default now(),
  unsubscribed_at    timestamptz
);

-- Back-in-stock alerts, per variant (or whole product when variant is null).
create table public.stock_alerts (
  id           uuid primary key default gen_random_uuid(),
  email        citext not null,
  product_id   uuid not null references public.products(id) on delete cascade,
  variant_id   uuid references public.product_variants(id) on delete cascade,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz
);
create unique index stock_alerts_pending_unique
  on public.stock_alerts(email, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where notified_at is null;
create index stock_alerts_pending_idx on public.stock_alerts(product_id) where notified_at is null;

-- Abandoned-cart recovery links restore the exact bag on any device.
alter table public.carts add column recovery_token text unique;

-- Stripe for international cards.
alter table public.payments drop constraint payments_provider_check;
alter table public.payments add constraint payments_provider_check
  check (provider in ('paystack','flutterwave','stripe','manual'));

-- Offline payments recorded by staff carry a method (bank transfer, cash, POS…).
alter table public.payments add column manual_method text;
alter table public.payments add column recorded_by uuid references public.staff_users(id) on delete set null;

alter table public.password_resets enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.stock_alerts enable row level security;
revoke all on public.password_resets from anon, authenticated;

insert into public.store_settings (key, value) values ('payments', '{}'::jsonb)
on conflict (key) do update set value = public.store_settings.value || jsonb_build_object(
  'stripe_enabled', coalesce((public.store_settings.value->>'stripe_enabled')::boolean, true),
  'manual_methods', coalesce(public.store_settings.value->'manual_methods', '["Bank transfer","Cash","POS"]'::jsonb));
