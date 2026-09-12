import { useEffect, useRef, useState } from 'react';
import { FileCheck2, FileStack, FolderOpen, Upload } from 'lucide-react';
import * as tus from 'tus-js-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { dashboardRequest } from '@/lib/dashboard-api';
import { formatBytes, formatDate, messageFrom } from './format';
import type { DashboardResponse, LibraryFile } from './types';
import { EmptyState, ErrorBanner, PageHeader, StatCard, TableSkeleton } from './ui-bits';

interface UploadSession {
  provider: 'WIX_MEDIA' | 'CLOUDINARY';
  uploadUrl?: string;
  uploadToken?: string;
  apiKey?: string;
  timestamp?: number;
  signature?: string;
}

export function FilesPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LibraryFile[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [pendingDelete, setPendingDelete] = useState<LibraryFile | undefined>();
  const [pendingUpload, setPendingUpload] = useState<File | undefined>();
  const [editing, setEditing] = useState<LibraryFile | undefined>();
  const [draftName, setDraftName] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftLabel, setDraftLabel] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('search', search.trim());
      const response = await dashboardRequest<DashboardResponse<{ files: LibraryFile[] }>>(`/api/files?${params.toString()}`);
      setFiles(response.data?.files ?? []);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to load files'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const uploadFile = async (file: File, label: string) => {
    setStatus(`Preparing ${file.name}…`);
    setProgress(0);
    try {
      const response = await dashboardRequest<DashboardResponse<UploadSession>>(`/api/media?mimeType=${encodeURIComponent(file.type || 'application/octet-stream')}&fileName=${encodeURIComponent(file.name)}&size=${file.size}`);
      const session = response.data;
      if (!session) throw new Error('Upload session is unavailable');
      if (session.provider === 'CLOUDINARY') {
        if (!session.uploadUrl || !session.apiKey || !session.timestamp || !session.signature) throw new Error('Cloudinary is not configured');
        const body = new FormData();
        body.append('file', file);
        body.append('api_key', session.apiKey);
        body.append('timestamp', String(session.timestamp));
        body.append('signature', session.signature);
        const uploaded = await fetch(session.uploadUrl, { method: 'POST', body });
        if (!uploaded.ok) throw new Error('Cloudinary upload failed');
        const payload = await uploaded.json() as { public_id?: string; secure_url?: string; bytes?: number; format?: string };
        if (!payload.public_id || !payload.secure_url) throw new Error('Cloudinary returned incomplete metadata');
        await dashboardRequest('/api/media', { method: 'POST', body: JSON.stringify({ name: file.name, label, publicId: payload.public_id, secureUrl: payload.secure_url, fileType: file.type || payload.format || 'FILE', fileSize: payload.bytes ?? file.size }) });
      } else {
        if (!session.uploadUrl || !session.uploadToken) throw new Error('Wix Media Manager resumable upload is unavailable');
        await new Promise<void>((resolve, reject) => {
          const upload = new tus.Upload(file, {
            endpoint: session.uploadUrl,
            retryDelays: [0, 3000, 5000, 10000, 20000],
            metadata: { filename: file.name, contentType: file.type || 'application/octet-stream', token: session.uploadToken ?? '' },
            onProgress: (uploaded, total) => setProgress(total ? Math.round(uploaded / total * 100) : 0),
            onError: reject,
            onSuccess: () => resolve(),
          });
          upload.start();
        });
        const finalizeUrl = `${session.uploadUrl}/${session.uploadToken}?filename=${encodeURIComponent(file.name)}`;
        const finalized = await fetch(finalizeUrl, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: '{}' });
        if (!finalized.ok) throw new Error('Wix Media Manager could not finalize the upload');
        const descriptor = await finalized.json() as { file?: { id?: string; url?: string; displayName?: string; sizeInBytes?: string } };
        if (!descriptor.file?.id || !descriptor.file.url) throw new Error('Wix returned incomplete file metadata');
        await dashboardRequest('/api/media', { method: 'POST', body: JSON.stringify({ name: file.name, label, mediaId: descriptor.file.id, url: descriptor.file.url, fileType: file.type || 'FILE', fileSize: Number(descriptor.file.sizeInBytes || file.size) }) });
      }
      setProgress(100);
      setStatus(`${file.name} uploaded.`);
      await load();
    } catch (reason) {
      setStatus(messageFrom(reason, 'Upload failed'));
    }
  };

  const saveEdit = async () => {
    if (!editing?._id) return;
    try {
      await dashboardRequest('/api/files', { method: 'PUT', body: JSON.stringify({ fileId: editing._id, name: draftName, label: draftLabel, description: draftDescription }) });
      setEditing(undefined);
      await load();
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to update file'));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete?._id) return;
    try {
      await dashboardRequest(`/api/files?fileId=${encodeURIComponent(pendingDelete._id)}`, { method: 'DELETE' });
      setPendingDelete(undefined);
      await load();
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to delete file'));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="File library"
        description="Upload PDFs and other assets to the library, then assign them to products."
        actions={<Button type="button" onClick={() => inputRef.current?.click()}><Upload className="size-4" aria-hidden="true" />Upload file</Button>}
      />
      <input ref={inputRef} type="file" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) { setPendingUpload(file); setDraftLabel(''); } event.target.value = ''; }} />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Files in this view" value={loading ? '—' : files.length} hint="Your reusable digital assets" icon={FileStack} />
        <StatCard label="Assigned to products" value={loading ? '—' : files.filter((file) => file.usedCount > 0).length} hint="Files linked to your catalog" icon={FileCheck2} tone="success" />
        <StatCard label="Ready to assign" value={loading ? '—' : files.filter((file) => file.usedCount === 0).length} hint="Files available for their first product" icon={FolderOpen} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add to your library</CardTitle>
          <CardDescription>Upload product guides, manuals, PDFs, or ZIPs. Reuse a single file across multiple products.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>Choose file</Button>
            {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
          </div>
          {progress > 0 && progress < 100 ? (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </CardContent>
      </Card>
      <div className="flex gap-2">
        <Input aria-label="Search files" placeholder="Search files" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') void load(); }} />
        <Button type="button" variant="outline" onClick={() => void load()}>Search</Button>
      </div>
      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
      {loading ? <TableSkeleton /> : files.length === 0 ? (
        <EmptyState title="No files in the library" description="Upload a PDF, ZIP, or guide to start assigning downloads to products." action={<Button type="button" onClick={() => inputRef.current?.click()}>Upload a file</Button>} />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Used on</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file._id ?? file.url}>
                  <TableCell className="font-medium">{file.name}</TableCell>
                  <TableCell className="text-muted-foreground">{file.fileType || 'FILE'}</TableCell>
                  <TableCell>{formatBytes(file.fileSize)}</TableCell>
                  <TableCell>{file.usedCount} product{file.usedCount === 1 ? '' : 's'}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(file.updatedAt ?? file.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => { setEditing(file); setDraftName(file.name); setDraftLabel(file.label ?? ''); setDraftDescription(file.description ?? ''); }}>Edit</Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => setPendingDelete(file)}>Delete</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <AlertDialog open={Boolean(pendingUpload)} onOpenChange={(open) => { if (!open) setPendingUpload(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload file</AlertDialogTitle>
            <AlertDialogDescription>Choose the button label shown on product pages. Leave it blank to show Download.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2"><Label htmlFor="upload-label">Button label (optional)</Label><Input id="upload-label" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} placeholder="Download guide" /></div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (pendingUpload) void uploadFile(pendingUpload, draftLabel.trim()); setPendingUpload(undefined); }}>Upload</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit file</AlertDialogTitle>
            <AlertDialogDescription>This name appears in the library and on product pages unless you set a custom label.</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            <div className="space-y-2"><Label htmlFor="file-name">Name</Label><Input id="file-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="file-label">Button label</Label><Input id="file-label" value={draftLabel} onChange={(event) => setDraftLabel(event.target.value)} placeholder="Download" /></div>
            <div className="space-y-2"><Label htmlFor="file-description">Description</Label><Input id="file-description" value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} /></div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void saveEdit()}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={Boolean(pendingDelete)} onOpenChange={(open) => { if (!open) setPendingDelete(undefined); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This removes the file from the library. Product assignments that use it will no longer resolve.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
