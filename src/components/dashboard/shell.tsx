import { ArrowUpRight, BarChart3, ChevronRight, CreditCard, Download, FileStack, Package, Settings } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { PageKind } from './types';

const navigation: Array<{ id: PageKind; label: string; icon: typeof Package }> = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'files', label: 'File library', icon: FileStack },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'pricing', label: 'Pricing plans', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function DashboardShell({ page, onNavigate, children }: { page: PageKind; onNavigate: (page: PageKind) => void; children: React.ReactNode }) {
  return (
    <main className="downloads-dashboard min-h-screen bg-[#f6f8fa] text-foreground">
      <a href="#dashboard-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-white focus:p-4">Skip to content</a>
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r bg-white px-4 py-7 md:flex lg:w-64">
          <div className="mb-12 flex items-center gap-3 px-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-sm"><Download className="size-5" aria-hidden="true" /></span>
            <div><p className="text-sm font-semibold tracking-tight">Product Downloads</p><p className="mt-0.5 text-xs text-muted-foreground">Your digital asset workspace</p></div>
          </div>
          <p className="mb-3 px-3 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">Workspace</p>
          <nav className="space-y-1.5" aria-label="Dashboard">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <button key={item.id} type="button" aria-current={active ? 'page' : undefined}
                  className={cn('flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary', active ? 'bg-primary/8 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
                  onClick={() => onNavigate(item.id)}>
                  <Icon className="size-[18px]" aria-hidden="true" />{item.label}
                  {active ? <span className="ml-auto size-1.5 rounded-full bg-primary" /> : null}
                </button>
              );
            })}
          </nav>
          <div className="mt-auto rounded-xl border bg-[#f8fafb] p-4">
            <FileStack className="mb-3 size-5 text-primary" aria-hidden="true" />
            <p className="text-sm font-semibold">A little extra for every product</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Keep guides, manuals, and downloads together in your file library.</p>
            <button type="button" onClick={() => onNavigate('files')} className="mt-4 flex items-center gap-2 text-xs font-semibold text-primary hover:underline">Open file library <ArrowUpRight className="size-3.5" aria-hidden="true" /></button>
          </div>
          <p className="mt-5 px-3 text-[11px] text-muted-foreground">Built for your Wix store</p>
        </aside>
        <section className="min-w-0 flex-1">
          <div className="flex min-h-18 items-center justify-between gap-3 border-b bg-white px-5 md:px-9 lg:px-12">
            <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="hidden sm:inline">Workspace</span><ChevronRight className="hidden size-3.5 sm:block" aria-hidden="true" /><span className="font-medium text-foreground">{navigation.find((item) => item.id === page)?.label}</span></div>
            <span className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] text-muted-foreground md:flex"><Package className="size-3.5" aria-hidden="true" />Product Downloads</span>
            <div className="md:hidden"><Select value={page} onValueChange={(value) => onNavigate(value as PageKind)}><SelectTrigger aria-label="Navigate dashboard" className="w-36"><SelectValue /></SelectTrigger><SelectContent>{navigation.map((item) => <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div id="dashboard-content" tabIndex={-1} className="mx-auto max-w-7xl px-5 py-8 outline-none md:px-9 md:py-10 lg:px-12">{children}</div>
        </section>
      </div>
    </main>
  );
}
