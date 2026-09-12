import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Direction } from 'radix-ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isLocale, localeDirection, SUPPORTED_LANGUAGES, translate, type Locale, type TranslationKey, type TranslationVariables } from './translations';

export { SUPPORTED_LANGUAGES, translate } from './translations';
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

export function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useLocale();
  return <div className={compact ? 'min-w-0 flex-1' : 'space-y-2'}>
    {!compact ? <p className="text-xs font-medium text-muted-foreground">{t('language')}</p> : null}
    <Select value={locale} onValueChange={(value) => { if (isLocale(value)) setLocale(value); }}>
      <SelectTrigger aria-label={t('language')} className="w-full bg-white"><SelectValue /></SelectTrigger>
      <SelectContent>{SUPPORTED_LANGUAGES.map(([code, name]) => <SelectItem key={code} value={code}><span lang={code} dir={localeDirection(code)}>{name}</span></SelectItem>)}</SelectContent>
    </Select>
  </div>;
}
