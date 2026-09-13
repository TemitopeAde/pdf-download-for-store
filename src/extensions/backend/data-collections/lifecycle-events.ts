import type { DataCollection } from '@wix/astro/builders'

export const collectionIdSuffix = 'lifecycle-events';

export default {
  idSuffix: collectionIdSuffix,
  displayName: 'Lifecycle Events',
  fields: [
    { type: 'TEXT', displayName: 'Title', key: 'title' },
    { type: 'TEXT', displayName: 'Event Type', key: 'eventType' },
    { type: 'TEXT', displayName: 'Instance ID', key: 'instanceId' },
    { type: 'TEXT', displayName: 'Site URL', key: 'siteUrl' },
    { type: 'TEXT', displayName: 'Site Display Name', key: 'siteDisplayName' },
    { type: 'TEXT', displayName: 'Owner Email', key: 'ownerEmail' },
    { type: 'TEXT', displayName: 'Vendor Product ID', key: 'vendorProductId' },
    { type: 'TEXT', displayName: 'Previous Vendor Product ID', key: 'previousVendorProductId' },
    { type: 'TEXT', displayName: 'Billing Cycle', key: 'cycle' },
    { type: 'TEXT', displayName: 'Invoice ID', key: 'invoiceId' },
    { type: 'TEXT', displayName: 'Event Payload JSON', key: 'eventPayloadJson' },
    { type: 'TEXT', displayName: 'Notified Email', key: 'notifiedEmail' },
    { type: 'DATETIME', displayName: 'Occurred At', key: 'occurredAt' },
  ],
  displayField: 'title',
  dataPermissions: {
    itemInsert: 'PRIVILEGED',
    itemRead: 'CMS_EDITOR',
    itemRemove: 'PRIVILEGED',
    itemUpdate: 'PRIVILEGED',
  },
  indexes: [
    { fields: [{ path: 'occurredAt', order: 'DESC' }] },
    { fields: [{ path: 'eventType', order: 'ASC' }, { path: 'occurredAt', order: 'DESC' }] },
  ],
  initialData: [],
} satisfies DataCollection;
