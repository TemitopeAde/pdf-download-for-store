import { httpClient } from '@wix/essentials';
import { createRoot, type Root } from 'react-dom/client';
import { toast, Toaster } from 'sonner';
import 'sonner/dist/styles.css';

interface ProductDownload {
  fileId: string;
  name: string;
  label?: string;
  description?: string;
  fileType: string;
  fileSize?: number;
  isVisible?: boolean;
  visibility?: 'PUBLIC' | 'MEMBERS_ONLY' | 'PURCHASE_REQUIRED';
}

interface ProductDownloadsResponse {
  success: boolean;
  data?: { files: ProductDownload[]; settings?: { title?: string; buttonText?: string; viewButtonText?: string; showViewButton?: boolean } };
}

async function requestPluginApi<T>(path: string): Promise<T> {
  // The custom element runs on the storefront; its module is hosted by this app.
  const url = new URL(path, new URL(import.meta.url).origin);
  const response = await httpClient.fetchWithAuth(url.href);
  if (!response.ok) {
    throw new Error(`Product downloads request failed (${response.status}) at ${url.pathname}`);
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Product downloads expected JSON at ${url.pathname}`);
  }
  return response.json() as Promise<T>;
}

async function requestDownloadApi(path: string): Promise<{ success: boolean; data?: { url: string }; errorMessage?: string }> {
  const url = new URL(path, new URL(import.meta.url).origin);
  const response = await httpClient.fetchWithAuth(url.href);
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new Error(`Product downloads expected JSON at ${url.pathname}`);
  }
  return response.json() as Promise<{ success: boolean; data?: { url: string }; errorMessage?: string }>;
}

type Style = { section: string; item: string; button: string; secondary: string; text: string; muted: string };

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));
}

function styleForPreset(preset: string, textColor: string, buttonColor: string, buttonTextColor: string, radius: number): Style {
  const base = { text: `color:${textColor};`, muted: 'color:#64748b;', button: `background:${buttonColor};color:${buttonTextColor};`, secondary: `background:transparent;color:${textColor};border:0;` };
  if (preset === 'DARK') return { ...base, section: `background:#111827;color:#f9fafb;border:0;border-radius:${radius}px;margin:0;padding:0;`, item: `background:#1f2937;border:0;border-radius:${radius}px;margin:0;padding:0;` };
  if (preset === 'SOFT') return { ...base, section: `background:#f8fafc;border:0;border-radius:${radius}px;margin:0;padding:0;`, item: `background:#fff;border:0;box-shadow:0 2px 10px rgba(15,23,42,.08);border-radius:${radius}px;margin:0;padding:0;` };
  if (preset === 'OUTLINE') return { ...base, section: `background:transparent;border:0;border-radius:${radius}px;margin:0;padding:0;`, item: `border:0;border-radius:${radius}px;margin:0;padding:0;` };
  return { ...base, section: `border:0;border-radius:${radius}px;margin:0;padding:0;`, item: `border:0;border-radius:${radius}px;margin:0;padding:0;` };
}

function fileActions(file: ProductDownload, buttonText: string, viewText: string, showView: boolean, styles: Style, radius: number): string {
  const view = showView && file.fileType.toLowerCase().includes('pdf')
    ? `<button type="button" data-action="view" data-file-id="${escapeHtml(file.fileId)}" style="${styles.secondary}border-radius:${radius}px;margin:0;padding:8px 12px;cursor:pointer">${escapeHtml(viewText)}</button>`
    : '';
  return `<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;flex-shrink:0;margin:0;padding:0"><button type="button" data-action="download" data-file-id="${escapeHtml(file.fileId)}" style="${styles.button}border:0;border-radius:${radius}px;margin:0;padding:8px 12px;display:inline-flex;align-items:center;gap:8px;cursor:pointer">${escapeHtml(buttonText)}<span class="product-downloads-button-spinner" aria-hidden="true"></span></button>${view}</div>`;
}

function renderFile(file: ProductDownload, layout: string, buttonText: string, viewText: string, showView: boolean, styles: Style, radius: number): string {
  const title = escapeHtml(file.name);
  const actions = fileActions(file, buttonText, viewText, showView, styles, radius);
  if (layout === 'BUTTONS') {
    return `<article style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;${styles.item}"><div style="min-width:0;flex:1"><div style="font-weight:600">${title}</div></div>${actions}</article>`;
  }
  if (layout === 'ACCORDION') {
    return `<details style="${styles.item}"><summary style="cursor:pointer;font-weight:600;margin:0;padding:0">${title}</summary><div style="margin:0;padding:0">${actions}</div></details>`;
  }
  return `<article style="display:flex;flex:1;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;min-width:0;${styles.item}"><div style="min-width:0;flex:1"><div style="font-weight:600">${title}</div></div>${actions}</article>`;
}

class ProductDownloadsElement extends HTMLElement {
  private toastRoot?: Root;
  private toastHost?: HTMLDivElement;

  static get observedAttributes() {
    return ['product-id', 'display-name', 'layout', 'style-preset', 'button-text', 'view-button-text', 'show-view-button', 'text-color', 'button-color', 'button-text-color', 'border-radius', 'spacing'];
  }

  connectedCallback() {
    this.style.display = 'block';
    this.style.width = '100%';
    this.style.maxWidth = '100%';
    this.style.boxSizing = 'border-box';
    this.style.margin = '0';
    this.style.padding = '0';
    this.toastHost = document.createElement('div');
    document.body.appendChild(this.toastHost);
    this.toastRoot = createRoot(this.toastHost);
    this.toastRoot.render(<Toaster />);
    void this.load();
  }

  disconnectedCallback() {
    this.toastRoot?.unmount();
    this.toastHost?.remove();
    this.toastRoot = undefined;
    this.toastHost = undefined;
  }

  attributeChangedCallback() {
    if (this.isConnected) void this.load();
  }

  private async load() {
    const productId = this.getAttribute('product-id') ?? this.getAttribute('productId');
    if (!productId) {
      this.innerHTML = '';
      return;
    }
    this.innerHTML = `<style>
      .product-downloads-loader {
        width: 60px;
        aspect-ratio: 4;
        --_g: no-repeat radial-gradient(circle closest-side, #000 90%, #0000);
        background:
          var(--_g) 0% 50%,
          var(--_g) 50% 50%,
          var(--_g) 100% 50%;
        background-size: calc(100% / 3) 100%;
        animation: product-downloads-loader-animation 1s infinite linear;
        margin: 0;
        padding: 0;
      }
      @keyframes product-downloads-loader-animation {
        33% { background-size: calc(100% / 3) 0%, calc(100% / 3) 100%, calc(100% / 3) 100%; }
        50% { background-size: calc(100% / 3) 100%, calc(100% / 3) 0%, calc(100% / 3) 100%; }
        66% { background-size: calc(100% / 3) 100%, calc(100% / 3) 100%, calc(100% / 3) 0%; }
      }
    </style><div class="product-downloads-loader" role="status" aria-label="Loading downloads"></div>`;
    try {
      const collectionIds = this.getAttribute('collection-ids') ?? this.getAttribute('collectionIds') ?? '';
      const params = new URLSearchParams({ productId, visibleOnly: 'true' });
      collectionIds.split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => params.append('collectionId', id));
      const payload = await requestPluginApi<ProductDownloadsResponse>(`/api/product-files?${params.toString()}`);
      const files = payload.data?.files ?? [];
      if (!payload.success || files.length === 0) {
        this.innerHTML = '';
        return;
      }
      this.render(productId, files, payload.data?.settings);
    } catch (error) {
      console.error('Unable to load product downloads', error);
      this.innerHTML = '';
    }
  }

  private render(productId: string, files: ProductDownload[], settings?: NonNullable<ProductDownloadsResponse['data']>['settings']) {
    const buttonText = this.getAttribute('button-text') || settings?.buttonText || 'Download';
    const viewText = this.getAttribute('view-button-text') || settings?.viewButtonText || 'View';
    const showView = this.getAttribute('show-view-button') !== 'false' && settings?.showViewButton !== false;
    const layout = (this.getAttribute('layout') || 'LIST').toUpperCase();
    const radius = Number(this.getAttribute('border-radius') || 8);
    const spacing = Number(this.getAttribute('spacing') || 10);
    const styles = styleForPreset(this.getAttribute('style-preset') || 'MINIMAL', this.getAttribute('text-color') || '#111827', this.getAttribute('button-color') || '#111827', this.getAttribute('button-text-color') || '#ffffff', radius);
    const listStyle = layout === 'CARDS'
      ? `display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:${spacing}px;`
      : `display:flex;flex-direction:column;gap:${spacing}px;`;
    this.innerHTML = `<style>
      .product-downloads-button-spinner {
        display: none;
        width: 14px;
        height: 14px;
        border: 2px solid currentColor;
        border-top-color: transparent;
        border-radius: 50%;
        animation: product-downloads-button-spinner-animation 0.7s linear infinite;
        margin: 0;
        padding: 0;
      }
      @keyframes product-downloads-button-spinner-animation {
        to { transform: rotate(360deg); }
      }
    </style><section style="font:15px system-ui;width:100%;box-sizing:border-box;${styles.section}${styles.text}"><div style="${listStyle}">${files.map((file) => renderFile(file, layout, buttonText, viewText, showView, styles, radius)).join('')}</div></section>`;
    this.querySelectorAll<HTMLButtonElement>('button[data-action]').forEach((button) => {
      button.addEventListener('click', () => void this.openFile(productId, button.dataset.fileId || '', button.dataset.action === 'view', button));
    });
  }

  private async openFile(productId: string, fileId: string, view: boolean, trigger?: HTMLButtonElement) {
    if (!fileId) return;
    const spinner = !view ? trigger?.querySelector<HTMLElement>('.product-downloads-button-spinner') : undefined;
    if (!view && trigger) {
      trigger.disabled = true;
      trigger.setAttribute('aria-busy', 'true');
      if (spinner) spinner.style.display = 'inline-block';
    }
    try {
      const payload = await requestDownloadApi(`/api/downloads?fileId=${encodeURIComponent(fileId)}&productId=${encodeURIComponent(productId)}&mode=${view ? 'view' : 'download'}`);
      if (!payload.success || !payload.data?.url) {
        const message = payload.errorMessage || 'Unable to download this file';
        console.warn(message);
        toast.error(message);
        return;
      }
      if (view) window.open(payload.data.url, '_blank', 'noopener,noreferrer');
      else {
        const anchor = document.createElement('a');
        anchor.href = payload.data.url;
        anchor.download = '';
        anchor.click();
      }
    } catch (error) {
      console.error('Unable to open product download', error);
      toast.error(error instanceof Error ? error.message : 'Unable to download this file');
    } finally {
      if (!view && trigger) {
        trigger.disabled = false;
        trigger.removeAttribute('aria-busy');
        if (spinner) spinner.style.display = 'none';
      }
    }
  }
}

export default ProductDownloadsElement;
