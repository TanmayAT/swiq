import fs from 'fs';
import path from 'path';
import { db } from './db';
import { Order, PaymentEvent, PaymentInfo, PaymentState } from './types';

/**
 * Apply a webhook/status event to an order, advancing its payment state.
 * Idempotent: replaying the same event id is a no-op.
 *
 * Returns the updated order (or null if not found).
 */
export function applyPaymentEvent(args: {
  orderId: string;
  eventId: string;                       // for dedupe
  source: PaymentEvent['source'];
  type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'PAYMENT_EXPIRED' | 'REFUND_INITIATED' | 'REFUND_SUCCESS';
  utr?: string;
  payerVpa?: string;
  paidAmountInPaise?: number;
  paidAt?: string;
  failureReason?: string;
  meta?: Record<string, unknown>;
}): Order | null {
  return db.orders.mutate(args.orderId, prev => {
    const payment: PaymentInfo = prev.payment ?? { events: [], webhookEventIds: [] };

    // Idempotency — same event id already recorded.
    if (payment.webhookEventIds.includes(args.eventId)) return prev;

    const event: PaymentEvent = {
      type: args.type,
      at: new Date().toISOString(),
      source: args.source,
      meta: args.meta,
    };
    const events = [...payment.events, event];
    const webhookEventIds = [...payment.webhookEventIds, args.eventId];

    // Determine new state. PAID is terminal except for REFUND_*.
    let nextState: PaymentState = prev.paymentState ?? 'INITIATED';
    const next: PaymentInfo = { ...payment, events, webhookEventIds };

    switch (args.type) {
      case 'PAYMENT_SUCCESS':
        if (nextState !== 'PAID' && nextState !== 'SETTLED' && nextState !== 'REFUNDED') {
          nextState = 'PAID';
          next.utr = args.utr;
          next.payerVpa = args.payerVpa;
          next.paidAmount = args.paidAmountInPaise != null ? args.paidAmountInPaise / 100 : prev.total;
          next.paidAt = args.paidAt ?? new Date().toISOString();
        }
        break;
      case 'PAYMENT_FAILED':
        if (nextState !== 'PAID' && nextState !== 'SETTLED') {
          nextState = 'FAILED';
          next.failureReason = args.failureReason;
        }
        break;
      case 'PAYMENT_EXPIRED':
        if (nextState === 'INITIATED' || nextState === 'CREATED') {
          nextState = 'EXPIRED';
        }
        break;
      case 'REFUND_INITIATED':
        // mark intent; final state set by REFUND_SUCCESS
        break;
      case 'REFUND_SUCCESS':
        if (nextState === 'PAID' || nextState === 'SETTLED') {
          nextState = 'REFUNDED';
          next.refundedAt = new Date().toISOString();
        }
        break;
    }

    return {
      ...prev,
      payment: next,
      paymentState: nextState,
      paymentStatus: (nextState === 'PAID' || nextState === 'SETTLED') ? 'paid' : prev.paymentStatus ?? 'pending',
      paymentRef: next.utr ?? prev.paymentRef,
    };
  });
}

/* ── tiny audit log so failed webhooks are inspectable ── */

const AUDIT_FILE = path.join(process.cwd(), 'data', 'payment_events.json');

export function appendAudit(entry: Record<string, unknown>) {
  let arr: unknown[] = [];
  try {
    if (fs.existsSync(AUDIT_FILE)) {
      arr = JSON.parse(fs.readFileSync(AUDIT_FILE, 'utf-8'));
      if (!Array.isArray(arr)) arr = [];
    }
  } catch {
    arr = [];
  }
  arr.unshift({ at: new Date().toISOString(), ...entry });
  // Keep most recent 500 only.
  if (arr.length > 500) arr = arr.slice(0, 500);
  fs.writeFileSync(AUDIT_FILE, JSON.stringify(arr, null, 2));
}
