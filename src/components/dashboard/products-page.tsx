import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, CircleCheck, FileClock, Package, Search, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  const [sort, setSort] = useState('name-asc');
  const [page, setPage] = useState(0);
  const pageCursors = useRef<Array<string | undefined>>([undefined]);
  const requestId = useRef(0);
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

  const load = async (targetPage = 0) => {
    const id = ++requestId.current;
    setLoading(true);
    setProducts([]);
    setError('');
    try {
      const params = new URLSearchParams({ search: debounced, sort, limit: '40', offset: String(targetPage * 40) });
      const nextCursor = pageCursors.current[targetPage];
      if (nextCursor) params.set('cursor', nextCursor);
      const response = await dashboardRequest<DashboardResponse<ProductListData>>(`/api/products?${params.toString()}`);
      if (id !== requestId.current) return;
      const data = response.data;
      if (!data) throw new Error('Unable to load products');
      setCatalogVersion(data.catalogVersion);
      setHasNext(data.hasNext);
      setCursor(data.nextCursor);
      setPage(targetPage);
      pageCursors.current[targetPage + 1] = data.nextCursor;
      setProducts(data.products);
    } catch (reason) {
      if (id === requestId.current) setError(messageFrom(reason, 'Unable to load products'));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  };

  useEffect(() => {
    pageCursors.current = [undefined];
    setPage(0);
    setHasNext(false);
    setCursor(undefined);
    void load(0);
    return () => { requestId.current += 1; };
  }, [debounced, sort]);

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
        <StatCard label="Products in this view" value={loading && !products.length ? '—' : products.length} hint="Products on this page" icon={Package} />
        <StatCard label="With downloads" value={loading && !products.length ? '—' : withFiles} hint="Products on this page with assigned files" icon={CircleCheck} tone="success" />
        <StatCard label="Without downloads" value={loading && !products.length ? '—' : products.length - withFiles} hint="Products on this page with no files attached" icon={FileClock} tone="warning" />
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
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger aria-label="Sort products" className="w-full bg-white sm:w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name: A–Z</SelectItem>
              <SelectItem value="name-desc">Name: Z–A</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filter} onValueChange={(value) => setFilter(value as FileFilter)}>
            <SelectTrigger aria-label="Filter this page by file status" className="w-full bg-white sm:ml-auto sm:w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All on this page</SelectItem>
              <SelectItem value="with">Has files (page)</SelectItem>
              <SelectItem value="without">Missing files (page)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error ? <ErrorBanner message={error} onRetry={() => void load(page)} /> : null}
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-5 py-4"><p className="text-xs text-muted-foreground">{loading ? 'Loading products…' : `Page ${page + 1} · ${visible.length} of ${products.length} products shown`}</p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={loading || page === 0} onClick={() => void load(page - 1)}>Previous</Button>
          <Button type="button" variant="outline" disabled={loading || Boolean(error) || !hasNext || (catalogVersion === 'V3_CATALOG' && !cursor)} onClick={() => void load(page + 1)}>Next</Button>
        </div>
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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
      setSelectedIds([]);
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

  const assign = async (fileIds: string[]) => {
    if (!product || fileIds.length === 0) return;
    setBusy(true);
    setError('');
    try {
      await dashboardRequest('/api/product-files', { method: 'POST', body: JSON.stringify({ productId: product.id, fileIds }) });
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
      await dashboardRequest('/api/product-files', { method: 'POST', body: JSON.stringify({ productId: product.id, fileId: entry.fileId, visibility, label: entry.label, description: entry.description, isVisible: entry.isVisible, sortOrder: entry.sortOrder }) });
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
            <div className="flex items-center justify-between gap-2">
              <Label>Add files</Label>
              {available.length > 0 ? (
                <Button type="button" size="sm" disabled={busy || selectedIds.length === 0} onClick={() => void assign(selectedIds)}>
                  Assign {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'selected'}
                </Button>
              ) : null}
            </div>
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">{library.length === 0 ? 'Upload files on the Files page, then assign them here.' : 'Every library file is already assigned to this product.'}</p>
            ) : (
              <ul className="space-y-2">
                {available.map((file) => {
                  const id = file._id;
                  if (!id) return null;
                  const checked = selectedIds.includes(id);
                  return (
                    <li key={id} className="flex items-center gap-2 rounded-lg border p-2">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(value) => setSelectedIds((current) => value === true ? [...current, id] : current.filter((item) => item !== id))}
                        aria-label={`Select ${file.name}`}
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-medium">{file.name}</span>
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void assign([id])}>Assign</Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {assigned.length === 0 ? <EmptyState title="No files on this product" description="Assign one or more files from the library. Every assigned file appears on the product page widget." /> : (
            <div className="space-y-3">
              <p className="text-sm font-medium">{assigned.length} file{assigned.length === 1 ? '' : 's'} on this product</p>
              {assigned.map((entry) => (
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
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
