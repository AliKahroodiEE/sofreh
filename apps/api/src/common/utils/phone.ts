const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Convert Persian/Arabic digits to Latin digits. */
export function toLatinDigits(text: string): string {
  return text
    .replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)));
}

/**
 * Normalise an Iranian mobile number to the 09xxxxxxxxx form.
 * Accepts «۰۹۱۲…», «+98912…», «0098912…», «912…» and spaces/dashes.
 * Returns null when the input is not a valid mobile number.
 */
export function normalizeIranMobile(input: string): string | null {
  let phone = toLatinDigits(String(input)).replace(/[\s\-()]/g, '');
  if (phone.startsWith('+98')) phone = `0${phone.slice(3)}`;
  else if (phone.startsWith('0098')) phone = `0${phone.slice(4)}`;
  else if (/^9\d{9}$/.test(phone)) phone = `0${phone}`;
  return /^09\d{9}$/.test(phone) ? phone : null;
}
