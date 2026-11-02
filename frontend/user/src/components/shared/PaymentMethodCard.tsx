import { Icon, type IconName } from "@/components/ui/Icon";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/cn";
import type { PaymentMethod } from "@/types/order";

/** Icon of a payment method by the kind its backend code names (wallet, installment / BNPL, else online gateway). */
function methodIcon(code: string): IconName {
  if (/wallet|kif/i.test(code)) return "payment/wallet";
  if (/install|bnpl|snapp|qest|aghsat|credit/i.test(code)) return "payment/installment";
  return "payment/online-payment";
}

/** One payment method from GET /user/payment-methods: the design's glass row with the "انتخاب‌شده" badge. */
export function PaymentMethodCard({ method, checked, onSelect, name = "gateway" }: { method: PaymentMethod; checked: boolean; onSelect: () => void; name?: string }) {
  const logo = mediaUrl(method.logo_url);
  return (
    <label className={cn("card flex min-h-[64px] cursor-pointer items-center gap-2.5 p-4 transition focus-within:ring-4 focus-within:ring-brand-500/15", checked && "!border-2 !border-[#7739e9]")}>
      <input type="radio" name={name} value={method.code} checked={checked} onChange={onSelect} className="sr-only" />
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- gateway logos come from the backend (often SVG)
        <img src={logo} alt="" className="size-7 shrink-0 object-contain" />
      ) : (
        <Icon name={methodIcon(method.code)} className="size-[22px] shrink-0 text-ink" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-bold text-ink">{method.title}</span>
        {method.description && <span className="block text-[11px] leading-[1.8] text-muted">{method.description}</span>}
      </span>
      {checked && <span className="shrink-0 rounded-full bg-success-bg px-[11px] py-[5px] text-[10px] text-success-fg">انتخاب‌شده</span>}
    </label>
  );
}
