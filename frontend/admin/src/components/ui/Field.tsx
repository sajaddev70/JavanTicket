import { cn } from "@/lib/cn";

const control =
  "w-full rounded-xl border border-line bg-field px-3.5 text-[15px] text-ink outline-none transition placeholder:text-muted/70 focus:border-brand-500/50 focus:bg-surface focus:ring-4 focus:ring-brand-500/10";

interface FieldProps {
  label: string;
  hint?: string;
  className?: string;
}

export function TextField({
  label,
  hint,
  className,
  ...input
}: FieldProps & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">{label}</span>
      <input {...input} className={cn(control, "h-12")} />
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function TextAreaField({
  label,
  hint,
  className,
  ...input
}: FieldProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-[13px] font-semibold text-ink/80">{label}</span>
      <textarea {...input} className={cn(control, "min-h-24 py-3 leading-7")} />
      {hint && <span className="mt-1 block text-[12px] text-muted">{hint}</span>}
    </label>
  );
}

export function InlineAlert({ tone, children }: { tone: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-4 py-3 text-[14px] font-medium",
        tone === "error" ? "border-danger/25 bg-danger/8 text-danger-fg" : "border-success/25 bg-success/8 text-success-fg",
      )}
    >
      {children}
    </div>
  );
}

export const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-bold text-white shadow-cta transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60";
export const secondaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-line-strong bg-surface px-5 text-sm font-bold text-ink transition hover:border-brand-500/40";
