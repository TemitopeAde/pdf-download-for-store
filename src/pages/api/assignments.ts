import type { APIRoute } from 'astro';

/**
This file defines an HTTP endpoint exposed at `/api/assignments`.

Endpoints are discovered from the filesystem — no registration is needed.
Call them from frontend extensions with `httpClient.fetchWithAuth()` from
`@wix/essentials` to attach the current user's access token.
*/

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ message: 'Hello from /api/assignments' }),
    { headers: { 'Content-Type': 'application/json' } }
  );
};

export const POST: APIRoute = async ({ request }) => {
  const data = await request.json();

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
};
