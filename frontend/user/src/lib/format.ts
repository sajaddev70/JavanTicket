const numberFormat = new Intl.NumberFormat("fa-IR");

export function faNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormat.format(value);
}

export function faDate(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** Same-month ranges collapse to "۲۴ تا ۲۷ اردیبهشت ۱۴۰۴". */
export function faDateRange(startIso: string, endIso?: string | null): string {
  if (!endIso) return faDate(startIso);
  const start = new Date(startIso);
  const end = new Date(endIso);
  const ym = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric" });
  if (ym.format(start) === ym.format(end)) {
    if (start.toDateString() === end.toDateString()) return faDate(startIso);
    const day = new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(start);
    return `${day} تا ${faDate(endIso)}`;
  }
  return `${faDate(startIso)} تا ${faDate(endIso)}`;
}

export function faYear(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(date);
}

export function toFaDigits(input: string): string {
  return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** "09121234567" -> "۰۹۱۲ *** ۴۵۶۷" */
export function maskMobile(mobile: string): string {
  if (mobile.length < 8) return toFaDigits(mobile);
  return toFaDigits(`${mobile.slice(0, 4)} *** ${mobile.slice(-4)}`);
}

/** Accepts Persian/Arabic digits, +98 / 0098 / 98 prefixes and spaces; returns 09XXXXXXXXX or null. */
export function normalizeIranMobile(input: string): string | null {
  let digits = toEnDigits(input).replace(/\D/g, "");
  if (digits.startsWith("0098")) digits = digits.slice(4);
  else if (digits.startsWith("98") && digits.length === 12) digits = digits.slice(2);
  if (digits.length === 10 && digits.startsWith("9")) digits = `0${digits}`;
  return /^09\d{9}$/.test(digits) ? digits : null;
}

export function faDateTime(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function faTime(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function faDayMonth(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" }).format(new Date(iso));
}

export function faWeekday(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(new Date(iso));
}

/** "۱۹:۰۰ - ۲۱:۰۰" (render inside dir="ltr") */
export function faTimeRange(startIso: string, endIso?: string | null): string {
  return endIso ? `${faTime(startIso)} - ${faTime(endIso)}` : faTime(startIso);
}

export function faPrice(value: number | null | undefined): string {
  return `${faNumber(value === null || value === undefined ? null : Number(value))} تومان`;
}
