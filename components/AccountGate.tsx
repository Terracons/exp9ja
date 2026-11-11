"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { isConfigured } from "@/lib/supabase";
export default function AccountGate({ error }: { error?: string }) {
  const [next, setNext] = useState("/dashboard");
  useEffect(() => {
    setNext(window.location.pathname + window.location.search);
  }, []);
  return (
    <section className="card">
      <p className="eyebrow">YOUR 1960.COM ACCOUNT</p>
      <h2>
        {error
          ? "Let's reconnect your account."
          : "Your next connection starts here."}
      </h2>
      <p>
        {error ||
          (isConfigured
            ? "Sign in to manage sourcing requests, orders, documents and logistics."
            : "Live accounts are awaiting marketplace setup. Explore Nigerian products while the operator completes configuration.")}
      </p>
      <div className="actions">
        {isConfigured && (
          <Link
            className="btn"
            href={`/login?next=${encodeURIComponent(next)}`}
          >
            Sign in to continue ↗
          </Link>
        )}
        <Link href="/#shop" className="text-link">
          Explore the marketplace
        </Link>
      </div>
    </section>
  );
}
