"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase, DOC_TYPES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";

export default function Docs() {
  const { profile, ready } = useProfile();
  const [oid, setOid] = useState("");
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const load = useCallback(async () => {
    const id = new URLSearchParams(window.location.search).get("o") || "";
    setOid(id);
    if (id) setRows((await supabase.from("documents").select("*").eq("order_id", id).order("created_at", { ascending: false })).data || []);
  }, []);
  useEffect(() => { if (profile) load(); }, [profile, load]);
  if (!ready) return <p className="muted">Loading</p>;
  if (!profile) return <p>Please <Link href="/login">sign in</Link> to view documents.</p>;
  if (!oid) return <p className="muted">Open an order on your <Link href="/dashboard">dashboard</Link> and choose Documents.</p>;

  async function upload(e: any) {
    e.preventDefault();
    const form = e.target, f = new FormData(form), file = f.get("file") as File;
    if (!file || !file.size) return;
    const path = `${oid}/${Date.now()}-${file.name.replace(/[^\w.]/g, "_")}`;
    const up = await supabase.storage.from("documents").upload(path, file);
    if (up.error) return setMsg(up.error.message);
    const { error } = await supabase.from("documents").insert({ order_id: oid, doc_type: f.get("type"), file_name: file.name, file_path: path });
    setMsg(error ? error.message : "Document uploaded");
    if (!error) { form.reset(); load(); }
  }
  async function open(path: string) {
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(path, 60);
    if (error) return setMsg(error.message);
    window.open(data.signedUrl, "_blank");
  }

  return (
    <>
      <h1 style={{ fontSize: "2rem" }}>Order documents</h1>
      <p className="muted">Files are private. Only the buyer and supplier on this order can open them.</p>
      <form onSubmit={upload}>
        <div className="grid">
          <label>Type<select name="type">{DOC_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label>
          <label>File<input name="file" type="file" required /></label>
        </div>
        <button className="btn">Upload</button> <span className="msg">{msg}</span>
      </form>
      <h2>Uploaded</h2>
      {rows.length === 0 && <p className="muted">No documents yet.</p>}
      {rows.map((d) => (
        <p key={d.id}><strong>{d.doc_type}</strong>: {d.file_name} <span className="muted">{new Date(d.created_at).toLocaleDateString()}</span>{" "}
          <button className="link" onClick={() => open(d.file_path)}>Open</button></p>
      ))}
    </>
  );
}
