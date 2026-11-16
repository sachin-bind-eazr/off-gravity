"use client";
export function csrf(): string {
  const m = document.cookie.match(/(?:^|; )og_csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}
export async function adminFetch(url: string, method: string, body?: unknown): Promise<{ ok: boolean; data: any }> {
  const r = await fetch(url, {
    method,
    headers: { "content-type": "application/json", "x-csrf-token": csrf() },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}
