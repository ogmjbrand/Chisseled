-- =====================================================================
-- Row Level Security
--
-- The Next.js server connects with a privileged role (DATABASE_URL) and is
-- the only writer. The browser-facing Supabase keys (anon / authenticated)
-- may only READ the public, active catalogue. Every other table has RLS
-- enabled with no policy for those roles, which denies all access.
-- =====================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'store_settings','permissions','roles','role_permissions','staff_users','staff_sessions',
    'categories','collections','products','product_images','product_variants','product_collections',
    'inventory','inventory_movements','customers','customer_sessions','customer_addresses',
    'customer_notes','discounts','shipping_zones','shipping_rates','carts','cart_items',
    'orders','order_items','order_events','discount_redemptions','payments','refunds',
    'webhook_events','shipments','marketing_campaigns','notifications','audit_logs','rate_limits'
  ] loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- RLS is not FORCEd: the owning role (the one that ran these migrations and
-- that DATABASE_URL connects as) is the trusted server and bypasses it.

-- Storefront read policies (catalogue only, active rows only)
create policy "public read active products" on public.products
  for select to anon, authenticated using (status = 'active');

create policy "public read variants of active products" on public.product_variants
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read images of active products" on public.product_images
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read active collections" on public.collections
  for select to anon, authenticated using (status = 'active');

create policy "public read product collections" on public.product_collections
  for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.status = 'active'));

create policy "public read categories" on public.categories
  for select to anon, authenticated using (true);

-- Never let browser keys touch sensitive tables even if a policy is added by mistake.
revoke all on public.staff_users, public.staff_sessions, public.customer_sessions,
  public.payments, public.refunds, public.webhook_events, public.audit_logs,
  public.rate_limits from anon, authenticated;

-- =====================================================================
-- Seed: permissions, system roles, default settings
-- =====================================================================

insert into public.permissions (key, module, description) values
  ('dashboard:view',     'overview',      'View the overview dashboard'),
  ('products:read',      'products',      'View products, collections and categories'),
  ('products:write',     'products',      'Create, edit and archive products, collections and categories'),
  ('inventory:read',     'inventory',     'View stock levels and movement history'),
  ('inventory:write',    'inventory',     'Adjust stock'),
  ('orders:read',        'orders',        'View orders'),
  ('orders:write',       'orders',        'Edit, cancel and annotate orders'),
  ('fulfillment:write',  'orders',        'Create shipments and update tracking'),
  ('customers:read',     'customers',     'View customers'),
  ('customers:write',    'customers',     'Edit customers, notes and tags'),
  ('payments:read',      'payments',      'View payments and transactions'),
  ('refunds:write',      'payments',      'Issue refunds'),
  ('discounts:read',     'discounts',     'View discounts'),
  ('discounts:write',    'discounts',     'Create and edit discounts'),
  ('shipping:read',      'shipping',      'View shipping zones and rates'),
  ('shipping:write',     'shipping',      'Edit shipping zones and rates'),
  ('marketing:read',     'marketing',     'View campaigns and abandoned carts'),
  ('marketing:write',    'marketing',     'Create and edit campaigns'),
  ('analytics:read',     'analytics',     'View analytics and reports'),
  ('staff:read',         'staff',         'View staff accounts and roles'),
  ('staff:write',        'staff',         'Invite staff, change roles and permissions'),
  ('notifications:read', 'notifications', 'View notifications'),
  ('settings:read',      'settings',      'View store settings'),
  ('settings:write',     'settings',      'Change store settings and integrations'),
  ('audit:read',         'staff',         'View the audit log')
on conflict (key) do nothing;

insert into public.roles (key, name, description, is_system) values
  ('owner',       'Owner',       'Full access. Cannot be removed while they are the only owner.', true),
  ('admin',       'Administrator','Full access to every module.', true),
  ('manager',     'Store manager','Runs day-to-day operations. No staff or settings changes.', true),
  ('fulfillment', 'Fulfilment',   'Picks, packs and ships orders; manages stock.', true),
  ('support',     'Customer support', 'Handles orders and customers. No refunds.', true),
  ('marketing',   'Marketing',    'Discounts, campaigns and analytics.', true),
  ('analyst',     'Analyst',      'Read-only access to reports.', true)
on conflict (key) do nothing;

-- owner & admin: everything
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key from public.roles r cross join public.permissions p
where r.key in ('owner','admin')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key from public.roles r join public.permissions p on true
where r.key = 'manager' and p.key not in ('staff:write','settings:write','audit:read')
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, k from public.roles r,
  unnest(array['dashboard:view','products:read','inventory:read','inventory:write','orders:read',
               'fulfillment:write','shipping:read','notifications:read']) k
where r.key = 'fulfillment'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, k from public.roles r,
  unnest(array['dashboard:view','products:read','inventory:read','orders:read','orders:write',
               'customers:read','customers:write','payments:read','shipping:read','notifications:read']) k
where r.key = 'support'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, k from public.roles r,
  unnest(array['dashboard:view','products:read','customers:read','discounts:read','discounts:write',
               'marketing:read','marketing:write','analytics:read','notifications:read']) k
where r.key = 'marketing'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, k from public.roles r,
  unnest(array['dashboard:view','products:read','inventory:read','orders:read','customers:read',
               'payments:read','discounts:read','shipping:read','marketing:read','analytics:read',
               'notifications:read']) k
where r.key = 'analyst'
on conflict do nothing;

insert into public.store_settings (key, value) values
  ('store', jsonb_build_object(
      'name', 'CHISSELED',
      'email', 'orders@chisseled.com',
      'currency', 'USD',
      'country', 'US',
      'tax_rate_bps', 0,
      'tax_inclusive', false,
      'reservation_minutes', 30,
      'low_stock_default', 5,
      'order_prefix', 'CH'
  )),
  ('payments', jsonb_build_object(
      'paystack_enabled', true,
      'flutterwave_enabled', true
  ))
on conflict (key) do nothing;

-- Real CHISSELED collections (taxonomy only — no products are seeded).
insert into public.collections (slug, title, description, position) values
  ('scarred',    'Scarred',    'The signature line.', 1),
  ('monogram',   'Monogram',   'The mark, repeated.', 2),
  ('camo',       'Camo',       'Disruptive pattern, performance cut.', 3),
  ('tracksuits', 'Tracksuits', 'Matched sets for travel and warm-up.', 4),
  ('essentials', 'Essentials', 'The pieces everything else is built around.', 5),
  ('statement',  'Statement',  'Loud by design.', 6)
on conflict (slug) do nothing;

insert into public.categories (slug, name, position) values
  ('hoodies','Hoodies',1), ('sweatshirts','Sweatshirts',2), ('jackets','Jackets',3),
  ('pants','Pants',4), ('leggings','Leggings',5), ('shorts','Shorts',6), ('shirts','Shirts',7),
  ('tops','Tops',8), ('bras','Bras',9), ('socks','Socks',10), ('caps','Caps',11), ('bags','Bags',12),
  ('accessories','Accessories',13), ('nutrition','Nutrition',14), ('equipment','Equipment',15)
on conflict (slug) do nothing;
