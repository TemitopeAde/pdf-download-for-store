import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { dashboardRequest } from '@/lib/dashboard-api';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { AppSettings, StorageProvider, WidgetLayout } from '@/lib/types';
import { messageFrom } from './format';
import type { DashboardResponse } from './types';
import { ErrorBanner, PageHeader, StatusBadge } from './ui-bits';

export function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [secret, setSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardRequest<DashboardResponse<Partial<AppSettings>>>('/api/settings')
      .then((response) => {
        if (response.data) setSettings((current) => ({ ...current, ...response.data }));
      })
      .catch((reason: unknown) => setError(messageFrom(reason, 'Unable to load settings')));
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSaved(false);
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      await dashboardRequest('/api/settings', { method: 'POST', body: JSON.stringify({ ...settings, ...(secret ? { apiSecret: secret } : {}) }) });
      setSecret('');
      setSaved(true);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to save settings'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Choose where files live, who can download them, and the defaults for new product-page widgets."
        actions={<Button type="button" disabled={saving} onClick={() => void save()}>{saving ? 'Saving…' : 'Save settings'}</Button>}
      />
      {error ? <ErrorBanner message={error} /> : null}
      {saved ? <StatusBadge tone="success">Settings saved</StatusBadge> : null}
      <Tabs defaultValue="storage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="access">Access rules</TabsTrigger>
          <TabsTrigger value="widget">Widget defaults</TabsTrigger>
        </TabsList>
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>File storage</CardTitle>
              <CardDescription>Wix Media Manager is the default. Cloudinary credentials stay server-side.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Storage provider</Label>
                <Select value={settings.storageProvider} onValueChange={(value) => update('storageProvider', value as StorageProvider)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WIX_MEDIA">Wix Media Manager</SelectItem>
                    <SelectItem value="CLOUDINARY">Cloudinary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.storageProvider === 'CLOUDINARY' ? (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="cloud-name" label="Cloud name" value={settings.cloudName ?? ''} onChange={(value) => update('cloudName', value)} />
                  <Field id="api-key" label="API key" value={settings.apiKey ?? ''} onChange={(value) => update('apiKey', value)} />
                  <div className="space-y-2">
                    <Label htmlFor="api-secret">API secret</Label>
                    <Input id="api-secret" type="password" value={secret} placeholder="Leave blank to keep the saved secret" onChange={(event) => setSecret(event.target.value)} />
                  </div>
                  <Field id="upload-preset" label="Signed upload preset (optional)" value={settings.uploadPreset ?? ''} onChange={(value) => update('uploadPreset', value)} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>Country gating</CardTitle>
              <CardDescription>Country is resolved server-side from the visitor IP.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Rule</Label>
                <Select value={settings.countryGateMode} onValueChange={(value) => update('countryGateMode', value as AppSettings['countryGateMode'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFF">Allow every country</SelectItem>
                    <SelectItem value="ALLOW">Allow only these countries</SelectItem>
                    <SelectItem value="BLOCK">Block these countries</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.countryGateMode !== 'OFF' ? (
                <div className="space-y-2">
                  <Label htmlFor="countries">Country codes</Label>
                  <Input id="countries" value={settings.countryCodes.join(', ')} placeholder="US, GB, NG" onChange={(event) => update('countryCodes', event.target.value.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean))} />
                  <p className="text-xs text-muted-foreground">Use ISO 3166-1 alpha-2 codes separated by commas.</p>
                </div>
              ) : null}
              <ToggleRow label="Allow when lookup fails" hint="Prevents a geolocation outage from blocking downloads." checked={settings.countryGateFailOpen} onCheckedChange={(value) => update('countryGateFailOpen', value)} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="widget">
          <Card>
            <CardHeader>
              <CardTitle>Widget defaults</CardTitle>
              <CardDescription>Used by new product-page plugin instances and as fallbacks when a widget does not override them.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field id="title" label="Section title" value={settings.title} onChange={(value) => update('title', value)} />
              <Field id="button" label="Download button" value={settings.buttonText} onChange={(value) => update('buttonText', value)} />
              <Field id="view-button" label="View button" value={settings.viewButtonText} onChange={(value) => update('viewButtonText', value)} />
              <div className="space-y-2">
                <Label>Default layout</Label>
                <Select value={settings.layout} onValueChange={(value) => update('layout', value as WidgetLayout)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['LIST', 'BUTTONS', 'CARDS', 'ACCORDION'] as const).map((layout) => <SelectItem key={layout} value={layout}>{layout}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Default sort</Label>
                <Select value={settings.defaultSort} onValueChange={(value) => update('defaultSort', value as AppSettings['defaultSort'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MANUAL">Manual</SelectItem>
                    <SelectItem value="NAME">Name</SelectItem>
                    <SelectItem value="TYPE">Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <ToggleRow label="Show file size" checked={settings.showFileSize} onCheckedChange={(value) => update('showFileSize', value)} />
              <ToggleRow label="Show file type" checked={settings.showFileType} onCheckedChange={(value) => update('showFileType', value)} />
              <ToggleRow label="Show description" checked={settings.showDescription} onCheckedChange={(value) => update('showDescription', value)} />
              <ToggleRow label="Open in a new tab" checked={settings.openInNewTab} onCheckedChange={(value) => update('openInNewTab', value)} />
              <ToggleRow label="Show view button" checked={settings.showViewButton} onCheckedChange={(value) => update('showViewButton', value)} />
              <ToggleRow label="Analytics enabled" hint="Records downloads for the Analytics page." checked={settings.analyticsEnabled} onCheckedChange={(value) => update('analyticsEnabled', value)} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function ToggleRow({ label, hint, checked, onCheckedChange }: { label: string; hint?: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4 md:col-span-2">
      <div>
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
