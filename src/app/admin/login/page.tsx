import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin/auth";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function Page() {
  if (await getAdmin()) redirect("/admin");
  return (
    <main className="mx-auto grid min-h-screen max-w-md content-center gap-6 p-6">
      <h1 className="t-section" style={{ fontSize: 44 }}>Admin sign in</h1>
      <LoginForm />
    </main>
  );
}
