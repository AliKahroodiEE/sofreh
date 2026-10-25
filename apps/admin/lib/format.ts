/**
 * Persian (fa-IR) formatting helpers: digits, money, dates and phone numbers.
 * All dates are shown in the Persian (Jalali) calendar, Tehran time.
 */

export const TEHRAN_TZ = "Asia/Tehran";

const numberFmt = new Intl.NumberFormat("fa-IR");
const compactFmt = new Intl.NumberFormat("fa-IR", { notation: "compact", maximumFractionDigits: 1 });
const percentFmt = new Intl.NumberFormat("fa-IR", { style: "percent", maximumFractionDigits: 0 });

/** 1234567 → «۱٬۲۳۴٬۵۶۷» */
export function faNumber(value: number): string {
  return numberFmt.format(value);
}

/** Money is integer toman: 123000 → «۱۲۳٬۰۰۰ تومان» */
export function toman(value: number): string {
  return `${numberFmt.format(value)} تومان`;
}

/** Short money for chart axes: 20862500 → «۲۰٫۹ میلیون» */
export function compactNumber(value: number): string {
  return compactFmt.format(value);
}

/** 0.125 → «۱۳٪» */
export function faPercent(ratio: number): string {
  return percentFmt.format(ratio);
}

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/** Replace Latin digits in a string with Persian ones (for codes, phones, …). */
export function faDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

/** Replace Persian (۰-۹) and Arabic (٠-٩) digits with Latin ones, e.g. for user input. */
export function toLatinDigits(value: string): string {
  return value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

/** Parse a user-typed integer (Persian digits and separators allowed). Empty → null. */
export function parseInteger(value: string): number | null {
  const digits = toLatinDigits(value).replace(/[^\d]/g, "");
  return digits ? Number(digits) : null;
}

/** 09121234567 → «۰۹۱۲ ۱۲۳ ۴۵۶۷» */
export function formatPhone(phone: string): string {
  const p = phone.replace(/\D/g, "");
  const grouped = p.length === 11 ? `${p.slice(0, 4)} ${p.slice(4, 7)} ${p.slice(7)}` : p;
  return faDigits(grouped);
}

// ------------------------------------------------------------------ dates

function persian(options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { timeZone: TEHRAN_TZ, ...options });
}

const dateFmt = persian({ day: "numeric", month: "long", year: "numeric" });
const dayMonthFmt = persian({ day: "numeric", month: "long" });
const timeFmt = persian({ hour: "2-digit", minute: "2-digit" });
const weekdayFmt = persian({ weekday: "long" });
const relativeFmt = new Intl.RelativeTimeFormat("fa", { numeric: "auto" });

type DateInput = string | number | Date;
const toDate = (d: DateInput) => (d instanceof Date ? d : new Date(d));

/** «۳ آبان ۱۴۰۵» */
export function formatDate(d: DateInput): string {
  return dateFmt.format(toDate(d));
}

/** «۳ آبان» */
export function formatDayMonth(d: DateInput): string {
  return dayMonthFmt.format(toDate(d));
}

/** «۱۰:۳۹» */
export function formatTime(d: DateInput): string {
  return timeFmt.format(toDate(d));
}

/** «۳ آبان، ۱۰:۳۹» */
export function formatDateTime(d: DateInput): string {
  return `${dayMonthFmt.format(toDate(d))}، ${timeFmt.format(toDate(d))}`;
}

/** «یکشنبه» */
export function formatWeekday(d: DateInput): string {
  return weekdayFmt.format(toDate(d));
}

/** «یکشنبه ۳ آبان ۱۴۰۵» */
export function formatFullDate(d: DateInput): string {
  return `${formatWeekday(d)} ${formatDate(d)}`;
}

/**
 * The stats API returns calendar days in Tehran as `YYYY-MM-DD`.
 * Noon Tehran time is safely inside that day whatever the viewer's time zone.
 */
export function tehranDay(date: string): Date {
  return new Date(`${date}T12:00:00+03:30`);
}

/** «۵ دقیقه پیش», «دیروز», … relative to `now` (ms). */
export function relativeTime(d: DateInput, now: number): string {
  const diff = (toDate(d).getTime() - now) / 1000;
  const abs = Math.abs(diff);
  if (abs < 45) return "همین الان";
  if (abs < 3600) return relativeFmt.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return relativeFmt.format(Math.round(diff / 3600), "hour");
  if (abs < 86400 * 7) return relativeFmt.format(Math.round(diff / 86400), "day");
  return formatDate(d);
}
