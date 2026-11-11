import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  adminClient,
  authenticate,
  paymentConfig,
  paystack,
} from "@/lib/payments-server";
import { productAmount } from "@/lib/payment-rules";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = paymentConfig();
  if (!config)
    return NextResponse.json(
      {
        error:
          "Online payments are awaiting operator configuration. No payment has been taken.",
      },
      { status: 503 },
    );
  if (request.headers.get("origin") !== config.origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const user = await authenticate(request);
    if (!user?.email)
      return NextResponse.json(
        { error: "Sign in to continue." },
        { status: 401 },
      );
    const body = await request.json();
    if (
      typeof body.orderId !== "string" ||
      !/^[0-9a-f-]{36}$/i.test(body.orderId)
    )
      return NextResponse.json(
        { error: "Choose a valid order." },
        { status: 400 },
      );
    const db = adminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("*")
      .eq("id", body.orderId)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (error || !order)
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (order.payment_status === "paid")
      return NextResponse.json(
        { error: "This order is already paid." },
        { status: 409 },
      );
    if (order.status !== "confirmed")
      return NextResponse.json(
        { error: "This order is not available for payment." },
        { status: 409 },
      );
    // A unique order key freezes the rate and reference across retries and parallel requests.
    const { error: insertError } = await db.from("payments").upsert(
      {
        order_id: order.id,
        buyer_id: user.id,
        reference: `1960-${randomUUID()}`,
        currency: "NGN",
        amount_minor: productAmount(
          Number(order.quantity_tons),
          Number(order.price_usd_per_ton),
          config.rate,
        ),
        usd_ngn_rate: config.rate,
      },
      { onConflict: "order_id", ignoreDuplicates: true },
    );
    if (insertError)
      throw new Error("Unable to prepare checkout. Please retry.");
    const { data: payment, error: readError } = await db
      .from("payments")
      .select("*")
      .eq("order_id", order.id)
      .single();
    if (readError || !payment) throw new Error("Unable to prepare checkout.");
    if (payment.status === "paid")
      return NextResponse.json(
        { error: "This order is already paid." },
        { status: 409 },
      );
    // First request returns a review quote. Payment starts only after explicit confirmation.
    if (body.confirm !== true)
      return NextResponse.json({
        amount: payment.amount_minor,
        currency: payment.currency,
        rate: payment.usd_ngn_rate,
        test: config.test,
      });
    if (Number(body.expectedAmount) !== Number(payment.amount_minor))
      return NextResponse.json(
        {
          error:
            "The payment amount changed. Please refresh and review it again.",
        },
        { status: 409 },
      );
    if (payment.checkout_url)
      return NextResponse.json({ url: payment.checkout_url });
    const result = await paystack("/transaction/initialize", {
      email: user.email,
      amount: String(payment.amount_minor),
      currency: payment.currency,
      reference: payment.reference,
      callback_url: `${config.origin}/checkout?o=${order.id}`,
      metadata: { order_id: order.id },
    });
    const checkout = new URL(result.authorization_url);
    if (
      checkout.protocol !== "https:" ||
      checkout.host !== "checkout.paystack.com"
    )
      throw new Error("Unexpected checkout address.");
    const { error: saveError } = await db
      .from("payments")
      .update({ checkout_url: checkout.href })
      .eq("id", payment.id);
    if (saveError)
      throw new Error("Unable to save the payment session. Please retry.");
    return NextResponse.json({ url: checkout.href });
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Unable to prepare checkout. Please retry.",
      },
      { status: 400 },
    );
  }
}
