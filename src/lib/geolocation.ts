import type { CountryGateMode } from './types';

export interface CountryGateResult {
  allowed: boolean;
  countryCode?: string;
  reason?: string;
}

function firstForwardedIp(value: string | null): string | undefined {
  const candidate = value?.split(',')[0]?.trim();
  return candidate || undefined;
}

export function requestIp(request: Request): string | undefined {
  return firstForwardedIp(request.headers.get('x-forwarded-for'))
    ?? request.headers.get('x-real-ip')?.trim()
    ?? request.headers.get('cf-connecting-ip')?.trim()
    ?? undefined;
}

export async function resolveCountry(request: Request): Promise<string | undefined> {
  const ip = requestIp(request);
  const endpoint = ip ? `https://api.country.is/${encodeURIComponent(ip)}` : 'https://api.country.is/';
  const response = await fetch(endpoint, { headers: { accept: 'application/json' } });
  if (!response.ok) throw new Error(`Country lookup failed with ${response.status}`);
  const payload: unknown = await response.json();
  if (typeof payload !== 'object' || payload === null) return undefined;
  const country = (payload as { country?: unknown }).country;
  return typeof country === 'string' ? country.toUpperCase() : undefined;
}

export function checkCountryGate(mode: CountryGateMode, configuredCodes: string[], countryCode: string | undefined, failOpen: boolean): CountryGateResult {
  if (mode === 'OFF' || configuredCodes.length === 0) return { allowed: true, countryCode };
  if (!countryCode) return { allowed: failOpen, reason: failOpen ? 'Country lookup unavailable; allowed by setting' : 'Country lookup unavailable' };
  const matches = configuredCodes.includes(countryCode);
  if (mode === 'ALLOW') return { allowed: matches, countryCode, reason: matches ? undefined : 'Downloads are not available in this country' };
  return { allowed: !matches, countryCode, reason: matches ? 'Downloads are not available in this country' : undefined };
}
