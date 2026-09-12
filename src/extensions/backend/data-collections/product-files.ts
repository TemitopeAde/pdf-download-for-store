import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'product-files';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Product File Assignments',
  fields: [
    {
      type: 'TEXT',
      displayName: 'Product ID',
      key: 'productId',
    },
    {
      type: 'TEXT',
      displayName: 'File ID',
      key: 'fileId',
    },
    { type: 'TEXT', displayName: 'Label', key: 'label' },
    { type: 'TEXT', displayName: 'Description', key: 'description' },
    { type: 'NUMBER', displayName: 'Sort Order', key: 'sortOrder' },
    { type: 'BOOLEAN', displayName: 'Visible', key: 'isVisible' },
    { type: 'TEXT', displayName: 'Download Access', key: 'visibility' },
  ],
  displayField: 'productId',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    itemRead: 'ANYONE',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [
    { fields: [{ path: 'productId', order: 'ASC' }, { path: 'fileId', order: 'ASC' }], unique: true },
    { fields: [{ path: 'productId', order: 'ASC' }, { path: 'sortOrder', order: 'ASC' }] },
  ],
  initialData: [],
} satisfies DataCollection;
