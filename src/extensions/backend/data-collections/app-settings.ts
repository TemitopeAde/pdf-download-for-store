import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'app-settings';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Download Settings',
  fields: [
    {
      type: 'TEXT',
      displayName: 'Settings Key',
      key: 'settingsKey',
    },
    {
      type: 'OBJECT',
      displayName: 'Settings',
      key: 'settings',
      objectOptions: { fields: [] },
    },
    { type: 'TEXT', displayName: 'Storage Provider', key: 'storageProvider' },
    { type: 'TEXT', displayName: 'Cloudinary Cloud Name', key: 'cloudName' },
    { type: 'TEXT', displayName: 'Cloudinary API Key', key: 'apiKey' },
    { type: 'TEXT', displayName: 'Cloudinary Secret Name', key: 'cloudinarySecretName' },
    { type: 'TEXT', displayName: 'Cloudinary Secret ID', key: 'cloudinarySecretId' },
    { type: 'TEXT', displayName: 'Cloudinary Upload Preset', key: 'uploadPreset' },
    { type: 'TEXT', displayName: 'Country Gate Mode', key: 'countryGateMode' },
    { type: 'ARRAY_STRING', displayName: 'Country Codes', key: 'countryCodes' },
    { type: 'BOOLEAN', displayName: 'Allow When Country Lookup Fails', key: 'countryGateFailOpen' },
    { type: 'TEXT', displayName: 'View Button Text', key: 'viewButtonText' },
    { type: 'BOOLEAN', displayName: 'Show View Button', key: 'showViewButton' },
  ],
  displayField: 'settingsKey',
  dataPermissions: {
    itemInsert: 'CMS_EDITOR',
    itemRead: 'ANYONE',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [{ fields: [{ path: 'settingsKey', order: 'ASC' }], unique: true }],
  initialData: [],
} satisfies DataCollection;
