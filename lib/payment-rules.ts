export function productAmount(
  quantity: number,
  unitPrice: number,
  rate: number,
) {
  if (![quantity, unitPrice, rate].every((n) => Number.isFinite(n) && n > 0))
    throw new Error("A valid order amount and exchange rate are required.");
  const total = quantity * unitPrice * rate;
  const amount = Math.round((total + Number.EPSILON * total) * 100);
  if (!Number.isSafeInteger(amount) || amount < 100)
    throw new Error("The payable amount is outside the supported range.");
  return amount;
}
export function paymentMatches(
  payment: {
    reference: string;
    amount_minor: number;
    currency: string;
    order_id: string;
  },
  transaction: {
    reference?: string;
    amount?: number;
    currency?: string;
    status?: string;
    metadata?: { order_id?: string };
  },
) {
  return (
    transaction.status === "success" &&
    transaction.reference === payment.reference &&
    transaction.currency === payment.currency &&
    transaction.amount === Number(payment.amount_minor) &&
    transaction.metadata?.order_id === payment.order_id
  );
}
