import { PaymentProviderError } from "@/lib/payments/types";

/** JSON request to a provider API with a timeout. Never logs headers (they carry the secret key). */
export async function providerFetch<T>(
  url: string,
  init: { method?: string; secret: string; body?: unknown },
): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 20_000);
  try {
    const res = await fetch(url, {
      method: init.method ?? "GET",
      headers: {
        Authorization: `Bearer ${init.secret}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: ctrl.signal,
    });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new PaymentProviderError(`Provider returned a non-JSON response (${res.status}).`);
    }
    if (!res.ok) {
      const msg = (json as { message?: string } | null)?.message ?? res.statusText;
      throw new PaymentProviderError(`Provider error ${res.status}: ${msg}`);
    }
    return json as T;
  } catch (err) {
    if (err instanceof PaymentProviderError) throw err;
    throw new PaymentProviderError(err instanceof Error && err.name === "AbortError" ? "Provider timed out." : "Could not reach the payment provider.");
  } finally {
    clearTimeout(timer);
  }
}
