import { cache } from "react";
import { db, isDatabaseConfigured, type Queryable } from "@/lib/db";

export interface StoreSettings {
  name: string;
  email: string;
  currency: string;
  country: string;
  /** Basis points, e.g. 750 = 7.5%. */
  tax_rate_bps: number;
  tax_inclusive: boolean;
  reservation_minutes: number;
  low_stock_default: number;
  order_prefix: string;
}

export interface PaymentSettings {
  paystack_enabled: boolean;
  flutterwave_enabled: boolean;
  stripe_enabled: boolean;
  /** Offline methods staff can record (bank transfer, cash, POS…). */
  manual_methods: string[];
}

export const DEFAULT_STORE: StoreSettings = {
  name: "CHISSELED",
  email: "orders@chisseled.com",
  currency: "USD",
  country: "US",
  tax_rate_bps: 0,
  tax_inclusive: false,
  reservation_minutes: 30,
  low_stock_default: 5,
  order_prefix: "CH",
};

export async function readSetting<T>(key: string, fallback: T, q: Queryable = db()): Promise<T> {
  const [row] = await q<{ value: T }[]>`select value from store_settings where key = ${key}`;
  return { ...fallback, ...(row?.value ?? {}) };
}

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  if (!isDatabaseConfigured()) return DEFAULT_STORE;
  return readSetting("store", DEFAULT_STORE);
});

export const getPaymentSettings = cache(async (): Promise<PaymentSettings> => {
  const fallback: PaymentSettings = { paystack_enabled: true, flutterwave_enabled: true, stripe_enabled: true, manual_methods: ["Bank transfer", "Cash", "POS"] };
  if (!isDatabaseConfigured()) return fallback;
  return readSetting("payments", fallback);
});

export async function writeSetting(key: string, value: unknown, q: Queryable = db()): Promise<void> {
  await q`insert into store_settings (key, value) values (${key}, ${q.json(value as never)})
          on conflict (key) do update set value = excluded.value, updated_at = now()`;
}

export function orderName(number: number, prefix = DEFAULT_STORE.order_prefix): string {
  return `#${prefix}${number}`;
}
