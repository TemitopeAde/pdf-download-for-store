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
  console.info('[product-downloads] purchase check started', {
    productId,
    active: token.active,
    subjectType: token.subjectType,
    hasSubjectId: Boolean(token.subjectId),
  });
  if (!token.active || token.subjectType !== 'MEMBER' || !token.subjectId) {
    console.warn('[product-downloads] purchase check denied: caller is not an active member', { productId });
    return false;
  }

  const searchOrders = auth.elevate(orders.searchOrders);
  let cursor: string | undefined;

  do {
    const response = await searchOrders({
      filter: { 'buyerInfo.memberId': { $eq: token.subjectId } },
      cursorPaging: { limit: 100, ...(cursor ? { cursor } : {}) },
    });
    const orders = (response.orders ?? []) as OrderLike[];
    console.info('[product-downloads] orders retrieved for purchase check', {
      productId,
      orderCount: orders.length,
      hasNext: Boolean(response.metadata?.cursors?.next),
      orderStatuses: orders.map((order) => ({ status: order.status, paymentStatus: order.paymentStatus, lineItemCount: order.lineItems?.length ?? 0 })),
      lineItems: orders.flatMap((order) => (order.lineItems ?? []).map((item) => ({
        appId: item.catalogReference?.appId,
        catalogItemId: item.catalogReference?.catalogItemId,
      }))),
    });
    const matched = orders.some((order) => {
      const validPayment = order.paymentStatus === 'PAID' || order.paymentStatus === 'PARTIALLY_REFUNDED';
      const validOrder = order.status !== 'CANCELED' && order.status !== 'REJECTED';
      return validPayment && validOrder && (order.buyerInfo?.memberId === token.subjectId) &&
        (order.lineItems ?? []).some((item) => item.catalogReference?.appId === WIX_STORES_APP_ID && item.catalogReference.catalogItemId === productId);
    });
    if (matched) {
      console.info('[product-downloads] purchase check matched', { productId });
      return true;
    }
    cursor = response.metadata?.cursors?.next ?? undefined;
  } while (cursor);

  console.warn('[product-downloads] purchase check did not match product', { productId });
  return false;
}
