import { items } from '@wix/data';
import { secrets } from '@wix/secrets';
import { auth } from '@wix/essentials';
import { COLLECTIONS, DEFAULT_SETTINGS, insertItem, updateItem } from './data';
import type { AppSettings, StorageProvider } from './types';

interface SettingsRecord {
  _id?: string;
  settingsKey?: string;
  settings?: Record<string, unknown>;
  storageProvider?: string;
  cloudName?: string;
  apiKey?: string;
  cloudinarySecretName?: string;
  cloudinarySecretId?: string;
  uploadPreset?: string;
  countryGateMode?: string;
  countryCodes?: string[];
  countryGateFailOpen?: boolean;
}

export interface PublicStorageSettings {
  storageProvider: StorageProvider;
  cloudName?: string;
  apiKey?: string;
  uploadPreset?: string;
}

const asSettings = (value: unknown): SettingsRecord => {
  if (typeof value === 'object' && value !== null) return value as SettingsRecord;
  return {};
};

const CLOUDINARY_SECRET_NAME = 'pdf_download_cloudinary_api_secret';

export async function getStorageSettings(): Promise<AppSettings & { apiSecret?: string }> {
  const result = await items.query(COLLECTIONS.settings).eq('settingsKey', 'default').limit(1).find();
  const record = asSettings(result.items[0]);
  const nested = record.settings ?? {};
  const provider = record.storageProvider === 'CLOUDINARY' ? 'CLOUDINARY' : 'WIX_MEDIA';
  return {
    ...DEFAULT_SETTINGS,
    storageProvider: provider,
    cloudName: typeof record.cloudName === 'string' ? record.cloudName : typeof nested.cloudName === 'string' ? nested.cloudName : undefined,
    apiKey: typeof record.apiKey === 'string' ? record.apiKey : typeof nested.apiKey === 'string' ? nested.apiKey : undefined,
    cloudinarySecretName: typeof record.cloudinarySecretName === 'string' ? record.cloudinarySecretName : typeof nested.cloudinarySecretName === 'string' ? nested.cloudinarySecretName : undefined,
    cloudinarySecretId: typeof record.cloudinarySecretId === 'string' ? record.cloudinarySecretId : typeof nested.cloudinarySecretId === 'string' ? nested.cloudinarySecretId : undefined,
    uploadPreset: typeof record.uploadPreset === 'string' ? record.uploadPreset : typeof nested.uploadPreset === 'string' ? nested.uploadPreset : undefined,
    countryGateMode: record.countryGateMode === 'ALLOW' || record.countryGateMode === 'BLOCK' ? record.countryGateMode : nested.countryGateMode === 'ALLOW' || nested.countryGateMode === 'BLOCK' ? nested.countryGateMode : 'OFF',
    countryCodes: Array.isArray(record.countryCodes) ? record.countryCodes.filter((value): value is string => typeof value === 'string') : Array.isArray(nested.countryCodes) ? nested.countryCodes.filter((value): value is string => typeof value === 'string') : [],
    countryGateFailOpen: typeof record.countryGateFailOpen === 'boolean' ? record.countryGateFailOpen : typeof nested.countryGateFailOpen === 'boolean' ? nested.countryGateFailOpen : true,
    ...(typeof nested === 'object' ? nested : {}),
  } as AppSettings & { apiSecret?: string };
}

export async function getCloudinaryApiSecret(settings?: AppSettings & { apiSecret?: string }): Promise<string | undefined> {
  const current = settings ?? await getStorageSettings();
  const name = (current as AppSettings & { cloudinarySecretName?: string }).cloudinarySecretName;
  if (!name) return undefined;
  try {
    const response = await auth.elevate(secrets.getSecretValue)(name);
    return response.value || undefined;
  } catch (error) {
    console.error('Unable to retrieve Cloudinary secret from Wix Secrets Vault', error);
    return undefined;
  }
}

export function toPublicStorageSettings(settings: AppSettings & { apiSecret?: string }): PublicStorageSettings {
  return {
    storageProvider: settings.storageProvider,
    cloudName: settings.cloudName,
    apiKey: settings.apiKey,
    uploadPreset: settings.uploadPreset,
  };
}

export function toPublicAppSettings(settings: AppSettings & { apiSecret?: string }): AppSettings {
  return {
    title: settings.title,
    buttonText: settings.buttonText,
    layout: settings.layout,
    showFileSize: settings.showFileSize,
    showFileType: settings.showFileType,
    showDescription: settings.showDescription,
    openInNewTab: settings.openInNewTab,
    analyticsEnabled: settings.analyticsEnabled,
    defaultSort: settings.defaultSort,
    storageProvider: settings.storageProvider,
    ...(settings.cloudName ? { cloudName: settings.cloudName } : {}),
    ...(settings.apiKey ? { apiKey: settings.apiKey } : {}),
    ...(settings.uploadPreset ? { uploadPreset: settings.uploadPreset } : {}),
    countryGateMode: settings.countryGateMode,
    countryCodes: settings.countryCodes,
    countryGateFailOpen: settings.countryGateFailOpen,
    viewButtonText: settings.viewButtonText,
    showViewButton: settings.showViewButton,
  };
}

export async function cloudinarySignature(apiSecret: string, timestamp: number): Promise<string> {
  const bytes = new TextEncoder().encode(`timestamp=${timestamp}${apiSecret}`);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function saveStorageSettings(input: Partial<AppSettings> & { apiSecret?: string }): Promise<AppSettings> {
  const current = await getStorageSettings();
  const merged: AppSettings & { apiSecret?: string } = {
    ...current,
    ...input,
    storageProvider: input.storageProvider === 'CLOUDINARY' ? 'CLOUDINARY' : input.storageProvider === 'WIX_MEDIA' ? 'WIX_MEDIA' : current.storageProvider,
    countryGateMode: input.countryGateMode === 'ALLOW' || input.countryGateMode === 'BLOCK' || input.countryGateMode === 'OFF' ? input.countryGateMode : current.countryGateMode,
    countryCodes: input.countryCodes?.map((code) => code.trim().toUpperCase()).filter(Boolean) ?? current.countryCodes,
    countryGateFailOpen: typeof input.countryGateFailOpen === 'boolean' ? input.countryGateFailOpen : current.countryGateFailOpen,
  };
  const result = await items.query(COLLECTIONS.settings).eq('settingsKey', 'default').limit(1).find();
  const existing = asSettings(result.items[0]);
  const value = {
    settingsKey: 'default',
    settings: merged,
    storageProvider: merged.storageProvider,
    cloudName: merged.cloudName ?? '',
    apiKey: merged.apiKey ?? '',
    cloudinarySecretName: (current as AppSettings & { cloudinarySecretName?: string }).cloudinarySecretName ?? CLOUDINARY_SECRET_NAME,
    cloudinarySecretId: (current as AppSettings & { cloudinarySecretId?: string }).cloudinarySecretId ?? '',
    uploadPreset: merged.uploadPreset ?? '',
    countryGateMode: merged.countryGateMode,
    countryCodes: merged.countryCodes,
    countryGateFailOpen: merged.countryGateFailOpen,
  };
  const incomingSecret = input.apiSecret?.trim();
  if (incomingSecret) {
    const currentSecretId = (current as AppSettings & { cloudinarySecretId?: string }).cloudinarySecretId;
    const secret = { name: CLOUDINARY_SECRET_NAME, description: 'Cloudinary API secret for PDF downloads', value: incomingSecret };
    const secretId = currentSecretId
      ? (await auth.elevate(secrets.updateSecret)(currentSecretId, secret), currentSecretId)
      : await auth.elevate(secrets.createSecret)(secret);
    value.cloudinarySecretName = CLOUDINARY_SECRET_NAME;
    value.cloudinarySecretId = secretId;
  }
  if (existing._id) await updateItem(COLLECTIONS.settings, { ...value, _id: existing._id });
  else await insertItem(COLLECTIONS.settings, value);
  return toPublicAppSettings(merged);
}
