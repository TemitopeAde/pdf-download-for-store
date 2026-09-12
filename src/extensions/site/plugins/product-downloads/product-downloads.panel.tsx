import React, { type FC, useCallback, useEffect, useState } from 'react';
import { widget } from '@wix/editor';
import { Box, Button, ColorInput, Dropdown, FormField, Input, NumberInput, SidePanel, Text, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';

type PluginSettings = {
  displayName: string;
  layout: string;
  stylePreset: string;
  buttonText: string;
  viewButtonText: string;
  showViewButton: boolean;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  borderRadius: number;
  spacing: number;
};

const defaults: PluginSettings = { displayName: 'Downloads', layout: 'LIST', stylePreset: 'MINIMAL', buttonText: 'Download', viewButtonText: 'View', showViewButton: true, textColor: '#111827', buttonColor: '#111827', buttonTextColor: '#ffffff', borderRadius: 8, spacing: 10 };

const propNames = Object.keys(defaults) as Array<keyof PluginSettings>;

const Panel: FC = () => {
  const [settings, setSettings] = useState<PluginSettings>(defaults);
  useEffect(() => {
    Promise.all(propNames.map(async (name) => [name, await widget.getProp(name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`))] as const))
      .then((entries) => setSettings((current) => Object.fromEntries(entries.map(([key, value]) => { const fallback = current[key]; const parsed = typeof fallback === 'boolean' ? value === 'true' : typeof fallback === 'number' ? Number(value) || fallback : String(value ?? fallback); return [key, parsed]; })) as unknown as PluginSettings))
      .catch((error) => console.error('Failed to load product download settings', error));
  }, []);
  const set = useCallback(<K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    const prop = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    void widget.setProp(prop, String(value));
  }, []);
  return <WixDesignSystemProvider><SidePanel width="320" height="100vh"><SidePanel.Content noPadding stretchVertically><Box direction="vertical" gap="SP4" padding="SP4">
    <Text appearance="H2">Product downloads</Text><Text secondary>The widget lists every file assigned to this product in the Product Downloads dashboard. Choose a visual style below.</Text>
    <FormField label="Style preset"><Dropdown selectedId={settings.stylePreset} options={[{ id: 'MINIMAL', value: 'Minimal' }, { id: 'SOFT', value: 'Soft card' }, { id: 'OUTLINE', value: 'Outline' }, { id: 'DARK', value: 'Dark' }]} onSelect={(option) => set('stylePreset', String(option.id))} /></FormField>
    <FormField label="Layout"><Dropdown selectedId={settings.layout} options={[{ id: 'LIST', value: 'List' }, { id: 'BUTTONS', value: 'Buttons' }, { id: 'CARDS', value: 'Cards' }, { id: 'ACCORDION', value: 'Accordion' }]} onSelect={(option) => set('layout', String(option.id))} /></FormField>
    <FormField label="Section title"><Input value={settings.displayName} onChange={(event) => set('displayName', event.target.value)} /></FormField>
    <FormField label="Download button text"><Input value={settings.buttonText} onChange={(event) => set('buttonText', event.target.value)} /></FormField>
    <FormField label="View PDF button text"><Input value={settings.viewButtonText} onChange={(event) => set('viewButtonText', event.target.value)} /></FormField>
    <Button priority="secondary" onClick={() => set('showViewButton', !settings.showViewButton)}>{settings.showViewButton ? 'Hide PDF view button' : 'Show PDF view button'}</Button>
    <FormField label="Text color"><ColorInput value={settings.textColor} onChange={(value) => set('textColor', String(value))} /></FormField>
    <FormField label="Button color"><ColorInput value={settings.buttonColor} onChange={(value) => set('buttonColor', String(value))} /></FormField>
    <FormField label="Button text color"><ColorInput value={settings.buttonTextColor} onChange={(value) => set('buttonTextColor', String(value))} /></FormField>
    <FormField label="Border radius"><NumberInput value={settings.borderRadius} min={0} max={32} onChange={(value) => set('borderRadius', Number(value) || 0)} /></FormField>
    <FormField label="Spacing"><NumberInput value={settings.spacing} min={4} max={40} onChange={(value) => set('spacing', Number(value) || 10)} /></FormField>
  </Box></SidePanel.Content></SidePanel></WixDesignSystemProvider>;
};

export default Panel;
