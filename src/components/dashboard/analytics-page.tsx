import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dashboardRequest } from '@/lib/dashboard-api';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { AnalyticsSummary } from '@/lib/types';
import { formatDate, messageFrom } from './format';
import type { DashboardResponse } from './types';
import { EmptyState, ErrorBanner, PageHeader, StatCard, TableSkeleton } from './ui-bits';

export function AnalyticsPage({ onOpenProducts }: { onOpenProducts: () => void }) {
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

  useEffect(() => { void load(); }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="See which files and products generate downloads. Events are recorded when a visitor downloads from the product page widget."
        actions={<Button type="button" variant="outline" onClick={() => void load()}>Refresh</Button>}
      />
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {loading && !data ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Today" value={data?.totals.today ?? 0} />
            <StatCard label="Last 7 days" value={data?.totals.last7Days ?? 0} />
            <StatCard label="All time" value={data?.totals.allTime ?? 0} />
            <StatCard label="Files downloaded" value={data?.totals.uniqueFiles ?? 0} />
            <StatCard label="Products" value={data?.totals.uniqueProducts ?? 0} />
          </div>
          {!data || data.totals.allTime === 0 ? (
            <EmptyState
              title="No downloads yet"
              description={`Assign files to products and add the ${DEFAULT_SETTINGS.title} widget to a product page. Downloads appear here automatically.`}
              action={<Button type="button" onClick={onOpenProducts}>Go to products</Button>}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <RankTable title="Top files" rows={data.topFiles.map((row) => ({ name: row.name, count: row.count }))} />
              <RankTable title="Top products" rows={data.topProducts.map((row) => ({ name: row.name, count: row.count }))} />
              <div className="overflow-hidden rounded-xl border bg-background lg:col-span-2">
                <div className="border-b px-4 py-3 font-medium">Recent downloads</div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>File</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recent.map((event, index) => (
                      <TableRow key={`${event.fileId}-${event.downloadedAt}-${index}`}>
                        <TableCell className="font-medium">{event.fileName}</TableCell>
                        <TableCell>{event.productName}</TableCell>
                        <TableCell>{event.countryCode}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(event.downloadedAt)}</TableCell>
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
  return (
    <div className="overflow-hidden rounded-xl border bg-background">
      <div className="border-b px-4 py-3 font-medium">{title}</div>
      {rows.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">Nothing to rank yet.</p> : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Downloads</TableHead>
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
