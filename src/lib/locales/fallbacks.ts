export const LOCALE_CODES = [
  'en', 'es', 'zh-CN', 'hi', 'ar', 'pt', 'fr', 'bn', 'ru', 'ur',
  'id', 'de', 'ja', 'pcm', 'mr', 'te', 'tr', 'ta', 'vi', 'ko',
] as const;

export type LocaleCode = (typeof LOCALE_CODES)[number];

export function withLocaleFallbacks(
  english: Record<string, string>,
  localized: Partial<Record<LocaleCode, Record<string, string>>> = {},
): Record<string, Record<string, string>> {
  return Object.fromEntries(LOCALE_CODES.map((locale) => [locale, { ...english, ...localized[locale] }]));
}
