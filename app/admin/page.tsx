"use client";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import AccountGate from "@/components/AccountGate";

export default function Admin() {
  const { profile, ready, error: profileError } = useProfile();
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState("");
  const load = useCallback(async () => {
    setRows(
      (
        await supabase
          .from("profiles")
          .select("*")
          .order("verified")
          .order("company")
      ).data || [],
    );
  }, []);
  useEffect(() => {
    if (profile?.is_admin) load();
  }, [profile, load]);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  if (!profile?.is_admin)
    return <p>This page is for 1960.com administrators.</p>;

  async function setVerified(id: string, verified: boolean) {
    if (busy) return;
    setBusy(id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ verified })
        .eq("id", id);
      if (error) throw error;
      setMsg(verified ? "Verification recorded." : "Verification revoked.");
      load();
    } catch {
      setMsg("Unable to update verification. Please retry.");
    } finally {
      setBusy("");
    }
  }
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Verification</h1>
      <p className="muted">
        Review each company's evidence offline, then mark it verified. Payment
        never grants verification.
      </p>
      {msg && <p role="status">{msg}</p>}
      <div className="scroll">
        <table className="ledger">
          <thead>
            <tr>
              <th>Company</th>
              <th>Role</th>
              <th>Country</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.company}</td>
                <td>{p.role}</td>
                <td>{p.country}</td>
                <td>{p.verified ? "Verified" : "Pending"}</td>
                <td>
                  <button
                    className="link"
                    disabled={!!busy}
                    onClick={() => setVerified(p.id, !p.verified)}
                  >
                    {p.verified ? "Revoke" : "Verify"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
