"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Admin() {
  const { profile, ready } = useProfile();
  const [rows, setRows] = useState<any[]>([]);
  const load = useCallback(async () => {
    setRows((await supabase.from("profiles").select("*").order("verified").order("company")).data || []);
  }, []);
  useEffect(() => { if (profile?.is_admin) load(); }, [profile, load]);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile?.is_admin) return <p>This page is for NaijaBulk administrators.</p>;

  async function setVerified(id: string, verified: boolean) {
    await supabase.from("profiles").update({ verified }).eq("id", id);
    load();
  }
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Verification</h1>
      <p className="muted">Review each company's evidence offline, then mark it verified. Payment never grants verification.</p>
      <div className="scroll"><table className="ledger">
        <thead><tr><th>Company</th><th>Role</th><th>Country</th><th>Status</th><th></th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id}><td>{p.company}</td><td>{p.role}</td><td>{p.country}</td><td>{p.verified ? "Verified" : "Pending"}</td>
            <td><button className="link" onClick={() => setVerified(p.id, !p.verified)}>{p.verified ? "Revoke" : "Verify"}</button></td></tr>
        ))}</tbody>
      </table></div>
    </>
  );
}
