"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Landmark, Loader2 } from "lucide-react";
import { ApiError, authApi, type AuthUser } from "@/lib/api";

type Mode = "login" | "signup";

export default function AuthGate({ children }: { children: (user: AuthUser) => ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    async function restore() {
      try {
        const result = await authApi.me();
        await authApi.bootstrap();
        if (active) setUser(result.user);
      } catch (err) {
        if (active && !(err instanceof ApiError && err.status === 401)) {
          setError(err instanceof Error ? err.message : "Unable to load your account.");
        }
      } finally { if (active) setReady(true); }
    }
    void restore();
    function expire() { setUser(null); setPassword(""); setNotice("Please sign in again."); }
    function checkSession() {
      void authApi.me().then(({user: current}) => {
        setUser(previous => previous && previous.id !== current.id ? null : previous);
      }).catch((err) => { if (err instanceof ApiError && err.status === 401) expire(); });
    }
    function changed(event: StorageEvent) { if (event.key === "spendsense-auth-change") expire(); }
    window.addEventListener("spendsense-session-expired", expire);
    window.addEventListener("focus", checkSession);
    window.addEventListener("storage", changed);
    return () => {
      active = false;
      window.removeEventListener("spendsense-session-expired", expire);
      window.removeEventListener("focus", checkSession);
      window.removeEventListener("storage", changed);
    };
  }, []);

  function announceChange() {
    try { localStorage.setItem("spendsense-auth-change", crypto.randomUUID()); } catch { /* optional cross-tab signal */ }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(""); setNotice("");
    if ((mode === "signup") && password !== confirmation) {
      setError("Passwords do not match."); return;
    }
    setBusy(true);
    try {
        const result = await (mode === "signup" ? authApi.signup(email, password) : authApi.login(email, password));
        announceChange();
        setMode("login"); // If initialization fails, retry login instead of creating the account again.
        await authApi.bootstrap();
        setUser(result.user);
      setPassword(""); setConfirmation("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally { setBusy(false); }
  }

  async function logout() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      await authApi.logout();
      if (user) { try { localStorage.removeItem(`spendsense-chat-history:${user.id}`); } catch { /* session still ends */ } }
      setUser(null); setPassword(""); setConfirmation(""); setMode("login");
      setNotice("You have signed out."); announceChange();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign out. Please try again."); }
    finally { setBusy(false); }
  }

  function switchMode(next: Mode) {
    setMode(next); setPassword(""); setConfirmation(""); setError(""); setNotice("");
  }

  if (!ready) return <main className="min-h-screen bg-background p-8 text-gray-600" role="status">Loading your account...</main>;
  if (user) return (
    <>
      <div className="border-b border-gray-200 bg-surface px-6 py-3">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 text-sm">
          <span className="break-all text-gray-600">Signed in as {user.email}</span>
          <button disabled={busy} onClick={() => void logout()} className="rounded-lg border border-gray-300 px-3 py-2 text-gray-700 disabled:opacity-50">{busy ? "Signing out..." : "Sign out"}</button>
        </div>
        {error && <p role="alert" className="mx-auto mt-2 max-w-6xl text-sm text-red-700">{error}</p>}
      </div>
      {children(user)}
    </>
  );
  const title = mode === "signup" ? "Create your account" : "Welcome back";
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-6">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-surface p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3"><Landmark className="text-indigo-600" /><span className="font-brand text-4xl font-semibold text-gray-900">SpendSense</span></div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-2 text-sm text-gray-600">Your own goals and conversations, with sample spending to explore.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <fieldset disabled={busy} className="space-y-4">
            <div><label htmlFor="auth-email" className="mb-1 block text-sm text-gray-700">Email</label><input id="auth-email" type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></div>
            <div><label htmlFor="auth-password" className="mb-1 block text-sm text-gray-700">Password</label><input id="auth-password" type="password" required minLength={mode === "login" ? 1 : 15} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" />{mode !== "login" && <p className="mt-1 text-xs text-gray-500">Use at least 15 characters. A memorable passphrase works well.</p>}</div>
            {(mode === "signup") && <div><label htmlFor="auth-confirm" className="mb-1 block text-sm text-gray-700">Confirm password</label><input id="auth-confirm" type="password" required maxLength={128} autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900" /></div>}
          </fieldset>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {notice && <p role="status" className="text-sm text-indigo-700">{notice}</p>}
          <button disabled={busy} type="submit" className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-medium text-white disabled:opacity-50">{busy && <Loader2 size={16} className="animate-spin" />}{busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}</button>
        </form>
        <div className="mt-5 flex flex-wrap justify-between gap-3 text-sm text-indigo-700">
          {mode === "login" ? <button disabled={busy} onClick={() => switchMode("signup")}>Create an account</button> : <button disabled={busy} onClick={() => switchMode("login")}>Back to sign in</button>}
        </div>
      </section>
    </main>
  );
}
