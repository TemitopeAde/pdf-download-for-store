import { COLLECTIONS, insertItem, queryCollection, removeItem, toFile, toProductFile, toRule, updateItem } from './data';
import type { AssignmentRule, DownloadFile, ProductFile } from './types';

export async function getProductFiles(productId: string, collectionIds: string[] = []): Promise<Array<ProductFile & { file: DownloadFile }>> {
  const [explicit, rules, files] = await Promise.all([
    queryCollection(COLLECTIONS.productFiles, 100, 0),
    queryCollection(COLLECTIONS.assignmentRules, 100, 0),
    queryCollection(COLLECTIONS.files, 100, 0),
  ]);
  const fileMap = new Map(files.map((file) => [toFile(file)._id, toFile(file)]));
  const productFiles = explicit.map(toProductFile).filter((entry) => entry.productId === productId);
  const assignmentRules = rules.map(toRule).filter((rule) => {
    if (rule.type === 'ALL_PRODUCTS') return true;
    if (rule.type === 'PRODUCT') return rule.targetId === productId;
    return Boolean(rule.targetId && collectionIds.includes(rule.targetId));
  });
  const result = new Map<string, ProductFile>();
  for (const entry of productFiles) result.set(entry.fileId, entry);
  for (const rule of assignmentRules) {
    if (!result.has(rule.fileId)) result.set(rule.fileId, { productId, fileId: rule.fileId, label: rule.label, description: rule.description, sortOrder: rule.sortOrder, isVisible: rule.isVisible, visibility: rule.visibility });
  }
  return [...result.values()]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => ({ ...entry, file: fileMap.get(entry.fileId) }))
    .filter((entry): entry is ProductFile & { file: DownloadFile } => Boolean(entry.file && entry.file.isActive !== false));
}

export async function assignFile(productId: string, fileId: string, metadata: Partial<ProductFile> = {}): Promise<ProductFile> {
  const existing = (await queryCollection(COLLECTIONS.productFiles, 100, 0)).map(toProductFile).find((entry) => entry.productId === productId && entry.fileId === fileId);
  const value = { productId, fileId, label: metadata.label ?? '', description: metadata.description ?? '', sortOrder: metadata.sortOrder ?? 0, isVisible: metadata.isVisible ?? true, visibility: metadata.visibility ?? 'PUBLIC' };
  return toProductFile(existing?._id ? await updateItem(COLLECTIONS.productFiles, { ...value, _id: existing._id }) : await insertItem(COLLECTIONS.productFiles, value));
}

export async function removeAssignment(id: string): Promise<void> {
  await removeItem(COLLECTIONS.productFiles, id);
}

export async function saveRule(rule: AssignmentRule): Promise<AssignmentRule> {
  const value = { type: rule.type, targetId: rule.targetId ?? '', fileId: rule.fileId, label: rule.label ?? '', description: rule.description ?? '', sortOrder: rule.sortOrder, isVisible: rule.isVisible, visibility: rule.visibility ?? 'PUBLIC' };
  return toRule(rule._id ? await updateItem(COLLECTIONS.assignmentRules, { ...value, _id: rule._id }) : await insertItem(COLLECTIONS.assignmentRules, value));
}
