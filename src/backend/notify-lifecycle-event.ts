import { appInstances } from '@wix/app-management';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTIONS } from '../lib/data';

export type LifecycleEventType =
  | 'APP_INSTALLED'
  | 'FREE_TRIAL'
  | 'PAID_PLAN_PURCHASED'
  | 'PAID_PLAN_CHANGED';

export type LifecycleEventInput = {
  eventType: LifecycleEventType;
  vendorProductId?: string | null;
  previousVendorProductId?: string | null;
  cycle?: string | null;
  invoiceId?: string | null;
  occurredAt?: Date | string | null;
  eventPayload?: unknown;
  instanceIdHint?: string | null;
};

const NOTIFY_EMAIL = 'adesiyantope2014@gmail.com';
const SEND_EMAIL_ENDPOINT =
  'https://dev-sitex1193665855.wixdev-sites.org/_functions-dev/sendEmail';
const SEND_TIMEOUT_MS = 10_000;
const LOG_PREFIX = '[PDF Download for Store]';

const EVENT_LABELS: Record<LifecycleEventType, string> = {
  APP_INSTALLED: 'App installed',
  FREE_TRIAL: 'Free trial started',
  PAID_PLAN_PURCHASED: 'Paid plan purchased',
  PAID_PLAN_CHANGED: 'Plan upgraded',
};

const getText = (value: unknown) =>
  typeof value === 'string' ? value.trim() : '';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const toIsoDate = (value: Date | string | null | undefined) => {
  if (!value) return new Date().toISOString();
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? new Date().toISOString()
    : parsed.toISOString();
};

const buildEmailHtml = (rows: Array<[string, string]>, heading: string) => {
  const itemsHtml = rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) =>
        `<li><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</li>`,
    )
    .join('');

  return [
    '<!DOCTYPE html><html><body style="font-family: Arial, sans-serif; color: #222;">',
    `<h2>${escapeHtml(heading)}</h2>`,
    itemsHtml ? `<ul>${itemsHtml}</ul>` : '<p>No details available.</p>',
    '</body></html>',
  ].join('');
};

const sendLifecycleEmail = async (to: string, subject: string, html: string) => {
  const response = await fetch(SEND_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, html }),
    signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
  });

  if (!response.ok) {
    const responseText = (await response.text().catch(() => '')).slice(0, 300);
    throw new Error(
      `Email endpoint returned ${response.status}${responseText ? `: ${responseText}` : ''}`,
    );
  }
};

export const isFreeTrialInProgress = async (): Promise<boolean> => {
  try {
    const getAppInstance = auth.elevate(appInstances.getAppInstance);
    const { instance } = await getAppInstance();
    return instance?.billing?.freeTrialInfo?.status === 'IN_PROGRESS';
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Failed to classify free trial status`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    return false;
  }
};

export const notifyLifecycleEvent = async (input: LifecycleEventInput) => {
  const label = EVENT_LABELS[input.eventType];
  const occurredAtIso = toIsoDate(input.occurredAt);

  let instanceId = getText(input.instanceIdHint);
  let siteUrl = '';
  let siteDisplayName = '';
  let ownerEmail = '';

  try {
    const getAppInstance = auth.elevate(appInstances.getAppInstance);
    const { instance, site } = await getAppInstance();
    instanceId = getText(instance?.instanceId) || instanceId;
    siteUrl = getText(site?.url);
    siteDisplayName = getText(site?.siteDisplayName);
    ownerEmail = getText(site?.ownerInfo?.email).toLowerCase();
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Failed to load app instance for lifecycle event`,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  const vendorProductId = getText(input.vendorProductId);
  const previousVendorProductId = getText(input.previousVendorProductId);
  const cycle = getText(input.cycle);
  const invoiceId = getText(input.invoiceId);
  const siteLabel = siteUrl || siteDisplayName || instanceId || 'unknown site';
  const title = `${input.eventType} · ${siteLabel}`;

  const detailRows: Array<[string, string]> = [
    ['Event', label],
    ['Site name', siteDisplayName],
    ['Site URL', siteUrl],
    ['Owner email', ownerEmail],
    ['Instance ID', instanceId],
    ['Plan', vendorProductId],
    ['Previous plan', previousVendorProductId],
    ['Billing cycle', cycle],
    ['Invoice ID', invoiceId],
    ['Occurred at', occurredAtIso],
  ];

  try {
    const insertItem = auth.elevate(items.insert);
    await insertItem(COLLECTIONS.lifecycleEvents, {
      title,
      eventType: input.eventType,
      instanceId,
      siteUrl,
      siteDisplayName,
      ownerEmail,
      vendorProductId,
      previousVendorProductId,
      cycle,
      invoiceId,
      eventPayloadJson: JSON.stringify(input.eventPayload ?? {}),
      notifiedEmail: NOTIFY_EMAIL,
      occurredAt: { $date: occurredAtIso },
    });
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Failed to save lifecycle event`,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }

  try {
    const subject = `[PDF Download for Store] ${label}`;
    await sendLifecycleEmail(
      NOTIFY_EMAIL,
      subject,
      buildEmailHtml(detailRows, subject),
    );
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Failed to send lifecycle email`,
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
};
