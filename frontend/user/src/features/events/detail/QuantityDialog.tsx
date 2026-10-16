"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { faNumber, faPrice } from "@/lib/format";
import type { EventSession } from "@/types/event";

const MAX = 10;

/** Ticket count for sessions without a seat map (general admission). The backend prices and validates it. */
export function QuantityDialog({ session, open, onClose, onConfirm }: { session: EventSession; open: boolean; onClose: () => void; onConfirm: (quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  const max = Math.min(MAX, session.available_seats);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="تعداد بلیت"
      description="این سانس بدون صندلی شماره‌دار است؛ تعداد بلیت موردنیاز را انتخاب کنید."
      footer={
        <Button block size="lg" onClick={() => onConfirm(quantity)}>
          ادامه خرید
        </Button>
      }
    >
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-line p-4">
        <div>
          <p className="text-[14px] font-bold text-ink">بلیت ورود</p>
          <p className="mt-1 text-[13px] text-muted">{faPrice(session.price)} برای هر نفر</p>
        </div>
        <div className="flex items-center gap-3" role="group" aria-label="تعداد بلیت">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
            disabled={quantity >= max}
            aria-label="افزایش تعداد"
            className="flex size-11 items-center justify-center rounded-xl border border-line-strong text-ink disabled:opacity-40"
          >
            <Plus className="size-5" />
          </button>
          <output className="w-8 text-center text-[20px] font-black text-ink" aria-live="polite">
            {faNumber(quantity)}
          </output>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            disabled={quantity <= 1}
            aria-label="کاهش تعداد"
            className="flex size-11 items-center justify-center rounded-xl border border-line-strong text-ink disabled:opacity-40"
          >
            <Minus className="size-5" />
          </button>
        </div>
      </div>
      <p className="mt-3 text-center text-[12.5px] text-muted">مبلغ نهایی در مرحله بعد توسط سامانه محاسبه می‌شود.</p>
    </Dialog>
  );
}
