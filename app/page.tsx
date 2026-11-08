"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, COMMODITIES, CAT, DEMO } from "@/lib/supabase";
import Thumb from "@/components/Thumb";

export default function Home() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");

  useEffect(() => {
    supabase.from("listings").select("*, profiles(company,country,verified)").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (error) setErr(error.message); setRows(data || []); });
  }, []);

  const source = rows && rows.length ? rows : DEMO;
  const shown = source.filter(
    (r) => (!cat || r.commodity === cat) &&
      `${r.title} ${r.origin_state ?? ""} ${r.profiles?.company ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <>
      <section className="hero">
        <aside className="cats" aria-label="Categories">
          <button className={!cat ? "on" : ""} onClick={() => setCat("")}>All categories</button>
          {COMMODITIES.map((c) => (
            <button key={c} className={cat === c ? "on" : ""} onClick={() => setCat(c)}><span>{CAT[c][0]}</span> {c}</button>
          ))}
        </aside>
        <div className="banner">
          <h1>Nigerian commodities, bought in bulk.</h1>
          <p>Browse suppliers, send one request for quotation, and compare offers in one place.</p>
          <div className="search">
            <input aria-label="Search" placeholder="Search cocoa, cashew, sesame, supplier or state" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn">Search</button>
          </div>
          <ul className="trust">
            <li>Verified supplier badges</li><li>Bulk pricing in USD per tonne</li><li>Compare quotations side by side</li>
          </ul>
        </div>
      </section>

      {err && <p className="card">Could not load listings: {err}. Check your Supabase environment variables and that schema.sql has been run.</p>}
      <h2 className="sec">{cat || "Featured listings"} {rows && rows.length === 0 && <small>Sample listings shown until suppliers publish their own</small>}</h2>
      {rows === null && <p className="muted">Loading listings</p>}
      {rows !== null && shown.length === 0 && <p className="muted">No matching listings.</p>}
      <div className="products">
        {shown.map((r) => (
          <article className="prod" key={r.id}>
            <Thumb url={r.image_url} commodity={r.commodity} />
            <div className="info">
              <h3>{r.title}</h3>
              <p className="price">US ${Number(r.price_usd_per_ton).toLocaleString()} <small>/ tonne</small></p>
              <p className="muted">Min. order {Number(r.moq_tons).toLocaleString()} t</p>
              <p className="muted">{r.origin_state || "Nigeria"}, Nigeria</p>
              <p className="sup">{r.profiles?.company}{r.profiles?.verified && <span className="v">Verified</span>}{r.demo && <span className="tag">Sample</span>}</p>
              {!r.demo && <Link className="btn" href={`/dashboard?c=${encodeURIComponent(r.commodity)}`}>Request quote</Link>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
