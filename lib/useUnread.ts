"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useUnread(meId?: string) {
  const [map, setMap] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!meId) { setMap({}); return; }
    const load = async () => {
      const [m, r] = await Promise.all([
        supabase.from("messages").select("quote_id,created_at").neq("sender_id", meId),
        supabase.from("message_reads").select("quote_id,last_read_at").eq("user_id", meId),
      ]);
      const seen: Record<string, number> = {};
      (r.data || []).forEach((x: any) => (seen[x.quote_id] = new Date(x.last_read_at).getTime()));
      const out: Record<string, number> = {};
      (m.data || []).forEach((x: any) => {
        if (!seen[x.quote_id] || new Date(x.created_at).getTime() > seen[x.quote_id]) out[x.quote_id] = (out[x.quote_id] || 0) + 1;
      });
      setMap(out);
    };
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [meId]);
  return { map, total: Object.values(map).reduce((a, b) => a + b, 0) };
}
