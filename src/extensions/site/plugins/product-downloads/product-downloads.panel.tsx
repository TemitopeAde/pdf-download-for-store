import React, { type FC } from 'react';
import { Box, SidePanel, Text, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

const Panel: FC = () => {
  return <WixDesignSystemProvider><SidePanel width="320" height="100vh"><SidePanel.Content noPadding stretchVertically><Box direction="vertical" gap="SP4" padding="SP4"><Text appearance="H2">Product downloads</Text><Text secondary>Each assigned file appears as a button. Set its label when assigning or uploading the file; if no label is set, the button says Download.</Text></Box></SidePanel.Content></SidePanel></WixDesignSystemProvider>;
};

export default Panel;
