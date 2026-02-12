const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => persianDigits[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  let result = input;
  for (let i = 0; i < 10; i++) {
    result = result
      .replace(new RegExp(persianDigits[i], 'g'), String(i))
      .replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return result;
}

export function normalizeQuery(input: string): string {
  if (typeof input !== 'string') return '';
  return toEnglishDigits(input.trim().toLowerCase());
}

/** Tokenize a normalized query into non-empty words */
export function tokenizeQuery(normalizedQuery: string): string[] {
  return normalizedQuery.split(/\s+/).filter(Boolean);
}

/** Check if all query tokens appear in the target string */
export function matchesAllTokens(tokens: string[], target: string): boolean {
  return tokens.every((t) => target.includes(t));
}

export const WEEK_DAYS: Record<number, string> = {
  6: 'شنبه',
  0: 'یکشنبه',
  1: 'دوشنبه',
  2: 'سه‌شنبه',
  3: 'چهارشنبه',
  4: 'پنجشنبه',
  5: 'جمعه',
};

export const WEEK_DAYS_ORDER = [6, 0, 1, 2, 3];

export function dayName(dayOfWeek: number): string {
  return WEEK_DAYS[dayOfWeek] ?? '';
}
