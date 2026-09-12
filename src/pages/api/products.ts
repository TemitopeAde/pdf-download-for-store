import type { APIRoute } from 'astro';
import { fail, json, ok } from '../../lib/data';
import { listProducts } from '../../lib/products';

/**
This file defines an HTTP endpoint exposed at `/api/products`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async ({ url }) => {
  try {
    const limit = Number(url.searchParams.get('limit') ?? 40);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const sort = url.searchParams.get('sort') ?? 'name-asc';
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isSafeInteger(offset) || offset < 0 || (sort !== 'name-asc' && sort !== 'name-desc')) {
      return json(fail('Invalid product pagination or sort'), 400);
    }
    const result = await listProducts(url.searchParams.get('search') ?? '', limit, offset, url.searchParams.get('cursor') ?? undefined, sort);
    return json(ok(result));
  } catch (error) {
    console.error('Unable to retrieve products', error);
    return json(fail('Unable to retrieve products'), 500);
  }
};

export const POST: APIRoute = async () => {
  return json(fail('Product writes are managed by Wix Stores'), 405);
};
