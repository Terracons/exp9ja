"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, CATEGORIES, DEMO, fmtQty } from "@/lib/supabase";
import Thumb from "@/components/Thumb";

const DIASPORA = [
  ["Garri", "White garri, yellow garri and Ijebu garri.", "garri"],
  ["Egusi", "Whole melon seeds and ground egusi.", "egusi"],
  ["Ogbono", "Whole ogbono seeds and ground ogbono.", "ogbono"],
  ["Dried Catfish", "Smoked and dried catfish in different pack sizes.", "catfish"],
  ["Dried Crayfish", "Whole dried crayfish and ground crayfish.", "crayfish"],
  ["Red Palm Oil", "Locally sourced palm oil in bottles, gallons and larger containers.", "palm oil"],
  ["Yam Flour", "Elubo and packaged yam flour.", "yam"],
  ["Dried Vegetables", "Bitter leaf, ugu, oha, uziza and other traditional vegetables.", "vegetables"],
  ["Stockfish", "Stockfish head, body, fins and cut portions.", "stockfish"],
  ["Nigerian Snacks", "Chin chin, kuli-kuli, plantain chips and other locally made snacks.", "snacks"],
];
const BULK_STEPS = ["Search for the commodity you need.", "Send a request for quotation.", "Receive offers from interested suppliers.", "Compare prices, specifications, quantity and lead times.", "Confirm your order and arrange logistics."];
const LOGISTICS = [
  ["Freight Forwarders", "Arrange air and sea cargo transportation."],
  ["Clearing and Customs Agents", "Support applicable export and destination customs clearance processes."],
  ["Inspection Agents", "Arrange product inspections, quantity checks and quality verification."],
  ["Warehousing and Consolidation", "Receive products from multiple suppliers and prepare consolidated shipments where feasible."],
  ["Local Delivery Partners", "Arrange collection and transportation from suppliers to warehouses, ports and cargo terminals."],
  ["Shipment Tracking", "Follow order preparation, collection, export processing, transit, customs clearance and final delivery as updates become available."],
];
const SELL = ["List retail products or bulk commodities.", "Set your pack sizes, minimum order quantities and prices.", "Receive retail orders and bulk quotation requests.", "Manage stock and communicate with buyers.", "Connect with logistics and inspection providers.", "Build a supplier profile and establish buyer trust."];
const RETAIL_HOW = ["Find Nigerian products.", "Select your preferred pack size.", "Place your order.", "Follow preparation and shipping updates.", "Receive your products."];
const BULK_HOW = ["Search for a Nigerian commodity.", "Submit an RFQ with your quantity and requirements.", "Compare supplier quotations.", "Agree on specifications and delivery arrangements.", "Track your shipment to its destination."];

function Card({ r }: { r: any }) {
  const retail = r.sale_type === "retail", unit = r.unit || "tonne";
  return (
    <article className="prod">
      <Thumb url={r.image_url} commodity={r.commodity} />
      <div className="info">
        <h3>{r.title}</h3>
        {r.price_usd_per_ton != null
          ? <p className="price">US ${Number(r.price_usd_per_ton).toLocaleString()} <small>/ {unit}</small></p>
          : <p className="muted">Price set by supplier</p>}
        {r.pack_sizes && <p className="muted">{r.pack_sizes}</p>}
        {r.moq_tons != null && <p className="muted">Min. order {fmtQty(r.moq_tons, unit)}</p>}
        {r.origin_state && <p className="muted">{r.origin_state}, Nigeria</p>}
        <p className="sup">{r.profiles?.company}{r.profiles?.verified && <span className="v">Verified</span>}{r.demo && <span className="tag">Sample</span>}</p>
        {!r.demo && <Link className="btn" href={`/dashboard?c=${encodeURIComponent(r.commodity)}`}>{retail ? "Request to buy" : "Request quote"}</Link>}
      </div>
    </article>
  );
}

export default function Home() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    supabase.from("listings").select("*, profiles(company,country,verified)").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (error) setErr(error.message); setRows(data || []); });
  }, []);

  const real = !!(rows && rows.length);
  const shown = (real ? rows! : DEMO).filter((r) =>
    (!cat || r.category === cat) &&
    `${r.title} ${r.commodity} ${r.category ?? ""} ${r.origin_state ?? ""} ${r.profiles?.company ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const bulk = shown.filter((r) => r.sale_type !== "retail");
  const retail = shown.filter((r) => r.sale_type === "retail");
  const go = (cat_: string, q_: string) => { setCat(cat_); setQ(q_); document.getElementById("listings")?.scrollIntoView({ behavior: "smooth" }); };

  return (
    <>
      <section className="banner">
        <h1>Everything Nigerian. Delivered Worldwide.</h1>
        <p>Discover authentic Nigerian food, agricultural commodities, natural products, fashion and more. Buy directly from Nigerian farmers, producers, independent sellers and businesses, whether you need one pack or an entire container.</p>
        <div className="search">
          <input aria-label="Search" placeholder="Search products, categories or suppliers" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn" onClick={() => go(cat, q)}>Search</button>
        </div>
        <p style={{ marginTop: "1rem" }}>
          <a className="btn alt light" href="#shop">Shop Nigerian Products</a>{" "}
          <a className="btn alt light" href="#bulk">Source in Bulk</a>
        </p>
        <ul className="trust">
          <li>Shop retail packs or order in bulk</li><li>Verified Nigerian suppliers</li><li>Request quotations and compare offers</li>
          <li>Freight, inspection and clearing services</li><li>Track orders and shipments</li>
        </ul>
      </section>

      <section id="categories" className="block">
        <h2 className="sec">Explore Categories</h2>
        <div className="tiles">
          {CATEGORIES.map((c) => (
            <button key={c.name} className={`tile ${cat === c.name ? "on" : ""}`} onClick={() => go(cat === c.name ? "" : c.name, "")}>
              <span className="em" style={{ background: c.color }}>{c.emoji}</span>
              <strong>{c.name}</strong><span className="muted">{c.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section id="shop" className="block">
        <h2 className="sec">Shop Nigerian Products</h2>
        <p className="muted">Find the food, ingredients and everyday products you grew up with, alongside new products made in Nigeria.</p>
        <h3>Popular with the Nigerian diaspora</h3>
        <div className="tiles small">
          {DIASPORA.map(([name, text, key]) => (
            <button key={name} className="tile" onClick={() => go("", key)}><strong>{name}</strong><span className="muted">{text}</span></button>
          ))}
        </div>
        <p className="muted">Browse products by pack size, price, supplier location and delivery destination.</p>
        <button className="btn" onClick={() => go("Nigerian Foodstuff", "")}>Explore Nigerian Food Products</button>
      </section>

      <div id="listings" />
      {err && <p className="card">Could not load listings: {err}. Check your Supabase environment variables and that the database SQL has been run.</p>}
      {(cat || q) && <p className="muted">Showing {cat || "all categories"}{q ? ` matching "${q}"` : ""}. <button className="link" onClick={() => { setCat(""); setQ(""); }}>Clear filters</button></p>}
      {rows === null && <p className="muted">Loading listings</p>}
      {rows !== null && shown.length === 0 && <p className="muted">No matching listings yet.</p>}
      {bulk.length > 0 && (
        <section className="block">
          <h2 className="sec">Featured Agricultural Commodities {!real && <small>Sample listings shown until suppliers publish their own products and prices.</small>}</h2>
          <p className="muted">Source Nigerian agricultural products directly from farmers, processors, aggregators and export suppliers.</p>
          <div className="products">{bulk.map((r) => <Card key={r.id} r={r} />)}</div>
        </section>
      )}
      {retail.length > 0 && (
        <section className="block">
          <h2 className="sec">Popular Nigerian Food Products {!real && <small>Sample product names. Prices and pack sizes are provided by suppliers.</small>}</h2>
          <p className="muted">Explore smaller retail packs and wholesale quantities from Nigerian food suppliers.</p>
          <div className="products">{retail.map((r) => <Card key={r.id} r={r} />)}</div>
        </section>
      )}

      <section id="bulk" className="block panel">
        <h2 className="sec">Source in Bulk</h2>
        <p>Are you an importer, wholesaler, manufacturer or distributor? NaijaBulk helps you connect with Nigerian suppliers and compare offers without contacting every supplier individually.</p>
        <ol className="steps">{BULK_STEPS.map((s) => <li key={s}>{s}</li>)}</ol>
        <p className="muted">Bulk order units include kilograms, bags, cartons, pallets, tonnes and containers.</p>
        <Link className="btn" href="/dashboard">Start a Bulk Sourcing Request</Link>
      </section>

      <section id="logistics" className="block">
        <h2 className="sec">More Than a Marketplace: Logistics and Trade Support</h2>
        <p className="muted">Finding a supplier is only one part of international trade. NaijaBulk also connects buyers with service providers who can help move products from suppliers in Nigeria to their final destinations.</p>
        <div className="tiles small">{LOGISTICS.map(([n, t]) => <div className="tile" key={n}><strong>{n}</strong><span className="muted">{t}</span></div>)}</div>
        <Link className="btn" href="/providers">Explore Logistics Providers</Link>
      </section>

      <section id="sell" className="block panel">
        <h2 className="sec">Sell on NaijaBulk</h2>
        <p>Are you a farmer, food producer, processor, trader, cooperative, artisan or registered business? You can list products and reach customers outside your immediate market.</p>
        <ul className="steps">{SELL.map((s) => <li key={s}>{s}</li>)}</ul>
        <Link className="btn" href="/login">Become a Supplier</Link>
      </section>

      <section className="block">
        <h2 className="sec">How NaijaBulk Works</h2>
        <div className="two">
          <div className="card"><h3>For individual and diaspora buyers</h3><ol className="steps">{RETAIL_HOW.map((s) => <li key={s}>{s}</li>)}</ol></div>
          <div className="card"><h3>For commercial buyers</h3><ol className="steps">{BULK_HOW.map((s) => <li key={s}>{s}</li>)}</ol></div>
        </div>
      </section>

      <section className="block">
        <h2 className="sec">Supplier Verification</h2>
        <p>NaijaBulk reviews supplier information and supporting documents as part of its marketplace verification process.</p>
        <p className="muted">Verification is intended to help buyers assess supplier credibility. It does not replace official export approvals, product certifications, food safety approvals or destination-country import requirements. Product and destination eligibility may vary.</p>
      </section>

      <section className="banner end">
        <h2 style={{ border: 0, margin: 0 }}>Start Exploring Nigerian Products</h2>
        <p>Whether you are buying Nigerian foodstuff for your home, sourcing products for your grocery store, or importing agricultural commodities for your business, NaijaBulk helps you discover Nigerian suppliers and coordinate the buying process.</p>
        <p><a className="btn alt light" href="#shop">Shop Nigerian Products</a> <a className="btn alt light" href="#bulk">Source in Bulk</a> <Link className="btn alt light" href="/login">Become a Supplier</Link></p>
      </section>
    </>
  );
}
