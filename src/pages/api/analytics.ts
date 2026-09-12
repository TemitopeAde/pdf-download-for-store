import type { APIRoute } from 'astro';
import { fail, json, ok } from '../../lib/data';
import { getAnalyticsSummary } from '../../lib/analytics';
import { currentPlan } from '../../lib/plans';

/**
This file defines an HTTP endpoint exposed at `/api/analytics`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async () => {
  if (!currentPlan().allowsAnalytics) return json(fail('Analytics require the Pro plan or higher'), 403);
  try {
    return json(ok(await getAnalyticsSummary()));
  } catch (error) {
    console.error('Unable to retrieve analytics', error);
    return json(fail('Unable to retrieve analytics'), 500);
  }
};

export const POST: APIRoute = async () => {
  return json(fail('Analytics writes happen when a visitor downloads a file'), 405);
};
