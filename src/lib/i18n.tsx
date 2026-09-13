import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Direction } from 'radix-ui';
import { isLocale, localeDirection, translate, type Locale, type TranslationKey, type TranslationVariables } from './translations';

export { SUPPORTED_LANGUAGES, translate, isLocale, localeDirection } from './translations';
export type { Locale, LanguageOption, TranslationKey, TranslationVariables } from './translations';
const STORAGE_KEY = 'pdf-downloads.dashboard.locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, variables?: TranslationVariables) => string;
}
const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', setLocale: () => {}, t: (key, variables) => translate(key, 'en', variables) });

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) setLocaleState(stored);
    } catch { /* Browser storage can be unavailable in embedded dashboards. */ }
    const sync = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) setLocaleState(event.newValue && isLocale(event.newValue) ? event.newValue : 'en');
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    const previousLang = root.lang;
    const previousDir = root.dir;
    root.lang = locale;
    root.dir = localeDirection(locale);
    return () => { root.lang = previousLang; root.dir = previousDir; };
  }, [locale]);
  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale: (next) => {
      if (!isLocale(next)) return;
      setLocaleState(next);
      try { window.localStorage.setItem(STORAGE_KEY, next); } catch { /* Keep the in-memory selection. */ }
    },
    t: (key, variables) => translate(key, locale, variables),
  }), [locale]);
  return <LocaleContext.Provider value={value}><Direction.Provider dir={localeDirection(locale)}>{children}</Direction.Provider></LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue { return useContext(LocaleContext); }
