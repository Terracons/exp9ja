import { NextResponse } from "next/server";
import {
  adminClient,
  authenticate,
  paymentConfig,
  verifyPayment,
} from "@/lib/payments-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!paymentConfig())
    return NextResponse.json(
      { error: "Payment verification is awaiting configuration." },
      { status: 503 },
    );
  try {
    const user = await authenticate(request);
    if (!user)
      return NextResponse.json(
        { error: "Sign in to check payment." },
        { status: 401 },
      );
    const { reference } = await request.json();
    if (
      typeof reference !== "string" ||
      !/^1960-[a-f0-9-]{36}$/i.test(reference)
    )
      return NextResponse.json(
        { error: "Invalid payment reference." },
        { status: 400 },
      );
    const { data } = await adminClient()
      .from("payments")
      .select("id")
      .eq("reference", reference)
      .eq("buyer_id", user.id)
      .maybeSingle();
    if (!data)
      return NextResponse.json(
        { error: "Payment not found." },
        { status: 404 },
      );
    const payment = await verifyPayment(reference);
    return NextResponse.json({ status: payment.status });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unable to verify payment.",
      },
      { status: 400 },
    );
  }
}
