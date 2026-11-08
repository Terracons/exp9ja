"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, PROVIDER_TYPES } from "@/lib/supabase";

export default function Login() {
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [role, setRole] = useState("buyer");
  const [msg, setMsg] = useState("");

  async function submit(e: any) {
    e.preventDefault();
    const f = new FormData(e.target);
    const email = f.get("email") as string, password = f.get("password") as string;
    setMsg("");
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { role, company: f.get("company"), country: f.get("country"), provider_type: f.get("ptype"), about: f.get("about") } },
      });
      if (error) return setMsg(error.message);
      if (!data.session) return setMsg("Account created. Check your email to confirm, then sign in.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return setMsg(error.message);
    }
    router.push("/dashboard");
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2 style={{ marginTop: 0 }}>{signup ? "Create your account" : "Sign in"}</h2>
      <form onSubmit={submit}>
        {signup && (
          <>
            <label>I am a<select value={role} onChange={(e) => setRole(e.target.value)}><option value="buyer">Buyer</option><option value="supplier">Supplier</option><option value="provider">Service provider</option></select></label>
            {role === "provider" && (<><label>Service<select name="ptype">{PROVIDER_TYPES.map((t) => <option key={t}>{t}</option>)}</select></label><label>About your services<input name="about" maxLength={300} /></label></>)}
            <label>Company name<input name="company" required /></label>
            <label>Country<input name="country" defaultValue="Nigeria" required /></label>
          </>
        )}
        <label>Email<input name="email" type="email" required /></label>
        <label>Password<input name="password" type="password" minLength={6} required /></label>
        <p><button className="btn">{signup ? "Sign up" : "Sign in"}</button></p>
      </form>
      {msg && <p className="msg">{msg}</p>}
      <button className="link" onClick={() => setSignup(!signup)}>{signup ? "I already have an account" : "Create an account"}</button>
    </div>
  );
}
