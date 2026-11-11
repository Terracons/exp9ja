"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AccountGate from "@/components/AccountGate";
import { supabase, PROVIDER_TYPES, fmtQty } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Freight() {
  const { profile, ready, error: profileError } = useProfile();
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  return profile.role === "provider" ? (
    <Provider me={profile} />
  ) : (
    <Requester me={profile} />
  );
}

function Requester({ me }: any) {
  const [order, setOrder] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [reqs, setReqs] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("o");
    const available = await supabase
      .from("orders")
      .select("*, rfqs(destination)")
      .order("created_at", { ascending: false });
    setOrders(available.data || []);
    setSelected(id || "");
    if (available.error)
      setMsg("Unable to load your orders. Please try again.");
    if (id)
      setOrder(
        (
          await supabase
            .from("orders")
            .select("*, rfqs(destination)")
            .eq("id", id)
            .maybeSingle()
        ).data,
      );
    let q = supabase
      .from("freight_requests")
      .select("*, freight_quotes(*, profiles(company,verified))")
      .order("created_at", { ascending: false });
    if (id) q = q.eq("order_id", id);
    const result = await q;
    setReqs(result.data || []);
    if (result.error)
      setMsg("Unable to load logistics requests. Please try again.");
    setLoaded(true);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function create(e: any) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form);
    if (busy || !order) return;
    setBusy(true);
    try {
      const { error } = await supabase.from("freight_requests").insert({
        order_id: order.id,
        service: f.get("service"),
        destination: f.get("dest"),
        notes: f.get("notes"),
        commodity: order.commodity,
        quantity_tons: order.quantity_tons,
        unit: order.unit,
        origin: String(f.get("origin")).trim(),
      });
      setMsg(error ? error.message : "Request sent to matching providers");
      if (!error) {
        form.reset();
        load();
      }
    } catch {
      setMsg("Unable to send your request. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function accept(id: string) {
    if (
      !window.confirm(
        "Assign this logistics provider? Confirm the service scope, price and delivery terms with the provider first.",
      )
    )
      return;
    const { error } = await supabase.rpc("accept_freight_quote", { q: id });
    setMsg(error ? error.message : "Provider assigned");
    load();
  }

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Freight and logistics</h1>
      <p className="muted">
        Compare service quotations for your confirmed orders. Freight, duties,
        taxes and insurance are separate from product payments.
      </p>
      <label style={{ maxWidth: 680 }}>
        Select an order
        <select
          aria-label="Choose an order for logistics"
          value={selected}
          onChange={(e) => {
            window.history.replaceState(
              null,
              "",
              e.target.value ? `/freight?o=${e.target.value}` : "/freight",
            );
            setSelected(e.target.value);
            setOrder(orders.find((o) => o.id === e.target.value) || null);
            load();
          }}
        >
          <option value="">Choose an order</option>
          {orders.map((o) => (
            <option key={o.id} value={o.id}>
              {o.commodity}, {fmtQty(o.quantity_tons, o.unit)} to{" "}
              {o.rfqs?.destination}
            </option>
          ))}
        </select>
      </label>
      {order ? (
        <>
          <h2>
            Request a service for {order.commodity},{" "}
            {fmtQty(order.quantity_tons, order.unit)}
          </h2>
          <form onSubmit={create} key={order.id}>
            <div className="grid">
              <label>
                Service
                <select name="service">
                  {PROVIDER_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Destination
                <input
                  name="dest"
                  defaultValue={order.rfqs?.destination}
                  required
                />
              </label>
              <label>
                Pickup location in Nigeria
                <input
                  name="origin"
                  placeholder="Address, city and state"
                  maxLength={300}
                  required
                />
              </label>
              <label>
                Shipment details
                <textarea
                  name="notes"
                  placeholder="Air or sea, dimensions, weight, container size, pickup date, packaging and insurance requirements"
                  maxLength={2000}
                  rows={3}
                  required
                />
              </label>
            </div>
            <button className="btn" disabled={busy}>
              {busy ? "Sending..." : "Request logistics quotations"}
            </button>
          </form>
        </>
      ) : (
        <p className="muted">
          To request a service, open an order on your{" "}
          <Link href="/dashboard">dashboard</Link> and choose Request freight.
        </p>
      )}
      <h2>Requests and quotations</h2>
      <p className="msg" role="status">
        {msg}
      </p>
      {!loaded && <p role="status">Loading your requests...</p>}
      {loaded && reqs.length === 0 && (
        <p className="muted">
          No requests yet. Select a confirmed order to start.
        </p>
      )}
      {reqs.map((r) => (
        <div className="card" key={r.id}>
          <h3>
            {r.service}: {r.commodity} to {r.destination}{" "}
            <span className="muted">({r.status})</span>
          </h3>
          {(r.freight_quotes || []).length === 0 && (
            <p className="muted">Waiting for providers to quote.</p>
          )}
          {(r.freight_quotes || []).map((q: any) => (
            <p key={q.id}>
              <strong>{q.profiles?.company}</strong>
              {q.profiles?.verified && <span className="v">Verified</span>}: USD{" "}
              {Number(q.price_usd).toLocaleString()}
              {q.transit_days ? `, ${q.transit_days} days` : ""}. {q.note}{" "}
              <em className="muted">{q.status}</em>{" "}
              {r.status === "open" && r.requested_by === me.id && (
                <button className="btn alt" onClick={() => accept(q.id)}>
                  Assign
                </button>
              )}
            </p>
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
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const requests = await supabase
      .from("freight_requests")
      .select("*")
      .eq("status", "open")
      .eq("service", me.provider_type)
      .order("created_at", { ascending: false });
    if (requests.error) setMsg("Unable to load requests. Please retry.");
    setOpen(requests.data || []);
    setMine(
      (
        await supabase
          .from("freight_quotes")
          .select("*, freight_requests(service,destination,commodity)")
          .eq("provider_id", me.id)
          .order("created_at", { ascending: false })
      ).data || [],
    );
  }, [me.id]);
  useEffect(() => {
    load();
  }, [load]);

  async function quote(e: any, request_id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    if (busy) return;
    if (!(Number(f.get("price")) > 0))
      return setMsg("Enter a quotation greater than zero.");
    setBusy(true);
    try {
      const { error } = await supabase.from("freight_quotes").insert({
        request_id,
        price_usd: Number(f.get("price")),
        transit_days: Number(f.get("days")) || null,
        note: f.get("note"),
      });
      setMsg(error ? error.message : "Quotation sent");
      if (!error) load();
    } catch {
      setMsg("Unable to send quotation. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  const done = (id: string) => mine.find((m) => m.request_id === id);

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>
        Requests for {me.provider_type?.toLowerCase()}
      </h1>
      <p className="msg" role="status">
        {msg}
      </p>
      {open.length === 0 && (
        <p className="muted">No open requests for your service right now.</p>
      )}
      {open.map((r) => (
        <div className="card" key={r.id}>
          <h3>
            {r.commodity}, {fmtQty(r.quantity_tons, r.unit)}, {r.origin} to{" "}
            {r.destination}
          </h3>
          <p className="muted">{r.notes || "No notes."}</p>
          {done(r.id) ? (
            <p className="msg">You quoted USD {done(r.id).price_usd}</p>
          ) : (
            <form onSubmit={(e) => quote(e, r.id)}>
              <div className="grid">
                <label>
                  Total service price (USD)
                  <input
                    name="price"
                    type="number"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>
                <label>
                  Transit days
                  <input name="days" type="number" min="1" />
                </label>
                <label>
                  Note
                  <input name="note" />
                </label>
              </div>
              <button className="btn alt" disabled={busy}>
                {busy ? "Sending..." : "Send quotation"}
              </button>
            </form>
          )}
        </div>
      ))}
      <h2>Your quotations</h2>
      {mine.length === 0 && <p className="muted">None yet.</p>}
      {mine.map((m) => (
        <p key={m.id}>
          {m.freight_requests?.commodity} to {m.freight_requests?.destination}:
          USD {Number(m.price_usd).toLocaleString()}{" "}
          <em className="muted">{m.status}</em>
        </p>
      ))}
    </>
  );
}
