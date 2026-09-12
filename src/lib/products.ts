import { catalogVersioning, products, productsV3 } from '@wix/stores';
import { items } from '@wix/data';
import { COLLECTIONS, toProductFile, toRule, queryAll } from './data';
import type { ProductSummary } from './types';
import { currentPlan } from './plans';

type CatalogVersion = 'V1_CATALOG' | 'V3_CATALOG' | 'STORES_NOT_INSTALLED';

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
  if (!productsList.length) return [];
  const globalRules = currentPlan().allowsGlobalAssignments
    ? (await queryAll(COLLECTIONS.assignmentRules)).map(toRule).filter((rule) => rule.type === 'ALL_PRODUCTS')
    : [];
  let page = await items.query(COLLECTIONS.productFiles)
    .hasSome('productId', productsList.map((product) => product.id)).limit(100).find();
  const fileIdsByProduct = new Map<string, Set<string>>();
  for (;;) {
    page.items.map(toProductFile).forEach((assignment) => {
      const fileIds = fileIdsByProduct.get(assignment.productId) ?? new Set<string>();
      fileIds.add(assignment.fileId);
      fileIdsByProduct.set(assignment.productId, fileIds);
    });
    if (!page.hasNext()) break;
    page = await page.next();
  }
  return productsList.map((product) => {
    const fileIds = fileIdsByProduct.get(product.id) ?? new Set<string>();
    globalRules.forEach((rule) => fileIds.add(rule.fileId));
    return { ...product, assignedFilesCount: fileIds.size };
  });
}

export async function getCatalogVersion(): Promise<CatalogVersion> {
  const response = await catalogVersioning.getCatalogVersion();
  const version = stringValue(asRecord(response).catalogVersion);
  return version === 'V1_CATALOG' || version === 'V3_CATALOG' ? version : 'STORES_NOT_INSTALLED';
}

export async function listProducts(search: string, limit: number, offset: number, cursor?: string, sort: 'name-asc' | 'name-desc' = 'name-asc'): Promise<{ products: ProductSummary[]; nextCursor?: string; hasNext: boolean; catalogVersion: CatalogVersion }> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0) {
    throw new RangeError('Invalid product pagination');
  }
  const version = await getCatalogVersion();
  if (version === 'STORES_NOT_INSTALLED') return { products: [], hasNext: false, catalogVersion: version };
  if (version === 'V1_CATALOG') {
    let query = products.queryProducts();
    if (search) query = query.startsWith('name', search);
    query = sort === 'name-desc' ? query.descending('name', '_id') : query.ascending('name', '_id');
    const result = await query.limit(Math.min(Math.max(limit, 1), 100)).skip(Math.max(offset, 0)).find();
    return { products: await withAssignmentCounts(result.items.map(mapProduct)), hasNext: result.hasNext(), catalogVersion: version };
  }
  const result = await productsV3.searchProducts({
    ...(search ? { search: { expression: search, fields: ['name'] } } : {}),
    sort: [
      { fieldName: 'name', order: sort === 'name-desc' ? productsV3.SortOrder.DESC : productsV3.SortOrder.ASC },
    ],
    cursorPaging: { limit, ...(cursor ? { cursor } : {}) },
  }, { fields: [productsV3.RequestedFields.DIRECT_CATEGORIES_INFO] });
  const nextCursor = result.pagingMetadata?.cursors?.next;
  return {
    products: await withAssignmentCounts((result.products ?? []).map(mapProduct)),
    ...(nextCursor ? { nextCursor } : {}),
    hasNext: result.pagingMetadata?.hasNext ?? Boolean(nextCursor),
    catalogVersion: version,
  };
}
