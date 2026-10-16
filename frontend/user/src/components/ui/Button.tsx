import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "outline" | "soft" | "ghost" | "danger" | "success";
type Size = "sm" | "md" | "lg" | "xl";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-brand-600 text-white shadow-cta hover:bg-brand-700 disabled:shadow-none",
  outline: "border border-line-strong bg-surface text-ink hover:border-brand-500/50 hover:text-brand-600",
  soft: "bg-brand-50 text-brand-600 hover:bg-brand-100",
  ghost: "text-ink-2 hover:bg-field hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-fg",
  success: "bg-success text-white hover:brightness-95",
};

// Every size keeps the 44px minimum touch target on phones.
const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-4 text-[13.5px] sm:min-h-10",
  md: "min-h-11 px-5 text-[14.5px]",
  lg: "min-h-12 px-6 text-[15.5px]",
  xl: "min-h-14 px-7 text-[16.5px]",
};

export function buttonClass({ variant = "primary", size = "md", block, className }: { variant?: Variant; size?: Size; block?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition select-none",
    "disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:pointer-events-none aria-disabled:opacity-55",
    VARIANTS[variant],
    SIZES[size],
    block && "w-full",
    className,
  );
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, block, loading, className, children, disabled, type = "button", ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} className={buttonClass({ variant, size, block, className })} {...props}>
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  );
});

export function ButtonLink({
  href,
  variant,
  size,
  block,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size; block?: boolean }) {
  return (
    <Link href={href} className={buttonClass({ variant, size, block, className })} {...props}>
      {children}
    </Link>
  );
}

export function IconButton({ label, className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-2 transition hover:border-brand-500/40 hover:text-brand-600 disabled:opacity-50 sm:size-10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
