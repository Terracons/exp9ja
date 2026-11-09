"use client";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/lib/useProfile";
import { useUnread } from "@/lib/useUnread";

export default function Nav() {
  const { profile } = useProfile();
  const { total } = useUnread(profile?.id);
  return (
    <header className="nav">
      <Link href="/" className="brand">NaijaBulk</Link>
      <nav>
        <Link href="/#shop">Shop Nigerian Products</Link>
        <Link href="/#bulk">Source in Bulk</Link>
        <Link href="/#categories">Categories</Link>
        <Link href="/suppliers">Suppliers</Link>
        <Link href="/providers">Logistics</Link>
        {profile && <Link href="/freight">Freight</Link>}
        {profile && <Link href="/inbox">Messages{total > 0 && <span className="badge" aria-label={`${total} unread`}>{total}</span>}</Link>}
        {profile && <Link href="/dashboard">Dashboard</Link>}
        {profile?.is_admin && <Link href="/admin">Admin</Link>}
        {profile ? <button className="link" onClick={() => supabase.auth.signOut()}>Sign out</button> : <Link href="/login">Sign in</Link>}
      </nav>
    </header>
  );
}
