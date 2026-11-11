"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/navigation";
export default function Confirm() {
  const router = useRouter();
  const [msg, setMsg] = useState("Confirming your account...");
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function finish() {
      const p = new URLSearchParams(window.location.search);
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      if (p.has("error") || fragment.has("error")) {
        setMsg(
          (p.get("error") || fragment.get("error")) === "access_denied"
            ? "Sign-in was cancelled or rejected. Try again, or continue with email."
            : "This sign-in or confirmation link is invalid or expired. Please sign in or request a new link.",
        );
        return;
      }
      if (p.get("code")) {
        const { error } = await supabase.auth.exchangeCodeForSession(
          p.get("code")!,
        );
        if (error) {
          setMsg(error.message);
          return;
        }
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .maybeSingle();
        if (error || !profile) {
          setMsg(
            "You are signed in, but your marketplace profile could not be loaded. Please retry, or ask the marketplace operator to check account setup.",
          );
          return;
        }
        if (profile.onboarding_complete === false)
          router.replace(
            `/auth/onboarding?next=${encodeURIComponent(safeNext(p.get("next")))}&role=${encodeURIComponent(p.get("role") || "buyer")}`,
          );
        else router.replace(safeNext(p.get("next")));
      } else
        setMsg("Your confirmation has been processed. Sign in to continue.");
    }
    finish().catch(() =>
      setMsg("Unable to confirm this link. Please try signing in."),
    );
  }, [router]);
  return (
    <section className="card">
      <h1 style={{ fontSize: "2.5rem" }}>Your account</h1>
      <p role="status">{msg}</p>
      <Link href="/login">Go to sign in</Link>
    </section>
  );
}
