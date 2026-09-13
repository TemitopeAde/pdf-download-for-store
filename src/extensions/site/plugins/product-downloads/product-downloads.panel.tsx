import React, { type FC, useCallback, useEffect, useState } from 'react';
import { inputs, widget } from '@wix/editor';
import { Box, Button, Dropdown, FillPreview, FormField, SidePanel, Text, WixDesignSystemProvider } from '@wix/design-system';
import '@wix/design-system/styles.global.css';
import { LocaleProvider, useLocale } from '../../../../lib/i18n';

type FontSetting = { font: string; textDecoration: string };
type PluginSettings = { labelFont: FontSetting; labelColor: string; layout: 'STACK' | 'ROW' };
const defaults: PluginSettings = { labelFont: { font: 'system-ui', textDecoration: '' }, labelColor: '#111827', layout: 'STACK' };

const Panel: FC = () => {
  const { t } = useLocale();
  const [settings, setSettings] = useState<PluginSettings>(defaults);
  useEffect(() => {
    Promise.all((Object.keys(defaults) as Array<keyof PluginSettings>).map(async (key) => [key, await widget.getProp(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`))] as const))
      .then((entries) => setSettings((current) => {
        const next = {
          ...current,
          ...Object.fromEntries(entries.map(([key, value]) => {
          if (key === 'labelFont') {
            try {
              const parsed = JSON.parse(String(value));
              if (parsed && typeof parsed.font === 'string') return [key, { font: parsed.font, textDecoration: typeof parsed.textDecoration === 'string' ? parsed.textDecoration : '' }];
            } catch { /* Support the old shorthand value. */ }
            return [key, { font: String(value || current.labelFont.font), textDecoration: '' }];
          }
          return [key, String(value || current[key])];
          })) as Partial<PluginSettings>,
        };
        void widget.setPreloadFonts([next.labelFont.font]);
        return next;
      }));
  }, []);
  const set = useCallback(<K extends keyof PluginSettings>(key: K, value: PluginSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    const propValue = key === 'labelFont' ? JSON.stringify(value) : String(value);
    void widget.setProp(key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`), propValue);
    if (key === 'labelFont') {
      // Wix preloads fonts used by custom elements only when the settings panel registers them.
      void widget.setPreloadFonts([(value as FontSetting).font]);
    }
  }, []);
  const chooseFont = useCallback(() => {
    void inputs.selectFont(settings.labelFont, { onChange: (value) => set('labelFont', { font: value.font, textDecoration: value.textDecoration || '' }) });
  }, [set, settings.labelFont]);
  const chooseColor = useCallback(() => {
    void inputs.selectColor(settings.labelColor, { onChange: (value) => { if (value) set('labelColor', value); } });
  }, [set, settings.labelColor]);
  return <WixDesignSystemProvider><SidePanel width="320" height="100vh"><SidePanel.Content noPadding stretchVertically><Box direction="vertical" gap="SP4" padding="SP4"><Text appearance="H2">{t('productDownloads')}</Text><Text secondary>{t('pluginIntro')}</Text><FormField label={t('buttonLayout')}><Dropdown size="small" options={[{ id: 'STACK', value: t('layoutStack') }, { id: 'ROW', value: t('layoutRow') }]} selectedId={settings.layout} valueParser={(option) => option.value} onSelect={(option) => set('layout', option.id === 'ROW' ? 'ROW' : 'STACK')} /></FormField><FormField label={t('labelFont')}><Button priority="secondary" fullWidth onClick={chooseFont}><Text size="small" ellipsis>{settings.labelFont.font === 'system-ui' ? t('chooseFont') : settings.labelFont.font}</Text></Button></FormField><FormField label={t('labelColor')}><Box width="30px" height="30px"><FillPreview fill={settings.labelColor} onClick={chooseColor} /></Box></FormField></Box></SidePanel.Content></SidePanel></WixDesignSystemProvider>;
};

export default function ProductDownloadsPanel() {
  return <LocaleProvider><Panel /></LocaleProvider>;
}
