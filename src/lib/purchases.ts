import { orders } from '@wix/ecom';
import { auth } from '@wix/essentials';

const WIX_STORES_APP_ID = '215238eb-22a5-4c36-9e7b-e7c08025e04e';

type OrderLike = {
  status?: string;
  paymentStatus?: string;
  buyerInfo?: { memberId?: string };
  lineItems?: Array<{ catalogReference?: { appId?: string; catalogItemId?: string } }>;
};

/** Checks the current logged-in member's paid Wix Stores orders for a product. */
export async function currentMemberPurchasedProduct(productId: string): Promise<boolean> {
  const token = await auth.getTokenInfo();
  if (!token.active || token.subjectType !== 'MEMBER' || !token.subjectId) return false;

  const searchOrders = auth.elevate(orders.searchOrders);
  let cursor: string | undefined;

  do {
    const response = await searchOrders({
      filter: { 'buyerInfo.memberId': { $eq: token.subjectId } },
      cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) },
    });
    const orders = (response.orders ?? []) as OrderLike[];
    if (orders.some((order) => {
      const validPayment = order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED';
      const validOrder = order.status !== 'CANCELED' && order.status !== 'REJECTED';
      return validPayment && validOrder && (order.buyerInfo?.memberId === token.subjectId) &&
        (order.lineItems ?? []).some((item) => item.catalogReference?.appId === WIX_STORES_APP_ID && item.catalogReference.catalogItemId === productId);
    })) return true;
    cursor = response.metadata?.cursors?.next ?? undefined;
  } while (cursor);

  return false;
}
