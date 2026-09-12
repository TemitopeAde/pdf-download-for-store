import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'assignment-rules';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Assignment Rules',
  fields: [
    {
      type: 'TEXT',
      displayName: 'Assignment Type',
      key: 'type',
    },
    {
      type: 'TEXT',
      displayName: 'Target ID',
      key: 'targetId',
    },
    { type: 'TEXT', displayName: 'File ID', key: 'fileId' },
    { type: 'TEXT', displayName: 'Label', key: 'label' },
    { type: 'TEXT', displayName: 'Description', key: 'description' },
    { type: 'NUMBER', displayName: 'Sort Order', key: 'sortOrder' },
    { type: 'BOOLEAN', displayName: 'Visible', key: 'isVisible' },
    { type: 'TEXT', displayName: 'Download Access', key: 'visibility' },
  ],
  displayField: 'type',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    itemRead: 'ANYONE',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [
    { fields: [{ path: 'type', order: 'ASC' }, { path: 'targetId', order: 'ASC' }, { path: 'fileId', order: 'ASC' }], unique: true },
  ],
  initialData: [],
} satisfies DataCollection;
