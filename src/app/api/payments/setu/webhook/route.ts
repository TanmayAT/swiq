import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSetuClient, SetuWebhookEvent } from '@/lib/setu';
import { applyPaymentEvent, appendAudit } from '@/lib/payments';

/**
 * POST /api/payments/setu/webhook
 *
 * Setu calls this when a payment terminates (success / fail / expired / refund).
 * Steps:
 *   1. Read raw body and verify signature.
 *   2. Dedupe by event id.
 *   3. Look up order by platformBillID; apply state transition.
 *   4. Always 200, even on duplicate / unknown events — Setu retries on non-2xx.
 *
 * Side-effects (notify vendor, fire kitchen ticket) should be triggered from
 * `applyPaymentEvent`'s state diff in production. For now we just transition.
 */
export async function POST(req: NextRequest) {
  const setu = getSetuClient();
  const raw = await req.text();
  const sig = req.headers.get('x-setu-signature');

  if (!setu.verifyWebhookSignature(raw, sig)) {
    appendAudit({ kind: 'webhook-bad-signature', sig });
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: SetuWebhookEvent;
  try {
    event = JSON.parse(raw) as SetuWebhookEvent;
  } catch {
    appendAudit({ kind: 'webhook-bad-json' });
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  // Resolve our order. Prefer billerBillID (which we set to our orderId),
  // fall back to platformBillID lookup if billerBillID is missing.
  let order = event.billerBillID ? db.orders.findById(event.billerBillID) : undefined;
  if (!order && event.platformBillID) {
    order = db.orders.findByPlatformBillID(event.platformBillID);
  }

  if (!order) {
    appendAudit({ kind: 'webhook-unknown-order', event });
    // Still 200 so Setu doesn't keep retrying for an order we'll never find.
    return NextResponse.json({ ok: true, ignored: 'unknown order' });
  }

  applyPaymentEvent({
    orderId: order.id,
    eventId: event.eventId,
    source: 'webhook',
    type: event.type,
    utr: event.utr,
    payerVpa: event.payerVpa,
    paidAmountInPaise: event.amountInPaise,
    paidAt: event.paidAt,
    failureReason: event.failureReason,
    meta: { platformBillID: event.platformBillID },
  });

  appendAudit({ kind: 'webhook', orderId: order.id, type: event.type, eventId: event.eventId });

  return NextResponse.json({ ok: true });
}
