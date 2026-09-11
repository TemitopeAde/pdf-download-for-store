import { httpClient } from '@wix/essentials';

export async function dashboardRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await httpClient.fetchWithAuth(new URL(path, import.meta.url).href, {
    ...init,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
  });
  const payload: unknown = await response.json();
  if (!response.ok) throw new Error(typeof payload === 'object' && payload !== null && 'errorMessage' in payload && typeof payload.errorMessage === 'string' ? payload.errorMessage : 'Request failed');
  return payload as T;
}
