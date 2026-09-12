import type { APIRoute } from 'astro';
import { fail, json, ok, readJson } from '../../lib/data';
import { assignFiles, getProductFiles, removeAssignment } from '../../lib/assignments';
import { getStorageSettings } from '../../lib/storage';
import type { ProductFile } from '../../lib/types';

/**
This file defines an HTTP endpoint exposed at `/api/product-files`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async ({ url }) => {
  const productId = url.searchParams.get('productId');
  if (!productId) return json(fail('productId is required'), 400);
  try {
    const files = await getProductFiles(productId, url.searchParams.getAll('collectionId'));
    const settings = await getStorageSettings();
    const visibleOnly = url.searchParams.get('visibleOnly') === 'true';
    const mapped = files
      .filter((entry) => !visibleOnly || entry.isVisible !== false)
      .map((entry) => ({ ...entry.file, fileId: entry.file._id ?? entry.fileId, assignmentId: entry._id, label: entry.label, description: entry.description, sortOrder: entry.sortOrder, isVisible: entry.isVisible, visibility: entry.visibility }));
    return json(ok({ files: mapped, settings: { title: settings.title, buttonText: settings.buttonText, viewButtonText: settings.viewButtonText, showViewButton: settings.showViewButton } }));
  } catch (error) {
    console.error('Unable to retrieve product files', error);
    return json(fail('Unable to retrieve product files'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await readJson(request);
    const productId = typeof body.productId === 'string' ? body.productId : '';
    const fileIds = Array.isArray(body.fileIds)
      ? body.fileIds.filter((value): value is string => typeof value === 'string' && value.length > 0)
      : typeof body.fileId === 'string' && body.fileId ? [body.fileId] : [];
    if (!productId || fileIds.length === 0) return json(fail('productId and at least one fileId are required'), 400);
    const visibility = body.visibility === 'MEMBERS_ONLY' || body.visibility === 'PURCHASE_REQUIRED' ? body.visibility : 'PUBLIC';
    const metadata: Partial<ProductFile> = { visibility };
    if (typeof body.label === 'string') metadata.label = body.label;
    if (typeof body.description === 'string') metadata.description = body.description;
    if (typeof body.sortOrder === 'number') metadata.sortOrder = body.sortOrder;
    if (typeof body.isVisible === 'boolean') metadata.isVisible = body.isVisible;
    const assignments = await assignFiles(productId, fileIds, metadata);
    return json(ok({ assignments }), 201);
  } catch (error) {
    console.error('Unable to assign file to product', error);
    return json(fail(error instanceof Error ? error.message : 'Unable to assign file to product'), 400);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const assignmentId = url.searchParams.get('assignmentId');
  if (!assignmentId) return json(fail('assignmentId is required'), 400);
  try {
    await removeAssignment(assignmentId);
    return json(ok({ removed: true }));
  } catch (error) {
    console.error('Unable to remove product file assignment', error);
    return json(fail('Unable to remove product file assignment'), 400);
  }
};
