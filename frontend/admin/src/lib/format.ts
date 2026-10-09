const numberFormat = new Intl.NumberFormat("fa-IR");
const percentFormat = new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 1 });
const relativeFormat = new Intl.RelativeTimeFormat("fa", { numeric: "always" });

export function faNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormat.format(value);
}

export function faPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${percentFormat.format(value)}٪`;
}

export function toFaDigits(input: string): string {
  return input.replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[Number(d)]);
}

export function toEnDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

/** Axis label in millions (the unit is stated in the chart subtitle), e.g. 500000000 -> "۵۰۰". */
export function faMillions(value: number): string {
  return percentFormat.format(value / 1_000_000);
}

/** "2026-10-07" (ISO date) -> Date at local midnight. */
export function parseIsoDate(date: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function faDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long" }).format(date);
}

export function faFullDate(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(date);
}

export function faWeekday(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { weekday: "long" }).format(date);
}

export function faTime(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

export function faYear(date: Date): string {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric" }).format(date);
}

export function faTimeAgo(iso: string, now: Date = new Date()): string {
  const seconds = Math.round((new Date(iso).getTime() - now.getTime()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) return "لحظاتی پیش";
  if (abs < 3600) return relativeFormat.format(Math.round(seconds / 60), "minute");
  if (abs < 86400) return relativeFormat.format(Math.round(seconds / 3600), "hour");
  if (abs < 86400 * 30) return relativeFormat.format(Math.round(seconds / 86400), "day");
  return relativeFormat.format(Math.round(seconds / (86400 * 30)), "month");
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
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(iso));
}

/** ISO instant -> "۱۵ اردیبهشت ۱۴۰۴" */
export function faDate(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));
}

/** ISO instant -> "۱۴۰۴/۰۲/۲۰" */
export function faDateNumeric(iso: string): string {
  return new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(iso));
}

/** Date range in one line: same day -> "۱۵ اردیبهشت ۱۴۰۴", otherwise "۱۲ تا ۱۵ خرداد ۱۴۰۴" / full both ends. */
export function faDateSpan(startIso?: string | null, endIso?: string | null): string {
  if (!startIso) return "—";
  if (!endIso) return faDate(startIso);
  const s = new Date(startIso);
  const e = new Date(endIso);
  const ym = new Intl.DateTimeFormat("en-US-u-ca-persian", { year: "numeric", month: "numeric" });
  const day = new Intl.DateTimeFormat("en-US-u-ca-persian", { day: "numeric" });
  if (ym.format(s) === ym.format(e)) {
    if (day.format(s) === day.format(e)) return faDate(startIso);
    return `${new Intl.DateTimeFormat("fa-IR", { day: "numeric" }).format(s)} تا ${faDate(endIso)}`;
  }
  return `${faDate(startIso)} تا ${faDate(endIso)}`;
}

/** "۱۰:۰۰ - ۱۶:۰۰" */
export function faTimeRange(startIso?: string | null, endIso?: string | null): string {
  if (!startIso) return "";
  return endIso ? `${faTime(startIso)} - ${faTime(endIso)}` : faTime(startIso);
}
