"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, fmtQty } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import AccountGate from "@/components/AccountGate";
export default function Checkout() {
  const { profile, ready, error } = useProfile();
  const [order, setOrder] = useState<any>(null),
    [payment, setPayment] = useState<any>(null),
    [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const api = useCallback(async (route: string, body: object) => {
    const { data } = await supabase.auth.getSession();
    const result = await fetch(`/api/payments/${route}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session?.access_token || ""}`,
      },
      body: JSON.stringify(body),
    });
    const value = await result.json();
    if (!result.ok)
      throw new Error(value.error || "Unable to connect to payment services.");
    return value;
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setMsg("");
    try {
      const id = new URLSearchParams(location.search).get("o");
      if (!id) throw new Error("Choose an order from your dashboard first.");
      const { data, error } = await supabase
        .from("orders")
        .select(
          "*, rfqs(destination), profiles!orders_supplier_id_fkey(company)",
        )
        .eq("id", id)
        .maybeSingle();
      if (error || !data)
        throw new Error(
          "This order could not be loaded or is not available to your account.",
        );
      setOrder(data);
      if (data.buyer_id === profile.id) {
        const { data: receipt } = await supabase
          .from("payments")
          .select("*")
          .eq("order_id", id)
          .maybeSingle();
        setPayment(receipt);
        if (data.payment_status !== "paid") {
          const price = await api("checkout", { orderId: id });
          setQuote(price);
        }
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Unable to load checkout.");
    } finally {
      setLoading(false);
    }
  }, [profile, api]);
  useEffect(() => {
    if (profile) load();
  }, [profile, load]);
  async function pay() {
    if (!confirmed || !quote || busy) return;
    setBusy(true);
    setMsg("");
    try {
      const data = await api("checkout", {
        orderId: order.id,
        confirm: true,
        expectedAmount: quote.amount,
      });
      location.assign(data.url);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Unable to open checkout.");
      setBusy(false);
    }
  }
  async function verify() {
    const reference =
      payment?.reference ||
      new URLSearchParams(location.search).get("reference");
    if (!reference || busy) return;
    setBusy(true);
    setMsg("");
    try {
      await api("verify", { reference });
      await load();
      setMsg("Payment confirmed. Your product payment has been recorded.");
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : "Unable to verify payment. Check again shortly.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <p role="status">Loading your account...</p>;
  if (!profile) return <AccountGate error={error} />;
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">REVIEW EVERY DETAIL</p>
        <h1>Your order. Your next step.</h1>
        <Link href="/dashboard">← Back to orders</Link>
      </div>
      {loading && <p role="status">Loading order...</p>}
      {msg && (
        <p className="form-status" role="status">
          {msg}
        </p>
      )}
      {order && (
        <div className="checkout-layout">
          <section className="card">
            <span className="status-pill">
              {order.payment_status === "paid"
                ? "Payment confirmed"
                : "Awaiting product payment"}
            </span>
            <h2 style={{ fontSize: "2rem", marginTop: "1rem" }}>
              {order.commodity}
            </h2>
            <p>
              Order <strong>{order.id}</strong>
            </p>
            <dl className="order-details">
              <dt>Supplier</dt>
              <dd>{order.profiles?.company || "Order supplier"}</dd>
              <dt>Quantity</dt>
              <dd>{fmtQty(order.quantity_tons, order.unit)}</dd>
              <dt>Unit price</dt>
              <dd>USD ${Number(order.price_usd_per_ton).toLocaleString()}</dd>
              <dt>Destination</dt>
              <dd>{order.rfqs?.destination}</dd>
            </dl>
            <p>Product total</p>
            <p className="checkout-total">
              USD $
              {(
                Number(order.quantity_tons) * Number(order.price_usd_per_ton)
              ).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
            <p className="muted">
              Product amount only. Freight, insurance, customs duties and
              destination taxes are quoted separately. Agree all delivery and
              refund terms before paying.
            </p>
            <div className="order-actions">
              <Link href={`/messages?q=${order.quote_id}`}>
                Message supplier
              </Link>
              <Link href={`/freight?o=${order.id}`}>Arrange logistics</Link>
              <Link href={`/docs?o=${order.id}`}>Order documents</Link>
              <Link href={`/track?o=${order.id}`}>Track shipment</Link>
            </div>
          </section>
          <section className="card">
            <h2 style={{ fontSize: "1.7rem" }}>
              {order.payment_status === "paid"
                ? "Payment receipt"
                : "Product checkout"}
            </h2>
            {order.payment_status === "paid" ? (
              <>
                <p>
                  Your payment is recorded. Keep your order reference for
                  enquiries.
                </p>
                {payment && (
                  <>
                    <p>
                      <strong>
                        {payment.currency}{" "}
                        {(Number(payment.amount_minor) / 100).toLocaleString(
                          undefined,
                          { minimumFractionDigits: 2 },
                        )}
                      </strong>
                    </p>
                    <p>Reference: {payment.reference}</p>
                    <p>
                      Paid:{" "}
                      {payment.paid_at
                        ? new Date(payment.paid_at).toLocaleString()
                        : "Confirmed"}
                    </p>
                  </>
                )}
                <p className="muted">
                  Payment confirmation records the product payment. Shipment and
                  delivery are managed separately.
                </p>
              </>
            ) : order.buyer_id !== profile.id ? (
              <p>
                Only the buyer can pay for this order. You can check its payment
                status here.
              </p>
            ) : (
              <>
                {quote ? (
                  <>
                    <p className="eyebrow">
                      {quote.test
                        ? "TEST CHECKOUT: NO LIVE PAYMENT"
                        : "PAYABLE THROUGH PAYSTACK"}
                    </p>
                    <p className="checkout-total">
                      NGN{" "}
                      {(Number(quote.amount) / 100).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="muted">
                      Conversion rate: USD 1 = NGN{" "}
                      {Number(quote.rate).toLocaleString()}. This rate is set by
                      the marketplace operator and fixed for this checkout. Your
                      bank may charge additional conversion fees.
                    </p>
                    <label className="check">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                      />{" "}
                      I reviewed the product amount, currency, supplier and
                      separately agreed shipping and refund terms.
                    </label>
                    <p>
                      <button
                        className="btn"
                        disabled={!confirmed || busy || loading}
                        onClick={pay}
                      >
                        {busy
                          ? "Please wait..."
                          : quote.test
                            ? "Continue to test checkout ↗"
                            : "Continue to payment ↗"}
                      </button>
                    </p>
                  </>
                ) : (
                  <p>
                    Online checkout is unavailable until the marketplace
                    operator configures payment services. No payment has been
                    taken.
                  </p>
                )}
                <p>
                  Already attempted payment? Confirm the result before trying
                  again.
                </p>
                <button
                  className="btn alt"
                  disabled={busy || loading}
                  onClick={verify}
                >
                  {busy ? "Checking..." : "Check payment status"}
                </button>
                <p className="muted">
                  We confirm payment with the provider. A return to this page
                  alone does not mark an order as paid.
                </p>
              </>
            )}
          </section>
        </div>
      )}
    </>
  );
}
