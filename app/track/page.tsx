"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AccountGate from "@/components/AccountGate";
import { supabase, STATUSES, fmtQty } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Track() {
  const { profile, ready, error: profileError } = useProfile();
  const [order, setOrder] = useState<any>(null);
  const [ship, setShip] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("o");
    if (id) {
      setOrder(
        (
          await supabase
            .from("orders")
            .select("*, rfqs(destination)")
            .eq("id", id)
            .maybeSingle()
        ).data,
      );
      const s = (
        await supabase
          .from("shipments")
          .select("*")
          .eq("order_id", id)
          .maybeSingle()
      ).data;
      setShip(s);
      if (s)
        setEvents(
          (
            await supabase
              .from("shipment_events")
              .select("*")
              .eq("shipment_id", s.id)
              .order("created_at", { ascending: false })
          ).data || [],
        );
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (profile) load();
  }, [profile, load]);

  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  if (!loaded) return <p className="muted">Loading</p>;
  if (!order)
    return (
      <p>
        Order not found. <Link href="/dashboard">Back to dashboard</Link>
      </p>
    );
  const canEdit = order.supplier_id === profile.id;

  async function createShipment(e: any) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { data, error } = await supabase
      .from("shipments")
      .insert({
        order_id: order.id,
        reference: f.get("ref"),
        carrier: f.get("carrier"),
        destination: order.rfqs?.destination || "To be confirmed",
      })
      .select()
      .single();
    if (error) return setMsg(error.message);
    await supabase
      .from("shipment_events")
      .insert({ shipment_id: data.id, status: "Booked", location: "Nigeria" });
    load();
  }

  async function addEvent(e: any) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form);
    const { error } = await supabase.from("shipment_events").insert({
      shipment_id: ship.id,
      status: f.get("status"),
      location: f.get("location"),
      note: f.get("note"),
    });
    setMsg(error ? error.message : "Update added");
    if (!error) {
      form.reset();
      load();
    }
  }

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>
        {order.commodity}, {fmtQty(order.quantity_tons, order.unit)}
      </h1>
      {!ship ? (
        canEdit ? (
          <>
            <h2>Create the shipment record</h2>
            <form onSubmit={createShipment}>
              <div className="grid">
                <label>
                  Booking or reference number
                  <input name="ref" required />
                </label>
                <label>
                  Carrier or forwarder
                  <input name="carrier" />
                </label>
              </div>
              <button className="btn">Create shipment</button>{" "}
              <span className="msg">{msg}</span>
            </form>
          </>
        ) : (
          <p className="muted">
            The supplier has not created a shipment for this order yet.
          </p>
        )
      ) : (
        <>
          <p className="card">
            <strong>{ship.status}</strong>
            <br />
            <span className="muted">
              Ref {ship.reference}
              {ship.carrier ? `, ${ship.carrier}` : ""}. {ship.origin} to{" "}
              {ship.destination}.
            </span>
          </p>
          {canEdit && (
            <form onSubmit={addEvent}>
              <div className="grid">
                <label>
                  Milestone
                  <select name="status">
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Location
                  <input name="location" placeholder="Apapa Port, Lagos" />
                </label>
                <label>
                  Note
                  <input name="note" />
                </label>
              </div>
              <button className="btn">Add update</button>{" "}
              <span className="msg">{msg}</span>
            </form>
          )}
          <h2>Timeline</h2>
          <ol className="tl">
            {events.map((ev) => (
              <li key={ev.id}>
                <strong>{ev.status}</strong>
                {ev.location ? `, ${ev.location}` : ""}
                <span className="tag">
                  {ev.source === "carrier"
                    ? "Carrier reported"
                    : "Supplier reported"}
                </span>
                <br />
                <span className="muted">
                  {new Date(ev.created_at).toLocaleString()}
                  {ev.note ? `. ${ev.note}` : ""}
                </span>
              </li>
            ))}
          </ol>
          <p className="muted">
            Every update shows who reported it. Manual updates are not carrier
            confirmation.
          </p>
        </>
      )}
    </>
  );
}
