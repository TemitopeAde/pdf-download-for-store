import { extensions } from '@wix/astro/builders'

export default extensions.dashboardPage({
  id: '3bc8984b-e329-40a9-9f32-2758cba910d6',
  title: 'PDF & File Download for Store',
  routePath: 'downloads',
  component: './extensions/dashboard/pages/products/products.tsx',
  fullPage: false,
});
