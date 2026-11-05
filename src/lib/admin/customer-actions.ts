"use server";

import { adminAction } from "@/lib/admin/action";
import { db, pgCode } from "@/lib/db";
import { audit } from "@/lib/commerce/audit";
import { syncConsent } from "@/lib/commerce/marketing";
import { ValidationError, bool, email, list, oneOf, optStr, str, uuid } from "@/lib/security/validate";

export const updateCustomerAction = adminAction("customers:write", async (staff, form) => {
  const id = uuid(form, "id");
  const data = {
    first_name: optStr(form, "first_name", { max: 80 }),
    last_name: optStr(form, "last_name", { max: 80 }),
    email: email(form),
    phone: optStr(form, "phone", { max: 30 }),
    tags: list(form, "tags", 20).map((t) => t.slice(0, 40)),
    accepts_marketing: bool(form, "accepts_marketing"),
    status: oneOf(form, "status", ["active", "disabled"] as const),
  };
  await db()`update customers set ${db()(data)} where id = ${id}`.catch((err) => {
    if (pgCode(err) === "23505") throw new ValidationError("email", "Another customer already uses that email.");
    throw err;
  });
  await syncConsent(data.email, data.accepts_marketing);
  if (data.status === "disabled") await db()`update customer_sessions set revoked_at = now() where customer_id = ${id} and revoked_at is null`;
  await audit(staff, "customer.update", "customer", id, { status: data.status, tags: data.tags });
  return "Customer saved.";
});

export const addCustomerNoteAction = adminAction("customers:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`insert into customer_notes (customer_id, staff_id, body) values (${id}, ${staff.id}, ${str(form, "body", { max: 4000, label: "Note" })})`;
  await audit(staff, "customer.note", "customer", id, {});
  return "Note added.";
});

export const deleteAddressAction = adminAction("customers:write", async (staff, form) => {
  const id = uuid(form, "id");
  await db()`delete from customer_addresses where id = ${uuid(form, "address_id")} and customer_id = ${id}`;
  await audit(staff, "customer.address_delete", "customer", id, {});
  return "Address removed.";
});
