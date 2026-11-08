"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, PROVIDER_TYPES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Freight() {
  const { profile, ready } = useProfile();
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <p>Please <Link href="/login">sign in</Link> to use freight services.</p>;
  return profile.role === "provider" ? <Provider me={profile} /> : <Requester me={profile} />;
}

function Requester({ me }: any) {
  const [order, setOrder] = useState<any>(null);
  const [reqs, setReqs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("o");
    if (id) setOrder((await supabase.from("orders").select("*, rfqs(destination)").eq("id", id).maybeSingle()).data);
    let q = supabase.from("freight_requests").select("*, freight_quotes(*, profiles(company,verified))").order("created_at", { ascending: false });
    if (id) q = q.eq("order_id", id);
    setReqs((await q).data || []);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function create(e: any) {
    e.preventDefault();
    const form = e.target, f = new FormData(form);
    const { error } = await supabase.from("freight_requests").insert({
      order_id: order.id, service: f.get("service"), destination: f.get("dest"), notes: f.get("notes"),
      commodity: order.commodity, quantity_tons: order.quantity_tons,
    });
    setMsg(error ? error.message : "Request sent to matching providers");
    if (!error) { form.reset(); load(); }
  }
  async function accept(id: string) {
    const { error } = await supabase.rpc("accept_freight_quote", { q: id });
    setMsg(error ? error.message : "Provider assigned");
    load();
  }

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Freight and logistics</h1>
      {order ? (
        <>
          <h2>Request a service for {order.commodity}, {Number(order.quantity_tons).toLocaleString()} tonnes</h2>
          <form onSubmit={create}>
            <div className="grid">
              <label>Service<select name="service">{PROVIDER_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
              <label>Destination<input name="dest" defaultValue={order.rfqs?.destination} required /></label>
              <label>Notes<input name="notes" placeholder="Container size, pickup address, dates" /></label>
            </div>
            <button className="btn">Send request</button> <span className="msg">{msg}</span>
          </form>
        </>
      ) : <p className="muted">To request a service, open an order on your <Link href="/dashboard">dashboard</Link> and choose Request freight.</p>}
      <h2>Requests and quotations</h2>
      {reqs.length === 0 && <p className="muted">No requests yet.</p>}
      {reqs.map((r) => (
        <div className="card" key={r.id}>
          <h3>{r.service}: {r.commodity} to {r.destination} <span className="muted">({r.status})</span></h3>
          {(r.freight_quotes || []).length === 0 && <p className="muted">Waiting for providers to quote.</p>}
          {(r.freight_quotes || []).map((q: any) => (
            <p key={q.id}><strong>{q.profiles?.company}</strong>{q.profiles?.verified && <span className="v">Verified</span>}: USD {Number(q.price_usd).toLocaleString()}{q.transit_days ? `, ${q.transit_days} days` : ""}. {q.note} <em className="muted">{q.status}</em>{" "}
              {r.status === "open" && r.requested_by === me.id && <button className="btn alt" onClick={() => accept(q.id)}>Assign</button>}</p>
          ))}
        </div>
      ))}
    </>
  );
}

function Provider({ me }: any) {
  const [open, setOpen] = useState<any[]>([]);
  const [mine, setMine] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    setOpen((await supabase.from("freight_requests").select("*").eq("status", "open").order("created_at", { ascending: false })).data || []);
    setMine((await supabase.from("freight_quotes").select("*, freight_requests(service,destination,commodity)").eq("provider_id", me.id).order("created_at", { ascending: false })).data || []);
  }, [me.id]);
  useEffect(() => { load(); }, [load]);

  async function quote(e: any, request_id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from("freight_quotes").insert({ request_id, price_usd: Number(f.get("price")), transit_days: Number(f.get("days")) || null, note: f.get("note") });
    setMsg(error ? error.message : "Quotation sent");
    if (!error) load();
  }
  const done = (id: string) => mine.find((m) => m.request_id === id);

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Requests for {me.provider_type?.toLowerCase()}</h1>
      <p className="msg">{msg}</p>
      {open.length === 0 && <p className="muted">No open requests for your service right now.</p>}
      {open.map((r) => (
        <div className="card" key={r.id}>
          <h3>{r.commodity}, {Number(r.quantity_tons).toLocaleString()} tonnes, {r.origin} to {r.destination}</h3>
          <p className="muted">{r.notes || "No notes."}</p>
          {done(r.id) ? <p className="msg">You quoted USD {done(r.id).price_usd}</p> : (
            <form onSubmit={(e) => quote(e, r.id)}>
              <div className="grid">
                <label>Price (USD)<input name="price" type="number" min="0" step="any" required /></label>
                <label>Transit days<input name="days" type="number" min="1" /></label>
                <label>Note<input name="note" /></label>
              </div>
              <button className="btn alt">Send quotation</button>
            </form>
          )}
        </div>
      ))}
      <h2>Your quotations</h2>
      {mine.length === 0 && <p className="muted">None yet.</p>}
      {mine.map((m) => <p key={m.id}>{m.freight_requests?.commodity} to {m.freight_requests?.destination}: USD {Number(m.price_usd).toLocaleString()} <em className="muted">{m.status}</em></p>)}
    </>
  );
}
