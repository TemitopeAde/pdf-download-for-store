import { useEffect, useState } from 'react';
import { toast, Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardRequest } from '@/lib/dashboard-api';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { AppSettings, StorageProvider } from '@/lib/types';
import { messageFrom } from './format';
import type { DashboardResponse } from './types';
import { PageHeader } from './ui-bits';
import { useLocale } from '@/lib/i18n';

export function SettingsPage() {
  const { t } = useLocale();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [secret, setSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardRequest<DashboardResponse<Partial<AppSettings>>>('/api/settings')
      .then((response) => {
        if (response.data) setSettings((current) => ({ ...current, ...response.data }));
      })
      .catch((reason: unknown) => toast.error(t(messageFrom(reason, 'Unable to load settings'))))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      await dashboardRequest('/api/settings', { method: 'POST', body: JSON.stringify({ ...settings, ...(secret ? { apiSecret: secret } : {}) }) });
      setSecret('');
      toast.success(t('Settings saved'));
    } catch (reason) {
      toast.error(t(messageFrom(reason, 'Unable to save settings')));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite">
        <Toaster />
        <PageHeader title={t('Settings')} description={t('Choose where files live, who can download them, and the defaults for new product-page widgets.')} />
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /><Skeleton className="h-4 w-80 max-w-full" /></CardHeader>
          <CardContent className="space-y-5"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toaster />
      <PageHeader
        title={t('Settings')}
        description={t('Choose where files live, who can download them, and the defaults for new product-page widgets.')}
        actions={<Button type="button" disabled={saving} onClick={() => void save()}>{saving ? t('Saving…') : t('Save settings')}</Button>}
      />
      <Tabs defaultValue="storage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="storage">{t('Storage')}</TabsTrigger>
          <TabsTrigger value="access">{t('Access rules')}</TabsTrigger>
        </TabsList>
        <TabsContent value="storage">
          <Card>
            <CardHeader>
              <CardTitle>{t('File storage')}</CardTitle>
              <CardDescription>{t('Wix Media Manager is the default. Cloudinary credentials stay server-side.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{t('Storage provider')}</Label>
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
                  <Field id="cloud-name" label={t('Cloud name')} value={settings.cloudName ?? ''} onChange={(value) => update('cloudName', value)} />
                  <Field id="api-key" label={t('API key')} value={settings.apiKey ?? ''} onChange={(value) => update('apiKey', value)} />
                  <div className="space-y-2">
                    <Label htmlFor="api-secret">{t('API secret')}</Label>
                    <Input id="api-secret" type="password" value={secret} placeholder={t('Leave blank to keep the saved secret')} onChange={(event) => setSecret(event.target.value)} />
                  </div>
                  <Field id="upload-preset" label={t('Signed upload preset (optional)')} value={settings.uploadPreset ?? ''} onChange={(value) => update('uploadPreset', value)} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="access">
          <Card>
            <CardHeader>
              <CardTitle>{t('Country gating')}</CardTitle>
              <CardDescription>{t('Country is resolved server-side from the visitor IP.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>{t('Rule')}</Label>
                <Select value={settings.countryGateMode} onValueChange={(value) => update('countryGateMode', value as AppSettings['countryGateMode'])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OFF">{t('Allow every country')}</SelectItem>
                    <SelectItem value="ALLOW">{t('Allow only these countries')}</SelectItem>
                    <SelectItem value="BLOCK">{t('Block these countries')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {settings.countryGateMode !== 'OFF' ? (
                <div className="space-y-2">
                  <Label htmlFor="countries">{t('Country codes')}</Label>
                  <Input id="countries" value={settings.countryCodes.join(', ')} placeholder={t('For example: {{codes}}', { codes: 'US, GB, NG' })} onChange={(event) => update('countryCodes', event.target.value.split(',').map((code) => code.trim().toUpperCase()).filter(Boolean))} />
                  <p className="text-xs text-muted-foreground">{t('Use ISO 3166-1 alpha-2 codes separated by commas.')}</p>
                </div>
              ) : null}
              <ToggleRow label={t('Allow when lookup fails')} hint={t('Prevents a geolocation outage from blocking downloads.')} checked={settings.countryGateFailOpen} onCheckedChange={(value) => update('countryGateFailOpen', value)} />
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

function ToggleRow({ label, hint, checked, disabled = false, onCheckedChange }: { label: string; hint?: string; checked: boolean; disabled?: boolean; onCheckedChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border p-4 md:col-span-2">
      <div>
        <Label>{label}</Label>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      <Switch disabled={disabled} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
