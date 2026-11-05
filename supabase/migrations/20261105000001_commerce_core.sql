-- =====================================================================
-- CHISSELED commerce core
-- Replaces the Shopify backend with first-party tables.
-- Money is stored in integer minor units (cents/kobo). Never floats.
-- =====================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- helpers
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------
-- settings
-- ---------------------------------------------------------------------
create table public.store_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- staff, roles, permissions
-- ---------------------------------------------------------------------
create table public.permissions (
  key          text primary key check (key ~ '^[a-z_]+:[a-z_]+$'),
  module       text not null,
  description  text not null
);

create table public.roles (
  id           uuid primary key default gen_random_uuid(),
  key          text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name         text not null,
  description  text not null default '',
  is_system    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.role_permissions (
  role_id         uuid not null references public.roles(id) on delete cascade,
  permission_key  text not null references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table public.staff_users (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null unique,
  name                text not null check (length(name) between 1 and 120),
  password_hash       text not null,
  role_id             uuid not null references public.roles(id),
  status              text not null default 'active' check (status in ('active','suspended')),
  failed_login_count  integer not null default 0,
  locked_until        timestamptz,
  last_login_at       timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index staff_users_role_idx on public.staff_users(role_id);

create table public.staff_sessions (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid not null references public.staff_users(id) on delete cascade,
  token_hash  text not null unique,
  ip          text,
  user_agent  text,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index staff_sessions_staff_idx on public.staff_sessions(staff_id);

-- ---------------------------------------------------------------------
-- catalogue
-- ---------------------------------------------------------------------
create table public.categories (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid references public.categories(id) on delete set null,
  slug         citext not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null,
  description  text not null default '',
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.collections (
  id               uuid primary key default gen_random_uuid(),
  slug             citext not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null,
  description      text not null default '',
  image_url        text,
  status           text not null default 'active' check (status in ('draft','active','archived')),
  position         integer not null default 0,
  seo_title        text,
  seo_description  text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             citext not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title            text not null check (length(title) between 1 and 200),
  subtitle         text not null default '',
  description      text not null default '',
  status           text not null default 'draft' check (status in ('draft','active','archived')),
  category_id      uuid references public.categories(id) on delete set null,
  product_type     text not null default '',
  vendor           text not null default 'CHISSELED',
  gender           text not null default 'unisex' check (gender in ('women','men','unisex')),
  tags             text[] not null default '{}',
  -- [{ "name": "Size", "values": ["S","M"] }, { "name": "Color", "values": [...] }]
  options          jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  -- Editorial extras the storefront renders (story, benefits, fabric, care, nutrition ...)
  details          jsonb not null default '{}'::jsonb check (jsonb_typeof(details) = 'object'),
  seo_title        text,
  seo_description  text,
  featured         boolean not null default false,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  search           tsvector generated always as (
    setweight(to_tsvector('simple', coalesce(title,'')), 'A') ||
    setweight(to_tsvector('simple', coalesce(subtitle,'') || ' ' || coalesce(product_type,'')), 'B') ||
    setweight(to_tsvector('simple', coalesce(description,'')), 'C')
  ) stored
);
create index products_status_idx   on public.products(status);
create index products_category_idx on public.products(category_id);
create index products_search_idx   on public.products using gin(search);
create index products_tags_idx     on public.products using gin(tags);

create table public.product_images (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  url         text not null check (url ~ '^(https://|/)'),
  alt         text not null default '',
  position    integer not null default 0,
  width       integer,
  height      integer,
  created_at  timestamptz not null default now()
);
create index product_images_product_idx on public.product_images(product_id, position);

create table public.product_variants (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products(id) on delete cascade,
  title             text not null default 'Default',
  sku               citext unique,
  barcode           text,
  price_cents       integer not null check (price_cents >= 0),
  compare_at_cents  integer check (compare_at_cents is null or compare_at_cents > 0),
  cost_cents        integer check (cost_cents is null or cost_cents >= 0),
  -- { "Size": "M", "Color": "Black" }
  options           jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  position          integer not null default 0,
  weight_grams      integer check (weight_grams is null or weight_grams >= 0),
  track_inventory   boolean not null default true,
  image_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (product_id, options)
);
create index product_variants_product_idx on public.product_variants(product_id, position);

create table public.product_collections (
  product_id     uuid not null references public.products(id) on delete cascade,
  collection_id  uuid not null references public.collections(id) on delete cascade,
  position       integer not null default 0,
  primary key (product_id, collection_id)
);
create index product_collections_collection_idx on public.product_collections(collection_id, position);

-- ---------------------------------------------------------------------
-- inventory
-- reserved <= on_hand is the invariant that makes overselling impossible.
-- ---------------------------------------------------------------------
create table public.inventory (
  variant_id           uuid primary key references public.product_variants(id) on delete cascade,
  on_hand              integer not null default 0 check (on_hand >= 0),
  reserved             integer not null default 0 check (reserved >= 0),
  low_stock_threshold  integer not null default 5 check (low_stock_threshold >= 0),
  updated_at           timestamptz not null default now(),
  constraint inventory_reserved_le_on_hand check (reserved <= on_hand)
);

create table public.inventory_movements (
  id              bigint generated always as identity primary key,
  variant_id      uuid not null references public.product_variants(id) on delete cascade,
  reason          text not null check (reason in
                    ('adjustment','restock','sale','reservation','reservation_release',
                     'return','damage','correction','import')),
  delta_on_hand   integer not null default 0,
  delta_reserved  integer not null default 0,
  on_hand_after   integer not null,
  reserved_after  integer not null,
  note            text not null default '',
  order_id        uuid,
  staff_id        uuid references public.staff_users(id) on delete set null,
  created_at      timestamptz not null default now()
);
create index inventory_movements_variant_idx on public.inventory_movements(variant_id, created_at desc);
create index inventory_movements_order_idx   on public.inventory_movements(order_id);

-- ---------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------
create table public.customers (
  id                  uuid primary key default gen_random_uuid(),
  email               citext not null unique,
  first_name          text not null default '',
  last_name           text not null default '',
  phone               text not null default '',
  -- null means a guest record (created by checkout) with no login
  password_hash       text,
  accepts_marketing   boolean not null default false,
  status              text not null default 'active' check (status in ('active','disabled')),
  tags                text[] not null default '{}',
  note                text not null default '',
  failed_login_count  integer not null default 0,
  locked_until        timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index customers_tags_idx on public.customers using gin(tags);

create table public.customer_sessions (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  token_hash   text not null unique,
  expires_at   timestamptz not null,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index customer_sessions_customer_idx on public.customer_sessions(customer_id);

create table public.customer_addresses (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  first_name   text not null default '',
  last_name    text not null default '',
  company      text not null default '',
  line1        text not null,
  line2        text not null default '',
  city         text not null,
  region       text not null default '',
  postal_code  text not null default '',
  country      char(2) not null check (country ~ '^[A-Z]{2}$'),
  phone        text not null default '',
  is_default   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index customer_addresses_customer_idx on public.customer_addresses(customer_id);
create unique index customer_addresses_one_default on public.customer_addresses(customer_id) where is_default;

create table public.customer_notes (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid not null references public.customers(id) on delete cascade,
  staff_id     uuid references public.staff_users(id) on delete set null,
  body         text not null check (length(body) between 1 and 4000),
  created_at   timestamptz not null default now()
);
create index customer_notes_customer_idx on public.customer_notes(customer_id, created_at desc);

-- ---------------------------------------------------------------------
-- discounts
-- ---------------------------------------------------------------------
create table public.discounts (
  id                  uuid primary key default gen_random_uuid(),
  code                citext unique,             -- null => automatic discount
  title               text not null,
  kind                text not null check (kind in ('percentage','fixed_amount','free_shipping')),
  value               integer not null default 0 check (value >= 0), -- percent (1-100) or minor units
  min_subtotal_cents  integer not null default 0 check (min_subtotal_cents >= 0),
  applies_to          text not null default 'all' check (applies_to in ('all','collections','products')),
  collection_ids      uuid[] not null default '{}',
  product_ids         uuid[] not null default '{}',
  usage_limit         integer check (usage_limit is null or usage_limit > 0),
  once_per_customer   boolean not null default false,
  times_used          integer not null default 0 check (times_used >= 0),
  is_automatic        boolean not null default false,
  status              text not null default 'active' check (status in ('active','disabled')),
  starts_at           timestamptz not null default now(),
  ends_at             timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (kind <> 'percentage' or value between 1 and 100),
  check (is_automatic or code is not null),
  check (ends_at is null or ends_at > starts_at)
);

-- ---------------------------------------------------------------------
-- shipping
-- ---------------------------------------------------------------------
create table public.shipping_zones (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  countries          char(2)[] not null default '{}',
  is_rest_of_world   boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index shipping_zones_one_rest_of_world on public.shipping_zones((true)) where is_rest_of_world;

create table public.shipping_rates (
  id                  uuid primary key default gen_random_uuid(),
  zone_id             uuid not null references public.shipping_zones(id) on delete cascade,
  name                text not null,
  price_cents         integer not null check (price_cents >= 0),
  free_over_cents     integer check (free_over_cents is null or free_over_cents > 0),
  min_subtotal_cents  integer not null default 0 check (min_subtotal_cents >= 0),
  days_min            integer check (days_min is null or days_min >= 0),
  days_max            integer check (days_max is null or days_max >= 0),
  active              boolean not null default true,
  position            integer not null default 0,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index shipping_rates_zone_idx on public.shipping_rates(zone_id, position);

-- ---------------------------------------------------------------------
-- carts
-- ---------------------------------------------------------------------
create table public.carts (
  id                  uuid primary key default gen_random_uuid(),
  customer_id         uuid references public.customers(id) on delete set null,
  email               citext,
  discount_code       citext,
  status              text not null default 'active' check (status in ('active','converted','abandoned')),
  converted_order_id  uuid,
  reminder_sent_at    timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index carts_status_updated_idx on public.carts(status, updated_at);

create table public.cart_items (
  id          uuid primary key default gen_random_uuid(),
  cart_id     uuid not null references public.carts(id) on delete cascade,
  variant_id  uuid not null references public.product_variants(id) on delete cascade,
  quantity    integer not null check (quantity between 1 and 99),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (cart_id, variant_id)
);

-- ---------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------
create sequence public.order_number_seq start 1001;

create table public.orders (
  id                      uuid primary key default gen_random_uuid(),
  number                  bigint not null unique default nextval('public.order_number_seq'),
  customer_id             uuid references public.customers(id) on delete set null,
  cart_id                 uuid references public.carts(id) on delete set null,
  email                   citext not null,
  phone                   text not null default '',
  currency                char(3) not null check (currency ~ '^[A-Z]{3}$'),
  status                  text not null default 'pending'
                            check (status in ('pending','open','completed','cancelled')),
  payment_status          text not null default 'pending'
                            check (payment_status in ('pending','paid','partially_refunded','refunded','failed','voided')),
  fulfillment_status      text not null default 'unfulfilled'
                            check (fulfillment_status in ('unfulfilled','partially_fulfilled','fulfilled','returned')),
  subtotal_cents          integer not null check (subtotal_cents >= 0),
  discount_cents          integer not null default 0 check (discount_cents >= 0),
  shipping_cents          integer not null default 0 check (shipping_cents >= 0),
  tax_cents               integer not null default 0 check (tax_cents >= 0),
  total_cents             integer not null check (total_cents >= 0),
  refunded_cents          integer not null default 0 check (refunded_cents >= 0),
  discount_id             uuid references public.discounts(id) on delete set null,
  discount_code           citext,
  shipping_rate_id        uuid references public.shipping_rates(id) on delete set null,
  shipping_method         text not null default '',
  shipping_address        jsonb,
  billing_address         jsonb,
  customer_note           text not null default '',
  staff_note              text not null default '',
  payment_provider        text,
  access_token_hash       text not null,   -- lets a guest view their own confirmation
  reservation_expires_at  timestamptz,
  inventory_state         text not null default 'reserved'
                            check (inventory_state in ('reserved','committed','released')),
  flags                   text[] not null default '{}',
  paid_at                 timestamptz,
  cancelled_at            timestamptz,
  cancel_reason           text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint orders_total_matches check
    (total_cents = subtotal_cents - discount_cents + shipping_cents + tax_cents),
  constraint orders_refund_le_total check (refunded_cents <= total_cents)
);
create index orders_customer_idx       on public.orders(customer_id, created_at desc);
create index orders_created_idx        on public.orders(created_at desc);
create index orders_payment_status_idx on public.orders(payment_status);
create index orders_fulfillment_idx    on public.orders(fulfillment_status);
create index orders_email_idx          on public.orders(email);
create index orders_reservation_idx    on public.orders(reservation_expires_at)
  where inventory_state = 'reserved';

alter table public.carts
  add constraint carts_converted_order_fk
  foreign key (converted_order_id) references public.orders(id) on delete set null;
alter table public.inventory_movements
  add constraint inventory_movements_order_fk
  foreign key (order_id) references public.orders(id) on delete set null;

create table public.order_items (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders(id) on delete cascade,
  product_id         uuid references public.products(id) on delete set null,
  variant_id         uuid references public.product_variants(id) on delete set null,
  title              text not null,
  variant_title      text not null default '',
  sku                text,
  image_url          text,
  unit_price_cents   integer not null check (unit_price_cents >= 0),
  unit_cost_cents    integer check (unit_cost_cents is null or unit_cost_cents >= 0),
  quantity           integer not null check (quantity > 0),
  total_cents        integer not null check (total_cents >= 0),
  fulfilled_quantity integer not null default 0 check (fulfilled_quantity >= 0),
  restocked_quantity integer not null default 0 check (restocked_quantity >= 0),
  check (fulfilled_quantity <= quantity),
  check (restocked_quantity <= quantity)
);
create index order_items_order_idx   on public.order_items(order_id);
create index order_items_variant_idx on public.order_items(variant_id);
create index order_items_product_idx on public.order_items(product_id);

create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders(id) on delete cascade,
  kind        text not null,
  message     text not null,
  data        jsonb not null default '{}'::jsonb,
  staff_id    uuid references public.staff_users(id) on delete set null,
  created_at  timestamptz not null default now()
);
create index order_events_order_idx on public.order_events(order_id, created_at);

create table public.discount_redemptions (
  id            uuid primary key default gen_random_uuid(),
  discount_id   uuid not null references public.discounts(id) on delete cascade,
  order_id      uuid not null references public.orders(id) on delete cascade,
  customer_id   uuid references public.customers(id) on delete set null,
  email         citext not null,
  amount_cents  integer not null check (amount_cents >= 0),
  created_at    timestamptz not null default now(),
  unique (discount_id, order_id)
);
create index discount_redemptions_email_idx on public.discount_redemptions(discount_id, email);

-- ---------------------------------------------------------------------
-- payments & refunds
-- ---------------------------------------------------------------------
create table public.payments (
  id                       uuid primary key default gen_random_uuid(),
  order_id                 uuid not null references public.orders(id) on delete restrict,
  provider                 text not null check (provider in ('paystack','flutterwave','manual')),
  reference                text not null unique,
  provider_transaction_id  text,
  amount_cents             integer not null check (amount_cents >= 0),
  currency                 char(3) not null,
  status                   text not null default 'initialized'
                             check (status in ('initialized','pending','succeeded','failed','abandoned')),
  authorization_url        text,
  channel                  text,
  fee_cents                integer,
  failure_reason           text,
  raw                      jsonb not null default '{}'::jsonb,
  verified_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);
create index payments_order_idx  on public.payments(order_id);
create index payments_status_idx on public.payments(status, created_at desc);

create table public.refunds (
  id                  uuid primary key default gen_random_uuid(),
  order_id            uuid not null references public.orders(id) on delete restrict,
  payment_id          uuid references public.payments(id) on delete set null,
  amount_cents        integer not null check (amount_cents > 0),
  reason              text not null default '',
  status              text not null default 'pending' check (status in ('pending','succeeded','failed')),
  provider_refund_id  text,
  -- [{ "order_item_id": "...", "quantity": 1 }]
  restock_items       jsonb not null default '[]'::jsonb,
  failure_reason      text,
  staff_id            uuid references public.staff_users(id) on delete set null,
  raw                 jsonb not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index refunds_order_idx on public.refunds(order_id);

create table public.webhook_events (
  id            bigint generated always as identity primary key,
  provider      text not null,
  event_id      text not null,
  event_type    text not null default '',
  payload       jsonb not null,
  processed_at  timestamptz,
  error         text,
  received_at   timestamptz not null default now(),
  unique (provider, event_id)
);

-- ---------------------------------------------------------------------
-- fulfilment
-- ---------------------------------------------------------------------
create table public.shipments (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders(id) on delete cascade,
  status           text not null default 'pending' check (status in
                     ('pending','in_transit','out_for_delivery','delivered','failed','returned')),
  carrier          text not null default '',
  tracking_number  text not null default '',
  tracking_url     text,
  -- [{ "order_item_id": "...", "quantity": 1 }]
  items            jsonb not null default '[]'::jsonb,
  shipped_at       timestamptz,
  delivered_at     timestamptz,
  staff_id         uuid references public.staff_users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index shipments_order_idx on public.shipments(order_id);

-- ---------------------------------------------------------------------
-- marketing, notifications, audit, rate limiting
-- ---------------------------------------------------------------------
create table public.marketing_campaigns (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  channel      text not null default 'email' check (channel in ('email','sms','social','other')),
  status       text not null default 'draft' check (status in ('draft','scheduled','active','completed')),
  segment      text not null default 'all',
  discount_id  uuid references public.discounts(id) on delete set null,
  starts_at    timestamptz,
  ends_at      timestamptz,
  notes        text not null default '',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.notifications (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  severity     text not null default 'info' check (severity in ('info','warning','critical')),
  title        text not null,
  body         text not null default '',
  entity_type  text,
  entity_id    text,
  dedupe_key   text unique,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index notifications_unread_idx on public.notifications(created_at desc) where read_at is null;

create table public.audit_logs (
  id           bigint generated always as identity primary key,
  staff_id     uuid references public.staff_users(id) on delete set null,
  actor        text not null,
  action       text not null,
  entity_type  text not null default '',
  entity_id    text not null default '',
  changes      jsonb not null default '{}'::jsonb,
  ip           text,
  created_at   timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);
create index audit_logs_entity_idx  on public.audit_logs(entity_type, entity_id);

create table public.rate_limits (
  key           text primary key,
  count         integer not null,
  window_start  timestamptz not null
);

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'roles','staff_users','categories','collections','products','product_variants',
    'customers','customer_addresses','discounts','shipping_zones','shipping_rates',
    'carts','cart_items','orders','payments','refunds','shipments','marketing_campaigns'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_updated_at', t);
  end loop;
end $$;

create trigger inventory_updated_at before update on public.inventory
  for each row execute function public.set_updated_at();
