"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import styles from "./MarketplaceHero.module.css";

function Icon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    search: "m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    box: "m3 7 9-5 9 5v10l-9 5-9-5V7m0 0 9 5 9-5M12 12v10M7 4l10 6",
    supplier: "M3 22V10l6-3v5l6-3v5l6-3v11H3M5 10V2h4v5M7 17v2m5-2v2m5-2v2",
    quote: "M6 3h12v19H6V3m3 0V1h6v2M9 8h6m-6 4h6m-6 4h4",
    truck:
      "M2 5h12v12H2V5m12 5h5l3 4v3h-8M8 19a2 2 0 1 1-4 0 2 2 0 0 1 4 0m12 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0",
    guide:
      "M12 5C8 2 5 2 2 3v16c3-1 6-1 10 2m0-16c4-3 7-3 10-2v16c-3-1-6-1-10 2V5",
    user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 22v-3a8 8 0 0 1 16 0v3",
    grid: "M3 3h7v7H3V3m11 0h7v7h-7V3M3 14h7v7H3v-7m11 0h7v7h-7v-7",
    heart: "M20 4c-3-2-6 0-8 2-2-2-5-4-8-2-5 4 0 10 8 17 8-7 13-13 8-17",
    message: "M3 3h18v14H9l-6 5V3m4 5h10M7 12h7",
    home: "m2 11 10-9 10 9M5 9v13h14V9M10 22v-8h4v8",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name] || paths.box} />
    </svg>
  );
}

type Props = {
  query: string;
  scope: string;
  category: string;
  savedCount: number;
  onQuery: (value: string) => void;
  onScope: (value: string) => void;
  onSearch: () => void;
  onCategory: (value: string) => void;
  onTerm: (value: string) => void;
  onSaved: () => void;
};

export default function MarketplaceHero(p: Props) {
  const { profile } = useProfile();
  const actions = [
    {
      label: "Categories",
      detail: "Explore Nigerian products",
      icon: "grid",
      href: "#categories",
    },
    {
      label: "Request a quote",
      detail: "Tell suppliers what you need",
      icon: "quote",
      href: "/dashboard",
    },
    {
      label: "Find suppliers",
      detail: "Meet producers and makers",
      icon: "supplier",
      href: "/suppliers",
    },
    {
      label: "Retail packs",
      detail: "A taste of home",
      icon: "box",
      term: "retail",
    },
    {
      label: "Logistics",
      detail: "Plan your next shipment",
      icon: "truck",
      href: "/providers",
    },
    {
      label: "Buyer guide",
      detail: "Understand the process",
      icon: "guide",
      href: "/guide",
    },
    {
      label: "Saved products",
      detail: "Build your shortlist",
      icon: "heart",
      saved: true,
    },
    {
      label: "Start selling",
      detail: "Take your products global",
      icon: "supplier",
      href: "/login?mode=signup&role=supplier",
    },
  ];
  return (
    <>
      <header className={`home-masthead ${styles.masthead}`}>
        <div className={styles.utility}>
          <div>
            <Link href="/guide">Buyer guide ↗</Link>
            <Link href="/providers">Shipping & inspection</Link>
            <Link href="/dashboard">My orders</Link>
          </div>
          <span>
            <span className="flag" /> Made in Nigeria <b> / </b> Buyers
            worldwide
          </span>
        </div>
        <div className={styles.mainbar}>
          <Link href="/" className={styles.logo} aria-label="1960.com home">
            1960<span>.com</span>
            <small>THE NIGERIAN MARKETPLACE</small>
          </Link>
          <nav
            className={styles.mobileTabs}
            aria-label="Marketplace navigation"
          >
            <a href="#shop" aria-current="page">
              <Icon name="box" />
              Products
            </a>
            <Link href="/suppliers">
              <Icon name="supplier" />
              Suppliers
            </Link>
            <Link href="/dashboard">
              <Icon name="quote" />
              Request quote
            </Link>
          </nav>
          <form
            role="search"
            className={styles.search}
            onSubmit={(e) => {
              e.preventDefault();
              p.onSearch();
            }}
          >
            <select
              aria-label="Search in"
              value={p.scope}
              onChange={(e) => p.onScope(e.target.value)}
            >
              <option value="products">Products</option>
              <option value="suppliers">Suppliers</option>
              <option value="providers">Logistics</option>
            </select>
            <span className={styles.searchIcon}>
              <Icon name="search" />
            </span>
            <input
              type="search"
              aria-label="Search products, suppliers or states"
              placeholder={
                p.scope === "products"
                  ? "Search products, suppliers..."
                  : `Search ${p.scope === "providers" ? "logistics companies" : "suppliers"}...`
              }
              value={p.query}
              onChange={(e) => p.onQuery(e.target.value)}
            />
            <button type="submit" aria-label="Search">
              <Icon name="search" />
              <span>Search</span>
            </button>
          </form>
          <Link
            className={styles.account}
            href={profile ? "/account" : "/login"}
          >
            <Icon name="user" />
            <span>
              <small>{profile ? "Your workspace" : "Welcome to 1960"}</small>
              {profile ? "My account" : "Sign in / Register"}
            </span>
          </Link>
          <Link href="/dashboard" className={styles.quoteButton}>
            <Icon name="quote" />
            Request a quote
          </Link>
        </div>
        <nav className={styles.subnav} aria-label="Trade navigation">
          <a href="#categories">
            <Icon name="grid" /> All categories
          </a>
          <Link href="/suppliers">Suppliers</Link>
          <Link href="/providers">Logistics & shipping</Link>
          <Link href="/guide">How it works</Link>
          <Link href="/about">About 1960</Link>
          <span />
          <Link href="/login?mode=signup&role=buyer">Start buying ↗</Link>
          <Link href="/login?mode=signup&role=supplier">Start selling ↗</Link>
        </nav>
        <nav
          className={styles.mobileCategories}
          aria-label="Quick product categories"
        >
          <button aria-pressed={!p.category} onClick={() => p.onCategory("")}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.name}
              aria-pressed={p.category === c.name}
              onClick={() => p.onCategory(c.name)}
            >
              {c.name
                .replace("Agricultural Commodities", "Agro & Food")
                .replace("Fashion and Textiles", "Fashion & Textiles")
                .replace("Beauty and Natural Products", "Beauty & Care")}
            </button>
          ))}
        </nav>
      </header>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.desktopText}>
                NIGERIA'S MARKETPLACE / GLOBAL POSSIBILITIES
              </span>
              <span className={styles.mobileText}>
                YOUR GATEWAY TO NIGERIAN PRODUCTS
              </span>
            </p>
            <h1 id="hero-title">
              <span className={styles.desktopText}>
                Source Nigeria.
                <br />
                <em>
                  Bring home
                  <br />
                  the possibilities.
                </em>
              </span>
              <span className={styles.mobileText}>
                Discover Nigeria.
                <br />
                <em>Source something great.</em>
              </span>
            </h1>
            <p className={styles.intro}>
              Connect with Nigerian producers. Discover products, compare
              quotations, and plan your next shipment.
            </p>
            <Link href="/suppliers" className={styles.mobileSupplier}>
              <span>
                <Icon name="supplier" />
              </span>
              <div>
                <strong>Meet Nigerian suppliers</strong>
                <small>From local producers to export businesses</small>
              </div>
              <b>↗</b>
            </Link>
            <div className={styles.heroButtons}>
              <a href="#shop" className={styles.primary}>
                Start sourcing <span>→</span>
              </a>
              <Link
                href="/suppliers"
                className={`${styles.secondary} ${styles.desktopText}`}
              >
                Browse suppliers
              </Link>
              <Link
                href="/dashboard"
                className={`${styles.secondary} ${styles.mobileText}`}
              >
                Request a quote
              </Link>
            </div>
            <div className={styles.topics}>
              <small>EXPLORE</small>
              {["Cocoa", "Shea", "Garri", "Cashew", "Adire"].map((term) => (
                <button key={term} onClick={() => p.onTerm(term)}>
                  {term}
                </button>
              ))}
            </div>
            <Link href="/guide" className={styles.how}>
              <span>▷</span> HOW BUYING ON 1960 WORKS
            </Link>
            <div className={styles.mobileFacts}>
              <span>
                <strong>9</strong>Categories
              </span>
              <span>
                <strong>Retail & bulk</strong>Order your way
              </span>
              <span>
                <strong>Nigeria</strong>Local origins
              </span>
            </div>
          </div>
          <aside
            className={styles.tradeCards}
            aria-label="Start your sourcing journey"
          >
            <p className={styles.cardLabel}>
              <i /> YOUR NEXT TRADE STARTS HERE
            </p>
            <Link href="/suppliers" className={styles.tradeCard}>
              <div>
                <small>FIND YOUR SUPPLIER</small>
                <Icon name="supplier" />
              </div>
              <h2>Meet the makers.</h2>
              <p>Explore company profiles and Nigerian product catalogues.</p>
              <span>
                Browse suppliers <b>↗</b>
              </span>
            </Link>
            <Link href="/dashboard" className={styles.tradeCard}>
              <div>
                <small>SOURCE ON YOUR TERMS</small>
                <Icon name="quote" />
              </div>
              <h2>One request. More possibilities.</h2>
              <div className={styles.steps}>
                <span>Product</span>
                <span>Quantity</span>
                <span>Destination</span>
              </div>
              <span>
                Request quotations <b>↗</b>
              </span>
            </Link>
            <Link href="/providers" className={styles.tradeCard}>
              <div>
                <small>PLAN THE JOURNEY</small>
                <Icon name="truck" />
              </div>
              <h2>From Nigeria to your market.</h2>
              <span>
                Find logistics partners <b>↗</b>
              </span>
            </Link>
          </aside>
        </div>
        <div className={styles.serviceStrip}>
          <span>
            <Icon name="supplier" />
            <div>
              <strong>NIGERIAN SUPPLIERS</strong>
              <small>Discover local producers</small>
            </div>
          </span>
          <span>
            <Icon name="quote" />
            <div>
              <strong>DIRECT QUOTATIONS</strong>
              <small>Compare supplier offers</small>
            </div>
          </span>
          <span>
            <Icon name="truck" />
            <div>
              <strong>LOGISTICS PARTNERS</strong>
              <small>Coordinate your shipment</small>
            </div>
          </span>
          <span>
            <Icon name="box" />
            <div>
              <strong>RETAIL & BULK</strong>
              <small>Source for home or business</small>
            </div>
          </span>
        </div>
      </section>
      <nav className={styles.quickActions} aria-label="Sourcing shortcuts">
        {actions.map((a) => {
          const children = (
            <>
              <span className={styles.actionIcon}>
                <Icon name={a.icon} />
              </span>
              <span>
                <strong>{a.label}</strong>
                <small>{a.detail}</small>
              </span>
            </>
          );
          return a.href ? (
            <Link key={a.label} href={a.href}>
              {children}
            </Link>
          ) : (
            <button
              key={a.label}
              onClick={() => (a.saved ? p.onSaved() : p.onTerm("retail"))}
            >
              {children}
            </button>
          );
        })}
      </nav>
      <nav className={styles.bottomNav} aria-label="Mobile navigation">
        <a href="#main-content">
          <Icon name="home" />
          Home
        </a>
        <a href="#categories">
          <Icon name="grid" />
          Categories
        </a>
        <Link href="/inbox">
          <Icon name="message" />
          Messages
        </Link>
        <button onClick={p.onSaved}>
          <Icon name="heart" />
          Saved{p.savedCount > 0 ? ` (${p.savedCount})` : ""}
        </button>
        <Link href={profile ? "/account" : "/login"}>
          <Icon name="user" />
          Account
        </Link>
      </nav>
    </>
  );
}
