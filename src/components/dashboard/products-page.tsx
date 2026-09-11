import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, CircleCheck, FileClock, Package, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { dashboardRequest } from '@/lib/dashboard-api';
import type { ProductSummary, Visibility } from '@/lib/types';
import { messageFrom } from './format';
import type { AssignedProductFile, DashboardResponse, LibraryFile, ProductListData } from './types';
import { EmptyState, ErrorBanner, PageHeader, StatCard, StatusBadge, TableSkeleton } from './ui-bits';

type FileFilter = 'all' | 'with' | 'without';

export function ProductsPage({ onOpenFiles }: { onOpenFiles: () => void }) {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<FileFilter>('all');
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [catalogVersion, setCatalogVersion] = useState<ProductListData['catalogVersion'] | undefined>();
  const [hasNext, setHasNext] = useState(false);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<ProductSummary | undefined>();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const load = async (append = false, nextCursor?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ search: debounced, limit: '40' });
      if (nextCursor) params.set('cursor', nextCursor);
      if (append) params.set('offset', String(products.length));
      const response = await dashboardRequest<DashboardResponse<ProductListData>>(`/api/products?${params.toString()}`);
      const data = response.data;
      if (!data) throw new Error('Unable to load products');
      setCatalogVersion(data.catalogVersion);
      setHasNext(data.hasNext);
      setCursor(data.nextCursor);
      setProducts((current) => append ? [...current, ...data.products] : data.products);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to load products'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(false); }, [debounced]);

  const visible = useMemo(() => products.filter((product) => {
    if (filter === 'with') return product.assignedFilesCount > 0;
    if (filter === 'without') return product.assignedFilesCount === 0;
    return true;
  }), [filter, products]);

  const withFiles = products.filter((product) => product.assignedFilesCount > 0).length;

  if (!loading && catalogVersion === 'STORES_NOT_INSTALLED') {
    return (
      <div className="space-y-6">
        <PageHeader title="Products" description="Assign downloadable files to Wix Store products." />
        <EmptyState title="Wix Stores is not installed" description="Install Wix Stores on this site to attach PDFs, ZIPs, and guides to products." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Give every product the files it needs. Manage guides, manuals, and downloads in one place."
        actions={<Button type="button" onClick={onOpenFiles}><Upload className="size-4" aria-hidden="true" />Upload files</Button>}
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Products in this view" value={loading && !products.length ? '—' : products.length} hint={hasNext ? 'Loaded products · more available' : 'Products matching your search'} icon={Package} />
        <StatCard label="With downloads" value={loading && !products.length ? '—' : withFiles} hint="Loaded products with assigned files" icon={CircleCheck} tone="success" />
        <StatCard label="Without downloads" value={loading && !products.length ? '—' : products.length - withFiles} hint="Loaded products with no files attached" icon={FileClock} tone="warning" />
      </div>
      <section aria-label="Product catalog" className="overflow-hidden rounded-xl border bg-white shadow-[0_2px_8px_0_#182b3a03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-5">
          <div><h2 className="text-sm font-semibold">Product catalog</h2><p className="mt-1 text-xs text-muted-foreground">Select a product to manage its downloadable files.</p></div>
          <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">{visible.length} shown</span>
        </div>
        <div className="flex flex-col gap-3 border-b bg-[#fcfdfd] p-4 sm:flex-row">
          <div className="relative flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input className="bg-white pl-8" aria-label="Search products" placeholder="Search by product name…" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
          <Select value={filter} onValueChange={(value) => setFilter(value as FileFilter)}>
            <SelectTrigger aria-label="Filter products by file status" className="w-full bg-white sm:ml-auto sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              <SelectItem value="with">Has files</SelectItem>
              <SelectItem value="without">Missing files</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? <ErrorBanner message={error} onRetry={() => void load(false)} /> : null}
        {loading && products.length === 0 ? <TableSkeleton /> : visible.length === 0 ? (
          <EmptyState
            title={debounced || filter !== 'all' ? 'No matching products' : 'No products yet'}
            description={debounced || filter !== 'all' ? 'Try a different search or filter.' : 'Add products in Wix Stores, then assign download files here.'}
          />
        ) : (
          <div className="overflow-hidden bg-background">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Files</TableHead>
                  <TableHead className="text-right"><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((product) => (
                  <TableRow key={product.id} className="cursor-pointer" onClick={() => setSelected(product)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? <img src={product.imageUrl} alt="" className="size-12 rounded-lg border object-cover" /> : <div className="flex size-12 items-center justify-center rounded-lg border bg-primary/5 text-sm font-semibold text-primary" aria-hidden>{product.name.slice(0, 1)}</div>}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{product.sku || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge tone={product.assignedFilesCount > 0 ? 'success' : 'warning'}>
                        {product.assignedFilesCount > 0 ? `${product.assignedFilesCount} file${product.assignedFilesCount === 1 ? '' : 's'}` : 'Needs files'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell className="text-right"><Button type="button" size="sm" variant="ghost" aria-label={`Manage files for ${product.name}`} onClick={(event) => { event.stopPropagation(); setSelected(product); }}>Manage <ArrowUpRight className="size-3.5 text-muted-foreground" aria-hidden="true" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"><p className="text-xs text-muted-foreground">{loading ? 'Loading products…' : `${visible.length} of ${products.length} loaded products shown`}</p>
        {hasNext ? <Button type="button" variant="outline" disabled={loading} onClick={() => void load(true, cursor)}>Load more</Button> : null}
        </div>
      </section>
      <ProductSheet
        product={selected}
        onClose={() => setSelected(undefined)}
        onChanged={(productId, count) => setProducts((current) => current.map((product) => product.id === productId ? { ...product, assignedFilesCount: count } : product))}
      />
    </div>
  );
}

function ProductSheet({ product, onClose, onChanged }: { product?: ProductSummary; onClose: () => void; onChanged: (productId: string, count: number) => void }) {
  const [assigned, setAssigned] = useState<AssignedProductFile[]>([]);
  const [library, setLibrary] = useState<LibraryFile[]>([]);
  const [fileId, setFileId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const refresh = async (current: ProductSummary) => {
    setBusy(true);
    setError('');
    try {
      const [filesResponse, libraryResponse] = await Promise.all([
        dashboardRequest<DashboardResponse<{ files: AssignedProductFile[] }>>(`/api/product-files?productId=${encodeURIComponent(current.id)}`),
        dashboardRequest<DashboardResponse<{ files: LibraryFile[] }>>('/api/files?limit=100'),
      ]);
      const nextAssigned = filesResponse.data?.files ?? [];
      setAssigned(nextAssigned);
      setLibrary(libraryResponse.data?.files ?? []);
      onChanged(current.id, nextAssigned.length);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to load product files'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (product) void refresh(product);
  }, [product?.id]);

  const available = library.filter((file) => file._id && !assigned.some((entry) => entry.fileId === file._id));

  const assign = async () => {
    if (!product || !fileId) return;
    setBusy(true);
    setError('');
    try {
      await dashboardRequest('/api/product-files', { method: 'POST', body: JSON.stringify({ productId: product.id, fileId, visibility: 'PUBLIC' }) });
      setFileId('');
      await refresh(product);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to assign file'));
      setBusy(false);
    }
  };

  const updateVisibility = async (entry: AssignedProductFile, visibility: Visibility) => {
    if (!product) return;
    setBusy(true);
    try {
      await dashboardRequest('/api/product-files', { method: 'POST', body: JSON.stringify({ productId: product.id, fileId: entry.fileId, visibility, label: entry.label, description: entry.description, isVisible: entry.isVisible }) });
      await refresh(product);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to update visibility'));
      setBusy(false);
    }
  };

  const remove = async (entry: AssignedProductFile) => {
    if (!entry.assignmentId) return;
    setBusy(true);
    try {
      await dashboardRequest(`/api/product-files?assignmentId=${encodeURIComponent(entry.assignmentId)}`, { method: 'DELETE' });
      if (product) await refresh(product);
    } catch (reason) {
      setError(messageFrom(reason, 'Unable to remove file'));
      setBusy(false);
    }
  };

  return (
    <Sheet open={Boolean(product)} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{product?.name ?? 'Product'}</SheetTitle>
          <SheetDescription>Assign library files and control who can download them.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4 pb-6">
          {error ? <ErrorBanner message={error} /> : null}
          <div className="space-y-2">
            <Label>Add a file</Label>
            <div className="flex gap-2">
              <Select value={fileId || undefined} onValueChange={setFileId} disabled={available.length === 0}>
                <SelectTrigger className="flex-1"><SelectValue placeholder={available.length ? 'Choose a file' : 'Upload files first'} /></SelectTrigger>
                <SelectContent>
                  {available.map((file) => file._id ? <SelectItem key={file._id} value={file._id}>{file.name}</SelectItem> : null)}
                </SelectContent>
              </Select>
              <Button type="button" disabled={!fileId || busy} onClick={() => void assign()}>Assign</Button>
            </div>
          </div>
          {assigned.length === 0 ? <EmptyState title="No files on this product" description="Choose a file from the library to make it downloadable on the product page." /> : assigned.map((entry) => (
            <div key={`${entry.fileId}-${entry.assignmentId ?? 'rule'}`} className="space-y-3 rounded-lg border p-3">
              <div>
                <p className="font-medium">{entry.label || entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.fileType} · {entry.assignmentId ? 'Direct assignment' : 'Assigned by rule'}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={entry.visibility ?? 'PUBLIC'} onValueChange={(value) => void updateVisibility(entry, value as Visibility)}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PUBLIC">Anyone</SelectItem>
                    <SelectItem value="MEMBERS_ONLY">Members only</SelectItem>
                    <SelectItem value="PURCHASE_REQUIRED">Purchase required</SelectItem>
                  </SelectContent>
                </Select>
                {entry.assignmentId ? <Button type="button" variant="destructive" size="sm" disabled={busy} onClick={() => void remove(entry)}>Remove</Button> : null}
              </div>
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
