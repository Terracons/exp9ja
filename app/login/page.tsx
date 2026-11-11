"use client";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  supabase,
  isConfigured,
  getAuthProviders,
  PROVIDER_TYPES,
} from "@/lib/supabase";
import { safeNext } from "@/lib/navigation";

const roles = [
  {
    id: "buyer",
    title: "Buyer",
    detail: "Shop for home or source for business",
  },
  {
    id: "supplier",
    title: "Supplier",
    detail: "Showcase products made in Nigeria",
  },
  {
    id: "provider",
    title: "Logistics partner",
    detail: "Connect buyers with trade services",
  },
];
export default function Login() {
  return (
    <Suspense fallback={<p role="status">Loading sign in...</p>}>
      <LoginForm />
    </Suspense>
  );
}
function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const mode =
    params.get("mode") === "signup"
      ? "signup"
      : params.get("mode") === "reset"
        ? "reset"
        : "signin";
  const [role, setRole] = useState("buyer");
  const [next, setNext] = useState("/dashboard");
  const [msg, setMsg] = useState("");
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState("");
  useEffect(() => {
    const p = params;
    if (roles.some((r) => r.id === p.get("role"))) setRole(p.get("role")!);
    setNext(safeNext(p.get("next")));
  }, [params]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    if (!isConfigured) {
      setFailed(true);
      setMsg(
        "Account services are not configured yet. You can still explore the marketplace.",
      );
      return;
    }
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email")).trim(),
      password = String(f.get("password") || "");
    setBusy(true);
    setFailed(false);
    setMsg("");
    setNeedsConfirmation(false);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        setMsg(
          "If an account exists for this email, you will receive a password reset link.",
        );
        return;
      }
      if (mode === "signup") {
        if (password !== f.get("confirm"))
          throw new Error("Your passwords do not match.");
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
            data: {
              role,
              company: String(f.get("company")).trim(),
              country: String(f.get("country")).trim(),
              provider_type: role === "provider" ? f.get("ptype") : null,
              about: String(f.get("about") || "").trim(),
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmationEmail(email);
          setNeedsConfirmation(true);
          setMsg(
            "Check your email to confirm your account. After confirmation, you can continue to your dashboard.",
          );
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      }
      router.push(`/auth/confirm?next=${encodeURIComponent(next)}`);
      router.refresh();
    } catch (err) {
      if (err instanceof Error && /email not confirmed/i.test(err.message)) {
        setConfirmationEmail(email);
        setNeedsConfirmation(true);
      }
      setFailed(true);
      setMsg(
        err instanceof Error
          ? err.message
          : "Unable to connect. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function google() {
    if (busy) return;
    if (!isConfigured) {
      setFailed(true);
      setMsg(
        "Sign-in is temporarily unavailable. The marketplace operator needs to connect account services.",
      );
      return;
    }
    setBusy(true);
    setFailed(false);
    setMsg("");
    try {
      const providers = await getAuthProviders();
      if (!providers.google) throw new Error("Google provider is not enabled.");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}&role=${encodeURIComponent(role)}`,
          queryParams: { prompt: "select_account" },
        },
      });
      if (error) throw error;
    } catch (err) {
      setFailed(true);
      setMsg(
        err instanceof Error &&
          /provider|not enabled|unsupported/i.test(err.message)
          ? "Google sign-in is not enabled for this marketplace yet. Use email sign-in or contact the marketplace operator."
          : err instanceof Error
            ? err.message
            : "Unable to connect to Google. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function resend() {
    if (!confirmationEmail || busy) return;
    setBusy(true);
    setFailed(false);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: confirmationEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setMsg("Confirmation email requested. Check your inbox and spam folder.");
    } catch (err) {
      setFailed(true);
      setMsg(
        err instanceof Error
          ? err.message
          : "Unable to resend the confirmation email.",
      );
    } finally {
      setBusy(false);
    }
  }
  function changeMode(value: string) {
    const query = new URLSearchParams(params.toString());
    if (value === "signin") query.delete("mode");
    else query.set("mode", value);
    router.replace(`/login${query.size ? `?${query}` : ""}`, { scroll: false });
    setMsg("");
    setFailed(false);
    setNeedsConfirmation(false);
  }
  return (
    <div className="auth-layout">
      <aside className="auth-intro">
        <p className="eyebrow">WELCOME TO 1960.COM</p>
        <h1>
          A little closer
          <br />
          to <em>home.</em>
        </h1>
        <p>
          Find the Nigerian products you love. Meet the people who make them.
          Build connections that cross borders.
        </p>
        <ol className="steps">
          <li>Discover products from Nigerian producers.</li>
          <li>Compare quotations and agree your order.</li>
          <li>Coordinate logistics and follow shipment updates.</li>
        </ol>
        <p>
          Buying for your family or sourcing for your business? You belong here.
        </p>
        <Link className="btn alt light" href="/#shop">
          Explore first ↗
        </Link>
      </aside>
      <section className="auth-form">
        <p className="eyebrow">YOUR NEXT CONNECTION STARTS HERE</p>
        <h2>
          {mode === "signup"
            ? "Join the marketplace."
            : mode === "reset"
              ? "Reset your password."
              : "Good to see you."}
        </h2>
        <p className="muted">
          {mode === "signup"
            ? "Choose how you want to take part."
            : mode === "reset"
              ? "Enter the email address linked to your account."
              : "Sign in to manage your products, orders and messages."}
        </p>
        {!isConfigured && (
          <p className="sample-notice">
            Sign-in is temporarily unavailable. The marketplace operator needs
            to connect account services. You can still browse products.
          </p>
        )}
        {mode !== "reset" && (
          <>
            <button
              type="button"
              className="google-auth"
              onClick={google}
              disabled={busy || !isConfigured}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M21.6 12.2c0-.7-.1-1.5-.2-2.2H12v4.2h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.5Z"
                />
                <path
                  fill="#34A853"
                  d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5a6 6 0 0 1-9-3.1H3.1v2.6A10 10 0 0 0 12 22Z"
                />
                <path
                  fill="#FBBC05"
                  d="M6.4 14a6 6 0 0 1 0-4V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 6c1.5 0 2.8.5 3.9 1.5L18.8 4A10 10 0 0 0 3.1 7.4L6.4 10A6 6 0 0 1 12 6Z"
                />
              </svg>
              {busy ? "Please wait..." : "Continue with Google"}
            </button>
            <p className="muted" style={{ fontSize: ".75rem" }}>
              New here? Google creates your account, then you choose your
              account type and complete your profile.
            </p>
            <div className="auth-divider">or continue with email</div>
          </>
        )}
        <form onSubmit={submit} aria-busy={busy}>
          {mode === "signup" && (
            <>
              <div
                className="role-options"
                role="group"
                aria-label="Account type"
              >
                {roles.map((r) => (
                  <button
                    type="button"
                    key={r.id}
                    aria-pressed={role === r.id}
                    onClick={() => setRole(r.id)}
                  >
                    {r.title}
                    <small>{r.detail}</small>
                  </button>
                ))}
              </div>
              <label>
                {role === "buyer"
                  ? "Your name or business name"
                  : "Registered business or trading name"}
                <input
                  name="company"
                  autoComplete="organization"
                  maxLength={120}
                  required
                />
              </label>
              <label>
                {role === "supplier"
                  ? "Business country"
                  : "Country of residence / operation"}
                <input
                  key={role}
                  name="country"
                  autoComplete="country-name"
                  defaultValue={role === "supplier" ? "Nigeria" : ""}
                  placeholder="e.g. Nigeria, United Kingdom, Canada"
                  maxLength={80}
                  required
                />
              </label>
              {role === "provider" && (
                <>
                  <label>
                    Service offered
                    <select name="ptype">
                      {PROVIDER_TYPES.map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    About your services
                    <textarea
                      name="about"
                      maxLength={300}
                      rows={3}
                      placeholder="Coverage, routes and experience"
                      required
                    />
                  </label>
                </>
              )}
            </>
          )}
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
            />
          </label>
          {mode !== "reset" && (
            <label>
              Password
              <div className="password-field">
                <input
                  name="password"
                  type={visible ? "text" : "password"}
                  autoComplete={
                    mode === "signup" ? "new-password" : "current-password"
                  }
                  minLength={mode === "signup" ? 10 : 6}
                  required
                />
                <button
                  type="button"
                  aria-label={visible ? "Hide password" : "Show password"}
                  onClick={() => setVisible(!visible)}
                >
                  {visible ? "Hide" : "Show"}
                </button>
              </div>
              {mode === "signup" && <small>Use at least 10 characters.</small>}
            </label>
          )}
          {mode === "signup" && (
            <>
              <label>
                Confirm password
                <input
                  name="confirm"
                  type={visible ? "text" : "password"}
                  autoComplete="new-password"
                  minLength={10}
                  required
                />
              </label>
              <label className="check">
                <input name="acknowledgement" type="checkbox" required /> I have
                read the buying and shipping guide and understand that shipping
                and import charges are quoted separately.
              </label>
              <Link href="/guide" target="_blank" rel="noopener noreferrer">
                Read the buying & shipping guide ↗
              </Link>
            </>
          )}
          <p>
            <button className="btn" disabled={busy || !isConfigured}>
              {busy
                ? "Please wait..."
                : mode === "signup"
                  ? "Create my account ↗"
                  : mode === "reset"
                    ? "Send reset link"
                    : "Sign in ↗"}
            </button>
          </p>
        </form>
        {msg && (
          <p
            className={`form-status ${failed ? "error" : ""}`}
            role={failed ? "alert" : "status"}
          >
            {msg}
          </p>
        )}
        {needsConfirmation && (
          <button className="link auth-resend" disabled={busy} onClick={resend}>
            Resend confirmation email
          </button>
        )}
        <div className="actions">
          <button
            className="link"
            onClick={() =>
              changeMode(
                mode === "signup" || mode === "reset" ? "signin" : "signup",
              )
            }
          >
            {mode === "signin" ? "Create an account" : "Back to sign in"}
          </button>
          {mode === "signin" && (
            <button className="link" onClick={() => changeMode("reset")}>
              Forgot password?
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
