import { db, type Queryable } from "@/lib/db";
import { randomToken } from "@/lib/security/crypto";
import { UserFacingError } from "@/lib/security/validate";
import { sendEmail, emailLayout, siteUrl, escapeHtml } from "@/lib/commerce/email";

/**
 * Newsletter + back-in-stock alerts. Subscriptions are mirrored onto
 * customers.accepts_marketing so segments and campaigns see one truth.
 */

export async function subscribe(email: string, source: string, q: Queryable = db()): Promise<"subscribed" | "already"> {
  const [row] = await q<{ status: string; inserted: boolean }[]>`
    insert into newsletter_subscribers (email, source, unsubscribe_token)
    values (${email}, ${source}, ${randomToken(24)})
    on conflict (email) do update set
      status = 'subscribed',
      unsubscribed_at = null,
      subscribed_at = case when newsletter_subscribers.status = 'unsubscribed' then now() else newsletter_subscribers.subscribed_at end
    returning status, (xmax = 0) as inserted`;
  await q`update customers set accepts_marketing = true where email = ${email}`;
  return row.inserted ? "subscribed" : "already";
}

export async function unsubscribeByToken(token: string): Promise<string | null> {
  if (!token || token.length > 64) return null;
  const [row] = await db()<{ email: string }[]>`
    update newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now()
    where unsubscribe_token = ${token} returning email`;
  if (!row) return null;
  await db()`update customers set accepts_marketing = false where email = ${row.email}`;
  return row.email;
}

/** Keeps the list in step when marketing consent changes elsewhere (account, admin). */
export async function syncConsent(email: string, accepts: boolean, q: Queryable = db()): Promise<void> {
  if (accepts) await subscribe(email, "account", q);
  else await q`update newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now()
               where email = ${email} and status = 'subscribed'`;
}

export async function unsubscribeLink(email: string): Promise<string | null> {
  const [row] = await db()<{ unsubscribe_token: string }[]>`
    select unsubscribe_token from newsletter_subscribers where email = ${email} and status = 'subscribed'`;
  return row ? `${siteUrl()}/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}` : null;
}

/** Registers a back-in-stock alert for a product (and size/colour, when given). */
export async function createStockAlert(input: { email: string; slug: string; variantId: string | null }): Promise<void> {
  const [p] = await db()<{ id: string }[]>`select id from products where slug = ${input.slug} and status = 'active'`;
  if (!p) throw new UserFacingError("That product isn't available.");
  if (input.variantId) {
    const [v] = await db()`select 1 from product_variants where id = ${input.variantId} and product_id = ${p.id}`;
    if (!v) throw new UserFacingError("That size isn't available for this product.");
  }
  const [{ n }] = await db()<{ n: number }[]>`
    select count(*)::int as n from stock_alerts where email = ${input.email} and notified_at is null`;
  if (n >= 25) throw new UserFacingError("You already have the maximum number of alerts.");
  await db()`
    insert into stock_alerts (email, product_id, variant_id) values (${input.email}, ${p.id}, ${input.variantId})
    on conflict do nothing`;
}

/**
 * Emails everyone whose awaited product/size has stock again, once each.
 * Run from the maintenance job. Returns how many alerts were sent.
 */
export async function processStockAlerts(limit = 100): Promise<number> {
  const due = await db()<{ id: string; email: string; title: string; slug: string; variant_title: string | null }[]>`
    select a.id, a.email, p.title, p.slug, v.title as variant_title
    from stock_alerts a
    join products p on p.id = a.product_id and p.status = 'active'
    left join product_variants v on v.id = a.variant_id
    where a.notified_at is null and (
      (a.variant_id is not null and exists (
        select 1 from inventory i join product_variants vv on vv.id = i.variant_id
        where i.variant_id = a.variant_id and (not vv.track_inventory or i.on_hand - i.reserved > 0)))
      or (a.variant_id is null and exists (
        select 1 from product_variants vv left join inventory i on i.variant_id = vv.id
        where vv.product_id = a.product_id and (not vv.track_inventory or i.on_hand - i.reserved > 0))))
    order by a.created_at limit ${limit}`;
  let sent = 0;
  for (const a of due) {
    // Claim first so two overlapping runs can't email the same person twice.
    const [claimed] = await db()`update stock_alerts set notified_at = now() where id = ${a.id} and notified_at is null returning id`;
    if (!claimed) continue;
    const name = `${a.title}${a.variant_title && a.variant_title !== "Default" ? ` — ${a.variant_title}` : ""}`;
    try {
      const ok = await sendEmail(
        a.email,
        `Back in stock: ${a.title}`,
        emailLayout(`<h1 style="font-size:20px">It's back.</h1>
          <p>${escapeHtml(name)} is in stock again. Stock is limited and isn't held — first come, first served.</p>
          <p><a href="${siteUrl()}/product/${a.slug}">Shop it now</a></p>`),
      );
      if (ok) sent++;
      else await db()`update stock_alerts set notified_at = null where id = ${a.id}`; // email not configured: keep pending
    } catch {
      await db()`update stock_alerts set notified_at = null where id = ${a.id}`;
    }
  }
  return sent;
}
