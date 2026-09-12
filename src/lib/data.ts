import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import type { ApiResult, AssignmentRule, DownloadFile, ProductFile } from './types';

export const COLLECTIONS = {
  files: '@admin14744/pdf-download-for-store/files',
  productFiles: '@admin14744/pdf-download-for-store/product-files',
  assignmentRules: '@admin14744/pdf-download-for-store/assignment-rules',
  downloadEvents: '@admin14744/pdf-download-for-store/download-events',
  settings: '@admin14744/pdf-download-for-store/app-settings',
} as const;

type DataRecord = Record<string, unknown> & { _id?: string };

const asRecord = (value: unknown): DataRecord => {
  if (typeof value === 'object' && value !== null) return value as DataRecord;
  return {};
};

const asString = (value: unknown, fallback = ''): string => typeof value === 'string' ? value : fallback;
const asNumber = (value: unknown, fallback = 0): number => typeof value === 'number' ? value : fallback;
const asBoolean = (value: unknown, fallback = false): boolean => typeof value === 'boolean' ? value : fallback;

export const toFile = (value: unknown): DownloadFile => {
  const record = asRecord(value);
  return {
    _id: record._id,
    name: asString(record.name),
    mediaId: asString(record.mediaId) || undefined,
    url: asString(record.url),
    storageProvider: record.storageProvider === 'CLOUDINARY' ? 'CLOUDINARY' : 'WIX_MEDIA',
    fileType: asString(record.fileType, 'FILE'),
    fileSize: typeof record.fileSize === 'number' ? record.fileSize : undefined,
    description: asString(record.description) || undefined,
    createdAt: asString(record.createdAt) || undefined,
    updatedAt: asString(record.updatedAt) || undefined,
    isActive: asBoolean(record.isActive, true),
  };
};

export const toProductFile = (value: unknown): ProductFile => {
  const record = asRecord(value);
  return {
    _id: record._id,
    productId: asString(record.productId),
    fileId: asString(record.fileId),
    label: asString(record.label) || undefined,
    description: asString(record.description) || undefined,
    sortOrder: asNumber(record.sortOrder),
    isVisible: asBoolean(record.isVisible, true),
    visibility: record.visibility === 'MEMBERS_ONLY' ? 'MEMBERS_ONLY' : record.visibility === 'PURCHASE_REQUIRED' ? 'PURCHASE_REQUIRED' : 'PUBLIC',
  };
};

export const toRule = (value: unknown): AssignmentRule => {
  const record = asRecord(value);
  const type = record.type === 'COLLECTION' || record.type === 'ALL_PRODUCTS' ? record.type : 'PRODUCT';
  return {
    _id: record._id,
    type,
    targetId: asString(record.targetId) || undefined,
    fileId: asString(record.fileId),
    label: asString(record.label) || undefined,
    description: asString(record.description) || undefined,
    sortOrder: asNumber(record.sortOrder),
    isVisible: asBoolean(record.isVisible, true),
    visibility: record.visibility === 'MEMBERS_ONLY' ? 'MEMBERS_ONLY' : record.visibility === 'PURCHASE_REQUIRED' ? 'PURCHASE_REQUIRED' : 'PUBLIC',
  };
};

export { DEFAULT_SETTINGS } from './types';

export async function queryCollection(collectionId: string, limit: number, skip = 0, search?: string): Promise<DataRecord[]> {
  let query = items.query(collectionId).limit(Math.min(Math.max(limit, 1), 100)).skip(Math.max(skip, 0));
  if (search) query = query.contains('name', search);
  const result = await query.find();
  return result.items.map(asRecord);
}

export async function queryAll(collectionId: string, search?: string): Promise<DataRecord[]> {
  const records: DataRecord[] = [];
  let skip = 0;
  for (;;) {
    const page = await queryCollection(collectionId, 100, skip, search);
    records.push(...page);
    if (page.length < 100 || skip >= 4900) break;
    skip += 100;
  }
  return records;
}

export async function getCollectionItem(collectionId: string, id: string): Promise<DataRecord | null> {
  return asRecord(await items.get(collectionId, id));
}

export async function insertItem(collectionId: string, value: Record<string, unknown>): Promise<DataRecord> {
  return asRecord(await auth.elevate(items.insert)(collectionId, value));
}

export async function updateItem(collectionId: string, value: Record<string, unknown> & { _id: string }): Promise<DataRecord> {
  return asRecord(await auth.elevate(items.update)(collectionId, value));
}

export async function removeItem(collectionId: string, id: string): Promise<void> {
  await auth.elevate(items.remove)(collectionId, id);
}

export function ok<T>(data: T): ApiResult<T> {
  return { success: true, data };
}

export function fail(errorMessage: string): ApiResult<never> {
  return { success: false, errorMessage };
}

export function json<T>(result: ApiResult<T>, status = result.success ? 200 : 400): Response {
  return Response.json(result, { status });
}

export async function readJson(request: Request): Promise<Record<string, unknown>> {
  const body: unknown = await request.json();
  if (typeof body !== 'object' || body === null || Array.isArray(body)) throw new Error('Request body must be a JSON object');
  return body as Record<string, unknown>;
}

export function requiredString(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || value.trim() === '') throw new Error(`${key} is required`);
  return value.trim();
}
