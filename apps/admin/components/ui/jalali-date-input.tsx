"use client";

import { daysInJalaliMonth, JALALI_MONTHS, type JalaliDate } from "@/lib/jalali";
import { faDigits, faNumber } from "@/lib/format";
import { Select } from "./field";

interface JalaliDateInputProps {
  value: JalaliDate;
  onChange: (value: JalaliDate) => void;
  /** First year offered in the list. */
  minYear: number;
  years?: number;
  disabled?: boolean;
  id?: string;
}

/** Day / month / year selects in the Persian calendar. */
export function JalaliDateInput({ value, onChange, minYear, years = 6, disabled, id }: JalaliDateInputProps) {
  const firstYear = Math.min(minYear, value.year);
  const yearOptions = Array.from({ length: years + (minYear - firstYear) }, (_, i) => firstYear + i);
  const days = daysInJalaliMonth(value.year, value.month);

  const update = (patch: Partial<JalaliDate>) => {
    const next = { ...value, ...patch };
    next.day = Math.min(next.day, daysInJalaliMonth(next.year, next.month));
    onChange(next);
  };

  return (
    <div className="grid grid-cols-[1fr_1.4fr_1.2fr] gap-2" role="group" aria-label="تاریخ">
      <Select id={id} aria-label="روز" value={value.day} disabled={disabled} onChange={(e) => update({ day: Number(e.target.value) })}>
        {Array.from({ length: days }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {faNumber(i + 1)}
          </option>
        ))}
      </Select>
      <Select aria-label="ماه" value={value.month} disabled={disabled} onChange={(e) => update({ month: Number(e.target.value) })}>
        {JALALI_MONTHS.map((name, i) => (
          <option key={name} value={i + 1}>
            {name}
          </option>
        ))}
      </Select>
      <Select aria-label="سال" value={value.year} disabled={disabled} onChange={(e) => update({ year: Number(e.target.value) })}>
        {yearOptions.map((year) => (
          <option key={year} value={year}>
            {faDigits(year)}
          </option>
        ))}
      </Select>
    </div>
  );
}
