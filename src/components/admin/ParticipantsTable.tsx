"use client";
import { useState } from "react";
import { adminFetch } from "./api";
import { Table, btnGhost } from "./ui";

type Row = { id: number; name: string; email: string; phone: string; reference: string; city: string; day: string };

export function ParticipantsTable({ rows, canReveal }: { rows: Row[]; canReveal: boolean }) {
  const [revealed, setRevealed] = useState<Record<number, string>>({});
  const [err, setErr] = useState<string | null>(null);
  async function reveal(id: number) {
    const reason = prompt("Why do you need this emergency contact? (logged)");
    if (!reason || reason.trim().length < 5) return;
    const { ok, data } = await adminFetch(`/api/admin/participants/${id}/reveal`, "POST", { reason });
    if (ok) setRevealed((r) => ({ ...r, [id]: data.emergencyPhone ?? "Not provided" })); else setErr(data.error ?? "Could not reveal.");
  }
  if (rows.length === 0) return <p className="text-text-muted">No participants yet.</p>;
  return (
    <>
      {err && <p role="alert" className="mb-2 font-semibold text-[#8C1D18]">{err}</p>}
      <Table>
        <thead><tr className="border-b border-ink/10"><th className="py-2">Name</th><th>Email</th><th>Phone</th><th>Booking</th><th>City / day</th><th>Emergency contact</th></tr></thead>
        <tbody>{rows.map((p) => (
          <tr key={p.id} className="border-b border-ink/5">
            <td className="py-2">{p.name}</td><td>{p.email}</td><td>{p.phone}</td><td>{p.reference}</td><td>{p.city} {p.day}</td>
            <td>{revealed[p.id] ?? (canReveal ? <button className={btnGhost + " !py-1"} onClick={() => reveal(p.id)}>Reveal</button> : "Hidden")}</td>
          </tr>))}</tbody>
      </Table>
    </>
  );
}
