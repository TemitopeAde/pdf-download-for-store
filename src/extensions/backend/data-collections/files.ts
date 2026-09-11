import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'files';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Downloadable Files',
  fields: [
    {
      type: 'TEXT',
      displayName: 'Display Name',
      key: 'name',
    },
    {
      type: 'TEXT',
      displayName: 'Media ID',
      key: 'mediaId',
    },
    { type: 'URL', displayName: 'URL', key: 'url' },
    { type: 'TEXT', displayName: 'File Type', key: 'fileType' },
    { type: 'TEXT', displayName: 'Storage Provider', key: 'storageProvider' },
    { type: 'TEXT', displayName: 'External Asset ID', key: 'externalId' },
    { type: 'TEXT', displayName: 'Resource Type', key: 'resourceType' },
    { type: 'NUMBER', displayName: 'File Size', key: 'fileSize' },
    { type: 'TEXT', displayName: 'Description', key: 'description' },
    { type: 'DATETIME', displayName: 'Created At', key: 'createdAt' },
    { type: 'DATETIME', displayName: 'Updated At', key: 'updatedAt' },
    { type: 'BOOLEAN', displayName: 'Active', key: 'isActive' },
  ],
  displayField: 'name',
  dataPermissions: {
    itemInsert: 'CMS_EDITOR',
    itemRead: 'ANYONE',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [
    { fields: [{ path: 'mediaId', order: 'ASC' }], unique: true },
    { fields: [{ path: 'fileType', order: 'ASC' }] },
  ],
  initialData: [],
} satisfies DataCollection;
