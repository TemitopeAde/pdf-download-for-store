import type { APIRoute } from 'astro';
import { COLLECTIONS, fail, getCollectionItem, insertItem, json, ok, queryAll, queryCollection, readJson, removeItem, requiredString, toFile, toProductFile, updateItem } from '../../lib/data';
import { currentPlan } from '../../lib/plans';

/**
This file defines an HTTP endpoint exposed at `/api/files`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async ({ url }) => {
  try {
    const plan = currentPlan();
    const requestedLimit = Number(url.searchParams.get('limit') ?? 100);
    const limit = plan.maxFiles === null ? requestedLimit : Math.min(requestedLimit, plan.maxFiles);
    const [fileRecords, assignments] = await Promise.all([
      queryCollection(COLLECTIONS.files, limit, Number(url.searchParams.get('offset') ?? 0), url.searchParams.get('search') ?? undefined),
      queryAll(COLLECTIONS.productFiles),
    ]);
    const usage = new Map<string, number>();
    assignments.map(toProductFile).forEach((assignment) => usage.set(assignment.fileId, (usage.get(assignment.fileId) ?? 0) + 1));
    const files = fileRecords.map((record) => {
      const file = toFile(record);
      return { ...file, usedCount: usage.get(file._id ?? '') ?? 0 };
    });
    return json(ok({ files }));
  } catch (error) {
    console.error('Unable to retrieve files', error);
    return json(fail('Unable to retrieve files'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const plan = currentPlan();
    if (plan.maxFiles !== null && (await queryAll(COLLECTIONS.files)).length >= plan.maxFiles) return json(fail(`Your ${plan.name} plan allows up to ${plan.maxFiles} files. Upgrade to add more.`), 403);
    const body = await readJson(request);
    const name = requiredString(body, 'name');
    const url = requiredString(body, 'url');
    const file = await insertItem(COLLECTIONS.files, { name, url, mediaId: typeof body.mediaId === 'string' ? body.mediaId : '', label: typeof body.label === 'string' ? body.label.trim() : '', fileType: typeof body.fileType === 'string' ? body.fileType : 'FILE', fileSize: typeof body.fileSize === 'number' ? body.fileSize : 0, description: typeof body.description === 'string' ? body.description : '', storageProvider: body.storageProvider === 'CLOUDINARY' ? 'CLOUDINARY' : 'WIX_MEDIA', externalId: typeof body.externalId === 'string' ? body.externalId : '', resourceType: typeof body.resourceType === 'string' ? body.resourceType : 'auto', createdAt: new Date(), updatedAt: new Date(), isActive: true });
    return json(ok(toFile(file)), 201);
  } catch (error) {
    console.error('Unable to save file', error);
    return json(fail('Unable to save file'), 400);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const body = await readJson(request);
    const fileId = requiredString(body, 'fileId');
    const existing = await getCollectionItem(COLLECTIONS.files, fileId);
    if (!existing?._id) return json(fail('File not found'), 404);
    const updated = await updateItem(COLLECTIONS.files, {
      ...existing,
      _id: existing._id,
      name: typeof body.name === 'string' && body.name.trim() ? body.name.trim() : existing.name,
      description: typeof body.description === 'string' ? body.description : existing.description,
      label: typeof body.label === 'string' ? body.label.trim() : existing.label,
      updatedAt: new Date(),
    });
    return json(ok(toFile(updated)));
  } catch (error) {
    console.error('Unable to update file', error);
    return json(fail('Unable to update file'), 400);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const fileId = url.searchParams.get('fileId');
  if (!fileId) return json(fail('fileId is required'), 400);
  try { await removeItem(COLLECTIONS.files, fileId); return json(ok({ removed: true })); }
  catch (error) { console.error('Unable to delete file', error); return json(fail('Unable to delete file'), 400); }
};
