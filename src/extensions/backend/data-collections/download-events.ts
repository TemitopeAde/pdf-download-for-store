import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'download-events';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Download Events',
  fields: [
    {
      type: 'TEXT',
      displayName: 'File ID',
      key: 'fileId',
    },
    {
      type: 'TEXT',
      displayName: 'Product ID',
      key: 'productId',
    },
    { type: 'DATETIME', displayName: 'Downloaded At', key: 'downloadedAt' },
    { type: 'TEXT', displayName: 'Member ID', key: 'memberId' },
    { type: 'TEXT', displayName: 'Country Code', key: 'countryCode' },
  ],
  displayField: 'fileId',
  dataPermissions: {
    itemInsert: 'ANYONE',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'CMS_EDITOR',
    itemUpdate: 'CMS_EDITOR',
  },
  indexes: [
    { fields: [{ path: 'downloadedAt', order: 'DESC' }] },
    { fields: [{ path: 'fileId', order: 'ASC' }, { path: 'downloadedAt', order: 'DESC' }] },
    { fields: [{ path: 'productId', order: 'ASC' }, { path: 'downloadedAt', order: 'DESC' }] },
  ],
  initialData: [],
} satisfies DataCollection;
