"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase, isConfigured, PROVIDER_TYPES } from "@/lib/supabase";
export default function Directory({ kind }: { kind: "supplier" | "provider" }) {
  const [rows, setRows] = useState<any[]>([]),
    [loading, setLoading] = useState(isConfigured),
    [error, setError] = useState("");
  const [query, setQuery] = useState(""),
    [type, setType] = useState(""),
    [verified, setVerified] = useState(false);
  useEffect(() => {
    setQuery(new URLSearchParams(window.location.search).get("q") || "");
    if (!isConfigured) return;
    let active = true;
    supabase
      .from("profiles")
      .select("id,company,country,verified,provider_type,about")
      .eq("role", kind)
      .order("verified", { ascending: false })
      .order("company")
      .then(({ data, error }) => {
        if (active) {
          setRows(data || []);
          setLoading(false);
          if (error)
            setError(
              "The directory could not be loaded. Please try again shortly.",
            );
        }
      });
    return () => {
      active = false;
    };
  }, [kind]);
  const shown = rows.filter(
    (r) =>
      (!type || r.provider_type === type) &&
      (!verified || r.verified) &&
      `${r.company} ${r.country} ${r.about || ""}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  const supplier = kind === "supplier";
  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">
          {supplier
            ? "MEET THE PEOPLE BEHIND THE PRODUCTS"
            : "FROM NIGERIA TO YOUR DOOR"}
        </p>
        <h1>
          {supplier
            ? "Local makers. Global possibilities."
            : "The right partner for the journey."}
        </h1>
        <p>
          {supplier
            ? "Find Nigerian producers and businesses. Explore their products, compare quotations and start a conversation."
            : "Find freight forwarders, clearing agents, inspectors and delivery partners. Request a tailored quote from your confirmed order."}
        </p>
        <div className="actions">
          <Link
            className="btn"
            href={
              supplier
                ? "/login?mode=signup&role=supplier"
                : "/login?mode=signup&role=provider"
            }
          >
            {supplier
              ? "Become a supplier ↗"
              : "Register as a logistics partner ↗"}
          </Link>
          {!supplier && (
            <Link href="/freight" className="text-link">
              My freight requests ↗
            </Link>
          )}
        </div>
      </div>
      <div className="directory-controls">
        <input
          aria-label="Search companies or countries"
          placeholder="Search company, country or specialism"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {!supplier && (
          <select
            aria-label="Service type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">All services</option>
            {PROVIDER_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}
        <label className="check">
          <input
            type="checkbox"
            checked={verified}
            onChange={(e) => setVerified(e.target.checked)}
          />{" "}
          Verified only
        </label>
      </div>
      <p className="muted">
        Verification is a marketplace review of supplier information. Confirm
        product certifications, service coverage and destination requirements
        before committing.
      </p>
      {error && (
        <p className="form-status error" role="alert">
          {error}
        </p>
      )}
      {!isConfigured && (
        <p className="sample-notice">
          The live directory will be available when marketplace account services
          are configured.
        </p>
      )}
      <p aria-live="polite">
        {loading
          ? "Loading companies..."
          : `${shown.length} ${supplier ? "suppliers" : "logistics partners"} found`}
      </p>
      <div className="products">
        {shown.map((p) => (
          <article className="card directory-card" key={p.id}>
            <span className="initials" aria-hidden="true">
              {p.company.slice(0, 2).toUpperCase()}
            </span>
            <h3>
              {p.company} {p.verified && <span className="v">Verified</span>}
            </h3>
            <p className="muted">
              {p.country}
              {p.provider_type ? ` / ${p.provider_type}` : ""}
            </p>
            <p>
              {p.about ||
                (supplier
                  ? "Explore this supplier's product collection."
                  : "Request a quotation to confirm coverage, price and transit time.")}
            </p>
            <Link
              href={supplier ? `/suppliers/${p.id}` : "/freight"}
              className="btn alt"
            >
              {supplier ? "View products ↗" : "Request logistics ↗"}
            </Link>
          </article>
        ))}
      </div>
      {!loading && !error && !shown.length && (
        <div className="empty-state">
          <h3>
            {rows.length
              ? "No companies match these filters."
              : "New connections are on their way."}
          </h3>
          <p>
            {rows.length
              ? "Try another company name, country or service type."
              : "Registered companies will appear here as the marketplace grows."}
          </p>
          {rows.length > 0 && (
            <button
              className="btn"
              onClick={() => {
                setQuery("");
                setType("");
                setVerified(false);
              }}
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </>
  );
}
