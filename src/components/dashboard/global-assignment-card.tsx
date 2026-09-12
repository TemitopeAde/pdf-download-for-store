import { useEffect, useMemo, useState } from 'react';
import { Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dashboardRequest } from '@/lib/dashboard-api';
import { messageFrom } from './format';
import type { DashboardResponse, LibraryFile } from './types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ErrorBanner } from './ui-bits';
import { currentPlan } from '@/lib/plans';

type Access = 'PUBLIC' | 'MEMBERS_ONLY' | 'PURCHASE_REQUIRED';
interface GlobalRule { _id?: string; fileId: string; label?: string; visibility?: Access; }
interface FileDraft { label: string; visibility: Access; }

export function GlobalAssignmentCard({ onSaved }: { onSaved?: () => void | Promise<void> }) {
  const plan = currentPlan();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [rules, setRules] = useState<GlobalRule[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<Record<string, FileDraft>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [filesResponse, rulesResponse] = await Promise.all([
        dashboardRequest<DashboardResponse<{ files: LibraryFile[] }>>('/api/files?limit=100'),
        dashboardRequest<DashboardResponse<{ rules: GlobalRule[] }>>('/api/assignment-rules'),
      ]);
      const nextRules = rulesResponse.data?.rules ?? [];
      setFiles(filesResponse.data?.files ?? []);
      setRules(nextRules);
      setSelected(nextRules.map((rule) => rule.fileId));
      setDrafts(Object.fromEntries(nextRules.map((rule) => [rule.fileId, { label: rule.label ?? '', visibility: rule.visibility ?? 'PUBLIC' }])));
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to load global assignments'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (open) void load(); }, [open]);

  const assignedIds = useMemo(() => new Set(rules.map((rule) => rule.fileId)), [rules]);

  const save = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await dashboardRequest('/api/assignment-rules', { method: 'POST', body: JSON.stringify({ assignments: selected.map((fileId) => ({ fileId, label: drafts[fileId]?.label ?? '', visibility: drafts[fileId]?.visibility ?? 'PUBLIC' })) }) });
      await load();
      await onSaved?.();
      setOpen(false);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to assign files to all products'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (rule: GlobalRule) => {
    if (!rule._id) return;
    setBusy(true);
    setError('');
    try {
      await dashboardRequest(`/api/assignment-rules?ruleId=${encodeURIComponent(rule._id)}`, { method: 'DELETE' });
      await load();
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to remove global assignment'));
    } finally {
      setBusy(false);
    }
  };

  return <>
    <Card className="border-primary/15 bg-primary/[0.025]">
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div><CardTitle className="flex items-center gap-2 text-base"><Globe2 className="size-4 text-primary" aria-hidden="true" />All products</CardTitle><CardDescription className="mt-1">Apply one or more library files to every current and future product.</CardDescription></div>
        <Button type="button" disabled={!plan.allowsGlobalAssignments} onClick={() => setOpen(true)}>{plan.allowsGlobalAssignments ? 'Manage files' : 'Upgrade to Pro'}</Button>
      </CardHeader>
      <CardContent className="pt-0 text-sm text-muted-foreground">
        {plan.allowsGlobalAssignments ? (rules.length > 0 ? `${rules.length} file${rules.length === 1 ? '' : 's'} assigned globally.` : 'No files are assigned globally.') : 'Global assignments are available on the Pro plan and higher.'}
      </CardContent>
    </Card>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Assign files to all products</DialogTitle><DialogDescription>Selected files will appear on every product download widget, including products added later.</DialogDescription></DialogHeader>
        {error ? <ErrorBanner message={error} /> : null}
        {loading ? <p className="py-8 text-center text-sm text-muted-foreground">Loading files…</p> : files.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Upload files to the library first.</p> : <ScrollArea className="h-96 rounded-lg border p-3"><div className="space-y-3">{files.map((file) => { const id = file._id; if (!id) return null; const checked = selected.includes(id); const draft = drafts[id] ?? { label: file.label ?? '', visibility: 'PUBLIC' as Access }; return <div key={id} className="rounded-lg p-2 hover:bg-muted"><label className="flex cursor-pointer items-center gap-3"><Checkbox checked={checked} onCheckedChange={(value) => { setSelected((current) => value === true ? [...new Set([...current, id])] : current.filter((item) => item !== id)); setDrafts((current) => ({ ...current, [id]: draft })); }} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>{assignedIds.has(id) ? <span className="text-xs text-muted-foreground">Assigned</span> : null}</label>{checked ? <div className="mt-2 grid gap-2 pl-7 sm:grid-cols-[1fr_10rem]"><div className="space-y-1"><Label htmlFor={`global-label-${id}`} className="text-xs">Plugin label</Label><Input id={`global-label-${id}`} value={draft.label} placeholder="Download" onChange={(event) => setDrafts((current) => ({ ...current, [id]: { ...draft, label: event.target.value } }))} /></div><div className="space-y-1"><Label htmlFor={`global-access-${id}`} className="text-xs">Access</Label><Select value={draft.visibility} onValueChange={(value) => setDrafts((current) => ({ ...current, [id]: { ...draft, visibility: value as Access } }))}><SelectTrigger id={`global-access-${id}`}><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PUBLIC">Everyone</SelectItem><SelectItem value="MEMBERS_ONLY">Members only</SelectItem><SelectItem value="PURCHASE_REQUIRED">After purchase</SelectItem></SelectContent></Select></div></div> : null}</div>; })}</div></ScrollArea>}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="button" disabled={busy || loading || selected.length === 0} onClick={() => void save()}>Assign {selected.length > 0 ? `${selected.length} file${selected.length === 1 ? '' : 's'}` : 'files'}</Button></DialogFooter>
        {rules.length > 0 ? <div className="border-t pt-3"><p className="mb-2 text-xs font-medium text-muted-foreground">Currently assigned globally</p><div className="space-y-1">{rules.map((rule) => <div key={rule._id ?? rule.fileId} className="flex items-center justify-between gap-2 text-sm"><span className="truncate">{files.find((file) => file._id === rule.fileId)?.name ?? rule.fileId}</span><Button type="button" size="sm" variant="destructive" disabled={busy} onClick={() => void remove(rule)}>Remove</Button></div>)}</div></div> : null}
      </DialogContent>
    </Dialog>
  </>;
}
