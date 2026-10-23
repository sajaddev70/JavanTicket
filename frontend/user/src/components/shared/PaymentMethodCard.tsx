import { Icon, type IconName } from "@/components/ui/Icon";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PaymentMethod } from "@/types/order";

/** Icon and tint of a payment method by the kind its backend code names (wallet, installment / BNPL, else online gateway). */
function methodKind(code: string): { icon: IconName; tone: string } {
  if (/wallet|kif/i.test(code)) return { icon: "payment/wallet", tone: "bg-purple-bg text-purple" };
  if (/install|bnpl|snapp|qest|aghsat|credit/i.test(code)) return { icon: "payment/installment", tone: "bg-success-bg text-success-fg" };
  return { icon: "payment/online-payment", tone: "bg-brand-50 text-brand-600" };
}

/** One payment method from GET /user/payment-methods as a radio card (reference 08). */
export function PaymentMethodCard({ method, checked, onSelect, name = "gateway" }: { method: PaymentMethod; checked: boolean; onSelect: () => void; name?: string }) {
  const logo = mediaUrl(method.logo_url);
  const kind = methodKind(method.code);
  return (
    <label
      className={cn(
        "flex min-h-[92px] cursor-pointer items-center gap-3.5 rounded-2xl border bg-surface p-4 transition focus-within:ring-4 focus-within:ring-brand-500/15",
        checked ? "border-brand-600 shadow-card" : "border-line hover:border-brand-500/40",
      )}
    >
      <input type="radio" name={name} value={method.code} checked={checked} onChange={onSelect} className="size-6 shrink-0 accent-brand-600" />
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-black text-ink">{method.title}</span>
        {method.description && <span className="mt-1 block text-[13px] leading-6 text-muted">{method.description}</span>}
      </span>
      <span className={cn("flex size-16 shrink-0 items-center justify-center rounded-2xl", kind.tone)}>
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element -- gateway logos come from the backend (often SVG)
          <img src={logo} alt="" className="h-10 w-10 object-contain" />
        ) : (
          <Icon name={kind.icon} className="size-8" />
        )}
      </span>
    </label>
  );
}
