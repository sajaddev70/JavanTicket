import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

export const inputClass = (invalid?: boolean) =>
  cn(
    "w-full min-h-[49px] rounded-[13px] border bg-field px-[15px] text-[14px] text-ink outline-none transition placeholder:text-muted/80",
    "focus:ring-4 disabled:bg-field disabled:text-muted",
    invalid ? "border-danger/60 focus:ring-danger/10" : "border-line-strong focus:border-brand-500/60 focus:ring-brand-500/10",
  );

/** Label + control + error message, wired with ids for screen readers. */
export function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: (props: { id: string; "aria-invalid"?: boolean; "aria-describedby"?: string }) => React.ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-[7px] block text-[11px] text-muted">
        {label}
        {required && <span className="mr-1 text-danger-fg" aria-hidden>*</span>}
      </label>
      {children({ id, "aria-invalid": error ? true : undefined, "aria-describedby": describedBy })}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-[12.5px] font-medium text-danger-fg">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1.5 text-[12.5px] text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(function Input(
  { invalid, className, ...props },
  ref,
) {
  return <input ref={ref} className={cn(inputClass(invalid ?? !!props["aria-invalid"]), className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(function Textarea(
  { invalid, className, ...props },
  ref,
) {
  return <textarea ref={ref} className={cn(inputClass(invalid ?? !!props["aria-invalid"]), "min-h-24 py-3 leading-7", className)} {...props} />;
});

/** Native select (best on phones, RTL by default) styled like the designs, with an optional leading icon and label. */
export function Select({
  icon,
  label,
  className,
  selectClassName,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { icon?: React.ReactNode; label?: string; selectClassName?: string }) {
  const id = useId();
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-[7px] block text-[11px] text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-2">{icon}</span>}
        <select
          id={id}
          className={cn(
            "min-h-[49px] w-full appearance-none rounded-[13px] border border-line-strong bg-field pl-10 text-[14px] font-semibold text-ink outline-none transition focus:border-brand-500/60 focus:ring-4 focus:ring-brand-500/10 [&>option]:bg-surface-solid",
            icon ? "pr-10" : "pr-4",
            selectClassName,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
      </div>
    </div>
  );
}

export function Checkbox({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: React.ReactNode }) {
  return (
    <label className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2.5 text-[13.5px] text-ink-2", className)}>
      <input type="checkbox" className="size-5 shrink-0 cursor-pointer rounded-md accent-[#ac30fa]" {...props} />
      <span>{label}</span>
    </label>
  );
}
