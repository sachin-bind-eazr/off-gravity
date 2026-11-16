"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Panel, Notice, Text, btnGhost, btnPrimary, money } from "./ui";

export function BookingActions({ id, status, refundable, canMoney, canEmail }: { id: number; status: string; refundable: number; canMoney: boolean; canEmail: boolean }) {
  const [reason, setReason] = useState("");
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<{ k: "ok" | "err"; t: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(action: string, body?: unknown, confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return;
    setBusy(true); setMsg(null);
    const { ok, data } = await adminFetch(`/api/admin/bookings/${id}/${action}`, "POST", body ?? {});
    setBusy(false);
    setMsg(ok ? { k: "ok", t: "Done." } : { k: "err", t: data.error ?? "Failed." });
    if (ok) setTimeout(() => location.reload(), 600);
  }
  if (!canMoney && !canEmail) return null;
  return (
    <Panel title="Actions">
      <div className="grid max-w-xl gap-4">
        {canEmail && status === "CONFIRMED" && <div><button className={btnGhost} disabled={busy} onClick={() => run("resend")}>Resend confirmation email</button></div>}
        {canMoney && status !== "CANCELLED" && status !== "REFUNDED" && (<>
          <Text label="Reason (required)" value={reason} onChange={setReason} />
          <Text label={`Partial refund amount in ₹ (blank = full; up to ${money(refundable)})`} value={amount} onChange={setAmount} />
          <div className="flex flex-wrap gap-3">
            <button className={btnPrimary} disabled={busy || reason.trim().length < 3 || !amount} onClick={() => run("refund", { reason, amountPaise: Math.round(Number(amount) * 100) }, `Refund ₹${amount} through Razorpay?`)}>Partial refund</button>
            <button className={btnGhost} disabled={busy || reason.trim().length < 3} onClick={() => run("cancel", { reason }, "Cancel this booking and refund any captured payment in full?")}>Cancel booking{refundable ? " and refund in full" : ""}</button>
          </div>
        </>)}
        {msg && <Notice kind={msg.k}>{msg.t}</Notice>}
      </div>
    </Panel>
  );
}
