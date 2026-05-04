import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSetuClient } from '@/lib/setu';
import { applyPaymentEvent, appendAudit } from '@/lib/payments';

/**
 * Reconciliation cron — Layer 3.
 *
 * Pulls every order in INITIATED state older than 5 minutes and queries Setu
 * for its true status. Catches webhook delivery failures and stuck orders.
 *
 * Wire to a real cron (Vercel Cron, GitHub Actions, k8s CronJob) hitting:
 *   POST /api/payments/reconcile  with header  x-cron-key: $RECONCILE_CRON_KEY
 */
export async function POST(req: Request) {
  const expected = process.env.RECONCILE_CRON_KEY;
  if (expected) {
    const got = req.headers.get('x-cron-key');
    if (got !== expected) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const setu = getSetuClient();
  const cutoff = Date.now() - 5 * 60_000;
  const stuck = db.orders.getAll().filter(o =>
    o.paymentState === 'INITIATED'
    && o.payment?.platformBillID
    && new Date(o.payment.initiatedAt ?? o.createdAt).getTime() < cutoff,
  );

  let advanced = 0;
  for (const o of stuck) {
    try {
      const live = await setu.getStatus(o.payment!.platformBillID!);
      if (live.status === 'SUCCESS') {
        applyPaymentEvent({
          orderId: o.id,
          eventId: `RECON_${o.payment!.platformBillID}_${Date.now()}`,
          source: 'reconcile',
          type: 'PAYMENT_SUCCESS',
          utr: live.utr,
          payerVpa: live.payerVpa,
          paidAmountInPaise: live.paidAmountInPaise,
          paidAt: live.paidAt,
        });
        advanced++;
      } else if (live.status === 'FAILURE') {
        applyPaymentEvent({
          orderId: o.id,
          eventId: `RECON_${o.payment!.platformBillID}_${Date.now()}`,
          source: 'reconcile',
          type: 'PAYMENT_FAILED',
          failureReason: live.failureReason,
        });
        advanced++;
      } else if (live.status === 'EXPIRED') {
        applyPaymentEvent({
          orderId: o.id,
          eventId: `RECON_${o.payment!.platformBillID}_${Date.now()}`,
          source: 'reconcile',
          type: 'PAYMENT_EXPIRED',
        });
        advanced++;
      }
    } catch (err) {
      appendAudit({ kind: 'reconcile-error', orderId: o.id, error: err instanceof Error ? err.message : 'unknown' });
    }
  }

  appendAudit({ kind: 'reconcile', scanned: stuck.length, advanced });
  return NextResponse.json({ scanned: stuck.length, advanced });
}
