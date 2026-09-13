import { commonTranslations } from './locales/common';
import { productTranslations } from './locales/products';
import { fileTranslations } from './locales/files';
import { settingsTranslations } from './locales/settings';

export const SUPPORTED_LANGUAGES = [
  ['en', 'English'], ['es', 'Español'], ['zh-CN', '简体中文'], ['hi', 'हिन्दी'], ['ar', 'العربية'],
  ['pt', 'Português'], ['fr', 'Français'], ['bn', 'বাংলা'], ['ru', 'Русский'], ['ur', 'اردو'],
  ['id', 'Bahasa Indonesia'], ['de', 'Deutsch'], ['ja', '日本語'], ['pcm', 'Naijá'], ['mr', 'मराठी'],
  ['te', 'తెలుగు'], ['tr', 'Türkçe'], ['ta', 'தமிழ்'], ['vi', 'Tiếng Việt'], ['ko', '한국어'],
] as const;
export type Locale = typeof SUPPORTED_LANGUAGES[number][0];
export type LanguageOption = { code: Locale; name: string };
export type TranslationKey = string;
export type TranslationVariables = Record<string, string | number>;
export const isLocale = (value: string): value is Locale => SUPPORTED_LANGUAGES.some(([code]) => code === value);
export const localeDirection = (locale: Locale): 'rtl' | 'ltr' => locale === 'ar' || locale === 'ur' ? 'rtl' : 'ltr';
const translatedOnly = (english: Record<string, string>, messages: Record<string, string> | undefined, locale: string) =>
  locale === 'en' || !messages ? messages ?? english : Object.fromEntries(Object.entries(messages).filter(([key, value]) => value !== english[key]));

export const dictionaries = Object.fromEntries(SUPPORTED_LANGUAGES.map(([locale]) => [locale, {
  ...productTranslations.en,
  ...fileTranslations.en,
  ...settingsTranslations.en,
  ...Object.fromEntries(Object.entries(commonTranslations.en).map(([key, english]) => [english, commonTranslations[locale]?.[key] ?? english])),
  ...commonTranslations[locale],
  ...translatedOnly(productTranslations.en, productTranslations[locale], locale),
  ...translatedOnly(fileTranslations.en, fileTranslations[locale], locale),
  ...translatedOnly(settingsTranslations.en, settingsTranslations[locale], locale),
}])) as Record<Locale, Record<string, string>>;

const errorAliases: Record<string, string> = {
  'Unable to retrieve products': 'Unable to load products',
  'Unable to retrieve product files': 'Unable to load product files',
  'Unable to retrieve global assignments': 'Unable to load global assignments',
  'Unable to retrieve files': 'Unable to load files',
  'Unable to retrieve analytics': 'Unable to load analytics',
  'Unable to load storage settings': 'Unable to load settings',
  'Unable to save storage settings': 'Unable to save settings',
  'Unable to assign file to product': 'Unable to assign file',
  'Unable to remove product file assignment': 'Unable to remove file',
  'Global product assignments require the Pro plan or higher': 'globalAssignmentLocked',
  'Analytics require the Pro plan or higher': 'analyticsLockedDescription',
  'Unable to download this file': 'unableToDownload',
};
const quotaMessages = [
  { pattern: /^Your (.+) plan allows up to (\d+) files\. Upgrade to add more\.$/, key: 'Your {{plan}} plan allows up to {{count}} files. Upgrade to add more.' },
  { pattern: /^Your (.+) plan allows assignments on up to (\d+) products\. Upgrade to add more\.$/, key: 'Your {{plan}} plan allows assignments on up to {{count}} products. Upgrade to add more.' },
];

export function translate(key: TranslationKey, locale: Locale = 'en', variables: TranslationVariables = {}): string {
  const messages = dictionaries[locale] ?? dictionaries.en;
  key = errorAliases[key] ?? key;
  for (const quota of quotaMessages) {
    const match = key.match(quota.pattern);
    if (match) { key = quota.key; variables = { plan: translate(match[1], locale), count: match[2], ...variables }; break; }
  }
  const template = messages[key] ?? dictionaries.en[key] ?? key;
  // Keep interpolated user content literal, even when it contains replacement tokens.
  return template.replace(/\{\{(\w+)\}\}/g, (placeholder, name: string) => Object.hasOwn(variables, name) ? String(variables[name]) : placeholder);
}
