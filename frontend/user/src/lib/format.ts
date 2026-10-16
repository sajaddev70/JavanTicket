/** Persian formatting: digits, Jalali dates (Intl's persian calendar, Tehran time), prices in Toman. */

const TZ = "Asia/Tehran";
const numberFormat = new Intl.NumberFormat("fa-IR");
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("fa-IR", { timeZone: TZ, ...options });

const dateFormat = fmt({ day: "numeric", month: "long", year: "numeric" });
const dayMonthFormat = fmt({ day: "numeric", month: "long" });
const weekdayFormat = fmt({ weekday: "long" });
const timeFormat = fmt({ hour: "2-digit", minute: "2-digit", hour12: false });
const ymFormat = new Intl.DateTimeFormat("en-US-u-ca-persian", { timeZone: TZ, year: "numeric", month: "numeric" });
const ymdFormat = new Intl.DateTimeFormat("en-US-u-ca-persian", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric" });

export function faNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) return "—";
  return numberFormat.format(Number(value));
}

/** "۲۱۰٬۰۰۰ تومان" */
export function faPrice(value: number | string | null | undefined): string {
  return `${faNumber(value)} تومان`;
}

/** "۲۸ اردیبهشت ۱۴۰۴" */
export const faDate = (iso: string) => dateFormat.format(new Date(iso));
/** "۲۸ اردیبهشت" */
export const faDayMonth = (iso: string) => dayMonthFormat.format(new Date(iso));
/** "جمعه" */
export const faWeekday = (iso: string) => weekdayFormat.format(new Date(iso));
/** "۲۰:۰۰" */
export const faTime = (iso: string) => timeFormat.format(new Date(iso));
/** "جمعه ۲۸ اردیبهشت ۱۴۰۴" */
export const faFullDate = (iso: string) => `${faWeekday(iso)} ${faDate(iso)}`;
/** "جمعه ۲۸ اردیبهشت ۱۴۰۴ - ۲۰:۰۰" */
export const faDateTime = (iso: string) => `${faFullDate(iso)} - ${faTime(iso)}`;

export function sameDay(a: string, b: string): boolean {
  return ymdFormat.format(new Date(a)) === ymdFormat.format(new Date(b));
}

/** Same-month ranges collapse to "۲۴ تا ۲۷ اردیبهشت ۱۴۰۴". */
export function faDateRange(startIso: string, endIso?: string | null): string {
  if (!endIso || sameDay(startIso, endIso)) return faDate(startIso);
  if (ymFormat.format(new Date(startIso)) === ymFormat.format(new Date(endIso))) {
    return `${fmt({ day: "numeric" }).format(new Date(startIso))} تا ${faDate(endIso)}`;
  }
  return `${faDate(startIso)} تا ${faDate(endIso)}`;
}

/** "۱۹:۰۰ تا ۲۱:۰۰" */
export function faTimeRange(startIso: string, endIso?: string | null): string {
  return endIso ? `${faTime(startIso)} تا ${faTime(endIso)}` : faTime(startIso);
}

export function faYear(date: Date): string {
  return fmt({ year: "numeric" }).format(date);
}

export function toFaDigits(input: string): string {
  return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input.replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** "09121234567" -> "۰۹۱۲ *** ۴۵۶۷" */
export function maskMobile(mobile: string): string {
  if (mobile.length < 8) return toFaDigits(mobile);
  return toFaDigits(`${mobile.slice(0, 4)} *** ${mobile.slice(-4)}`);
}

/** "09121234567" -> "۰۹۱۲ ۱۲۳ ۴۵۶۷" */
export function formatMobile(mobile: string): string {
  return toFaDigits(mobile.length === 11 ? `${mobile.slice(0, 4)} ${mobile.slice(4, 7)} ${mobile.slice(7)}` : mobile);
}

/** Accepts Persian/Arabic digits, +98 / 0098 / 98 prefixes and spaces; returns 09XXXXXXXXX or null. */
export function normalizeIranMobile(input: string): string | null {
  let digits = toEnDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : null;
}

/** "WYAXXWRLFTABA375" -> "WYAX-XWRL-FTAB-A375" (QR payload as printed under the code). */
export function groupCode(code: string, size = 4): string {
  return code.match(new RegExp(`.{1,${size}}`, "g"))?.join("-") ?? code;
}
