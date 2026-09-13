import { app } from '@wix/astro/builders';
import dashboard from './extensions/dashboard/pages/products/products.extension.ts';

import productDownloads from './extensions/site/plugins/product-downloads/product-downloads.extension.ts';

import dataCollections from './extensions/backend/data-collections/data-collections.extension.ts';

import appInstalled from './extensions/backend/events/app-installed/app-installed.extension.ts';

import paidPlanPurchased from './extensions/backend/events/paid-plan-purchased/paid-plan-purchased.extension.ts';

import paidPlanChanged from './extensions/backend/events/paid-plan-changed/paid-plan-changed.extension.ts';

export default app()
  .use(dashboard).use(productDownloads).use(dataCollections).use(appInstalled).use(paidPlanPurchased).use(paidPlanChanged);
