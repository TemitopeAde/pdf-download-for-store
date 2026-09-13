import { Check, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from './ui-bits';
import { createUpgradeUrl, CURRENT_PLAN } from '@/lib/plans';
import { useLocale } from '@/lib/i18n';

const plans = [
  { name: 'Basic', price: 'Free', description: 'A limited way to get started', featured: false },
  { name: 'Pro', price: '$3.50', description: 'For growing stores with more downloads', featured: true },
  { name: 'Business', price: '$6', description: 'For established stores and larger catalogs', featured: false },
] as const;

const features = [
  { name: 'File library', values: ['5 files', '100 files', 'Unlimited'] },
  { name: 'Products', values: ['5 products', '50 products', 'Unlimited'] },
  { name: 'Download access', values: ['Everyone only', 'All access rules', 'All access rules'] },
  { name: 'Global product assignments', values: [false, true, true] },
  { name: 'Download analytics', values: [false, true, true] },
  { name: 'Priority support', values: [false, false, true] },
] as const;

export function PricingPage() {
  const { t } = useLocale();
  return (
    <div className="space-y-6">
      <PageHeader title={t('pricingPlans')} description={t('pricingDescription')} />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.featured ? 'border-primary shadow-md' : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{t(plan.name)}</CardTitle>
                {plan.featured ? <Badge>{t('Most popular')}</Badge> : null}
              </div>
              <CardDescription>{t(plan.description)}</CardDescription>
              <p className="pt-3 text-3xl font-semibold">{plan.price === 'Free' ? t('Free') : plan.price}{plan.price !== 'Free' ? <span className="text-sm font-normal text-muted-foreground">{' '}{t('/ month')}</span> : null}</p>
              <div className="pt-4">
                {plan.name === CURRENT_PLAN ? <Badge variant="secondary">{t('currentPlan')}</Badge> : <Button asChild variant={plan.featured ? 'default' : 'outline'} className="w-full"><a href={createUpgradeUrl()} target="_blank" rel="noreferrer">{t('Upgrade to {{name}}', { name: t(plan.name) })}</a></Button>}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Plan comparison')}</CardTitle>
          <CardDescription>{t('Feature availability by plan.')}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">{t('Feature')}</TableHead>
                  {plans.map((plan) => <TableHead key={plan.name} className="min-w-32">{t(plan.name)}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell className="font-medium">{t(feature.name)}</TableCell>
                    {feature.values.map((value, index) => (
                      <TableCell key={`${feature.name}-${plans[index].name}`} className="text-muted-foreground">
                        {typeof value === 'boolean' ? value ? <Check className="size-4 text-emerald-600" aria-label={t('Included')} /> : <span aria-label={t('Not included')}>—</span> : t(value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="size-3.5" aria-hidden="true" />{t('You are currently on the {{name}} plan. Billing and checkout will be connected later.', { name: t(CURRENT_PLAN) })}</p>
    </div>
  );
}
