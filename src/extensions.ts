import { app } from '@wix/astro/builders';
import dashboard from './extensions/dashboard/pages/products/products.extension.ts';

import productDownloads from './extensions/site/plugins/product-downloads/product-downloads.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

export default app()
  .use(dashboard).use(productDownloads).use(dataCollections);
