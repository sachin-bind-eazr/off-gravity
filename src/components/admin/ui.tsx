"use client";
import type { ReactNode } from "react";

export const inputCls = "w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-[16px] outline-none focus:border-ink";
export const btnPrimary = "cursor-pointer rounded-full bg-orange px-6 py-3 font-extrabold text-ink disabled:opacity-60";
export const btnGhost = "cursor-pointer rounded-full border border-ink/25 px-5 py-2.5 font-bold";

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-[15px] font-bold">
      {label}
      {children}
      {hint && <span className="text-sm font-normal text-text-muted">{hint}</span>}
    </label>
  );
}
export function Text({ label, value, onChange, hint, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; hint?: string; placeholder?: string; type?: string }) {
  return <Field label={label} hint={hint}><input type={type} className={inputCls} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} /></Field>;
}
export function Area({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <Field label={label}><textarea className={inputCls} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} /></Field>;
}
export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return <label className="flex items-center gap-2 font-semibold"><input type="checkbox" className="h-5 w-5" checked={checked} onChange={(e) => onChange(e.target.checked)} />{label}</label>;
}
export function Panel({ title, children, className = "" }: { title?: string; children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white p-5 sm:p-6 ${className}`}>{title && <h2 className="mb-4 text-xl font-extrabold">{title}</h2>}{children}</section>;
}
export function Notice({ kind, children }: { kind: "ok" | "err"; children: ReactNode }) {
  return <p role={kind === "err" ? "alert" : "status"} className={`rounded-xl px-4 py-2.5 font-semibold ${kind === "err" ? "bg-[#FDE8E6] text-[#8C1D18]" : "bg-mint/30"}`}>{children}</p>;
}
export const Table = ({ children }: { children: ReactNode }) => <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-[15px]">{children}</table></div>;
export const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN")}`;
