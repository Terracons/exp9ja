import "server-only";
import { createClient } from "@supabase/supabase-js";
import { paymentMatches } from "./payment-rules";
export function paymentConfig() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const site = process.env.SITE_URL;
  const rate = Number(process.env.PAYMENT_USD_NGN_RATE);
  if (!url || !key || !secret || !site || !Number.isFinite(rate) || rate <= 0)
    return null;
  let origin: string;
  try {
    origin = new URL(site).origin;
    new URL(url);
  } catch {
    return null;
  }
  if (!/^sk_(test|live)_/.test(secret)) return null;
  if (!origin.startsWith("https://") && !origin.startsWith("http://localhost:"))
    return null;
  return {
    url,
    key,
    secret,
    origin,
    rate,
    test: secret.startsWith("sk_test_"),
  };
}
export function adminClient() {
  const config = paymentConfig();
  if (!config) throw new Error("Payment services are not configured.");
  return createClient(config.url, config.key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function authenticate(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer (.+)$/)?.[1];
  if (!token) return null;
  const { data, error } = await adminClient().auth.getUser(token);
  return error ? null : data.user;
}
export async function paystack(path: string, body?: object) {
  const config = paymentConfig();
  if (!config) throw new Error("Payment services are not configured.");
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${config.secret}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || !result.status)
    throw new Error(
      "The payment provider could not process this request. Please retry or check your transaction status.",
    );
  return result.data;
}
export async function verifyPayment(reference: string) {
  const db = adminClient();
  const { data: payment, error } = await db
    .from("payments")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (error || !payment) throw new Error("Payment reference not found.");
  if (payment.status === "paid") return payment;
  const transaction = await paystack(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
  if (!paymentMatches(payment, transaction))
    throw new Error(
      "Payment has not been confirmed for this order. If you were debited, check again shortly.",
    );
  const { error: settleError } = await db.rpc("settle_order_payment", {
    payment_reference: reference,
    provider_transaction: String(transaction.id),
  });
  if (settleError)
    throw new Error(
      "Payment verification is being reconciled. Please check again shortly.",
    );
  return { ...payment, status: "paid" };
}
