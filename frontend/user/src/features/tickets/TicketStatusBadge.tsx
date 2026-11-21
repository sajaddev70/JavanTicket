import { CircleCheck, CircleX, ScanLine } from "lucide-react";
import { cn } from "@/lib/cn";
import type { TicketStatus } from "@/types/order";

export function ticketState(status: TicketStatus, sessionCancelled?: boolean) {
  if (status === "CANCELLED" || sessionCancelled) return { label: "لغو شده", tone: "bg-danger-bg text-danger-fg", icon: CircleX };
  if (status === "USED") return { label: "استفاده شده", tone: "bg-field text-ink-2", icon: ScanLine };
  return { label: "معتبر", tone: "bg-success-bg text-success-fg", icon: CircleCheck };
}

export function TicketStatusBadge({ status, sessionCancelled, className }: { status: TicketStatus; sessionCancelled?: boolean; className?: string }) {
  const s = ticketState(status, sessionCancelled);
  const Icon = s.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-[11px] py-[5px] text-[10px]", s.tone, className)}>
      <Icon className="size-3.5" />
      {s.label}
    </span>
  );
}
