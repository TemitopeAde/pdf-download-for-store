import type { AnalyticsSummary, AppSettings, DownloadFile, ProductSummary, Visibility } from '@/lib/types';

export type PageKind = 'products' | 'files' | 'analytics' | 'pricing' | 'settings';

export interface DashboardResponse<T> {
  success: boolean;
  data?: T;
  errorMessage?: string;
}

export interface ProductListData {
  products: ProductSummary[];
  nextCursor?: string;
  hasNext: boolean;
  catalogVersion: 'V1_CATALOG' | 'V3_CATALOG' | 'STORES_NOT_INSTALLED';
}

export interface LibraryFile extends DownloadFile {
  usedCount: number;
}

export interface AssignedProductFile extends DownloadFile {
  fileId: string;
  assignmentId?: string;
  label?: string;
  visibility?: Visibility;
  isVisible: boolean;
  sortOrder: number;
}

export type SettingsForm = AppSettings;
export type AnalyticsData = AnalyticsSummary;
