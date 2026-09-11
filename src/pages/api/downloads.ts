import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { files as mediaFiles } from '@wix/media';
import { COLLECTIONS, fail, getCollectionItem, json, ok, readJson, toFile } from '../../lib/data';
import { checkCountryGate, resolveCountry } from '../../lib/geolocation';
import { getStorageSettings } from '../../lib/storage';
import { getProductFiles } from '../../lib/assignments';
import { currentMemberPurchasedProduct } from '../../lib/purchases';

/**
This file defines an HTTP endpoint exposed at `/api/downloads`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async ({ request, url }) => {
  const fileId = url.searchParams.get('fileId');
  const productId = url.searchParams.get('productId') ?? '';
  if (!fileId) return json(fail('fileId is required'), 400);
  try {
    const settings = await getStorageSettings();
    let countryCode: string | undefined;
    try { countryCode = await resolveCountry(request); } catch (error) { console.error('Country lookup failed', error); }
    const gate = checkCountryGate(settings.countryGateMode, settings.countryCodes, countryCode, settings.countryGateFailOpen);
    if (!gate.allowed) return json(fail(gate.reason ?? 'Downloads are not available in your country'), 403);
    const record = await getCollectionItem(COLLECTIONS.files, fileId);
    if (!record) return json(fail('File not found'), 404);
    const file = toFile(record);
    if (!productId) return json(fail('productId is required'), 400);
    const assignment = (await getProductFiles(productId)).find((entry) => entry.fileId === fileId);
    if (assignment?.visibility === 'MEMBERS_ONLY') {
      const token = await auth.getTokenInfo();
      if (!token.active || token.subjectType !== 'MEMBER') return json(fail('Please log in to download this file'), 401);
    }
    if (assignment?.visibility === 'PURCHASE_REQUIRED' && !(await currentMemberPurchasedProduct(productId))) {
      return json(fail('Purchase the product to download this file'), 403);
    }
    if (settings.analyticsEnabled) {
      try {
        await items.insert(COLLECTIONS.downloadEvents, { fileId, productId, downloadedAt: new Date(), countryCode: countryCode ?? '' });
      } catch (error) {
        console.error('Download event could not be recorded', error);
      }
    }
    let downloadUrl = file.url;
    if (file.storageProvider !== 'CLOUDINARY') {
      if (!file.mediaId) return json(fail('Wix Media ID is missing for this file'), 422);
      const generated = await auth.elevate(mediaFiles.generateFileDownloadUrl)(file.mediaId, { expirationInMinutes: 15 });
      downloadUrl = generated.downloadUrls?.[0]?.url ?? '';
      if (!downloadUrl) return json(fail('Unable to generate a Wix download URL'), 502);
    }
    return json(ok({ url: downloadUrl, countryCode }));
  } catch (error) {
    console.error('Unable to prepare download', error);
    return json(fail('Unable to prepare download'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await readJson(request);
    const fileId = typeof body.fileId === 'string' ? body.fileId : '';
    if (!fileId) return json(fail('fileId is required'), 400);
    const productId = typeof body.productId === 'string' ? body.productId : '';
    const settings = await getStorageSettings();
    let countryCode: string | undefined;
    try { countryCode = await resolveCountry(request); } catch (error) { console.error('Country lookup failed', error); }
    const gate = checkCountryGate(settings.countryGateMode, settings.countryCodes, countryCode, settings.countryGateFailOpen);
    if (!gate.allowed) return json(fail(gate.reason ?? 'Downloads are not available in your country'), 403);
    await items.insert(COLLECTIONS.downloadEvents, { fileId, productId, downloadedAt: new Date(), countryCode: countryCode ?? '' });
    return json(ok({ countryCode }));
  } catch (error) {
    console.error('Unable to track download', error);
    return json(fail('Unable to track download'), 400);
  }
};
