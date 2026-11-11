"use client";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, PROVIDER_TYPES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { safeNext } from "@/lib/navigation";
import AccountGate from "@/components/AccountGate";
export default function Onboarding() {
  return (
    <Suspense fallback={<p role="status">Loading account setup...</p>}>
      <Setup />
    </Suspense>
  );
}
function Setup() {
  const router = useRouter(),
    params = useSearchParams();
  const { profile, ready, error } = useProfile();
  const [role, setRole] = useState("buyer"),
    [busy, setBusy] = useState(false),
    [msg, setMsg] = useState("");
  useEffect(() => {
    const chosen = params.get("role");
    if (chosen && ["buyer", "supplier", "provider"].includes(chosen))
      setRole(chosen);
  }, [params]);
  useEffect(() => {
    if (profile && profile.onboarding_complete !== false)
      router.replace(safeNext(params.get("next")));
  }, [profile, router, params]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setMsg("");
    try {
      const { error } = await supabase.rpc("complete_my_onboarding", {
        account_role: role,
        business: String(f.get("company")).trim(),
        location: String(f.get("country")).trim(),
        description: String(f.get("about") || "").trim(),
        service: role === "provider" ? f.get("service") : null,
      });
      if (error) throw error;
      window.location.assign(safeNext(params.get("next")));
    } catch (err) {
      setMsg(
        err instanceof Error
          ? err.message
          : "Unable to complete your profile. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!ready) return <p role="status">Loading your account...</p>;
  if (!profile) return <AccountGate error={error} />;
  return (
    <section
      className="auth-form"
      style={{ maxWidth: 720, margin: "1rem auto" }}
    >
      <p className="eyebrow">YOU'RE SIGNED IN</p>
      <h1 style={{ fontSize: "2.4rem" }}>
        Let's set up your marketplace profile.
      </h1>
      <p>
        Choose how you will use 1960.com. Your Google account handles sign-in;
        these details help connect you with the right trade partners.
      </p>
      <form onSubmit={submit}>
        <label>
          Account type
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="buyer">Buyer: shop or source products</option>
            <option value="supplier">Supplier: sell Nigerian products</option>
            <option value="provider">
              Logistics partner: offer trade services
            </option>
          </select>
        </label>
        <label>
          {role === "buyer"
            ? "Your name or business name"
            : "Business or trading name"}
          <input
            name="company"
            maxLength={120}
            defaultValue={
              profile.company === "New member" ? "" : profile.company
            }
            required
            autoComplete="organization"
          />
        </label>
        <label>
          Country
          <input
            name="country"
            maxLength={80}
            required
            autoComplete="country-name"
            placeholder="e.g. Nigeria, United Kingdom, Canada"
          />
        </label>
        {role === "provider" && (
          <label>
            Service offered
            <select name="service">
              {PROVIDER_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        )}
        <label>
          About your business (optional)
          <textarea name="about" maxLength={1000} rows={3} />
        </label>
        <button className="btn" disabled={busy}>
          {busy ? "Saving your profile..." : "Complete my profile ↗"}
        </button>
        {msg && (
          <p role="alert" className="form-status error">
            {msg}
          </p>
        )}
      </form>
    </section>
  );
}
