"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
export default function Reset() {
  const [ready, setReady] = useState(false),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false),
    [msg, setMsg] = useState("");
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    async function init() {
      const p = new URLSearchParams(location.search);
      if (p.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          p.get("code")!,
        );
        if (error)
          return setMsg(
            "This reset link is invalid or expired. Request a new one.",
          );
      }
      const { data } = await supabase.auth.getSession();
      setReady(!!data.session);
      if (!data.session)
        setMsg(
          "Open the password reset link from your email, or request a new one.",
        );
    }
    init().catch(() =>
      setMsg("Unable to open the reset link. Please try again."),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (f.get("password") !== f.get("confirm"))
      return setMsg("Passwords do not match.");
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: String(f.get("password")),
      });
      if (error) throw error;
      await supabase.auth.signOut();
      setDone(true);
      setMsg("Password updated. Sign in with your new password.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="auth-form"
      style={{ maxWidth: 520, margin: "2rem auto" }}
    >
      <h2>Choose a new password.</h2>
      {ready && !done && (
        <form onSubmit={submit}>
          <label>
            New password
            <input
              type="password"
              name="password"
              minLength={10}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              name="confirm"
              minLength={10}
              autoComplete="new-password"
              required
            />
          </label>
          <button className="btn" disabled={busy}>
            {busy ? "Saving..." : "Update password"}
          </button>
        </form>
      )}
      {msg && <p role="status">{msg}</p>}
      <Link href="/login">Back to sign in</Link>
    </section>
  );
}
