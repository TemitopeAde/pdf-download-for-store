import { Check, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from './ui-bits';

const plans = [
  { name: 'Basic', price: '$9', description: 'For small stores getting started', featured: false },
  { name: 'Pro', price: '$19', description: 'For growing stores with more downloads', featured: true },
  { name: 'Business', price: '$49', description: 'For established stores and larger catalogs', featured: false },
] as const;

const features = [
  { name: 'File library', values: ['25 files', '100 files', 'Unlimited'] },
  { name: 'Products', values: ['25 products', 'Unlimited', 'Unlimited'] },
  { name: 'Download access rules', values: [true, true, true] },
  { name: 'Global product assignments', values: [false, true, true] },
  { name: 'Download analytics', values: [false, true, true] },
  { name: 'Priority support', values: [false, false, true] },
] as const;

export function PricingPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Pricing plans" description="Choose the plan that fits your store. Billing and checkout will be connected later." />
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={plan.featured ? 'border-primary shadow-md' : undefined}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>{plan.name}</CardTitle>
                {plan.featured ? <Badge>Most popular</Badge> : null}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <p className="pt-3 text-3xl font-semibold">{plan.price}<span className="text-sm font-normal text-muted-foreground"> / month</span></p>
            </CardHeader>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plan comparison</CardTitle>
          <CardDescription>Feature availability by plan.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-48">Feature</TableHead>
                  {plans.map((plan) => <TableHead key={plan.name} className="min-w-32">{plan.name}</TableHead>)}
                </TableRow>
              </TableHeader>
              <TableBody>
                {features.map((feature) => (
                  <TableRow key={feature.name}>
                    <TableCell className="font-medium">{feature.name}</TableCell>
                    {feature.values.map((value, index) => (
                      <TableCell key={`${feature.name}-${plans[index].name}`} className="text-muted-foreground">
                        {typeof value === 'boolean' ? value ? <Check className="size-4 text-emerald-600" aria-label="Included" /> : <span aria-label="Not included">—</span> : value}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <p className="flex items-center gap-2 text-xs text-muted-foreground"><CreditCard className="size-3.5" aria-hidden="true" />Pricing is currently a preview table. No plan can be purchased yet.</p>
    </div>
  );
}
