"use client";
import { Badge } from "./ui";
import { ORDER_STATUS_LABELS, type OrderStatusCode } from "@/lib/admin/labels";
import { formatPhone } from "@/lib/format";

export function StatusBadge({ status }: { status: OrderStatusCode }) {
  const tone = status === "NEW" ? "solid" : status === "CANCELLED" || status === "COMPLETED" ? "muted" : "outline";
  return <Badge tone={tone}>{ORDER_STATUS_LABELS[status]}</Badge>;
}

const stop = (e: React.MouseEvent) => e.stopPropagation();

export function PhoneLink({ phone, className }: { phone: string; className?: string }) {
  const pretty = formatPhone(phone);
  return (
    <a href={`tel:${pretty.replace(/\s/g, "")}`} onClick={stop} className={className ?? "whitespace-nowrap underline-offset-4 hover:underline"}>
      {pretty}
    </a>
  );
}

export function SourceLabel({ source, username }: { source: "WEB" | "TELEGRAM"; username: string | null }) {
  if (source === "WEB") return <span>Сайт</span>;
  return (
    <span className="whitespace-nowrap">
      Telegram
      {username && (
        <>
          {" "}
          <a
            href={`https://t.me/${username}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={stop}
            className="text-navy underline underline-offset-4"
          >
            @{username}
          </a>
        </>
      )}
    </span>
  );
}
