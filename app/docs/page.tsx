"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AccountGate from "@/components/AccountGate";
import { supabase, DOC_TYPES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Docs() {
  const { profile, ready, error: profileError } = useProfile();
  const [oid, setOid] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("o") || "";
    if (id) {
      const order = await supabase
        .from("orders")
        .select("id")
        .eq("id", id)
        .maybeSingle();
      if (order.data) {
        setOid(id);
        const result = await supabase
          .from("documents")
          .select("*")
          .eq("order_id", id)
          .order("created_at", { ascending: false });
        setRows(result.data || []);
        if (result.error) setMsg("Unable to load documents. Please retry.");
      } else setMsg("This order is unavailable to your account.");
    }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (profile) load();
  }, [profile, load]);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <AccountGate error={profileError} />;
  if (!loaded) return <p role="status">Loading your order documents...</p>;
  if (!oid)
    return (
      <p className="muted">
        {msg || "Open an order on your dashboard and choose Documents."}{" "}
        <Link href="/dashboard">Go to dashboard</Link>
      </p>
    );

  async function upload(e: any) {
    e.preventDefault();
    const form = e.target,
      f = new FormData(form),
      file = f.get("file") as File;
    if (!file || !file.size) return;
    if (busy) return;
    const types = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (file.size > 10 * 1024 * 1024 || !types.includes(file.type))
      return setMsg("Choose a PDF, JPG, PNG, Word or Excel file under 10 MB.");
    setBusy(true);
    try {
      const path = `${oid}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
      const up = await supabase.storage.from("documents").upload(path, file);
      if (up.error) throw up.error;
      const { error } = await supabase.from("documents").insert({
        order_id: oid,
        doc_type: f.get("type"),
        file_name: file.name,
        file_path: path,
      });
      setMsg(error ? error.message : "Document uploaded");
      if (!error) {
        form.reset();
        load();
      }
    } catch (err: any) {
      setMsg(err.message || "Upload failed. Please retry.");
    } finally {
      setBusy(false);
    }
  }
  async function open(path: string) {
    const { data, error } = await supabase.storage
      .from("documents")
      .createSignedUrl(path, 60);
    if (error) return setMsg(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Order documents</h1>
      <p className="muted">
        Files are private. Only the buyer and supplier on this order can open
        them.
      </p>
      <form onSubmit={upload}>
        <div className="grid">
          <label>
            Type
            <select name="type">
              {DOC_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label>
            File (PDF, image, Word or Excel, max 10 MB)
            <input
              name="file"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx,.xlsx"
              required
            />
          </label>
        </div>
        <button className="btn" disabled={busy}>
          {busy ? "Uploading..." : "Upload document"}
        </button>{" "}
        <span className="msg" role="status">
          {msg}
        </span>
      </form>
      <h2>Uploaded</h2>
      {rows.length === 0 && <p className="muted">No documents yet.</p>}
      {rows.map((d) => (
        <p key={d.id}>
          <strong>{d.doc_type}</strong>: {d.file_name}{" "}
          <span className="muted">
            {new Date(d.created_at).toLocaleDateString()}
          </span>{" "}
          <button className="link" onClick={() => open(d.file_path)}>
            Open
          </button>
        </p>
      ))}
    </>
  );
}
