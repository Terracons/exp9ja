import { test } from "node:test";
import assert from "node:assert/strict";
import { filterListings } from "../lib/discovery.ts";
import { safeNext } from "../lib/navigation.ts";
import { productAmount, paymentMatches } from "../lib/payment-rules.ts";

const base = {
  query: "",
  category: "",
  sale: "",
  origin: "",
  verified: false,
  savedOnly: false,
  sort: "newest",
};
const products = [
  {
    id: "a",
    title: "Cocoa",
    commodity: "Cocoa",
    category: "Agriculture",
    origin_state: "Ondo",
    sale_type: "bulk",
    price_usd_per_ton: 200,
    profiles: { company: "Cooperative", verified: true },
  },
  {
    id: "b",
    title: "Garri",
    commodity: "Garri",
    category: "Food",
    origin_state: "Ogun",
    sale_type: "retail",
    price_usd_per_ton: null,
  },
  {
    id: "c",
    title: "Cashew",
    commodity: "Cashew",
    category: "Agriculture",
    origin_state: "Kogi",
    sale_type: "bulk",
    price_usd_per_ton: 100,
  },
];
test("discovery combines search, verification, origin and saved collection", () => {
  assert.deepEqual(
    filterListings(
      products,
      {
        ...base,
        query: "  COOPERATIVE  ",
        origin: "Ondo",
        verified: true,
        savedOnly: true,
      },
      ["a"],
    ).map((r) => r.id),
    ["a"],
  );
  assert.equal(
    filterListings(products, { ...base, category: "Food", sale: "bulk" }, [])
      .length,
    0,
  );
  assert.deepEqual(
    filterListings(products, { ...base, sale: "retail" }, []).map((r) => r.id),
    ["b"],
  );
});
test("price sorting keeps unpriced products last in both directions and preserves source order", () => {
  assert.deepEqual(
    filterListings(products, { ...base, sort: "price-low" }, []).map(
      (r) => r.id,
    ),
    ["c", "a", "b"],
  );
  assert.deepEqual(
    filterListings(products, { ...base, sort: "price-high" }, []).map(
      (r) => r.id,
    ),
    ["a", "c", "b"],
  );
  assert.deepEqual(
    products.map((r) => r.id),
    ["a", "b", "c"],
  );
});
test("sign-in preserves local order context and rejects external redirects", () => {
  assert.equal(
    safeNext("/dashboard?c=Garri&unit=pack"),
    "/dashboard?c=Garri&unit=pack",
  );
  for (const input of [
    "https://evil.test",
    "//evil.test",
    "/\\evil.test",
    "/\nevil.test",
    null,
  ])
    assert.equal(safeNext(input), "/dashboard");
});
test("payment amounts reject invalid values and round to whole kobo", () => {
  assert.equal(productAmount(2, 10.25, 1500), 3075000);
  assert.equal(productAmount(1, 1.005, 1), 101);
  for (const args of [
    [0, 10, 1],
    [1, -1, 1],
    [1, 1, NaN],
    [Infinity, 1, 1],
    [1, 0.001, 1],
    [1e20, 1e20, 1],
  ])
    assert.throws(() => productAmount(...args));
});
test("payment confirmation binds reference, order, currency, amount and success status", () => {
  const p = {
    reference: "1960-abc",
    amount_minor: 1200,
    currency: "NGN",
    order_id: "order1",
  };
  const t = {
    reference: p.reference,
    amount: 1200,
    currency: "NGN",
    status: "success",
    metadata: { order_id: "order1" },
  };
  assert.equal(paymentMatches(p, t), true);
  for (const patch of [
    { status: "pending" },
    { amount: 1 },
    { currency: "USD" },
    { reference: "other" },
    { metadata: { order_id: "other" } },
    { metadata: undefined },
  ])
    assert.equal(paymentMatches(p, { ...t, ...patch }), false);
});
