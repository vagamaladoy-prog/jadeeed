import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin/login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // already signed in → straight to orders (a broken SESSION_SECRET just shows the form)
  const admin = await getAdmin().catch(() => null);
  if (admin) redirect("/admin/orders");

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded border border-line bg-white p-6 sm:p-8">
        <p className="text-body-sm text-muted">Jadeeed</p>
        <h1 className="mb-6 text-heading font-medium tracking-tight">Вход в админку</h1>
        <LoginForm />
      </div>
    </main>
  );
}
