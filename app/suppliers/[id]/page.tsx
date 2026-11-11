"use client";
import { useEffect, useState, use } from "react";
import Link from "next/link";
import { supabase, isConfigured, fmtQty } from "@/lib/supabase";
import Thumb from "@/components/Thumb";
export default function Supplier({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [profile, setProfile] = useState<any>(null),
    [rows, setRows] = useState<any[]>([]),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!isConfigured || !/^[0-9a-f-]{36}$/i.test(id)) {
      setBusy(false);
      return;
    }
    Promise.all([
      supabase
        .from("profiles")
        .select("id,company,country,about,verified")
        .eq("id", id)
        .eq("role", "supplier")
        .maybeSingle(),
      supabase
        .from("listings")
        .select("*")
        .eq("supplier_id", id)
        .order("created_at", { ascending: false }),
    ]).then(([p, l]) => {
      if (active) {
        setProfile(p.data);
        setRows(l.data || []);
        setBusy(false);
        if (p.error || l.error)
          setError(
            "This supplier's information could not be loaded. Please retry.",
          );
      }
    });
    return () => {
      active = false;
    };
  }, [id]);
  if (busy) return <p role="status">Loading supplier...</p>;
  if (error || !profile)
    return (
      <section className="card">
        <h2>{error || "Supplier not found."}</h2>
        <Link href="/suppliers">Back to suppliers</Link>
      </section>
    );
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">MEET YOUR NEXT NIGERIAN TRADE PARTNER</p>
        <h1>{profile.company}</h1>
        <p>
          {profile.country}{" "}
          {profile.verified && <span className="v">Verified supplier</span>}
        </p>
        <p>{profile.about}</p>
        <Link href="/suppliers">← All suppliers</Link>
      </div>
      <h2>Products from this supplier</h2>
      {!rows.length && <p>This supplier has not published any products yet.</p>}
      <div className="products">
        {rows.map((r) => (
          <article className="prod" key={r.id}>
            <Thumb url={r.image_url} commodity={r.commodity} />
            <div className="info">
              <p className="product-origin">{r.origin_state}, Nigeria</p>
              <h3>{r.title}</h3>
              <p className="price">
                USD ${Number(r.price_usd_per_ton).toLocaleString()}{" "}
                <small>/ {r.unit}</small>
              </p>
              <p className="muted">Minimum {fmtQty(r.moq_tons, r.unit)}</p>
              <p>{r.pack_sizes}</p>
              <Link
                className="btn"
                href={`/dashboard?c=${encodeURIComponent(r.commodity)}&unit=${encodeURIComponent(r.unit || "tonne")}`}
              >
                Request a quotation ↗
              </Link>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
