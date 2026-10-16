import { z } from "zod";
import { normalizeIranMobile } from "@/lib/format";

/** Client-side checks are for convenience only; the backend validates the number and the code again. */
export const mobileSchema = z.object({
  mobile: z
    .string()
    .trim()
    .min(1, "شماره موبایل خود را وارد کنید.")
    .refine((v) => normalizeIranMobile(v) !== null, "شماره موبایل معتبر نیست. نمونه: ۰۹۱۲۳۴۵۶۷۸۹"),
});

export type MobileForm = z.infer<typeof mobileSchema>;
