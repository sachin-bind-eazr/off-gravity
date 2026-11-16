"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Text, Notice, btnPrimary } from "./ui";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [step, setStep] = useState<"creds" | "totp" | "setup">("creds");
  const [setup, setSetup] = useState<{ secret: string; uri: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr(null);
    const { ok, data } = await adminFetch("/api/admin/login", "POST", { email, password, totp: totp || undefined });
    setBusy(false);
    if (ok && data.ok) { location.href = "/admin"; return; }
    if (data.needsTotpSetup) { setStep("setup"); setSetup({ secret: data.secret, uri: data.uri }); }
    else if (data.needsTotp) setStep("totp");
    if (data.error) setErr(data.error);
  }
  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-white p-6">
      {err && <Notice kind="err">{err}</Notice>}
      <Text label="Email" type="email" value={email} onChange={setEmail} />
      <Text label="Password" type="password" value={password} onChange={setPassword} />
      {step === "setup" && setup && (
        <div className="grid gap-2 rounded-xl bg-cream p-4 text-[15px]">
          <p className="font-bold">Set up two-factor sign-in</p>
          <p>Add this key to an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code below.</p>
          <p className="break-all rounded bg-white p-2 font-mono">{setup.secret}</p>
          <p className="break-all text-sm text-text-muted">{setup.uri}</p>
        </div>
      )}
      {step !== "creds" && <Text label="6-digit authenticator code" value={totp} onChange={(v) => setTotp(v.replace(/\D/g, "").slice(0, 6))} />}
      <button className={btnPrimary} disabled={busy}>{busy ? "Checking…" : step === "creds" ? "Continue" : "Sign in"}</button>
    </form>
  );
}
