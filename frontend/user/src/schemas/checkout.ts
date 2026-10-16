import { z } from "zod";
import { normalizeIranMobile } from "@/lib/format";

/** Buyer details. Frontend checks are for a friendlier form only; the backend validates them again. */
export const buyerSchema = z.object({
  first_name: z.string().trim().min(1, "نام را وارد کنید.").max(50, "نام حداکثر ۵۰ کاراکتر است."),
  last_name: z.string().trim().min(1, "نام خانوادگی را وارد کنید.").max(50, "نام خانوادگی حداکثر ۵۰ کاراکتر است."),
  mobile: z
    .string()
    .trim()
    .min(1, "شماره موبایل را وارد کنید.")
    .refine((v) => normalizeIranMobile(v) !== null, "شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹"),
  email: z.union([z.literal(""), z.string().trim().email("ایمیل واردشده معتبر نیست.").max(100, "ایمیل حداکثر ۱۰۰ کاراکتر است.")]),
  note: z.string().max(500, "یادداشت حداکثر ۵۰۰ کاراکتر است."),
  terms: z.boolean().refine((v) => v, "برای ادامه، پذیرش قوانین و مقررات لازم است."),
});

export type BuyerForm = z.infer<typeof buyerSchema>;
