"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, PROVIDER_TYPES } from "@/lib/supabase";

export default function Providers() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [type, setType] = useState("");
  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "provider").order("verified", { ascending: false }).order("company")
      .then(({ data }) => setRows(data || []));
  }, []);
  const shown = (rows || []).filter((p) => !type || p.provider_type === type);
  return (
    <>
      <h1 style={{ fontSize: "2.2rem" }}>Service providers</h1>
      <p className="muted">Freight forwarders, haulage, clearing agents, inspectors, warehouses and more. Registration alone does not prove legal authority, so look for the Verified badge.</p>
      <div className="bar"><select aria-label="Service type" value={type} onChange={(e) => setType(e.target.value)}>
        <option value="">All services</option>{PROVIDER_TYPES.map((t) => <option key={t}>{t}</option>)}</select></div>
      {rows !== null && shown.length === 0 && <p className="muted">No providers yet. <Link href="/login">Register your company</Link> as a service provider.</p>}
      <div className="products">
        {shown.map((p) => (
          <article className="card" key={p.id}>
            <h3>{p.company}{p.verified && <span className="v">Verified</span>}</h3>
            <p className="price" style={{ fontSize: "1rem" }}>{p.provider_type}</p>
            <p className="muted">{p.country}</p>
            <p>{p.about}</p>
          </article>
        ))}
      </div>
    </>
  );
}
