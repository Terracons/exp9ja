"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Suppliers() {
  const [rows, setRows] = useState<any[] | null>(null);
  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "supplier").order("verified", { ascending: false }).order("company")
      .then(({ data }) => setRows(data || []));
  }, []);
  return (
    <>
      <h1 style={{ fontSize: "2.2rem" }}>Suppliers</h1>
      <p className="muted">Verification helps buyers assess credibility. It does not replace export approvals, product certifications or destination import requirements.</p>
      {rows !== null && rows.length === 0 && <p className="muted">No suppliers yet. <Link href="/login">Become a supplier</Link>.</p>}
      <div className="products">
        {(rows || []).map((p) => (
          <article className="card" key={p.id}><h3>{p.company}{p.verified && <span className="v">Verified</span>}</h3><p className="muted">{p.country}</p></article>
        ))}
      </div>
    </>
  );
}
