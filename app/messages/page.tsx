"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, fmtQty } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Messages() {
  const { profile, ready } = useProfile();
  const [quote, setQuote] = useState<any>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("q");
    if (!id) return;
    const { data } = await supabase.from("quotes")
      .select("*, profiles(company), rfqs(commodity,quantity_tons,unit,destination,profiles(company))").eq("id", id).maybeSingle();
    setQuote(data);
    if (data) supabase.rpc("mark_read", { q: id });
    setMsgs((await supabase.from("messages").select("*").eq("quote_id", id).order("created_at")).data || []);
  }, []);
  useEffect(() => {
    if (!profile) return;
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [profile, load]);

  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <p>Please <Link href="/login">sign in</Link> to view messages.</p>;
  if (!quote) return <p className="muted">Conversation not found. <Link href="/dashboard">Back to dashboard</Link></p>;

  async function send(e: any) {
    e.preventDefault();
    if (!text.trim()) return;
    const { error } = await supabase.from("messages").insert({ quote_id: quote.id, body: text.trim() });
    if (error) return setErr(error.message);
    setText(""); setErr(""); load();
  }

  const r = quote.rfqs;
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>{r.commodity}, {fmtQty(r.quantity_tons, r.unit)} to {r.destination}</h1>
      <p className="muted">{r.profiles?.company} (buyer) and {quote.profiles?.company} (supplier). Quotation: USD {Number(quote.price_usd_per_ton).toLocaleString()} per {r.unit}, {quote.lead_time_days} days.</p>
      <div className="chat">
        {msgs.length === 0 && <p className="muted">No messages yet. Ask about specifications, samples, packaging or payment terms.</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble ${m.sender_id === profile.id ? "me" : ""}`}>
            {m.body}<small>{new Date(m.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
      <form onSubmit={send} className="search" style={{ maxWidth: "none" }}>
        <input aria-label="Message" placeholder="Write a message" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />
        <button className="btn">Send</button>
      </form>
      {err && <p className="msg">{err}</p>}
    </>
  );
}
