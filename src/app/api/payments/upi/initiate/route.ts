import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSetuClient } from '@/lib/setu';
import { appendAudit } from '@/lib/payments';
import { PaymentInfo } from '@/lib/types';

/**
 * POST /api/payments/upi/initiate
 * body: { orderId: string }
 *
 * Creates a Setu payment link for the order, stores the platformBillID + upiLink,
 * transitions paymentState to INITIATED, and returns the link to the client.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }
  const orderId = body.orderId;
  if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 });

  const order = db.orders.findById(orderId);
  if (!order) return NextResponse.json({ error: 'order not found' }, { status: 404 });
  if (order.paymentMethod !== 'upi') {
    return NextResponse.json({ error: 'order is not a UPI order' }, { status: 400 });
  }

  // If we already have a live link and it isn't expired/paid, reuse it (idempotent).
  const existing = order.payment;
  const now = Date.now();
  const stillValid = existing?.upiLink
    && existing.expiresAt
    && new Date(existing.expiresAt).getTime() > now
    && order.paymentState !== 'PAID'
    && order.paymentState !== 'FAILED'
    && order.paymentState !== 'EXPIRED'
    && order.paymentState !== 'REFUNDED';

  if (stillValid) {
    return NextResponse.json({
      platformBillID: existing!.platformBillID,
      upiLink: existing!.upiLink,
      expiresAt: existing!.expiresAt,
      reused: true,
    });
  }

  const shop = db.shop.get();
  if (!shop.bankAccountId || !shop.bankIfsc) {
    return NextResponse.json({
      error: 'Vendor bank account not onboarded. Set bankAccountId and bankIfsc on the shop record before accepting UPI payments.',
    }, { status: 400 });
  }

  const setu = getSetuClient();

  try {
    const link = await setu.createPaymentLink({
      orderId,
      amountInPaise: Math.round(order.total * 100),
      payeeName: shop.name,
      note: `Order ${orderId.slice(-6).toUpperCase()}`,
      expiresInMinutes: 15,
      vendor: {
        bankAccountId: shop.bankAccountId,
        bankIfsc: shop.bankIfsc,
      },
      additionalInfo: {
        orderId,
        customerPhone: order.customerPhone,
      },
    });

    const payment: PaymentInfo = {
      ...(existing ?? { events: [], webhookEventIds: [] }),
      platformBillID: link.platformBillID,
      upiLink: link.upiLink,
      expiresAt: link.expiresAt,
      initiatedAt: new Date().toISOString(),
      events: [
        ...((existing?.events) ?? []),
        { type: 'LINK_CREATED', at: new Date().toISOString(), source: 'system' },
      ],
      webhookEventIds: existing?.webhookEventIds ?? [],
    };

    db.orders.update(orderId, { payment, paymentState: 'INITIATED' });

    appendAudit({ kind: 'initiate', orderId, platformBillID: link.platformBillID });

    return NextResponse.json({
      platformBillID: link.platformBillID,
      upiLink: link.upiLink,
      expiresAt: link.expiresAt,
      reused: false,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown error';
    appendAudit({ kind: 'initiate-error', orderId, error: msg });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
