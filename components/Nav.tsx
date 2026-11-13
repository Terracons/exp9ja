"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { useUnread } from "@/lib/useUnread";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Nav() {
  const { profile } = useProfile();
  const { total } = useUnread(profile?.id);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <header className="nav">
      <Link href="/" className="brand" aria-label="1960.com home">
        1960<span>.com</span>
        <small>THE NIGERIAN MARKETPLACE</small>
      </Link>
      <button
        className="menu-toggle"
        aria-expanded={open}
        aria-controls="main-navigation"
        onClick={() => setOpen(!open)}
      >
        {open ? "Close ✕" : "Menu ☰"}
      </button>
      <nav
        id="main-navigation"
        className={open ? "open" : ""}
        aria-label="Main navigation"
        onClick={() => setOpen(false)}
      >
        <Link href="/#shop">Marketplace</Link>
        <Link href="/dashboard">Request a quote</Link>
        <Link
          href="/suppliers"
          aria-current={pathname === "/suppliers" ? "page" : undefined}
        >
          Suppliers
        </Link>
        <Link
          href="/providers"
          aria-current={pathname === "/providers" ? "page" : undefined}
        >
          Logistics
        </Link>
        <Link
          href="/guide"
          aria-current={pathname === "/guide" ? "page" : undefined}
        >
          How it works
        </Link>
        {profile && <Link href="/freight">Freight</Link>}
        {profile && (
          <Link href="/inbox">
            Messages
            {total > 0 && (
              <span className="badge" aria-label={`${total} unread`}>
                {total}
              </span>
            )}
          </Link>
        )}
        {profile && <Link href="/dashboard">Dashboard</Link>}
        {profile && <Link href="/account">Profile</Link>}
        {profile?.is_admin && <Link href="/admin">Admin</Link>}
        {profile ? (
          <button className="link" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        ) : (
          <>
            <Link href="/login">Sign in</Link>
            <Link className="nav-cta" href="/login?mode=signup">
              Join the marketplace ↗
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
