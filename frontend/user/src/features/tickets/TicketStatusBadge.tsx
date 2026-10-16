import { CircleCheck, CircleX, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TicketStatus } from "@/types/order";

export function ticketState(status: TicketStatus, sessionCancelled?: boolean) {
  if (status === "CANCELLED" || sessionCancelled) return { label: "لغو شده", tone: "bg-danger-bg text-danger-fg", icon: CircleX };
  if (status === "USED") return { label: "استفاده شده", tone: "bg-field text-ink-2", icon: ScanLine };
  return { label: "معتبر", tone: "bg-success text-white", icon: CircleCheck };
}

export function TicketStatusBadge({ status, sessionCancelled, className }: { status: TicketStatus; sessionCancelled?: boolean; className?: string }) {
  const s = ticketState(status, sessionCancelled);
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[14px] font-black", s.tone, className)}>
      <Icon className="size-5" />
      {s.label}
    </span>
  );
}
