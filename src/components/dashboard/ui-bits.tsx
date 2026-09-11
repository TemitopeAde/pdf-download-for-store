import { AlertCircle, FolderOpen, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function PageHeader({ title, description, actions }: { title: string; description: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'neutral' }: { label: string; value: string | number; hint?: string; icon?: LucideIcon; tone?: 'neutral' | 'success' | 'warning' }) {
  return (
    <Card size="sm" className="relative h-full overflow-hidden border shadow-[0_2px_8px_0_#182b3a03]">
      <CardHeader className="gap-3">
        <div className="flex items-center justify-between gap-2">
          <CardDescription className="text-xs font-medium">{label}</CardDescription>
          {Icon ? <span className={cn('flex size-9 items-center justify-center rounded-lg', tone === 'success' ? 'bg-emerald-50 text-emerald-700' : tone === 'warning' ? 'bg-amber-50 text-amber-700' : 'bg-primary/7 text-primary')}><Icon className="size-[18px]" aria-hidden="true" /></span> : null}
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight tabular-nums group-data-[size=sm]/card:text-3xl">{value}</CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-xs leading-relaxed text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border bg-white px-6 py-16 text-center">
      <span className="mb-2 flex size-14 items-center justify-center rounded-2xl border bg-muted/60 text-primary"><FolderOpen className="size-6" aria-hidden="true" /></span>
      <p className="font-semibold">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 text-sm text-destructive"><AlertCircle className="size-4 shrink-0" aria-hidden="true" />{message}</p>
      {onRetry ? <Button type="button" variant="outline" size="sm" onClick={onRetry}>Try again</Button> : null}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'success' | 'warning' }) {
  return <Badge variant="outline" className={cn('gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium', tone === 'success' ? 'border-emerald-200/70 bg-emerald-50 text-emerald-700' : tone === 'warning' ? 'border-amber-200/70 bg-amber-50 text-amber-800' : 'bg-muted/50 text-muted-foreground')}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{children}</Badge>;
}
