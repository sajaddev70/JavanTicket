import Link from "next/link";
import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "pink" | "success" | "orange" | "glass" | "outline" | "soft" | "ghost" | "danger";
type Size = "sm" | "md" | "lg" | "xl";

/** Gradient pill buttons of the references: violet (main flow), magenta (event CTA), green (pay), orange (hero). */
const VARIANTS: Record<Variant, string> = {
  primary: "bg-grad-primary text-white glow-primary hover:brightness-110 disabled:shadow-none",
  pink: "bg-grad-pink text-white glow-pink hover:brightness-110 disabled:shadow-none",
  success: "bg-grad-success text-white glow-success hover:brightness-105 disabled:shadow-none",
  orange: "bg-grad-orange text-white glow-orange hover:brightness-105 disabled:shadow-none",
  glass: "glass hover:bg-white/20",
  outline: "border border-line-strong bg-surface text-ink hover:border-purple/50 hover:text-purple",
  soft: "bg-purple-bg text-purple hover:brightness-95 dark:hover:brightness-125",
  ghost: "text-ink-2 hover:bg-field hover:text-ink",
  danger: "bg-danger text-white hover:bg-danger-fg",
};

// Every size keeps the 44px minimum touch target on phones.
const SIZES: Record<Size, string> = {
  sm: "min-h-11 px-4 text-[13.5px] sm:min-h-10",
  md: "min-h-12 px-5 text-[14.5px]",
  lg: "min-h-[52px] px-6 text-[16px]",
  xl: "min-h-14 px-7 text-[17px]",
};

export function buttonClass({ variant = "primary", size = "md", block, className }: { variant?: Variant; size?: Size; block?: boolean; className?: string } = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-black transition select-none",
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
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-2 transition hover:border-purple/40 hover:text-purple disabled:opacity-50 sm:size-10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
