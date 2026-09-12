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
  data?: { files: ProductDownload[]; settings?: { title?: string; buttonText?: string } };
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

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] ?? character));
}

function renderFile(file: ProductDownload): string {
  const buttonText = file.label?.trim() || 'Download';
  return `<button type="button" data-action="download" data-file-id="${escapeHtml(file.fileId)}" style="border:0;border-radius:4px;padding:10px 16px;cursor:pointer">${escapeHtml(buttonText)}<span class="product-downloads-button-spinner" aria-hidden="true"></span></button>`;
}

class ProductDownloadsElement extends HTMLElement {
  private toastRoot?: Root;
  private toastHost?: HTMLDivElement;

  static get observedAttributes() {
    return ['product-id'];
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

  private renderLoadingButton() {
    const buttonText = escapeHtml(this.getAttribute('button-text') || 'Download');
    this.innerHTML = `<button type="button" disabled aria-busy="true" style="border:0;border-radius:4px;padding:10px 16px;opacity:1;cursor:pointer">${buttonText}</button>`;
  }

  private async load() {
    const productId = this.getAttribute('product-id') ?? this.getAttribute('productId');
    if (!productId) {
      this.innerHTML = '';
      return;
    }
    this.renderLoadingButton();
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
      this.render(productId, files);
    } catch (error) {
      console.error('Unable to load product downloads', error);
      this.innerHTML = '';
    }
  }

  private render(productId: string, files: ProductDownload[]) {
    const listStyle = 'display:flex;flex-wrap:wrap;gap:8px;';
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
    </style><div style="${listStyle}">${files.map(renderFile).join('')}</div>`;
    this.querySelectorAll<HTMLButtonElement>('button[data-action="download"]').forEach((button) => {
      button.addEventListener('click', () => void this.openFile(productId, button.dataset.fileId || '', button));
    });
  }

  private async openFile(productId: string, fileId: string, trigger?: HTMLButtonElement) {
    if (!fileId) return;
    const spinner = trigger?.querySelector<HTMLElement>('.product-downloads-button-spinner');
    if (trigger) {
      trigger.disabled = true;
      trigger.setAttribute('aria-busy', 'true');
      if (spinner) spinner.style.display = 'inline-block';
    }
    try {
      const payload = await requestDownloadApi(`/api/downloads?fileId=${encodeURIComponent(fileId)}&productId=${encodeURIComponent(productId)}`);
      if (!payload.success || !payload.data?.url) {
        const message = payload.errorMessage || 'Unable to download this file';
        console.warn(message);
        toast.error(message);
        return;
      }
      const anchor = document.createElement('a');
      anchor.href = payload.data.url;
      anchor.download = '';
      anchor.click();
    } catch (error) {
      console.error('Unable to open product download', error);
      toast.error(error instanceof Error ? error.message : 'Unable to download this file');
    } finally {
      if (trigger) {
        trigger.disabled = false;
        trigger.removeAttribute('aria-busy');
        if (spinner) spinner.style.display = 'none';
      }
    }
  }
}

export default ProductDownloadsElement;
