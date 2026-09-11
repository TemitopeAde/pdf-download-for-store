import { items } from '@wix/data';
import { COLLECTIONS, queryAll, toFile } from './data';
import { listProducts } from './products';
import type { AnalyticsSummary } from './types';

function asRecord(value: unknown): Record<string, unknown> & { _id?: string } {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> & { _id?: string } : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function eventDate(value: unknown): Date | undefined {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return undefined;
}

async function listDownloadEvents(max = 1000): Promise<Array<Record<string, unknown>>> {
  const records: Array<Record<string, unknown>> = [];
  let skip = 0;
  for (;;) {
    const result = await items.query(COLLECTIONS.downloadEvents).descending('downloadedAt').limit(100).skip(skip).find();
    records.push(...result.items.map(asRecord));
    if (result.items.length < 100 || records.length >= max) break;
    skip += 100;
  }
  return records.slice(0, max);
}

function ranked(counts: Map<string, number>, names: Map<string, string>, fallback: string): Array<{ id: string; name: string; count: number }> {
  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, name: names.get(id) || `${fallback} ${id.slice(0, 8)}`, count }));
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  const [events, files, products] = await Promise.all([
    listDownloadEvents(),
    queryAll(COLLECTIONS.files),
    listProducts('', 100, 0).catch(() => ({ products: [] as Array<{ id: string; name: string }> })),
  ]);
  const fileNames = new Map(files.map((file) => {
    const mapped = toFile(file);
    return [mapped._id ?? '', mapped.name] as const;
  }).filter((entry) => entry[0]));
  const productNames = new Map(products.products.map((product) => [product.id, product.name] as const));
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const fileCounts = new Map<string, number>();
  const productCounts = new Map<string, number>();
  let today = 0;
  let last7Days = 0;
  for (const event of events) {
    const downloadedAt = eventDate(event.downloadedAt);
    if (downloadedAt) {
      if (downloadedAt.getTime() >= startOfToday.getTime()) today += 1;
      if (downloadedAt.getTime() >= weekAgo) last7Days += 1;
    }
    const fileId = asString(event.fileId);
    const productId = asString(event.productId);
    if (fileId) fileCounts.set(fileId, (fileCounts.get(fileId) ?? 0) + 1);
    if (productId) productCounts.set(productId, (productCounts.get(productId) ?? 0) + 1);
  }
  return {
    totals: {
      allTime: events.length,
      last7Days,
      today,
      uniqueFiles: fileCounts.size,
      uniqueProducts: productCounts.size,
    },
    topFiles: ranked(fileCounts, fileNames, 'File').map((row) => ({ fileId: row.id, name: row.name, count: row.count })),
    topProducts: ranked(productCounts, productNames, 'Product').map((row) => ({ productId: row.id, name: row.name, count: row.count })),
    recent: events.slice(0, 25).map((event) => {
      const fileId = asString(event.fileId);
      const productId = asString(event.productId);
      const downloadedAt = eventDate(event.downloadedAt);
      return {
        fileId,
        fileName: fileNames.get(fileId) || 'Unknown file',
        productId,
        productName: productNames.get(productId) || (productId ? 'Unknown product' : '—'),
        countryCode: asString(event.countryCode) || '—',
        downloadedAt: downloadedAt ? downloadedAt.toISOString() : '',
      };
    }),
  };
}
