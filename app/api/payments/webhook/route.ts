import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { paymentConfig, verifyPayment } from "@/lib/payments-server";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const config = paymentConfig();
  if (!config) return new NextResponse("Unavailable", { status: 503 });
  const body = await request.text(),
    signature = request.headers.get("x-paystack-signature") || "";
  const expected = createHmac("sha512", config.secret).update(body).digest();
  if (
    !/^[0-9a-f]{128}$/i.test(signature) ||
    !timingSafeEqual(expected, Buffer.from(signature, "hex"))
  )
    return new NextResponse("Invalid signature", { status: 401 });
  try {
    const event = JSON.parse(body);
    if (
      event.event === "charge.success" &&
      typeof event.data?.reference === "string" &&
      event.data.reference.startsWith("1960-")
    )
      await verifyPayment(event.data.reference);
    return NextResponse.json({ received: true });
  } catch {
    return new NextResponse("Retry later", { status: 500 });
  }
}
