import { isLocale, type Locale } from './translations';

export function localeFromDocument(language = typeof document === 'undefined' ? '' : document.documentElement.lang || (typeof navigator === 'undefined' ? '' : navigator.language)): Locale {
  const normalized = language.trim().replace('_', '-');
  if (isLocale(normalized)) return normalized;
  const short = normalized.split('-')[0];
  if (short === 'zh') return 'zh-CN';
  if (isLocale(short)) return short;
  return 'en';
}
