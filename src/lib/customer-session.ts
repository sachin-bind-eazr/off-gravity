import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
const COOKIE = "og_customer";
const key = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-only-secret");
/** Short-lived (2h) signed cookie scoped to one email. */
export async function createCustomerSession(email: string) {
  const token = await new SignJWT({ email: email.toLowerCase() }).setProtectedHeader({ alg: "HS256" }).setExpirationTime("2h").sign(key());
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 7200 });
}
export async function getCustomerEmail(): Promise<string | null> {
  const t = (await cookies()).get(COOKIE)?.value; if (!t) return null;
  try { const { payload } = await jwtVerify(t, key()); return typeof payload.email === "string" ? payload.email : null; } catch { return null; }
}
export async function clearCustomerSession(){ (await cookies()).delete(COOKIE); }
