import { useMemo, useState } from 'react';
import { AnalyticsPage } from './analytics-page';
import { FilesPage } from './files-page';
import { ProductsPage } from './products-page';
import { PricingPage } from './pricing-page';
import { SettingsPage } from './settings-page';
import { DashboardShell } from './shell';
import type { PageKind } from './types';
import '@/styles/globals.css';

export function DashboardApp({ initialPage }: { initialPage: PageKind }) {
  const [page, setPage] = useState(initialPage);
  const content = useMemo(() => {
    if (page === 'settings') return <SettingsPage />;
    if (page === 'files') return <FilesPage />;
    if (page === 'analytics') return <AnalyticsPage onOpenProducts={() => setPage('products')} />;
    if (page === 'pricing') return <PricingPage />;
    return <ProductsPage onOpenFiles={() => setPage('files')} />;
  }, [page]);
  return <DashboardShell page={page} onNavigate={setPage}>{content}</DashboardShell>;
}
