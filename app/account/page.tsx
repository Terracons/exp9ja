"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useProfile } from "@/lib/useProfile";
import { supabase, PROVIDER_TYPES } from "@/lib/supabase";
import AccountGate from "@/components/AccountGate";
export default function Account() {
  const { profile, ready, error } = useProfile();
  const [msg, setMsg] = useState(""),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState("");
  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email || ""));
  }, []);
  if (!ready) return <p role="status">Loading your profile...</p>;
  if (!profile) return <AccountGate error={error} />;
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    const f = new FormData(e.currentTarget);
    try {
      const { error } = await supabase.rpc("update_my_profile", {
        business: String(f.get("company")).trim(),
        location: String(f.get("country")).trim(),
        description: String(f.get("about")).trim(),
        service: profile.role === "provider" ? f.get("service") : null,
      });
      if (error) throw error;
      setMsg(
        "Profile updated. Changes to business details require verification again.",
      );
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Unable to save profile.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR MARKETPLACE IDENTITY</p>
        <h1>Your business profile.</h1>
        <p>
          {email} / {profile.role} /{" "}
          {profile.verified ? "Verified" : "Verification pending"}
        </p>
        <Link href="/dashboard">← Dashboard</Link>
      </div>
      <form onSubmit={save} className="auth-form" style={{ maxWidth: 680 }}>
        <label>
          Business or trading name
          <input
            name="company"
            defaultValue={profile.company}
            maxLength={120}
            required
          />
        </label>
        <label>
          Country
          <input
            name="country"
            defaultValue={profile.country}
            maxLength={80}
            required
          />
        </label>
        <label>
          About your business
          <textarea
            name="about"
            rows={5}
            defaultValue={profile.about || ""}
            maxLength={1000}
            placeholder="Tell buyers what you produce, your location, capacity and experience."
          />
        </label>
        {profile.role === "provider" && (
          <label>
            Service type
            <select name="service" defaultValue={profile.provider_type}>
              {PROVIDER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
        <p className="muted">
          Your company name, country and description appear in the directory.
          Account roles and verification are managed separately.
        </p>
        <button className="btn" disabled={busy}>
          {busy ? "Saving..." : "Save profile"}
        </button>
        {msg && <p role="status">{msg}</p>}
      </form>
    </>
  );
}
