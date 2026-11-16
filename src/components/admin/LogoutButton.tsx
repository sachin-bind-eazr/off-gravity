"use client";
import { adminFetch } from "./api";
export function LogoutButton() {
  return (
    <button className="cursor-pointer whitespace-nowrap rounded-xl px-4 py-2.5 text-left font-bold hover:bg-white/10" onClick={async () => { await adminFetch("/api/admin/logout", "POST"); location.href = "/admin/login"; }}>
      Sign out
    </button>
  );
}
