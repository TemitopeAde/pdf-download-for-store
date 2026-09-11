import type { APIRoute } from 'astro';
import { json, readJson, fail, ok } from '../../lib/data';
import { getStorageSettings, saveStorageSettings, toPublicAppSettings } from '../../lib/storage';

/**
This file defines an HTTP endpoint exposed at `/api/settings`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async () => {
  try {
    return json(ok(toPublicAppSettings(await getStorageSettings())));
  } catch (error) {
    console.error('Unable to load storage settings', error);
    return json(fail('Unable to load storage settings'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await readJson(request);
    const settings = await saveStorageSettings({
      storageProvider: body.storageProvider === 'CLOUDINARY' ? 'CLOUDINARY' : 'WIX_MEDIA',
      cloudName: typeof body.cloudName === 'string' ? body.cloudName : undefined,
      apiKey: typeof body.apiKey === 'string' ? body.apiKey : undefined,
      apiSecret: typeof body.apiSecret === 'string' ? body.apiSecret : undefined,
      uploadPreset: typeof body.uploadPreset === 'string' ? body.uploadPreset : undefined,
      countryGateMode: body.countryGateMode === 'ALLOW' || body.countryGateMode === 'BLOCK' ? body.countryGateMode : 'OFF',
      countryCodes: Array.isArray(body.countryCodes) ? body.countryCodes.filter((value): value is string => typeof value === 'string') : [],
      countryGateFailOpen: typeof body.countryGateFailOpen === 'boolean' ? body.countryGateFailOpen : true,
      title: typeof body.title === 'string' ? body.title : undefined,
      buttonText: typeof body.buttonText === 'string' ? body.buttonText : undefined,
      viewButtonText: typeof body.viewButtonText === 'string' ? body.viewButtonText : undefined,
      layout: body.layout === 'BUTTONS' || body.layout === 'CARDS' || body.layout === 'ACCORDION' || body.layout === 'LIST' ? body.layout : undefined,
      defaultSort: body.defaultSort === 'NAME' || body.defaultSort === 'TYPE' || body.defaultSort === 'MANUAL' ? body.defaultSort : undefined,
      showFileSize: typeof body.showFileSize === 'boolean' ? body.showFileSize : undefined,
      showFileType: typeof body.showFileType === 'boolean' ? body.showFileType : undefined,
      showDescription: typeof body.showDescription === 'boolean' ? body.showDescription : undefined,
      openInNewTab: typeof body.openInNewTab === 'boolean' ? body.openInNewTab : undefined,
      analyticsEnabled: typeof body.analyticsEnabled === 'boolean' ? body.analyticsEnabled : undefined,
      showViewButton: typeof body.showViewButton === 'boolean' ? body.showViewButton : undefined,
    });
    return json(ok(settings));
  } catch (error) {
    console.error('Unable to save storage settings', error);
    return json(fail('Unable to save storage settings'), 400);
  }
};
