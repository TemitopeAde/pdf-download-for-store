import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { isLocale, localeDirection, SUPPORTED_LANGUAGES, useLocale } from '@/lib/i18n';

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
