import { createClient } from "@supabase/supabase-js";

// Reads the standard names first, then the names the Vercel Supabase integration creates.
// Each variable is written out in full so Next.js can inline it into the browser bundle.
const url =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
  "http://localhost:54321";
const key =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_PUBLISHABLE_KEY ||
  "missing-anon-key";

export const supabase = createClient(url, key);

export const COMMODITIES = ["Cocoa", "Coffee", "Cashew", "Sesame", "Ginger", "Shea", "Palm products", "Soy", "Rubber", "Cotton", "Hibiscus"];

export const CAT: Record<string, [string, string]> = {
  Cocoa: ["🍫", "#6B3E26"], Coffee: ["☕", "#4A2C1A"], Cashew: ["🥜", "#C98B2B"], Sesame: ["🌾", "#B79A5B"],
  Ginger: ["🫚", "#C47A1E"], Shea: ["🌰", "#8A6A3F"], "Palm products": ["🌴", "#3F7D3A"], Soy: ["🫘", "#8C9A3C"],
  Rubber: ["⚫", "#3A3F44"], Cotton: ["☁️", "#7FA3C7"], Hibiscus: ["🌺", "#B3263E"],
};

export const DEMO = [
  ["Cocoa", "Dried fermented cocoa beans, main crop", "Ondo", 25, 3400],
  ["Cashew", "Raw cashew nuts in shell, 2026 crop", "Kogi", 20, 1150],
  ["Sesame", "Hulled white sesame seed, 99% purity", "Benue", 22, 1750],
  ["Ginger", "Split dried ginger, export grade", "Kaduna", 18, 2300],
  ["Shea", "Shea nuts, cleaned and bagged", "Niger", 30, 620],
  ["Hibiscus", "Dried hibiscus flowers, Grade A", "Jigawa", 15, 1900],
  ["Palm products", "Palm kernel, bulk", "Edo", 40, 540],
  ["Soy", "Soybeans, non-GMO", "Benue", 50, 610],
].map(([commodity, title, origin_state, moq_tons, price_usd_per_ton], i) => ({
  id: "demo" + i, commodity, title, origin_state, moq_tons, price_usd_per_ton, demo: true, profiles: { company: "Sample supplier", verified: false },
}));

export const STATUSES = ["Booked", "Cargo collected", "In warehouse", "Inspected", "Export documents ready", "Customs cleared", "Departed port", "In transit", "Arrived at destination port", "Delivered", "Delayed or exception"];

export const PROVIDER_TYPES = ["Freight forwarder", "Haulage provider", "Clearing agent", "Inspection provider", "Warehouse provider", "Shipping line", "Insurance provider", "Laboratory"];
export const DOC_TYPES = ["Commercial invoice", "Packing list", "Certificate of origin", "Phytosanitary certificate", "Inspection report", "Bill of lading", "Other"];