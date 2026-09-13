import { httpClient } from '@wix/essentials';
import { createRoot, type Root } from 'react-dom/client';
import { toast, Toaster } from 'sonner';
import 'sonner/dist/styles.css';
import { localeFromDocument } from '../../../../lib/detect-locale';
import { translate } from '../../../../lib/translations';

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

function renderFormatIcon(file: ProductDownload): string {
  const type = file.fileType.toLowerCase().split(';')[0]?.trim() || '';
  const extension = file.name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] || '';
  const formats = [
    { extensions: ['xls', 'xlsx', 'xlsm', 'xlsb', 'csv', 'ods'], types: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel.sheet.macroenabled.12', 'application/vnd.ms-excel.sheet.binary.macroenabled.12', 'text/csv', 'application/vnd.oasis.opendocument.spreadsheet'], label: 'XLS', color: '#167447' },
    { extensions: ['doc', 'docx', 'docm', 'odt', 'rtf'], types: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-word.document.macroenabled.12', 'application/vnd.oasis.opendocument.text', 'application/rtf', 'text/rtf'], label: 'DOC', color: '#2563eb' },
    { extensions: ['pdf'], types: ['application/pdf'], label: 'PDF', color: '#b91c1c' },
    { extensions: ['zip', 'rar', '7z', 'gz', 'tar'], types: ['application/zip', 'application/x-zip-compressed', 'application/vnd.rar', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip', 'application/x-tar'], label: 'ZIP', color: '#7c3aed' },
    { extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'avif', 'bmp', 'tif', 'tiff', 'ico', 'heic'], types: [], label: 'IMG', color: '#0e7490' },
  ];
  const format = formats.find((entry) => entry.types.includes(type))
    ?? (type.startsWith('image/') ? formats.find((entry) => entry.label === 'IMG') : undefined)
    ?? formats.find((entry) => entry.extensions.includes(type.replace(/^\./, '')) || entry.extensions.includes(extension));
  const color = format?.color || '#4b5563';
  const label = format?.label || 'FILE';
  return `<svg width="28" height="32" viewBox="0 0 28 32" style="flex-shrink:0" aria-hidden="true" focusable="false"><path d="M4 0h14l10 10v18a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V4a4 4 0 0 1 4-4Z" fill="${color}"/><path d="M18 0v7a3 3 0 0 0 3 3h7Z" fill="#fff" fill-opacity=".3"/><text x="14" y="24" text-anchor="middle" style="font:700 8px Arial,sans-serif;fill:#fff">${label}</text></svg>`;
}

function renderFile(file: ProductDownload, labelColor: string, locale: ReturnType<typeof localeFromDocument>): string {
  const defaultLabel = translate('download', locale);
  const buttonText = file.label?.trim() || defaultLabel;
  const accessibleLabel = buttonText === defaultLabel || /^download\b/i.test(buttonText)
    ? translate('downloadNamed', locale, { name: file.label?.trim() || file.name })
    : buttonText;
  return `<button type="button" data-action="download" data-file-id="${escapeHtml(file.fileId)}" aria-label="${escapeHtml(accessibleLabel)}" style="display:inline-flex;align-items:center;gap:8px;max-width:100%;border:0;border-radius:4px;cursor:pointer;color:${sanitizeColor(labelColor)}">${renderFormatIcon(file)}<span style="min-width:0;overflow-wrap:anywhere;text-align:start">${escapeHtml(buttonText)}</span><svg width="16" height="16" style="margin-left:auto;flex-shrink:0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3v12"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path></svg><span class="product-downloads-button-spinner" aria-hidden="true"></span></button>`;
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
    this.innerHTML = `<div class="product-downloads-loading" role="status" aria-label="${translate('loadingDownloads', localeFromDocument())}"><span></span><span></span><span></span></div><style>
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
    const locale = localeFromDocument();
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
    </style><div style="${listStyle}">${files.map((file) => renderFile(file, labelColor, locale)).join('')}</div>`;
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
        const message = payload.errorMessage || translate('unableToDownload', localeFromDocument());
        console.warn(message);
        toast.error(translate(message, localeFromDocument()));
        return;
      }
      const anchor = document.createElement('a');
      anchor.href = payload.data.url;
      anchor.download = '';
      anchor.click();
    } catch (error) {
      console.error('Unable to open product download', error);
      toast.error(translate(error instanceof Error ? error.message : 'unableToDownload', localeFromDocument()));
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
