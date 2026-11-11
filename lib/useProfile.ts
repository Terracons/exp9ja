"use client";
import { useEffect, useState } from "react";
import { supabase, isConfigured } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let sequence = 0;
    if (!isConfigured) {
      setReady(true);
      return;
    }
    const load = async () => {
      const current = ++sequence;
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!active || current !== sequence) return;
        if (!user) {
          setProfile(null);
          setError("");
        } else {
          const result = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
          if (active && current === sequence) {
            setProfile(result.data);
            setError(
              result.error
                ? "Your account profile could not be loaded. Please retry or contact the marketplace operator."
                : "",
            );
          }
        }
      } catch {
        if (active && current === sequence)
          setError("Unable to connect to your account. Please retry.");
      } finally {
        if (active && current === sequence) setReady(true);
      }
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      setTimeout(load, 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { profile, ready, error };
}
