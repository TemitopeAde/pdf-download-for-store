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

function sanitizeColor(value: string): string {
  return /^#[0-9a-fA-F]{6,8}$/.test(value) ? value : '#111827';
}

type FontSetting = { font: string; textDecoration: string };

function applyFont(element: HTMLElement, setting: FontSetting): void {
  // inputs.selectFont returns CSS shorthand such as `18px "geotica-w01-four-open"`.
  const font = setting.font.trim() || 'system-ui';
  element.style.font = font;
  element.style.textDecoration = setting.textDecoration || '';
  // Ask the browser to fetch the selected Wix webfont before the button is painted.
  void document.fonts?.load(font).catch(() => undefined);
}

function fontValueFromAttribute(value: string | null): FontSetting {
  if (!value) return { font: 'system-ui', textDecoration: '' };
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null && 'font' in parsed && typeof parsed.font === 'string') {
      return {
        font: parsed.font,
        textDecoration: 'textDecoration' in parsed && typeof parsed.textDecoration === 'string' ? parsed.textDecoration : '',
      };
    }
  } catch { /* Older plugin instances stored the shorthand directly. */ }
  return { font: value, textDecoration: '' };
}

function renderFile(file: ProductDownload, labelColor: string): string {
  const buttonText = file.label?.trim() || 'Download';
  return `<button type="button" data-action="download" data-file-id="${escapeHtml(file.fileId)}" style="display:inline-flex;align-items:center;gap:8px;border:0;border-radius:4px;cursor:pointer;color:${sanitizeColor(labelColor)}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg>${escapeHtml(buttonText)}<span class="product-downloads-button-spinner" aria-hidden="true"></span></button>`;
}

class ProductDownloadsElement extends HTMLElement {
  private toastRoot?: Root;
  private toastHost?: HTMLDivElement;

  static get observedAttributes() {
    return ['product-id', 'label-font', 'label-color', 'layout'];
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
    this.innerHTML = `<div class="product-downloads-loading" role="status" aria-label="Loading downloads"><span></span><span></span><span></span></div><style>
      .product-downloads-loading {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        min-height: 24px;
      }
      .product-downloads-loading span {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: currentColor;
        animation: product-downloads-loading-animation 1.2s infinite ease-in-out;
      }
      .product-downloads-loading span:nth-child(2) { animation-delay: 0.15s; }
      .product-downloads-loading span:nth-child(3) { animation-delay: 0.3s; }
      @keyframes product-downloads-loading-animation {
        0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
        40% { opacity: 1; transform: scale(1); }
      }
    </style>`;
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
    const layout = this.getAttribute('layout') === 'ROW' ? 'row' : 'column';
    const listStyle = `display:flex;flex-direction:${layout};align-items:flex-start;gap:8px;`;
    const labelFont = fontValueFromAttribute(this.getAttribute('label-font'));
    const labelColor = this.getAttribute('label-color') || '#111827';
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
    </style><div style="${listStyle}">${files.map((file) => renderFile(file, labelColor)).join('')}</div>`;
    this.querySelectorAll<HTMLButtonElement>('button[data-action="download"]').forEach((button) => {
      applyFont(button, labelFont);
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
