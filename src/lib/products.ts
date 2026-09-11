import { catalogVersioning, products, productsV3 } from '@wix/stores';
import { COLLECTIONS, queryAll, toProductFile } from './data';
import type { ProductSummary } from './types';

type CatalogVersion = 'V1_CATALOG' | 'V3_CATALOG' | 'STORES_NOT_INSTALLED';
let cachedVersion: CatalogVersion | undefined;

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown): string { return typeof value === 'string' ? value : ''; }

function mapProduct(value: unknown): ProductSummary {
  const product = asRecord(value);
  const media = asRecord(product.media);
  const mainMedia = asRecord(media.mainMedia ?? media.main);
  const image = asRecord(mainMedia.image);
  const variantsInfo = asRecord(product.variantsInfo);
  const variants = Array.isArray(variantsInfo.variants) ? variantsInfo.variants : [];
  const firstVariant = asRecord(variants[0]);
  const nestedVariant = asRecord(firstVariant.variant);
  const categories = Array.isArray(product.directCategories) ? product.directCategories : [];
  const collectionIds = Array.isArray(product.collectionIds)
    ? product.collectionIds.filter((id): id is string => typeof id === 'string')
    : categories.map((category) => stringValue(asRecord(category).id)).filter(Boolean);
  const imageUrl = stringValue(image.url) || (typeof mainMedia.image === 'string' ? mainMedia.image : '') || stringValue(mainMedia.url);
  return {
    id: stringValue(product._id),
    name: stringValue(product.name) || 'Unnamed product',
    sku: stringValue(product.sku) || stringValue(firstVariant.sku) || stringValue(nestedVariant.sku),
    ...(imageUrl ? { imageUrl } : {}),
    assignedFilesCount: 0,
    collectionIds,
  };
}

async function withAssignmentCounts(productsList: ProductSummary[]): Promise<ProductSummary[]> {
  const assignments = await queryAll(COLLECTIONS.productFiles);
  const counts = new Map<string, number>();
  assignments.map(toProductFile).forEach((assignment) => counts.set(assignment.productId, (counts.get(assignment.productId) ?? 0) + 1));
  return productsList.map((product) => ({ ...product, assignedFilesCount: counts.get(product.id) ?? 0 }));
}

export async function getCatalogVersion(): Promise<CatalogVersion> {
  if (cachedVersion) return cachedVersion;
  const response = await catalogVersioning.getCatalogVersion();
  const version = stringValue(asRecord(response).catalogVersion);
  cachedVersion = version === 'V1_CATALOG' || version === 'V3_CATALOG' ? version : 'STORES_NOT_INSTALLED';
  return cachedVersion;
}

export async function listProducts(search: string, limit: number, offset: number, cursor?: string): Promise<{ products: ProductSummary[]; nextCursor?: string; hasNext: boolean; catalogVersion: CatalogVersion }> {
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return { products: [], hasNext: false, catalogVersion: version };
  if (version === 'V1_CATALOG') {
    let query = products.queryProducts();
    if (search) query = query.startsWith('name', search);
    const result = await query.limit(Math.min(Math.max(limit, 1), 100)).skip(Math.max(offset, 0)).find();
    return { products: await withAssignmentCounts(result.items.map(mapProduct)), hasNext: result.hasNext(), catalogVersion: version };
  }
  const searchOptions = { ...(search ? { expression: search } : {}), cursorPaging: { limit: Math.min(Math.max(limit, 1), 100), ...(cursor ? { cursor } : {}) } };
  const result = await productsV3.searchProducts(searchOptions as never, { fields: ['name', 'media', 'variantsInfo', 'directCategories'] as never });
  const response = asRecord(result);
  const mapped = Array.isArray(response.products) ? response.products.map(mapProduct) : [];
  const cursors = asRecord(response.cursors);
  const nextCursor = stringValue(cursors.next) || undefined;
  return { products: await withAssignmentCounts(mapped), ...(nextCursor ? { nextCursor } : {}), hasNext: Boolean(nextCursor), catalogVersion: version };
}
