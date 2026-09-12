export type AssignmentType = 'PRODUCT' | 'COLLECTION' | 'ALL_PRODUCTS';
export type Visibility = 'PUBLIC' | 'MEMBERS_ONLY' | 'PURCHASE_REQUIRED';
export type WidgetLayout = 'LIST' | 'BUTTONS' | 'CARDS' | 'ACCORDION';
export type StorageProvider = 'WIX_MEDIA' | 'CLOUDINARY';
export type CountryGateMode = 'OFF' | 'ALLOW' | 'BLOCK';

export interface DownloadFile {
  _id?: string;
  name: string;
  mediaId?: string;
  url: string;
  storageProvider?: StorageProvider;
  fileType: string;
  fileSize?: number;
  description?: string;
  label?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

export interface ProductFile {
  _id?: string;
  productId: string;
  fileId: string;
  label?: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  visibility?: Visibility;
}

export interface AssignmentRule {
  _id?: string;
  type: AssignmentType;
  targetId?: string;
  fileId: string;
  label?: string;
  description?: string;
  sortOrder: number;
  isVisible: boolean;
  visibility?: Visibility;
}

export interface AppSettings {
  title: string;
  buttonText: string;
  layout: WidgetLayout;
  showFileSize: boolean;
  showFileType: boolean;
  showDescription: boolean;
  openInNewTab: boolean;
  analyticsEnabled: boolean;
  defaultSort: 'MANUAL' | 'NAME' | 'TYPE';
  storageProvider: StorageProvider;
  cloudName?: string;
  apiKey?: string;
  apiSecret?: string;
  uploadPreset?: string;
  countryGateMode: CountryGateMode;
  countryCodes: string[];
  countryGateFailOpen: boolean;
  viewButtonText: string;
  showViewButton: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  title: 'Downloads',
  buttonText: 'Download',
  layout: 'LIST',
  showFileSize: true,
  showFileType: true,
  showDescription: true,
  openInNewTab: false,
  analyticsEnabled: true,
  defaultSort: 'MANUAL',
  storageProvider: 'WIX_MEDIA',
  countryGateMode: 'OFF',
  countryCodes: [],
  countryGateFailOpen: true,
  viewButtonText: 'View',
  showViewButton: true,
};

export interface ProductSummary {
  id: string;
  name: string;
  sku: string;
  imageUrl?: string;
  assignedFilesCount: number;
  collectionIds: string[];
}

export interface AnalyticsSummary {
  totals: {
    allTime: number;
    last7Days: number;
    today: number;
    uniqueFiles: number;
    uniqueProducts: number;
  };
  topFiles: Array<{ fileId: string; name: string; count: number }>;
  topProducts: Array<{ productId: string; name: string; count: number }>;
  recent: Array<{
    fileId: string;
    fileName: string;
    productId: string;
    productName: string;
    countryCode: string;
    downloadedAt: string;
  }>;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  errorMessage: string;
}

export type ApiResult<T> = ApiSuccess<T> | ApiFailure;
