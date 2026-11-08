"use client";
import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export function useProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) setProfile(null);
      else setProfile((await supabase.from("profiles").select("*").eq("id", user.id).single()).data);
      setReady(true);
    };
    const { data: sub } = supabase.auth.onAuthStateChange(() => { setTimeout(load, 0); });
    return () => sub.subscription.unsubscribe();
  }, []);
  return { profile, ready };
}
