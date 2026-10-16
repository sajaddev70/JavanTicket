"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "@/stores/useToastStore";
import { cn } from "@/lib/cn";

export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`کپی ${label}`}
      title={`کپی ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(`${label} کپی شد.`);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          toast.error("کپی انجام نشد.");
        }
      }}
      className={cn("inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:bg-field hover:text-brand-600", className)}
    >
      {copied ? <Check className="size-[18px] text-success" /> : <Copy className="size-[18px]" />}
    </button>
  );
}
