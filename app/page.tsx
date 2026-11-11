"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  supabase,
  isConfigured,
  CATEGORIES,
  DEMO,
  fmtQty,
} from "@/lib/supabase";
import { filterListings, type Listing, type Filters } from "@/lib/discovery";
import Thumb from "@/components/Thumb";

const initial: Filters = {
  query: "",
  category: "",
  sale: "",
  origin: "",
  verified: false,
  savedOnly: false,
  sort: "newest",
};
export default function Home() {
  const [rows, setRows] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(isConfigured);
  const [failed, setFailed] = useState(false);
  const [filters, setFilters] = useState(initial);
  const [saved, setSaved] = useState<string[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("1960-saved") || "[]");
      if (Array.isArray(value))
        setSaved(value.filter((id) => typeof id === "string"));
    } catch {
      /* Browsing remains available without storage. */
    }
    setStorageReady(true);
    if (!isConfigured) return;
    let active = true;
    supabase
      .from("listings")
      .select("*, profiles(company,country,verified)")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (active) {
          setRows(data || []);
          setFailed(!!error);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (storageReady) {
      try {
        localStorage.setItem("1960-saved", JSON.stringify(saved));
      } catch {
        setNotice(
          "Saved for this visit. Your browser could not store this list.",
        );
      }
    }
  }, [saved, storageReady]);
  const demo = !rows.length;
  const source = demo ? DEMO : rows;
  const shown = filterListings(source, filters, saved);
  const origins = [
    ...new Set(source.map((r) => r.origin_state).filter(Boolean)),
  ].sort();
  const update = (patch: Partial<Filters>) =>
    setFilters((current) => ({ ...current, ...patch }));
  function explore(category = "") {
    update({ category, query: "", savedOnly: false });
    document.getElementById("shop")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }
  function toggleSaved(id: string) {
    setSaved((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }
  return (
    <>
      <section className="independence-hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="flag" aria-label="Nigerian flag" /> ROOTED IN
            NIGERIA. OPEN TO THE WORLD.
          </p>
          <h1 id="hero-title">
            Made here.
            <br />
            Loved <em>everywhere.</em>
          </h1>
          <p className="hero-description">
            From the food you miss to the products your business needs. Discover
            Nigerian producers, source with confidence, and bring a piece of
            home to the world.
          </p>
          <div className="actions">
            <a className="btn" href="#shop">
              Explore Nigerian products ↗
            </a>
            <Link className="text-link" href="/dashboard">
              Source in bulk ↗
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="tiny-star" aria-hidden="true">
              ✳
            </span>{" "}
            Our independence. Our enterprise. Our next chapter.
          </div>
        </div>
        <div
          className="heritage-art"
          role="img"
          aria-label="Green and ivory artwork celebrating Nigeria's independence on 1 October 1960"
        >
          <div className="art-top">
            <span>NIGERIA / EST. 1960</span>
            <span>01 OCT</span>
          </div>
          <div className="sunburst" aria-hidden="true">
            ✳
          </div>
          <div className="art-number">
            19
            <br />
            <span>60</span>
            <i>
              Since independence.
              <br />
              Towards possibility.
            </i>
          </div>
          <div className="art-bottom">
            <span>THE SPIRIT OF A NATION</span>
            <span>↗</span>
          </div>
        </div>
      </section>
      <div className="manifesto-strip">
        <span>GROWN WITH CARE</span>
        <span aria-hidden="true">✳</span>
        <span>CRAFTED WITH PRIDE</span>
        <span aria-hidden="true">✳</span>
        <span>SHARED WITH THE WORLD</span>
      </div>
      <section className="discovery-section" id="categories">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A LITTLE CLOSER TO HOME</p>
            <h2>So much to discover.</h2>
          </div>
          <a href="#shop" className="text-link">
            Browse all products ↗
          </a>
        </div>
        <div className="category-ribbon">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              className={`category-item ${filters.category === c.name ? "selected" : ""}`}
              onClick={() => explore(c.name)}
            >
              <span
                className={`category-symbol symbol-${i % 4}`}
                aria-hidden="true"
              >
                {c.emoji}
              </span>
              <span>{c.name}</span>
              <span className="category-arrow" aria-hidden="true">
                ↗
              </span>
            </button>
          ))}
        </div>
      </section>
      <section className="discovery-section" id="shop">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FROM OUR SOIL, OUR HANDS, OUR HOMES</p>
            <h2>Find your piece of Nigeria.</h2>
          </div>
          <button
            className={`saved-toggle ${filters.savedOnly ? "selected" : ""}`}
            aria-pressed={filters.savedOnly}
            onClick={() => update({ savedOnly: !filters.savedOnly })}
          >
            ♡ Saved ({saved.length})
          </button>
        </div>
        <div className="discovery-toolbar">
          <label className="search-field">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label="Search products, suppliers or states"
              placeholder="Try cocoa, garri, or a supplier..."
              value={filters.query}
              onChange={(e) => update({ query: e.target.value })}
            />
          </label>
          <label>
            <span className="sr-only">Category</span>
            <select
              value={filters.category}
              onChange={(e) => update({ category: e.target.value })}
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.name}>{c.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Order type</span>
            <select
              value={filters.sale}
              onChange={(e) => update({ sale: e.target.value })}
            >
              <option value="">Retail & bulk</option>
              <option value="retail">Retail packs</option>
              <option value="bulk">Bulk sourcing</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Sort products</span>
            <select
              value={filters.sort}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Latest arrivals</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </label>
        </div>
        <div className="filter-details">
          <label className="check">
            <input
              type="checkbox"
              checked={filters.verified}
              onChange={(e) => update({ verified: e.target.checked })}
            />{" "}
            Verified suppliers only
          </label>
          <label className="origin-filter">
            Origin{" "}
            <select
              value={filters.origin}
              onChange={(e) => update({ origin: e.target.value })}
            >
              <option value="">All states</option>
              {origins.map((state) => (
                <option key={state!}>{state}</option>
              ))}
            </select>
          </label>
          <button className="link" onClick={() => setFilters(initial)}>
            Reset filters
          </button>
        </div>
        {demo && (
          <p className="sample-notice" role="status">
            {failed ? "Live listings are temporarily unavailable. " : ""}Explore
            sample listings.{" "}
            {isConfigured
              ? "Published products appear here when available."
              : "Live buying and accounts require marketplace setup."}{" "}
            Sample prices are illustrative.
          </p>
        )}
        <div className="result-summary" aria-live="polite">
          {loading
            ? "Loading latest products..."
            : `${shown.length} ${shown.length === 1 ? "discovery" : "discoveries"}${filters.savedOnly ? " in your collection" : " from Nigeria"}`}
          <span>Retail packs to container loads</span>
        </div>
        {notice && <p role="status">{notice}</p>}
        <div className="products discovery-products">
          {shown.map((r) => (
            <article className="prod" key={r.id}>
              <div className="product-visual">
                <Thumb url={r.image_url} commodity={r.commodity} />
                <span className="product-type">
                  {r.demo
                    ? "SAMPLE"
                    : r.sale_type === "retail"
                      ? "RETAIL"
                      : "BULK"}
                </span>
                <button
                  className={`save-product ${saved.includes(r.id) ? "is-saved" : ""}`}
                  aria-label={`${saved.includes(r.id) ? "Unsave" : "Save"} ${r.title}`}
                  aria-pressed={saved.includes(r.id)}
                  onClick={() => toggleSaved(r.id)}
                >
                  {saved.includes(r.id) ? "♥" : "♡"}
                </button>
              </div>
              <div className="info">
                <p className="product-origin">
                  {r.origin_state
                    ? `${r.origin_state}, Nigeria`
                    : "Nigerian food collection"}
                </p>
                <h3>{r.title}</h3>
                <p className="supplier-name">
                  {r.profiles?.company || "Independent supplier"}{" "}
                  {r.profiles?.verified && <span className="v">Verified</span>}
                </p>
                <p className="price">
                  {r.price_usd_per_ton != null ? (
                    <>
                      ${Number(r.price_usd_per_ton).toLocaleString()}{" "}
                      <small>USD / {r.unit || "tonne"}</small>
                    </>
                  ) : (
                    "Ask for pricing"
                  )}
                </p>
                {r.moq_tons != null && (
                  <p className="muted">
                    Min. order {fmtQty(r.moq_tons, r.unit)}
                  </p>
                )}
                {r.pack_sizes && (
                  <p className="muted pack-description">{r.pack_sizes}</p>
                )}
                {r.demo ? (
                  <span className="sample-caption">
                    Preview product • Not available to order
                  </span>
                ) : (
                  <Link
                    className="product-request"
                    href={`/dashboard?c=${encodeURIComponent(r.commodity)}&unit=${encodeURIComponent(r.unit || "tonne")}`}
                  >
                    Request {r.sale_type === "retail" ? "to buy" : "a quote"} ↗
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
        {!shown.length && (
          <div className="empty-state">
            <span aria-hidden="true">⌕</span>
            <h3>
              {filters.savedOnly
                ? "Your collection starts here."
                : "A different discovery awaits."}
            </h3>
            <p>
              {filters.savedOnly
                ? "Save products with the heart button, or adjust your filters."
                : "Try a broader search or another category."}
            </p>
            <button className="btn" onClick={() => setFilters(initial)}>
              Explore all products
            </button>
          </div>
        )}
      </section>
      <section className="heritage-section" id="heritage">
        <div>
          <p className="eyebrow">MORE THAN A NAME. A BEGINNING.</p>
          <h2>
            October first.
            <br />
            <em>Forever forward.</em>
          </h2>
          <p>
            On 1 October 1960, Nigeria became independent. Our name honours that
            beginning. Our marketplace champions what comes next.
          </p>
          <p className="heritage-date">01 / 10 / 1960</p>
        </div>
        <div className="heritage-statement">
          <span aria-hidden="true">✳</span>
          <h3>
            A world of potential.
            <br />A place to call home.
          </h3>
          <p>
            We connect Nigerian farmers, food producers, artisans and businesses
            with international buyers and the diaspora. One product. One
            relationship. One possibility at a time.
          </p>
          <Link href="/guide">Your guide to buying internationally ↗</Link>
        </div>
      </section>
      <section id="bulk" className="trade-section">
        <div>
          <p className="eyebrow">LOCAL ROOTS. GLOBAL AMBITION.</p>
          <h2>
            Good things grow
            <br />
            when we connect.
          </h2>
          <p>
            Find your supplier, agree your specifications, and coordinate the
            journey. Build your next trade connection in Nigeria.
          </p>
          <Link className="btn" href="/dashboard">
            Start a sourcing request ↗
          </Link>
        </div>
        <ol className="trade-steps">
          <li>
            <span>01</span>
            <div>
              <h3>Discover & shortlist</h3>
              <p>Explore products and save the ones that fit your needs.</p>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <h3>Request & compare</h3>
              <p>Send your requirements and compare supplier quotations.</p>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <h3>Pay, coordinate & track</h3>
              <p>
                Review your order, request logistics quotes, and follow shipment
                updates.
              </p>
              <Link href="/providers">Explore logistics partners ↗</Link>
            </div>
          </li>
        </ol>
      </section>
      <section className="seller-callout">
        <span aria-hidden="true">✳</span>
        <div>
          <p className="eyebrow">MADE IN NIGERIA. READY FOR THE WORLD.</p>
          <h2>Your craft deserves a bigger stage.</h2>
          <p>
            Farmers, makers, producers and independent businesses. There is a
            place for you here.
          </p>
        </div>
        <Link href="/login?mode=signup&role=supplier" className="btn">
          Become a supplier ↗
        </Link>
      </section>
    </>
  );
}
