import { extensions } from '@wix/astro/builders'

export default extensions.sitePlugin({
  id: 'ef31eec4-b1ad-4aa9-be57-4907a912e586',
  name: 'PDF & File Download for Store',
  marketData: {
    name: 'PDF & File Download for Store',
    description: 'Allow customers to download PDFs and files related to products.',
    logoUrl: '{{BASE_URL}}/product-downloads-icon.png',
  },
  placements: [
    {
      appDefinitionId: 'a0c68605-c2e7-4c8d-9ea1-767f9770e087',
      widgetId: '6a25b678-53ec-4b37-a190-65fcd1ca1a63',
      slotId: 'product-page-details-1',
    },
    {
      appDefinitionId: '1380b703-ce81-ff05-f115-39571d94dfcd',
      widgetId: '13a94f09-2766-3c40-4a32-8edb5acdd8bc',
      slotId: 'product-page-details-1',
    },
  ],
  installation: { autoAdd: true },
  tagName: 'product-downloads',
  element: './extensions/site/plugins/product-downloads/product-downloads.tsx',
  settings: './extensions/site/plugins/product-downloads/product-downloads.panel.tsx',
});
