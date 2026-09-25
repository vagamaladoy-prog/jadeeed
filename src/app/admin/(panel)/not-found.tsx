import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-heading font-medium">Не найдено</h1>
      <p className="mt-2 text-body-sm text-muted">Запись удалена или ссылка неверна.</p>
      <Link href="/admin/orders" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-6" })}>
        К заказам
      </Link>
    </div>
  );
}
