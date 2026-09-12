import { ArrowUpRight, BarChart3, ChevronRight, CreditCard, Download, FileStack, Package, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PageKind } from './types';
import { createUpgradeUrl, CURRENT_PLAN } from '@/lib/plans';
import { LanguageSelector, useLocale, type TranslationKey } from '@/lib/i18n';

const navigation: Array<{ id: PageKind; labelKey: TranslationKey; icon: typeof Package }> = [
  { id: 'products', labelKey: 'products', icon: Package },
  { id: 'files', labelKey: 'fileLibrary', icon: FileStack },
  { id: 'analytics', labelKey: 'analytics', icon: BarChart3 },
  { id: 'pricing', labelKey: 'pricingPlans', icon: CreditCard },
  { id: 'settings', labelKey: 'settings', icon: Settings },
];

export function DashboardShell({ page, onNavigate, children }: { page: PageKind; onNavigate: (page: PageKind) => void; children: React.ReactNode }) {
  const { t } = useLocale();
  return (
    <main className="downloads-dashboard min-h-screen bg-[#f6f8fa] text-foreground">
      <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">{t('Skip to content')}</a>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-white px-4 py-7 md:flex lg:w-64">
          <div className="mb-12 flex items-center gap-3 px-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm"><Download className="size-5" aria-hidden="true" /></span>
            <div><p className="text-sm font-semibold tracking-tight">{t('productDownloads')}</p><p className="mt-0.5 text-xs text-muted-foreground">{t('Your digital asset workspace')}</p></div>
          </div>
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">{t('workspace')}</p>
          <nav className="space-y-1.5" aria-label={t('Dashboard')}>
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button key={item.id} type="button" aria-current={active ? 'page' : undefined}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', active ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
                  onClick={() => onNavigate(item.id)}>
                  <Icon className="size-[18px]" aria-hidden="true" />{t(item.labelKey)}
                  {active ? <span className="ml-auto size-1.5 rounded-full bg-primary" /> : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-4 rounded-xl border border-primary/15 bg-primary/[0.025] p-4">
            <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{t('currentPlan')}</p>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{CURRENT_PLAN}</span>
            </div>
            <p className="mt-2 text-sm font-semibold">{t('needMoreDownloads')}</p>
            <a href={createUpgradeUrl()} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-xs font-semibold text-primary hover:underline">{t('upgradePlan')} <ArrowUpRight className="size-3.5" aria-hidden="true" /></a>
          </div>
          <div className="mt-4 px-3"><LanguageSelector /></div>
          <p className="mt-5 px-3 text-[11px] text-muted-foreground">{t('builtForWix')}</p>
        </aside>
        <section className="min-w-0 flex-1">
          <div className="flex min-h-18 flex-wrap items-center justify-between gap-3 border-b bg-white px-5 py-3 md:px-9 lg:px-12">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">{t('workspace')}</span><ChevronRight className="hidden size-3.5 sm:block" aria-hidden="true" /><span className="font-medium text-foreground">{t(navigation.find((item) => item.id === page)?.labelKey ?? 'products')}</span></div>
            <span className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground md:flex"><Package className="size-3.5" aria-hidden="true" />{t('productDownloads')}</span>
            <div className="flex w-full min-w-0 items-center gap-2 md:hidden"><LanguageSelector compact /><Select value={page} onValueChange={(value) => onNavigate(value as PageKind)}><SelectTrigger aria-label={t('Navigate dashboard')} className="w-36 shrink-0"><SelectValue /></SelectTrigger><SelectContent>{navigation.map((item) => <SelectItem key={item.id} value={item.id}>{t(item.labelKey)}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div id="dashboard-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-8 outline-none md:px-9 md:py-10 lg:px-12">{children}</div>
        </section>
      </div>
    </main>
  );
}
