import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dashboardRequest } from '@/lib/dashboard-api';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { AnalyticsSummary } from '@/lib/types';
import { formatDate, messageFrom } from './format';
import type { DashboardResponse } from './types';
import { EmptyState, ErrorBanner, PageHeader, StatCard, TableSkeleton } from './ui-bits';
import { currentPlan } from '@/lib/plans';
import { useLocale } from '@/lib/i18n';

export function AnalyticsPage({ onOpenProducts }: { onOpenProducts: () => void }) {
  const plan = currentPlan();
  const { t, locale } = useLocale();
  const [data, setData] = useState<AnalyticsSummary | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await dashboardRequest<DashboardResponse<AnalyticsSummary>>('/api/analytics');
      setData(response.data);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to load analytics'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (plan.allowsAnalytics) void load(); }, [plan.allowsAnalytics]);

  if (!plan.allowsAnalytics) return <div className="space-y-6"><PageHeader title={t('Analytics')} description={t('See which files and products generate downloads.')} /><EmptyState title={t('Analytics is a Pro feature')} description={t('Upgrade to Pro or Business to track downloads and view analytics.')} /></div>;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('Analytics')}
        description={t('See which files and products generate downloads.')}
        actions={<Button type="button" variant="outline" onClick={() => void load()}>{t('Refresh')}</Button>}
      />
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {loading && !data ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label={t('Today')} value={data?.totals.today ?? 0} />
            <StatCard label={t('Last 7 days')} value={data?.totals.last7Days ?? 0} />
            <StatCard label={t('All time')} value={data?.totals.allTime ?? 0} />
            <StatCard label={t('Files downloaded')} value={data?.totals.uniqueFiles ?? 0} />
            <StatCard label={t('Products')} value={data?.totals.uniqueProducts ?? 0} />
          </div>
          {!data || data.totals.allTime === 0 ? (
            <EmptyState
              title={t('No downloads yet')}
              description={t('Assign files to products and add the {{name}} widget to a product page. Downloads appear here automatically.', { name: DEFAULT_SETTINGS.title })}
              action={<Button type="button" onClick={onOpenProducts}>{t('Go to products')}</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <RankTable title={t('Top files')} rows={data.topFiles.map((row) => ({ name: row.name, count: row.count }))} />
              <RankTable title={t('Top products')} rows={data.topProducts.map((row) => ({ name: row.name, count: row.count }))} />
              <div className="overflow-hidden rounded-xl border bg-background lg:col-span-2">
                <div className="border-b px-4 py-3 font-medium">{t('Recent downloads')}</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('File')}</TableHead>
                      <TableHead>{t('Product')}</TableHead>
                      <TableHead>{t('Country')}</TableHead>
                      <TableHead>{t('When')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((event, index) => (
                      <TableRow key={`${event.fileId}-${event.downloadedAt}-${index}`}>
                        <TableCell className="font-medium">{event.fileName}</TableCell>
                        <TableCell>{event.productName}</TableCell>
                        <TableCell>{event.countryCode}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(event.downloadedAt, locale)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function RankTable({ title, rows }: { title: string; rows: Array<{ name: string; count: number }> }) {
  const { t } = useLocale();
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="border-b px-4 py-3 font-medium">{title}</div>
      {rows.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">{t('Nothing to rank yet.')}</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('Name')}</TableHead>
              <TableHead className="text-right">{t('Downloads')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.name}>
                <TableCell>{row.name}</TableCell>
                <TableCell className="text-right font-medium">{row.count}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
