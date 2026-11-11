"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AccountGate from "@/components/AccountGate";
import { supabase, fmtQty } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { useUnread } from "@/lib/useUnread";

export default function Inbox() {
  const { profile, ready, error: profileError } = useProfile();
  const { map } = useUnread(profile?.id);
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    if (profile)
      supabase
        .from("quotes")
        .select(
          "*, profiles(company), rfqs(commodity,quantity_tons,unit,profiles(company))",
        )
        .order("created_at", { ascending: false })
        .then(({ data }) => setRows(data || []));
  }, [profile]);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Messages</h1>
      {rows.length === 0 && (
        <p className="muted">
          Conversations start once a supplier quotes on a request.
        </p>
      )}
      {rows.map((q) => (
        <Link key={q.id} href={`/messages?q=${q.id}`} className="card row">
          <span>
            <strong>
              {q.rfqs?.commodity}, {fmtQty(q.rfqs?.quantity_tons, q.rfqs?.unit)}
            </strong>
            <br />
            <span className="muted">
              {profile.role === "supplier"
                ? q.rfqs?.profiles?.company
                : q.profiles?.company}
            </span>
          </span>
          {map[q.id] > 0 && <span className="badge">{map[q.id]} new</span>}
        </Link>
      ))}
    </>
  );
}
