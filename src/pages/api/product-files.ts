import type { APIRoute } from 'astro';
import { fail, json, ok, readJson } from '../../lib/data';
import { assignFile, getProductFiles, removeAssignment } from '../../lib/assignments';
import { getStorageSettings } from '../../lib/storage';

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
    return json(ok({ files: files.map((entry) => ({ ...entry.file, fileId: entry.file._id ?? entry.fileId, assignmentId: entry._id, label: entry.label, description: entry.description, sortOrder: entry.sortOrder, isVisible: entry.isVisible, visibility: entry.visibility })), settings: { title: settings.title, buttonText: settings.buttonText, viewButtonText: settings.viewButtonText, showViewButton: settings.showViewButton } }));
  } catch (error) {
    console.error('Unable to retrieve product files', error);
    return json(fail('Unable to retrieve product files'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await readJson(request);
    if (typeof body.productId !== 'string' || typeof body.fileId !== 'string') return json(fail('productId and fileId are required'), 400);
    const assignment = await assignFile(body.productId, body.fileId, {
      label: typeof body.label === 'string' ? body.label : undefined,
      description: typeof body.description === 'string' ? body.description : undefined,
      sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : undefined,
      isVisible: typeof body.isVisible === 'boolean' ? body.isVisible : undefined,
      visibility: body.visibility === 'MEMBERS_ONLY' ? 'MEMBERS_ONLY' : body.visibility === 'PURCHASE_REQUIRED' ? 'PURCHASE_REQUIRED' : 'PUBLIC',
    });
    return json(ok(assignment), 201);
  } catch (error) {
    console.error('Unable to assign file to product', error);
    return json(fail('Unable to assign file to product'), 400);
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
