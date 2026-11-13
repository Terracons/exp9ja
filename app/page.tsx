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
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [searchScope, setSearchScope] = useState("products");
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
    setSearchScope("products");
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
      <section className="market-search" aria-labelledby="hero-title">
        <div className="market-search-heading">
          <div>
            <p className="trade-kicker">FROM NIGERIA. FOR THE WORLD.</p>
            <h1 id="hero-title">Find your next Nigerian discovery.</h1>
          </div>
          <span className="market-origin">
            <span className="flag" aria-hidden="true" /> Nigerian products.
            Global connections.
          </span>
        </div>
        <form
          className="market-search-form"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            if (searchScope !== "products") {
              router.push(
                `/${searchScope}?q=${encodeURIComponent(filters.query.trim())}`,
              );
              return;
            }
            document.getElementById("shop")?.scrollIntoView({
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
            });
          }}
        >
          <select
            aria-label="Search in"
            value={searchScope}
            onChange={(e) => setSearchScope(e.target.value)}
          >
            <option value="products">Products</option>
            <option value="suppliers">Suppliers</option>
            <option value="providers">Logistics</option>
          </select>
          <input
            aria-label="Search products, suppliers or states"
            placeholder={
              searchScope === "products"
                ? "Try garri, cocoa, adire..."
                : searchScope === "suppliers"
                  ? "Search supplier names or specialities"
                  : "Search logistics companies or services"
            }
            value={filters.query}
            onChange={(e) => update({ query: e.target.value })}
          />
          <button className="btn" type="submit">
            Search
          </button>
        </form>
        <div className="search-suggestions">
          <span>Explore:</span>
          {["Garri", "Cocoa", "Ginger", "Adire", "Shea"].map((term) => (
            <button
              key={term}
              onClick={() => {
                setSearchScope("products");
                setFilters({ ...initial, query: term });
                document.getElementById("shop")?.scrollIntoView();
              }}
            >
              {term}
            </button>
          ))}
        </div>
      </section>
      <nav className="trade-shortcuts" aria-label="Sourcing shortcuts">
        <a href="#categories">
          <span aria-hidden="true">▦</span> Shop by category
        </a>
        <Link href="/suppliers">
          <span aria-hidden="true">◉</span> Find suppliers
        </Link>
        <Link href="/dashboard">
          <span aria-hidden="true">↗</span> Request quotations
        </Link>
        <Link href="/providers">
          <span aria-hidden="true">▱</span> Shipping & inspection
        </Link>
        <Link href="/guide">
          <span aria-hidden="true">◎</span> Buyer guide
        </Link>
      </nav>
      <div className="market-layout">
        <aside
          className="market-categories"
          id="categories"
          aria-label="Product categories"
        >
          <h2>
            <span aria-hidden="true">☰</span> All categories
          </h2>
          <div className="market-category-list">
            <button
              className={!filters.category ? "active" : ""}
              aria-pressed={!filters.category}
              onClick={() => explore("")}
            >
              <span aria-hidden="true">◈</span>
              <span>All Nigerian products</span>
              <span aria-hidden="true">›</span>
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                className={filters.category === c.name ? "active" : ""}
                aria-pressed={filters.category === c.name}
                onClick={() => explore(c.name)}
              >
                <span aria-hidden="true">{c.emoji}</span>
                <span>{c.name}</span>
                <span aria-hidden="true">›</span>
              </button>
            ))}
          </div>
          <div className="sidebar-sourcing">
            <strong>Buying for your business?</strong>
            <p>Tell suppliers what you need. Compare their quotations.</p>
            <Link href="/dashboard">Post a sourcing request ↗</Link>
          </div>
        </aside>
        <div className="market-main">
          <section className="sourcing-banner" aria-labelledby="sourcing-title">
            <div>
              <p className="trade-kicker">THE 1960 COLLECTION</p>
              <h2 id="sourcing-title">
                Rooted here.
                <br />
                <span>Ready for everywhere.</span>
              </h2>
              <p>
                Everyday favourites. Exceptional raw materials.
                <br />
                Discover Nigerian products, from retail to bulk.
              </p>
              <a href="#shop" className="btn">
                Explore the marketplace <span aria-hidden="true">↗</span>
              </a>
            </div>
            <div className="trade-art" aria-hidden="true">
              <div className="trade-orbit" />
              <span className="art-location">NIGERIA ↗ THE WORLD</span>
              <div className="art-package package-back">
                <span>MADE IN</span>
                <strong>NIGERIA</strong>
                <i />
              </div>
              <div className="art-package package-front">
                <span>THE GOOD STUFF</span>
                <strong>
                  1960<span>.com</span>
                </strong>
                <i />
                <small>GROWN. CRAFTED. CONNECTED.</small>
              </div>
              <span className="art-stamp">
                LOCAL ORIGINS
                <br />
                GLOBAL POSSIBILITIES
              </span>
            </div>
          </section>
          <section className="discovery-section market-products" id="shop">
            <div className="section-heading">
              <div>
                <p className="eyebrow">RETAIL & BULK • SOURCED IN NIGERIA</p>
                <h2>Explore products</h2>
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
            <details className="market-advanced">
              <summary>More filters: origin & verified suppliers</summary>
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
            </details>
            <div className="active-filters" aria-label="Active filters">
              {(
                [
                  ["query", filters.query && `Search: ${filters.query}`],
                  ["category", filters.category],
                  [
                    "sale",
                    filters.sale &&
                      (filters.sale === "retail"
                        ? "Retail packs"
                        : "Bulk sourcing"),
                  ],
                  ["origin", filters.origin],
                  ["verified", filters.verified && "Verified suppliers"],
                  ["savedOnly", filters.savedOnly && "Saved products"],
                ] as const
              )
                .filter(([, label]) => label)
                .map(([key, label]) => (
                  <button
                    key={key}
                    aria-label={`Remove ${label} filter`}
                    onClick={() =>
                      update({
                        [key]: typeof initial[key] === "boolean" ? false : "",
                      })
                    }
                  >
                    {label} <span aria-hidden="true">×</span>
                  </button>
                ))}
              {(filters.query ||
                filters.category ||
                filters.sale ||
                filters.origin ||
                filters.verified ||
                filters.savedOnly) && (
                <button
                  className="clear-filters"
                  onClick={() => setFilters(initial)}
                >
                  Clear all
                </button>
              )}
            </div>
            {demo && (
              <p className="sample-notice" role="status">
                {failed ? "Live listings are temporarily unavailable. " : ""}
                Explore sample listings.{" "}
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
                      {r.profiles?.verified && (
                        <span className="v">Verified</span>
                      )}
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
                        Request{" "}
                        {r.sale_type === "retail" ? "to buy" : "a quote"} ↗
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
          <section
            className="market-collections"
            aria-labelledby="collections-title"
          >
            <h2 id="collections-title">Featured collections</h2>
            <div className="collection-grid">
              {[
                {
                  title: "A taste of home",
                  detail: "Explore retail packs",
                  sale: "retail",
                },
                {
                  title: "Source in bulk",
                  detail: "Explore bulk products",
                  sale: "bulk",
                },
                {
                  title: "Latest arrivals",
                  detail: "Explore the full marketplace",
                  sale: "",
                },
              ].map((collection) => (
                <button
                  key={collection.title}
                  className="collection-card"
                  onClick={() => {
                    setFilters({ ...initial, sale: collection.sale });
                    document.getElementById("shop")?.scrollIntoView();
                  }}
                >
                  <span className="collection-title">
                    {collection.title} <span aria-hidden="true">↗</span>
                  </span>
                  <span className="collection-detail">{collection.detail}</span>
                  <span className="collection-thumbs">
                    {source
                      .filter(
                        (r) =>
                          !collection.sale ||
                          (r.sale_type || "bulk") === collection.sale,
                      )
                      .slice(0, 2)
                      .map((r) => (
                        <Thumb
                          key={r.id}
                          url={r.image_url}
                          commodity={r.commodity}
                        />
                      ))}
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </div>
      <section className="market-help">
        <div>
          <strong>Find Nigerian suppliers</strong>
          <span>Explore producer profiles and product catalogues.</span>
          <Link href="/suppliers">Browse suppliers ↗</Link>
        </div>
        <div>
          <strong>Plan your shipment</strong>
          <span>Find freight, inspection and clearing partners.</span>
          <Link href="/providers">Explore logistics ↗</Link>
        </div>
        <div>
          <strong>New to international buying?</strong>
          <span>Understand quotations, payments and delivery.</span>
          <Link href="/guide">Read the buyer guide ↗</Link>
        </div>
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
