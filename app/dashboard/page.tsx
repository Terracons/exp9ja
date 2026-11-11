"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AccountGate from "@/components/AccountGate";
import {
  supabase,
  COMMODITIES,
  CATEGORIES,
  UNITS,
  categoryOf,
  fmtQty,
} from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import Thumb from "@/components/Thumb";

const Commodities = ({ name = "commodity", value, onChange }: any) => (
  <select
    name={name}
    {...(onChange ? { value, onChange } : { defaultValue: value })}
  >
    {CATEGORIES.map((g) => (
      <optgroup key={g.name} label={g.name}>
        {g.items.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </optgroup>
    ))}
  </select>
);

export default function Dashboard() {
  const { profile, ready, error: profileError } = useProfile();
  const [tick, setTick] = useState(0);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  return (
    <>
      <h1 style={{ fontSize: "2.2rem" }}>{profile.company}</h1>
      <p className="muted">
        {profile.role === "supplier"
          ? "Supplier"
          : profile.role === "provider"
            ? profile.provider_type
            : "Buyer"}{" "}
        account, {profile.verified ? "verified" : "verification pending"}
      </p>
      <div className="dashboard-summary">
        <div className="card">
          <strong>Your profile</strong>
          <Link href="/account">Update business details</Link>
        </div>
        <div className="card">
          <strong>Your conversations</strong>
          <Link href="/inbox">Open messages</Link>
        </div>
        <div className="card">
          <strong>Your logistics</strong>
          <Link href="/freight">Manage freight requests</Link>
        </div>
      </div>
      {profile.role === "supplier" ? (
        <Supplier me={profile} bump={() => setTick(tick + 1)} />
      ) : profile.role === "provider" ? (
        <p>
          <Link className="btn" href="/freight">
            View freight requests
          </Link>
        </p>
      ) : (
        <Buyer me={profile} bump={() => setTick(tick + 1)} />
      )}
      {profile.role !== "provider" && <Orders tick={tick} />}
    </>
  );
}

function Supplier({ me, bump }: any) {
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [mine, setMine] = useState<any[]>([]);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [quoted, setQuoted] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setMine(
      (
        await supabase
          .from("listings")
          .select("*")
          .eq("supplier_id", me.id)
          .order("created_at", { ascending: false })
      ).data || [],
    );
    setRfqs(
      (
        await supabase
          .from("rfqs")
          .select("*")
          .eq("status", "open")
          .order("created_at", { ascending: false })
      ).data || [],
    );
    setQuoted(
      (await supabase.from("quotes").select("*").eq("supplier_id", me.id))
        .data || [],
    );
  }, [me.id]);
  useEffect(() => {
    load();
  }, [load]);

  async function addListing(e: any) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form);
    if (busy) return;
    if (!(Number(f.get("moq")) > 0) || !(Number(f.get("price")) > 0))
      return setMsg("Quantity and price must be greater than zero.");
    const file = f.get("image") as File;
    if (
      file?.size &&
      (!["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
        file.size > 5 * 1024 * 1024)
    )
      return setMsg("Choose a JPG, PNG or WebP photo under 5 MB.");
    setBusy(true);
    try {
      let image_url = null;
      if (file && file.size) {
        const path = `${me.id}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
        const up = await supabase.storage.from("listings").upload(path, file);
        if (up.error) throw up.error;
        image_url = supabase.storage.from("listings").getPublicUrl(path)
          .data.publicUrl;
      }
      const listing = {
        image_url: image_url || editing?.image_url || null,
        category: categoryOf(String(f.get("commodity"))),
        sale_type: f.get("sale"),
        unit: f.get("unit"),
        pack_sizes: f.get("packs"),
        commodity: f.get("commodity"),
        title: f.get("title"),
        origin_state: f.get("origin"),
        moq_tons: Number(f.get("moq")),
        price_usd_per_ton: Number(f.get("price")),
      };
      const { error } = editing
        ? await supabase
            .from("listings")
            .update(listing)
            .eq("id", editing.id)
            .eq("supplier_id", me.id)
        : await supabase.from("listings").insert(listing);
      if (error) throw error;
      setMsg(editing ? "Listing updated" : "Listing published");
      setEditing(null);
      form.reset();
      load();
    } catch (error: any) {
      setMsg(error.message || "Unable to save listing. Please retry.");
    } finally {
      setBusy(false);
    }
  }

  async function sendQuote(e: any, rfq_id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase.from("quotes").insert({
      rfq_id,
      price_usd_per_ton: Number(f.get("price")),
      lead_time_days: Number(f.get("days")),
      note: f.get("note"),
    });
    setMsg(error ? error.message : "Quotation sent");
    if (!error) {
      load();
      bump();
    }
  }

  async function revise(e: any, id: string) {
    e.preventDefault();
    const f = new FormData(e.target);
    const { error } = await supabase
      .from("quotes")
      .update({ price_usd_per_ton: Number(f.get("price")) })
      .eq("id", id);
    setMsg(error ? error.message : "Price revised");
    if (!error) load();
  }

  return (
    <>
      <h2 id="listing-form">
        {editing ? "Edit your listing" : "Publish a Nigerian product"}
      </h2>
      <p className="muted">
        List products made in Nigeria with accurate units, origin, pack sizes
        and photos. Prices are USD per selected unit.
      </p>
      <form onSubmit={addListing} key={editing?.id || "new"}>
        <div className="grid">
          <label>
            Commodity
            <Commodities value={editing?.commodity} />
          </label>
          <label>
            Title
            <input
              name="title"
              defaultValue={editing?.title}
              placeholder="e.g. Raw cashew nuts, 2026 crop"
              required
            />
          </label>
          <label>
            Origin state
            <input
              name="origin"
              defaultValue={editing?.origin_state}
              placeholder="Origin state in Nigeria, e.g. Ogun"
              required
              maxLength={80}
            />
          </label>
          <label>
            Minimum order
            <input
              name="moq"
              defaultValue={editing?.moq_tons}
              type="number"
              min="0.001"
              step="any"
              required
            />
          </label>
          <label>
            USD per unit
            <input
              name="price"
              defaultValue={editing?.price_usd_per_ton}
              type="number"
              min="0.001"
              step="any"
              required
            />
          </label>
          <label>
            Sold as
            <select name="sale" defaultValue={editing?.sale_type || "bulk"}>
              <option value="bulk">Bulk</option>
              <option value="retail">Retail packs</option>
            </select>
          </label>
          <label>
            Unit
            <select name="unit" defaultValue={editing?.unit || "tonne"}>
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            Pack sizes
            <input
              name="packs"
              defaultValue={editing?.pack_sizes}
              placeholder="1 kg, 5 kg, 25 kg"
            />
          </label>
          <label>
            Photo
            <input
              name="image"
              type="file"
              accept="image/jpeg,image/png,image/webp"
            />
          </label>
        </div>
        <button className="btn" disabled={busy}>
          {busy ? "Saving..." : editing ? "Save changes" : "Publish product"}
        </button>
        {editing && (
          <button
            className="link"
            type="button"
            onClick={() => setEditing(null)}
          >
            Cancel editing
          </button>
        )}{" "}
        <span className="msg" role="status">
          {msg}
        </span>
      </form>
      {mine.length > 0 && (
        <div className="products" style={{ marginTop: "1rem" }}>
          {mine.map((l) => (
            <article className="prod" key={l.id}>
              <Thumb url={l.image_url} commodity={l.commodity} />
              <div className="info">
                <h3>{l.title}</h3>
                <p className="price">
                  US ${Number(l.price_usd_per_ton).toLocaleString()}{" "}
                  <small>/ {l.unit || "tonne"}</small>
                </p>
                <div className="actions">
                  <button
                    className="link"
                    onClick={() => {
                      setEditing(l);
                      document.getElementById("listing-form")?.scrollIntoView();
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="link"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          "Remove this product? Existing orders remain available.",
                        )
                      )
                        return;
                      const { error } = await supabase
                        .from("listings")
                        .delete()
                        .eq("id", l.id)
                        .eq("supplier_id", me.id);
                      setMsg(error ? error.message : "Listing removed");
                      if (!error) load();
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <h2>Open requests for quotation</h2>
      {rfqs.length === 0 && (
        <p className="muted">No open requests right now.</p>
      )}
      {rfqs.map((r) => {
        const done = quoted.find((x) => x.rfq_id === r.id);
        return (
          <div className="card" key={r.id}>
            <h3>
              {r.commodity}, {fmtQty(r.quantity_tons, r.unit)} to{" "}
              {r.destination}
            </h3>
            <p className="muted">{r.specs || "No specifications given."}</p>
            {done ? (
              <div>
                <p className="msg">
                  You quoted USD {done.price_usd_per_ton} per {r.unit} (
                  {done.status}).{" "}
                  <Link href={`/messages?q=${done.id}`}>Message buyer</Link>
                </p>
                {done.status === "submitted" && (
                  <form
                    onSubmit={(e) => revise(e, done.id)}
                    className="search"
                    style={{ maxWidth: 340 }}
                  >
                    <input
                      name="price"
                      type="number"
                      min="0.001"
                      step="any"
                      placeholder="New USD per unit"
                      required
                    />
                    <button className="btn alt">Revise</button>
                  </form>
                )}
              </div>
            ) : (
              <form onSubmit={(e) => sendQuote(e, r.id)}>
                <div className="grid">
                  <label>
                    USD per {r.unit}
                    <input
                      name="price"
                      type="number"
                      min="0.001"
                      step="any"
                      required
                    />
                  </label>
                  <label>
                    Lead time (days)
                    <input name="days" type="number" min="1" required />
                  </label>
                  <label>
                    Note
                    <input name="note" />
                  </label>
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
  const [unit, setUnit] = useState("tonne");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    setRfqs(
      (
        await supabase
          .from("rfqs")
          .select("*, quotes(*, profiles(company,verified))")
          .eq("buyer_id", me.id)
          .order("created_at", { ascending: false })
      ).data || [],
    );
  }, [me.id]);
  useEffect(() => {
    load();
    const p = new URLSearchParams(window.location.search).get("c");
    if (p && COMMODITIES.includes(p)) setC(p);
    const u = new URLSearchParams(window.location.search).get("unit");
    if (u && UNITS.includes(u)) setUnit(u);
  }, [load]);

  async function addRfq(e: any) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form);
    if (sending) return;
    if (!(Number(f.get("qty")) > 0))
      return setMsg("Enter a quantity greater than zero.");
    setSending(true);
    try {
      const { error } = await supabase.from("rfqs").insert({
        commodity: c,
        quantity_tons: Number(f.get("qty")),
        unit,
        destination: f.get("dest"),
        specs: f.get("specs"),
      });
      setMsg(error ? error.message : "Request sent to suppliers");
      if (!error) {
        form.reset();
        load();
      }
    } catch {
      setMsg("Unable to send your request. Please retry.");
    } finally {
      setSending(false);
    }
  }

  async function accept(id: string) {
    if (
      !window.confirm(
        "Accept this quotation and create your order? Freight, duties and taxes are separate.",
      )
    )
      return;
    const { error } = await supabase.rpc("accept_quote", { q: id });
    setMsg(error ? error.message : "Quotation accepted and order created");
    load();
    bump();
  }

  return (
    <>
      <h2>What would you like to source?</h2>
      <p className="muted">
        For home or business: specify quantities, units, pack sizes and
        destination city and country. Suppliers confirm pricing and export
        suitability.
      </p>
      <form onSubmit={addRfq}>
        <div className="grid">
          <label>
            Commodity
            <Commodities
              value={c}
              onChange={(e: any) => setC(e.target.value)}
            />
          </label>
          <label>
            Quantity
            <input name="qty" type="number" min="0.001" step="any" required />
          </label>
          <label>
            Unit
            <select
              name="unit"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {UNITS.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </label>
          <label>
            Destination
            <input
              name="dest"
              placeholder="London, United Kingdom"
              maxLength={200}
              required
            />
          </label>
          <label>
            Specifications
            <input
              name="specs"
              placeholder="Grade, pack sizes, packaging, delivery terms and documents"
              maxLength={2000}
            />
          </label>
        </div>
        <button className="btn" disabled={sending}>
          {sending ? "Sending..." : "Send request to suppliers"}
        </button>{" "}
        <span className="msg" role="status">
          {msg}
        </span>
      </form>

      <h2>Your requests and quotations</h2>
      {rfqs.length === 0 && <p className="muted">No requests yet.</p>}
      {rfqs.map((r) => (
        <div className="card" key={r.id}>
          <h3>
            {r.commodity}, {fmtQty(r.quantity_tons, r.unit)} to {r.destination}{" "}
            <span className="muted">({r.status})</span>
          </h3>
          {(r.quotes || []).length === 0 && (
            <p className="muted">Waiting for suppliers to quote.</p>
          )}
          {(r.quotes || []).map((q: any) => (
            <p key={q.id}>
              <strong>{q.profiles?.company}</strong>
              {q.profiles?.verified && <span className="v">Verified</span>}: USD{" "}
              {Number(q.price_usd_per_ton).toLocaleString()} per {r.unit},{" "}
              {q.lead_time_days} days. {q.note}{" "}
              <em className="muted">{q.status}</em>{" "}
              <Link href={`/messages?q=${q.id}`}>Message</Link>{" "}
              {r.status === "open" && (
                <button className="btn alt" onClick={() => accept(q.id)}>
                  Accept
                </button>
              )}
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
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data || []));
  }, [tick]);
  return (
    <>
      <h2>Orders</h2>
      {rows.length === 0 ? (
        <p className="muted">No orders yet.</p>
      ) : (
        <div className="scroll">
          <table className="ledger">
            <thead>
              <tr>
                <th>Product</th>
                <th className="num">Quantity</th>
                <th className="num">USD per unit</th>
                <th className="num">Total USD</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id}>
                  <td>{o.commodity}</td>
                  <td className="num">{fmtQty(o.quantity_tons, o.unit)}</td>
                  <td className="num">
                    {Number(o.price_usd_per_ton).toLocaleString()}
                  </td>
                  <td className="num price">
                    {(o.quantity_tons * o.price_usd_per_ton).toLocaleString()}
                  </td>
                  <td>{o.status}</td>
                  <td>
                    <Link href={`/checkout?o=${o.id}`}>
                      {o.payment_status === "paid"
                        ? "Payment receipt"
                        : "Review & pay"}
                    </Link>
                    {" | "}
                    <Link href={`/track?o=${o.id}`}>Track</Link>
                    {" | "}
                    <Link href={`/freight?o=${o.id}`}>Request freight</Link>
                    {" | "}
                    <Link href={`/docs?o=${o.id}`}>Documents</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
