import { extensions } from '@wix/astro/builders'

import filesCollection from './files';

import productFilesCollection from './product-files';

import assignmentRulesCollection from './assignment-rules';

import downloadEventsCollection from './download-events';

import appSettingsCollection from './app-settings';

import lifecycleEventsCollection from './lifecycle-events';

export default extensions.dataCollections({
  id: 'd994ab5e-0e32-4b39-84b9-e8e11ae5f340',
  name: 'Data Collections',
  collections: [
    filesCollection,
    productFilesCollection,
    assignmentRulesCollection,
    downloadEventsCollection,
    appSettingsCollection,
    lifecycleEventsCollection
  ],
});
