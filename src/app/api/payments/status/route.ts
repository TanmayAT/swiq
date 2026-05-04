import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSetuClient } from '@/lib/setu';
import { applyPaymentEvent, appendAudit } from '@/lib/payments';

/**
 * GET /api/payments/status?orderId=...
 *
 * Layer 2 of the confirmation strategy: while the user is on the payment
 * screen, we poll this endpoint. It first reads our local state (set by the
 * webhook). If still INITIATED, we ask Setu directly — that handles the case
 * where the webhook is delayed by a few seconds.
 *
 * Returns the public-safe summary of the order's payment state.
 */
export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get('orderId');
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = db.orders.findById(orderId);
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });

  // If terminal, just return.
  const terminal = ['PAID', 'SETTLED', 'FAILED', 'EXPIRED', 'REFUNDED'];
  if (order.paymentState && terminal.includes(order.paymentState)) {
    return summary(order);
  }

  // Otherwise, ping the gateway as a fallback (Layer 2).
  const platformBillID = order.payment?.platformBillID;
  if (platformBillID) {
    const setu = getSetuClient();
    try {
      const live = await setu.getStatus(platformBillID);
      if (live.status === 'SUCCESS') {
        applyPaymentEvent({
          orderId: order.id,
          eventId: `STATUS_API_${platformBillID}_${Date.now()}`,
          source: 'status-api',
          type: 'PAYMENT_SUCCESS',
          utr: live.utr,
          payerVpa: live.payerVpa,
          paidAmountInPaise: live.paidAmountInPaise,
          paidAt: live.paidAt,
        });
      } else if (live.status === 'FAILURE') {
        applyPaymentEvent({
          orderId: order.id,
          eventId: `STATUS_API_${platformBillID}_${Date.now()}`,
          source: 'status-api',
          type: 'PAYMENT_FAILED',
          failureReason: live.failureReason,
        });
      } else if (live.status === 'EXPIRED') {
        applyPaymentEvent({
          orderId: order.id,
          eventId: `STATUS_API_${platformBillID}_${Date.now()}`,
          source: 'status-api',
          type: 'PAYMENT_EXPIRED',
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      appendAudit({ kind: 'status-error', orderId, error: msg });
    }
  }

  // Re-read after potential mutation.
  return summary(db.orders.findById(orderId)!);
}

function summary(order: import('@/lib/types').Order) {
  return NextResponse.json({
    orderId: order.id,
    paymentState: order.paymentState ?? 'CREATED',
    paymentStatus: order.paymentStatus ?? 'pending',
    paymentMethod: order.paymentMethod,
    total: order.total,
    upiLink: order.payment?.upiLink,
    expiresAt: order.payment?.expiresAt,
    utr: order.payment?.utr,
    paidAt: order.payment?.paidAt,
    failureReason: order.payment?.failureReason,
  });
}
