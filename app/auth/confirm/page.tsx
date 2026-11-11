"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { safeNext } from "@/lib/navigation";
export default function Confirm() {
  const router = useRouter();
  const [msg, setMsg] = useState("Confirming your account...");
  useEffect(() => {
    async function finish() {
      const p = new URLSearchParams(window.location.search);
      if (p.has("error")) {
        setMsg(
          "This confirmation link is invalid or expired. Please sign in or request a new link.",
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
      if (data.session) router.replace(safeNext(p.get("next")));
      else setMsg("Your confirmation has been processed. Sign in to continue.");
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
