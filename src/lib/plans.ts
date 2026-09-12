export type PlanName = 'Basic' | 'Pro' | 'Business';

export interface Plan {
  name: PlanName;
  maxFiles: number | null;
  maxProducts: number | null;
  allowsAdvancedAccess: boolean;
  allowsGlobalAssignments: boolean;
  allowsAnalytics: boolean;
}

// Billing is not connected yet, so this is the single source of truth for the
// currently active plan until it is replaced by the billing entitlement.
export const CURRENT_PLAN: PlanName = 'Basic';

export function createUpgradeUrl(): string {
  const upgradeUrl = new URL('https://www.wix.com/apps/upgrade/84b2cf04-a201-44d5-8039-fbfebcab162a');
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const instanceId = params.get('appInstanceId') ?? params.get('instanceId');
    if (instanceId) upgradeUrl.searchParams.set('appInstanceId', instanceId);
  }
  return upgradeUrl.href;
}

export const PLANS: Record<PlanName, Plan> = {
  Basic: { name: 'Basic', maxFiles: 5, maxProducts: 5, allowsAdvancedAccess: false, allowsGlobalAssignments: false, allowsAnalytics: false },
  Pro: { name: 'Pro', maxFiles: 100, maxProducts: 50, allowsAdvancedAccess: true, allowsGlobalAssignments: true, allowsAnalytics: true },
  Business: { name: 'Business', maxFiles: null, maxProducts: null, allowsAdvancedAccess: true, allowsGlobalAssignments: true, allowsAnalytics: true },
};

export const currentPlan = (): Plan => PLANS[CURRENT_PLAN];
