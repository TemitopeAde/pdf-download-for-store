import type { APIRoute } from 'astro';
import { assignFilesToAllProducts, getGlobalRules, removeRule } from '../../lib/assignments';
import { fail, json, ok, readJson } from '../../lib/data';
import type { Visibility } from '../../lib/types';
import { currentPlan } from '../../lib/plans';

export const GET: APIRoute = async () => {
  try {
    return json(ok({ rules: await getGlobalRules() }));
  } catch (error) {
    console.error('Unable to retrieve global assignments', error);
    return json(fail('Unable to retrieve global assignments'), 500);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!currentPlan().allowsGlobalAssignments) return json(fail('Global product assignments require the Pro plan or higher'), 403);
  try {
    const body = await readJson(request);
    const assignments = Array.isArray(body.assignments)
      ? body.assignments.flatMap((value) => {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) return [];
        const entry = value as Record<string, unknown>;
        if (typeof entry.fileId !== 'string' || !entry.fileId.trim()) return [];
        const visibility: Visibility | undefined = entry.visibility === 'MEMBERS_ONLY' || entry.visibility === 'PURCHASE_REQUIRED' ? entry.visibility : undefined;
        return [{
          fileId: entry.fileId.trim(),
          ...(typeof entry.label === 'string' ? { label: entry.label.trim() } : {}),
          ...(visibility ? { visibility } : {}),
        }];
      })
      : [];
    if (assignments.length === 0 && typeof body.fileId === 'string' && body.fileId.trim()) assignments.push({ fileId: body.fileId.trim() });
    if (assignments.length === 0) return json(fail('At least one file assignment is required'), 400);
    const rules = await assignFilesToAllProducts(assignments);
    return json(ok({ rules }), 201);
  } catch (error) {
    console.error('Unable to assign files to all products', error);
    return json(fail(error instanceof Error ? error.message : 'Unable to assign files to all products'), 400);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  const ruleId = url.searchParams.get('ruleId');
  if (!ruleId) return json(fail('ruleId is required'), 400);
  try {
    await removeRule(ruleId);
    return json(ok({ removed: true }));
  } catch (error) {
    console.error('Unable to remove global assignment', error);
    return json(fail('Unable to remove global assignment'), 400);
  }
};
