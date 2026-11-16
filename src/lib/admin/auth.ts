import "server-only";
import argon2 from "argon2";
import { generateSecret, verifySync, generateURI } from "otplib";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { db } from "../db";
import { can, type Role, type Permission } from "./roles";

const COOKIE = "og_admin";
const CSRF = "og_csrf";
const key = () => new TextEncoder().encode((process.env.SESSION_SECRET ?? "dev-only-secret") + ":admin");
export type AdminSession = { id: number; email: string; role: Role };

export const hashPassword = (p: string) => argon2.hash(p);
export const verifyPassword = (h: string, p: string) => argon2.verify(h, p).catch(() => false);
export const newTotpSecret = () => generateSecret();
export const verifyTotp = (secret: string, token: string) => {
  try { return verifySync({ secret, token, epochTolerance: 30 }).valid; } catch { return false; }
};
export const totpUri = (email: string, secret: string) => generateURI({ issuer: "OFF GRAVITY Admin", label: email, secret });

export async function startAdminSession(u: AdminSession) {
  const token = await new SignJWT({ id: u.id, email: u.email, role: u.role })
    .setProtectedHeader({ alg: "HS256" }).setExpirationTime("8h").sign(key());
  const c = await cookies();
  const secure = process.env.NODE_ENV === "production";
  c.set(COOKIE, token, { httpOnly: true, secure, sameSite: "strict", path: "/", maxAge: 8 * 3600 });
  c.set(CSRF, randomBytes(24).toString("hex"), { httpOnly: false, secure, sameSite: "strict", path: "/", maxAge: 8 * 3600 });
}
export async function endAdminSession() {
  const c = await cookies();
  c.delete(COOKIE);
  c.delete(CSRF);
}
export async function getAdmin(): Promise<AdminSession | null> {
  const t = (await cookies()).get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, key());
    const u = await db.adminUser.findUnique({ where: { id: Number(payload.id) } });
    return u ? { id: u.id, email: u.email, role: u.role } : null; // role re-read from DB every request
  } catch { return null; }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

/** Guard for EVERY admin route handler: authentication + role permission + CSRF on writes. */
export async function requireRole(req: Request, perm: Permission): Promise<AdminSession> {
  const a = await getAdmin();
  if (!a) throw new HttpError(401, "Sign in required.");
  if (!can(a.role, perm)) throw new HttpError(403, "You don't have permission to do that.");
  if (!["GET", "HEAD"].includes(req.method)) {
    const header = req.headers.get("x-csrf-token");
    const cookie = (await cookies()).get(CSRF)?.value;
    if (!header || !cookie || header !== cookie) throw new HttpError(403, "Invalid CSRF token.");
  }
  return a;
}

type Ctx = { params: Promise<Record<string, string>> };
/** Turns HttpError / Zod errors into JSON responses. */
export function handle(fn: (req: Request, ctx: Ctx) => Promise<Response>) {
  return async (req: Request, ctx: Ctx) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e && typeof e === "object" && "issues" in e) {
        return Response.json({ error: "Check the highlighted fields.", issues: (e as { issues: unknown }).issues }, { status: 400 });
      }
      console.error("admin api error", (e as Error)?.message);
      return Response.json({ error: "Something went wrong." }, { status: 500 });
    }
  };
}

export async function audit(actorId: number | null, action: string, entity: string, entityId: string | number, before: unknown, after: unknown) {
  await db.auditLog.create({
    data: { actorId, action, entity, entityId: String(entityId), before: (before ?? undefined) as never, after: (after ?? undefined) as never },
  });
}
