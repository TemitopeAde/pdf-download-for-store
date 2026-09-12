import type { APIRoute } from 'astro';
import { files as wixMediaFiles } from '@wix/media';
import { auth } from '@wix/essentials';
import { COLLECTIONS, insertItem, json, fail, ok, queryAll, readJson, toFile } from '../../lib/data';
import { cloudinarySignature, getCloudinaryApiSecret, getStorageSettings, toPublicStorageSettings } from '../../lib/storage';
import { currentPlan } from '../../lib/plans';

/**
This file defines an HTTP endpoint exposed at `/api/media`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async ({ url }) => {
  try {
    const plan = currentPlan();
    if (plan.maxFiles !== null && (await queryAll(COLLECTIONS.files)).length >= plan.maxFiles) return json(fail(`Your ${plan.name} plan allows up to ${plan.maxFiles} files. Upgrade to add more.`), 403);
    const settings = await getStorageSettings();
    if (settings.storageProvider !== 'CLOUDINARY') {
      const mimeType = url.searchParams.get('mimeType') || 'application/octet-stream';
      const fileName = url.searchParams.get('fileName') || undefined;
      const size = url.searchParams.get('size');
      const upload = await auth.elevate(wixMediaFiles.generateFileResumableUploadUrl)(mimeType, {
        ...(fileName ? { fileName } : {}),
        ...(size ? { sizeInBytes: size } : {}),
        uploadProtocol: 'TUS',
      });
      return json(ok({ provider: 'WIX_MEDIA', uploadUrl: upload.uploadUrl, uploadToken: upload.uploadToken, uploadProtocol: upload.uploadProtocol, settings: toPublicStorageSettings(settings) }));
    }
    const apiSecret = await getCloudinaryApiSecret(settings);
    if (!settings.cloudName || !settings.apiKey || !apiSecret) return json(fail('Cloudinary storage is not configured'), 422);
    const timestamp = Math.floor(Date.now() / 1000);
    return json(ok({
      provider: 'CLOUDINARY',
      cloudName: settings.cloudName,
      apiKey: settings.apiKey,
      timestamp,
      signature: await cloudinarySignature(apiSecret, timestamp),
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloudName)}/auto/upload`,
      uploadPreset: settings.uploadPreset,
      ...(url.searchParams.get('purpose') ? { purpose: url.searchParams.get('purpose') } : {}),
    }));
  } catch (error) {
    console.error('Unable to prepare media upload', error);
    return json(fail('Unable to prepare media upload'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const plan = currentPlan();
    if (plan.maxFiles !== null && (await queryAll(COLLECTIONS.files)).length >= plan.maxFiles) return json(fail(`Your ${plan.name} plan allows up to ${plan.maxFiles} files. Upgrade to add more.`), 403);
    const settings = await getStorageSettings();
    const body = await readJson(request);
    const externalId = typeof body.publicId === 'string' ? body.publicId : typeof body.mediaId === 'string' ? body.mediaId : '';
    const fileUrl = typeof body.secureUrl === 'string' ? body.secureUrl : typeof body.url === 'string' ? body.url : '';
    if (!externalId || !fileUrl || typeof body.name !== 'string') return json(fail('Uploaded file metadata is required'), 400);
    const file = await insertItem(COLLECTIONS.files, {
      name: body.name,
      url: fileUrl,
      mediaId: externalId,
      externalId,
      resourceType: typeof body.resourceType === 'string' ? body.resourceType : 'auto',
      fileType: typeof body.fileType === 'string' ? body.fileType : 'FILE',
      fileSize: typeof body.fileSize === 'number' ? body.fileSize : 0,
      description: typeof body.description === 'string' ? body.description : '',
      label: typeof body.label === 'string' ? body.label.trim() : '',
      storageProvider: settings.storageProvider,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
    });
    return json(ok(toFile(file)), 201);
  } catch (error) {
    console.error('Unable to finalize media upload', error);
    return json(fail('Unable to finalize media upload'), 400);
  }
};
