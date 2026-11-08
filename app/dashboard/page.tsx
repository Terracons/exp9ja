"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, COMMODITIES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import Thumb from "@/components/Thumb";

const Commodities = ({ name = "commodity", value, onChange }: any) => (
  <select name={name} value={value} onChange={onChange}>{COMMODITIES.map((c) => <option key={c}>{c}</option>)}</select>
);

export default function Dashboard() {
  const { profile, ready } = useProfile();
  const [tick, setTick] = useState(0);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <p>Please <Link href="/login">sign in</Link> to use your dashboard.</p>;
  return (
    <>
      <h1 style={{ fontSize: "2.2rem" }}>{profile.company}</h1>
      <p className="muted">
        {profile.role === "supplier" ? "Supplier" : profile.role === "provider" ? profile.provider_type : "Buyer"} account, {profile.verified ? "verified" : "verification pending"}
      </p>
      {profile.role === "supplier" ? <Supplier me={profile} bump={() => setTick(tick + 1)} /> : profile.role === "provider" ? <p><Link className="btn" href="/freight">View freight requests</Link></p> : <Buyer me={profile} bump={() => setTick(tick + 1)} />}
      {profile.role !== "provider" && <Orders tick={tick} />}
    </>
  );
}

function Supplier({ me, bump }: any) {
  const [mine, setMine] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quoted, setQuoted] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setMine((await supabase.from("listings").select("*").eq("supplier_id", me.id).order("created_at", { ascending: false })).data || []);
    setRfqs((await supabase.from("rfqs").select("*").eq("status", "open").order("created_at", { ascending: false })).data || []);
    setQuoted((await supabase.from("quotes").select("*").eq("supplier_id", me.id)).data || []);
  }, [me.id]);
  useEffect(() => { load(); }, [load]);

  async function addListing(e: any) {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    const file = f.get("image") as File;
    let image_url = null;
    if (file && file.size) {
      const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const up = await supabase.storage.from("listings").upload(path, file);
      if (up.error) return setMsg(up.error.message);
      image_url = supabase.storage.from("listings").getPublicUrl(path).data.publicUrl;
    }
    const { error } = await supabase.from("listings").insert({ image_url,
      commodity: f.get("commodity"), title: f.get("title"), origin_state: f.get("origin"),
      moq_tons: Number(f.get("moq")), price_usd_per_ton: Number(f.get("price")),
    });
    setMsg(error ? error.message : "Listing published");
    if (!error) { form.reset(); load(); }
  }

  async function sendQuote(e: any, rfq_id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from("quotes").insert({
      rfq_id, price_usd_per_ton: Number(f.get("price")), lead_time_days: Number(f.get("days")), note: f.get("note"),
    });
    setMsg(error ? error.message : "Quotation sent");
    if (!error) { load(); bump(); }
  }

  async function revise(e: any, id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from("quotes").update({ price_usd_per_ton: Number(f.get("price")) }).eq("id", id);
    setMsg(error ? error.message : "Price revised");
    if (!error) load();
  }

  return (
    <>
      <h2>Publish a listing</h2>
      <form onSubmit={addListing}>
        <div className="grid">
          <label>Commodity<Commodities /></label>
          <label>Title<input name="title" placeholder="e.g. Raw cashew nuts, 2026 crop" required /></label>
          <label>Origin state<input name="origin" placeholder="Ogun" /></label>
          <label>Min order (tonnes)<input name="moq" type="number" min="0" step="any" required /></label>
          <label>USD per tonne<input name="price" type="number" min="0" step="any" required /></label>
          <label>Photo<input name="image" type="file" accept="image/*" /></label>
        </div>
        <button className="btn">Publish</button> <span className="msg">{msg}</span>
      </form>
      {mine.length > 0 && (
        <div className="products" style={{ marginTop: "1rem" }}>
          {mine.map((l) => (
            <article className="prod" key={l.id}><Thumb url={l.image_url} commodity={l.commodity} />
              <div className="info"><h3>{l.title}</h3><p className="price">US ${Number(l.price_usd_per_ton).toLocaleString()} <small>/ tonne</small></p></div></article>
          ))}
        </div>
      )}

      <h2>Open requests for quotation</h2>
      {rfqs.length === 0 && <p className="muted">No open requests right now.</p>}
      {rfqs.map((r) => {
        const done = quoted.find((x) => x.rfq_id === r.id);
        return (
          <div className="card" key={r.id}>
            <h3>{r.commodity}, {Number(r.quantity_tons).toLocaleString()} tonnes to {r.destination}</h3>
            <p className="muted">{r.specs || "No specifications given."}</p>
            {done ? (
              <div>
                <p className="msg">You quoted USD {done.price_usd_per_ton} per tonne ({done.status}). <Link href={`/messages?q=${done.id}`}>Message buyer</Link></p>
                {done.status === "submitted" && (
                  <form onSubmit={(e) => revise(e, done.id)} className="search" style={{ maxWidth: 340 }}>
                    <input name="price" type="number" min="0" step="any" placeholder="New USD per tonne" required />
                    <button className="btn alt">Revise</button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => sendQuote(e, r.id)}>
                <div className="grid">
                  <label>USD per tonne<input name="price" type="number" min="0" step="any" required /></label>
                  <label>Lead time (days)<input name="days" type="number" min="1" required /></label>
                  <label>Note<input name="note" /></label>
                </div>
                <button className="btn alt">Send quotation</button>
              </form>
            )}
          </div>
        );
      })}
    </>
  );
}

function Buyer({ me, bump }: any) {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [c, setC] = useState(COMMODITIES[0]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setRfqs((await supabase.from("rfqs").select("*, quotes(*, profiles(company,verified))").eq("buyer_id", me.id).order("created_at", { ascending: false })).data || []);
  }, [me.id]);
  useEffect(() => {
    load();
    const p = new URLSearchParams(window.location.search).get("c");
    if (p && COMMODITIES.includes(p)) setC(p);
  }, [load]);

  async function addRfq(e: any) {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    const { error } = await supabase.from("rfqs").insert({
      commodity: c, quantity_tons: Number(f.get("qty")), destination: f.get("dest"), specs: f.get("specs"),
    });
    setMsg(error ? error.message : "Request sent to suppliers");
    if (!error) { form.reset(); load(); }
  }

  async function accept(id: string) {
    const { error } = await supabase.rpc("accept_quote", { q: id });
    setMsg(error ? error.message : "Quotation accepted and order created");
    load(); bump();
  }

  return (
    <>
      <h2>New request for quotation</h2>
      <form onSubmit={addRfq}>
        <div className="grid">
          <label>Commodity<Commodities value={c} onChange={(e: any) => setC(e.target.value)} /></label>
          <label>Quantity (tonnes)<input name="qty" type="number" min="0" step="any" required /></label>
          <label>Destination<input name="dest" placeholder="Qingdao, China" required /></label>
          <label>Specifications<input name="specs" placeholder="Grade, moisture, packaging" /></label>
        </div>
        <button className="btn">Send request</button> <span className="msg">{msg}</span>
      </form>

      <h2>Your requests and quotations</h2>
      {rfqs.length === 0 && <p className="muted">No requests yet.</p>}
      {rfqs.map((r) => (
        <div className="card" key={r.id}>
          <h3>{r.commodity}, {Number(r.quantity_tons).toLocaleString()} tonnes to {r.destination} <span className="muted">({r.status})</span></h3>
          {(r.quotes || []).length === 0 && <p className="muted">Waiting for suppliers to quote.</p>}
          {(r.quotes || []).map((q: any) => (
            <p key={q.id}>
              <strong>{q.profiles?.company}</strong>{q.profiles?.verified && <span className="v">Verified</span>}: USD {Number(q.price_usd_per_ton).toLocaleString()} per tonne, {q.lead_time_days} days. {q.note} <em className="muted">{q.status}</em>{" "}
              <Link href={`/messages?q=${q.id}`}>Message</Link>{" "}
              {r.status === "open" && <button className="btn alt" onClick={() => accept(q.id)}>Accept</button>}
            </p>
          ))}
        </div>
      ))}
    </>
  );
}

function Orders({ tick }: { tick: number }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("orders").select("*").order("created_at", { ascending: false }).then(({ data }) => setRows(data || []));
  }, [tick]);
  return (
    <>
      <h2>Orders</h2>
      {rows.length === 0 ? <p className="muted">No orders yet.</p> : (
        <div className="scroll"><table className="ledger">
          <thead><tr><th>Product</th><th className="num">Tonnes</th><th className="num">USD per tonne</th><th className="num">Total USD</th><th>Status</th><th></th></tr></thead>
          <tbody>{rows.map((o) => (
            <tr key={o.id}><td>{o.commodity}</td><td className="num">{Number(o.quantity_tons).toLocaleString()}</td>
              <td className="num">{Number(o.price_usd_per_ton).toLocaleString()}</td>
              <td className="num price">{(o.quantity_tons * o.price_usd_per_ton).toLocaleString()}</td><td>{o.status}</td><td><Link href={`/track?o=${o.id}`}>Track</Link>{" | "}<Link href={`/freight?o=${o.id}`}>Request freight</Link>{" | "}<Link href={`/docs?o=${o.id}`}>Documents</Link></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}
