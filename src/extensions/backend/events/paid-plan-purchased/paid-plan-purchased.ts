import { appInstances } from '@wix/app-management';
import {
  isFreeTrialInProgress,
  notifyLifecycleEvent,
} from '../../../../backend/notify-lifecycle-event';

export default appInstances.onAppInstancePaidPlanPurchased(async (event) => {
  try {
    const data = event.data;
    const freeTrial = await isFreeTrialInProgress();

    await notifyLifecycleEvent({
      eventType: freeTrial ? 'FREE_TRIAL' : 'PAID_PLAN_PURCHASED',
      vendorProductId: data.vendorProductId,
      cycle: data.cycle,
      invoiceId: data.invoiceId,
      occurredAt: data.operationTimeStamp,
      instanceIdHint: event.metadata?.instanceId,
      eventPayload: data,
    });
  } catch (error) {
    console.error(
      '[PDF Download for Store] Failed to handle paid plan purchased event',
      error instanceof Error ? error.message : 'Unknown error',
    );
  }
});
