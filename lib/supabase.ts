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
export const isConfigured =
  url !== "http://localhost:54321" && key !== "missing-anon-key";

export const CATEGORIES = [
  {
    name: "Agricultural Commodities",
    emoji: "🌾",
    color: "#B79A5B",
    blurb:
      "Cocoa, cashew, sesame, ginger, hibiscus, soybeans, shea, palm products, rubber, cotton, groundnuts and other export commodities.",
    items: [
      "Cocoa",
      "Coffee",
      "Cashew",
      "Sesame",
      "Ginger",
      "Hibiscus",
      "Soybeans",
      "Shea",
      "Palm products",
      "Rubber",
      "Cotton",
      "Groundnuts",
    ],
  },
  {
    name: "Nigerian Foodstuff",
    emoji: "🍲",
    color: "#C47A1E",
    blurb:
      "Garri, egusi, ogbono, yam flour, poundo yam, Ofada rice, beans, palm oil, dried vegetables and traditional cooking ingredients.",
    items: [
      "Garri",
      "Egusi",
      "Ogbono",
      "Yam flour",
      "Poundo yam",
      "Ofada rice",
      "Beans",
      "Palm oil",
      "Dried vegetables",
    ],
  },
  {
    name: "Fish and Seafood",
    emoji: "🐟",
    color: "#2F6F8F",
    blurb:
      "Dried catfish, smoked catfish, bonga fish, mangala, panla, stockfish, dried crayfish, prawns and other seafood products.",
    items: [
      "Dried catfish",
      "Smoked catfish",
      "Bonga fish",
      "Mangala",
      "Panla",
      "Stockfish",
      "Dried crayfish",
      "Prawns",
    ],
  },
  {
    name: "Spices and Seasonings",
    emoji: "🌶️",
    color: "#B3261E",
    blurb:
      "Suya spice, yaji, Cameroon pepper, dried pepper, turmeric, uda, ehuru, iru, ogiri and local seasoning blends.",
    items: [
      "Suya spice",
      "Yaji",
      "Cameroon pepper",
      "Dried pepper",
      "Turmeric",
      "Uda",
      "Ehuru",
      "Iru",
      "Ogiri",
    ],
  },
  {
    name: "Snacks and Packaged Foods",
    emoji: "🥨",
    color: "#A86A0C",
    blurb:
      "Chin chin, kuli-kuli, plantain chips, yam chips, coconut snacks, kilishi and other Nigerian snacks.",
    items: [
      "Chin chin",
      "Kuli-kuli",
      "Plantain chips",
      "Yam chips",
      "Coconut snacks",
      "Kilishi",
    ],
  },
  {
    name: "Drinks and Beverage Ingredients",
    emoji: "🍹",
    color: "#8E2A5B",
    blurb:
      "Zobo leaves, zobo concentrate, kunu mix, tiger nuts, Nigerian coffee, cocoa powder, ginger concentrate and herbal teas.",
    items: [
      "Zobo leaves",
      "Zobo concentrate",
      "Kunu mix",
      "Tiger nuts",
      "Nigerian coffee",
      "Cocoa powder",
      "Ginger concentrate",
      "Herbal teas",
    ],
  },
  {
    name: "Beauty and Natural Products",
    emoji: "🧴",
    color: "#6B8F5A",
    blurb:
      "Shea butter, black soap, cocoa butter, coconut oil, natural hair oils and locally made skincare products.",
    items: [
      "Shea butter",
      "Black soap",
      "Cocoa butter",
      "Coconut oil",
      "Hair oils",
      "Skincare",
    ],
  },
  {
    name: "Fashion and Textiles",
    emoji: "🧵",
    color: "#5B3F8C",
    blurb:
      "Ankara, Adire, Aso-oke, Akwete, Nigerian lace, traditional clothing, bags, footwear and accessories.",
    items: [
      "Ankara",
      "Adire",
      "Aso-oke",
      "Akwete",
      "Lace",
      "Traditional clothing",
      "Bags",
      "Footwear",
      "Accessories",
    ],
  },
  {
    name: "Arts, Crafts and Home Products",
    emoji: "🧺",
    color: "#8A6A3F",
    blurb:
      "Woven baskets, handmade jewellery, leather products, pottery, wooden crafts, home décor and locally made furniture.",
    items: [
      "Baskets",
      "Jewellery",
      "Leather products",
      "Pottery",
      "Wooden crafts",
      "Home decor",
      "Furniture",
    ],
  },
];
export const COMMODITIES = CATEGORIES.flatMap((c) => c.items);
export const categoryOf = (item: string) =>
  CATEGORIES.find((c) => c.items.includes(item))?.name || "Other";
export const CAT: Record<string, [string, string]> = Object.fromEntries(
  CATEGORIES.flatMap((c) => c.items.map((i) => [i, [c.emoji, c.color]])),
);
export const UNITS = [
  "tonne",
  "kg",
  "bag",
  "carton",
  "pallet",
  "container",
  "pack",
];
export const fmtQty = (q: any, unit?: string) => {
  const n = Number(q),
    u = unit || "tonne";
  return `${n.toLocaleString()} ${u === "kg" || n === 1 ? u : u + "s"}`;
};

const bulk = [
  ["Cocoa", "Dried fermented cocoa beans, main crop", "Ondo", 25, 3400],
  ["Cashew", "Raw cashew nuts in shell, 2026 crop", "Kogi", 20, 1150],
  ["Sesame", "Hulled white sesame seed, 99% purity", "Benue", 22, 1750],
  ["Ginger", "Split dried ginger, export grade", "Kaduna", 18, 2300],
  ["Shea", "Shea nuts, cleaned and bagged", "Niger", 30, 620],
  ["Hibiscus", "Dried hibiscus flowers, Grade A", "Jigawa", 15, 1900],
  ["Palm products", "Palm kernel, bulk", "Edo", 40, 540],
  ["Soybeans", "Soybeans, non-GMO", "Benue", 50, 610],
].map(
  ([commodity, title, origin_state, moq_tons, price_usd_per_ton]: any, i) => ({
    id: "demob" + i,
    commodity,
    title,
    origin_state,
    moq_tons,
    price_usd_per_ton,
    unit: "tonne",
    sale_type: "bulk",
    category: categoryOf(commodity),
    demo: true,
    profiles: { company: "Sample supplier", verified: false },
  }),
);
const retail = [
  ["Garri", "White Garri", "Available in 1 kg, 5 kg, 10 kg and 25 kg packs."],
  [
    "Garri",
    "Yellow Garri",
    "Locally processed cassava flakes for retail and wholesale orders.",
  ],
  [
    "Egusi",
    "Egusi",
    "Whole melon seeds and ground egusi in different pack sizes.",
  ],
  [
    "Ogbono",
    "Ogbono",
    "Whole seeds and ground ogbono for household and commercial buyers.",
  ],
  [
    "Dried catfish",
    "Dried Catfish",
    "Dried and smoked catfish, subject to destination import requirements.",
  ],
  [
    "Dried crayfish",
    "Dried Crayfish",
    "Whole and ground crayfish for cooking and food preparation.",
  ],
  [
    "Palm oil",
    "Red Palm Oil",
    "Bottled and bulk palm oil from Nigerian suppliers.",
  ],
  [
    "Stockfish",
    "Stockfish",
    "Different cuts and sizes for retail and wholesale orders, where destination rules permit.",
  ],
].map(([commodity, title, pack_sizes]: any, i) => ({
  id: "demor" + i,
  commodity,
  title,
  pack_sizes,
  origin_state: null,
  moq_tons: null,
  price_usd_per_ton: null,
  unit: "pack",
  sale_type: "retail",
  category: categoryOf(commodity),
  demo: true,
  profiles: { company: "Sample supplier", verified: false },
}));
export const DEMO: any[] = [...bulk, ...retail];

export const STATUSES = [
  "Booked",
  "Cargo collected",
  "In warehouse",
  "Inspected",
  "Export documents ready",
  "Customs cleared",
  "Departed port",
  "In transit",
  "Arrived at destination port",
  "Delivered",
  "Delayed or exception",
];

export const PROVIDER_TYPES = [
  "Freight forwarder",
  "Haulage provider",
  "Clearing agent",
  "Inspection provider",
  "Warehouse provider",
  "Shipping line",
  "Insurance provider",
  "Laboratory",
];
export const DOC_TYPES = [
  "Commercial invoice",
  "Packing list",
  "Certificate of origin",
  "Phytosanitary certificate",
  "Inspection report",
  "Bill of lading",
  "Other",
];
