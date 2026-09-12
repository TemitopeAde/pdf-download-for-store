import { items } from '@wix/data';
import { COLLECTIONS, insertItem, queryAll, removeItem, toFile, toProductFile, toRule, updateItem } from './data';
import type { AssignmentRule, DownloadFile, ProductFile } from './types';

async function queryByProduct(productId: string): Promise<ProductFile[]> {
  const records = [];
  let skip = 0;
  for (;;) {
    const result = await items.query(COLLECTIONS.productFiles).eq('productId', productId).limit(100).skip(skip).find();
    records.push(...result.items.map(toProductFile));
    if (result.items.length < 100) break;
    skip += 100;
  }
  return records;
}

export async function getProductFiles(productId: string, collectionIds: string[] = []): Promise<Array<ProductFile & { file: DownloadFile }>> {
  const [explicit, rules, files] = await Promise.all([
    queryByProduct(productId),
    queryAll(COLLECTIONS.assignmentRules),
    queryAll(COLLECTIONS.files),
  ]);
  const fileMap = new Map(files.map((file) => {
    const mapped = toFile(file);
    return [mapped._id, mapped] as const;
  }).filter((entry) => entry[0]));
  const assignmentRules = rules.map(toRule).filter((rule) => {
    if (rule.type === 'ALL_PRODUCTS') return true;
    if (rule.type === 'PRODUCT') return rule.targetId === productId;
    return Boolean(rule.targetId && collectionIds.includes(rule.targetId));
  });
  const result = new Map<string, ProductFile>();
  for (const entry of explicit) result.set(entry.fileId, entry);
  for (const rule of assignmentRules) {
    if (!result.has(rule.fileId)) result.set(rule.fileId, { productId, fileId: rule.fileId, label: rule.label, description: rule.description, sortOrder: rule.sortOrder, isVisible: rule.isVisible, visibility: rule.visibility });
  }
  return [...result.values()]
    .sort((left, right) => left.sortOrder - right.sortOrder || left.fileId.localeCompare(right.fileId))
    .map((entry) => ({ ...entry, file: fileMap.get(entry.fileId) }))
    .filter((entry): entry is ProductFile & { file: DownloadFile } => Boolean(entry.file && entry.file.isActive !== false));
}

export async function assignFile(productId: string, fileId: string, metadata: Partial<ProductFile> = {}): Promise<ProductFile> {
  const siblings = await queryByProduct(productId);
  const existing = siblings.find((entry) => entry.fileId === fileId);
  const nextSort = siblings.reduce((max, entry) => Math.max(max, entry.sortOrder), -1) + 1;
  const value = {
    productId,
    fileId,
    label: metadata.label ?? existing?.label ?? '',
    description: metadata.description ?? existing?.description ?? '',
    sortOrder: metadata.sortOrder ?? existing?.sortOrder ?? nextSort,
    isVisible: metadata.isVisible ?? existing?.isVisible ?? true,
    visibility: metadata.visibility ?? existing?.visibility ?? 'PUBLIC',
  };
  return toProductFile(existing?._id ? await updateItem(COLLECTIONS.productFiles, { ...value, _id: existing._id }) : await insertItem(COLLECTIONS.productFiles, value));
}

export async function assignFiles(productId: string, fileIds: string[], metadata: Partial<ProductFile> = {}): Promise<ProductFile[]> {
  const uniqueIds = [...new Set(fileIds.filter(Boolean))];
  const assigned: ProductFile[] = [];
  for (const fileId of uniqueIds) assigned.push(await assignFile(productId, fileId, metadata));
  return assigned;
}

export async function removeAssignment(id: string): Promise<void> {
  await removeItem(COLLECTIONS.productFiles, id);
}

export async function saveRule(rule: AssignmentRule): Promise<AssignmentRule> {
  const value = { type: rule.type, targetId: rule.targetId ?? '', fileId: rule.fileId, label: rule.label ?? '', description: rule.description ?? '', sortOrder: rule.sortOrder, isVisible: rule.isVisible, visibility: rule.visibility ?? 'PUBLIC' };
  return toRule(rule._id ? await updateItem(COLLECTIONS.assignmentRules, { ...value, _id: rule._id }) : await insertItem(COLLECTIONS.assignmentRules, value));
}
