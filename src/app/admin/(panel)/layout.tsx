import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { AdminSidebar, AdminTabBar } from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const newOrders = await db.order.count({ where: { status: "NEW" } }).catch(() => 0);

  return (
    <>
      <a
        href="#admin-main"
        className="sr-only z-[100] rounded bg-ink px-4 py-3 text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        К содержимому
      </a>
      <AdminSidebar newOrders={newOrders} />
      <main id="admin-main" className="min-h-dvh pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] lg:pb-12 lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-10 lg:pt-10">{children}</div>
      </main>
      <AdminTabBar newOrders={newOrders} />
    </>
  );
}
