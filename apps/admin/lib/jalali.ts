/**
 * Minimal Jalali (Persian calendar) helpers built on Intl, used by the date
 * picker. Gregorian → Jalali comes straight from Intl; Jalali → Gregorian is
 * found by estimating the date and correcting it day by day.
 */

export interface JalaliDate {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
}

const partsFmt = new Intl.DateTimeFormat("en-u-ca-persian-nu-latn", {
  timeZone: "Asia/Tehran",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

export const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

/** The Jalali calendar date of an instant, in Tehran. */
export function toJalali(date: Date): JalaliDate {
  const parts = partsFmt.formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

const compare = (a: JalaliDate, b: JalaliDate) => a.year - b.year || a.month - b.month || a.day - b.day;

/** Noon (Tehran) of the given Jalali day. */
export function fromJalali(target: JalaliDate): Date {
  // Day-of-year estimate: the first 6 months have 31 days, the next 5 have 30.
  const dayOfYear = target.month <= 6 ? (target.month - 1) * 31 + target.day : 186 + (target.month - 7) * 30 + target.day;
  // 1 Farvardin is 20 or 21 March.
  let guess = new Date(Date.UTC(target.year + 621, 2, 20, 8, 30) + (dayOfYear - 1) * 86_400_000);
  for (let i = 0; i < 5; i++) {
    const diff = compare(target, toJalali(guess));
    if (diff === 0) break;
    guess = new Date(guess.getTime() + Math.sign(diff) * 86_400_000);
  }
  return guess;
}

/** Number of days in a Jalali month (Esfand has 30 days in leap years). */
export function daysInJalaliMonth(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const lastDay = toJalali(new Date(fromJalali({ year: year + 1, month: 1, day: 1 }).getTime() - 86_400_000));
  return lastDay.day;
}

/** End of the given Jalali day in Tehran (23:59:59 +03:30) as an ISO string. */
export function endOfJalaliDayIso(date: JalaliDate): string {
  const noon = fromJalali(date);
  const tehranDay = new Date(noon.getTime() + 3.5 * 3_600_000).toISOString().slice(0, 10);
  return new Date(`${tehranDay}T23:59:59+03:30`).toISOString();
}
