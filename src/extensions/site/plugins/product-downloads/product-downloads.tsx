import { httpClient } from '@wix/essentials';

interface ProductDownload { fileId: string; name: string; label?: string; description?: string; fileType: string; fileSize?: number; visibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PURCHASE_REQUIRED'; }
interface ProductDownloadsResponse { success: boolean; data?: { files: ProductDownload[]; settings?: { title?: string; buttonText?: string; viewButtonText?: string; showViewButton?: boolean } }; }

function escapeHtml(value: string): string { return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character)); }
function formatSize(bytes?: number): string { if (!bytes || bytes < 1) return ''; const units = ['B', 'KB', 'MB', 'GB']; const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1); return `${(bytes / (1024 ** index)).toFixed(index === 0 ? 0 : 1)} ${units[index]}`; }

type Style = { section: string; item: string; button: string; secondary: string; text: string; muted: string };
function styleForPreset(preset: string, textColor: string, buttonColor: string, buttonTextColor: string, radius: number, spacing: number): Style {
  const base = { text: `color:${textColor};`, muted: 'color:#64748b;', button: `background:${buttonColor};color:${buttonTextColor};`, secondary: `background:transparent;color:${textColor};border:1px solid ${buttonColor};` };
  if (preset === 'DARK') return { ...base, section: `background:#111827;color:#f9fafb;border:1px solid #374151;border-radius:${radius}px;padding:16px;margin:16px 0;`, item: `background:#1f2937;border:1px solid #374151;border-radius:${radius}px;padding:12px;` };
  if (preset === 'SOFT') return { ...base, section: `background:#f8fafc;border:0;border-radius:${radius}px;padding:20px;margin:16px 0;`, item: `background:#fff;border:0;box-shadow:0 2px 10px rgba(15,23,42,.08);border-radius:${radius}px;padding:12px;` };
  if (preset === 'OUTLINE') return { ...base, section: `background:transparent;border:2px solid ${buttonColor};border-radius:${radius}px;padding:16px;margin:16px 0;`, item: `border:1px solid ${buttonColor};border-radius:${radius}px;padding:12px;` };
  return { ...base, section: `border:1px solid #e5e7eb;border-radius:${radius}px;padding:16px;margin:16px 0;`, item: `border:1px solid #eef0f2;border-radius:${radius}px;padding:12px;` };
}

class ProductDownloadsElement extends HTMLElement {
  static get observedAttributes() { return ['product-id', 'display-name', 'layout', 'style-preset', 'button-text', 'view-button-text', 'show-view-button', 'text-color', 'button-color', 'button-text-color', 'border-radius', 'spacing']; }
  connectedCallback() { void this.load(); }
  attributeChangedCallback() { if (this.isConnected) void this.load(); }
  private async load() {
    const productId = this.getAttribute('product-id') ?? this.getAttribute('productId');
    if (!productId) { this.innerHTML = ''; return; }
    this.innerHTML = '<div style="padding:16px;color:#64748b;font:14px system-ui">Loading downloads…</div>';
    try { const response = await httpClient.fetchWithAuth(`/api/product-files?productId=${encodeURIComponent(productId)}`); const payload = await response.json() as ProductDownloadsResponse; if (!payload.success || !payload.data?.files.length) { this.innerHTML = ''; return; } this.render(productId, payload.data.files, payload.data.settings); }
    catch (error) { console.error('Unable to load product downloads', error); this.innerHTML = ''; }
  }
  private render(productId: string, files: ProductDownload[], settings?: NonNullable<ProductDownloadsResponse['data']>['settings']) {
    const title = this.getAttribute('display-name') || settings?.title || 'Downloads'; const buttonText = this.getAttribute('button-text') || settings?.buttonText || 'Download'; const viewText = this.getAttribute('view-button-text') || settings?.viewButtonText || 'View'; const showView = this.getAttribute('show-view-button') !== 'false' && settings?.showViewButton !== false; const layout = (this.getAttribute('layout') || 'LIST').toUpperCase(); const radius = Number(this.getAttribute('border-radius') || 8); const spacing = Number(this.getAttribute('spacing') || 10); const styles = styleForPreset(this.getAttribute('style-preset') || 'MINIMAL', this.getAttribute('text-color') || '#111827', this.getAttribute('button-color') || '#111827', this.getAttribute('button-text-color') || '#ffffff', radius, spacing); const grid = layout === 'CARDS' ? 'display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));' : '';
    this.innerHTML = `<section style="font:15px system-ui;${styles.section}${styles.text}"><h2 style="font-size:20px;margin:0 0 14px">${escapeHtml(title)}</h2><div style="${grid}display:flex;flex-direction:${layout === 'CARDS' ? 'row' : 'column'};gap:${spacing}px">${files.map((file) => { const meta = [file.fileType.toUpperCase(), formatSize(file.fileSize)].filter(Boolean).join(' • '); const view = showView && file.fileType.toLowerCase().includes('pdf') ? `<button type="button" data-action="view" data-file-id="${escapeHtml(file.fileId)}" style="${styles.secondary}border-radius:${radius}px;padding:8px 12px;cursor:pointer">${escapeHtml(viewText)}</button>` : ''; return `<article style="display:flex;flex:1;align-items:center;justify-content:space-between;gap:12px;${styles.item}"><div><div style="font-weight:600">${escapeHtml(file.label || file.name)}</div><div style="font-size:12px;margin-top:3px;${styles.muted}">${escapeHtml(meta)}</div>${file.description ? `<div style="font-size:13px;margin-top:5px;${styles.muted}">${escapeHtml(file.description)}</div>` : ''}</div><div style="display:flex;gap:8px;flex-shrink:0"><button type="button" data-action="download" data-file-id="${escapeHtml(file.fileId)}" style="${styles.button}border:0;border-radius:${radius}px;padding:8px 12px;cursor:pointer">${escapeHtml(buttonText)}</button>${view}</div></article>`; }).join('')}</div></section>`;
    this.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => button.addEventListener('click', () => void this.openFile(productId, button.dataset.fileId || '', button.dataset.action === 'view')));
  }
  private async openFile(productId: string, fileId: string, view: boolean) {
    if (!fileId) return;
    try { const response = await httpClient.fetchWithAuth(`/api/downloads?fileId=${encodeURIComponent(fileId)}&productId=${encodeURIComponent(productId)}&mode=${view ? 'view' : 'download'}`); const payload = await response.json() as { success: boolean; data?: { url: string }; errorMessage?: string }; if (!response.ok || !payload.success || !payload.data?.url) { if (payload.errorMessage) console.warn(payload.errorMessage); return; } if (view) window.open(payload.data.url, '_blank', 'noopener,noreferrer'); else { const anchor = document.createElement('a'); anchor.href = payload.data.url; anchor.download = ''; anchor.click(); } }
    catch (error) { console.error('Unable to open product download', error); }
  }
}

export default ProductDownloadsElement;
