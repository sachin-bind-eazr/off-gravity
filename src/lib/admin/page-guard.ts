import "server-only";
import { redirect } from "next/navigation";
import { getAdmin } from "./auth";
import { can, type Permission } from "./roles";

/** Server-component guard; the API handlers separately enforce the same permissions. */
export async function requirePage(perm: Permission) {
  const a = await getAdmin();
  if (!a) redirect("/admin/login");
  if (!can(a.role, perm)) redirect("/admin?denied=1");
  return a;
}
