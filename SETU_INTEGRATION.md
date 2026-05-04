# Setu UPI Deeplinks — Integration Guide

This app routes UPI payments through Setu's UPI Deeplinks scheme. Customers
still pay through GPay / PhonePe / Paytm / BHIM exactly as before — but the
money lands in Setu's nodal account first and is auto-settled to each vendor's
bank account, and Setu fires a webhook so we can reliably mark orders as PAID.

There is no mock or simulated path. Until you complete the steps below the
`/api/payments/upi/initiate` endpoint will return an error.

---

## What lives where

| Concern               | File                                                |
| --------------------- | --------------------------------------------------- |
| HTTP client           | `src/lib/setu.ts`                                   |
| State machine         | `src/lib/payments.ts` + `Order.paymentState`        |
| Initiate (create link)| `src/app/api/payments/upi/initiate/route.ts`        |
| Webhook ingest        | `src/app/api/payments/setu/webhook/route.ts`        |
| Status polling (UI)   | `src/app/api/payments/status/route.ts`              |
| Reconciliation cron   | `src/app/api/payments/reconcile/route.ts`           |
| Order schema          | `src/lib/types.ts` (`Order`, `PaymentInfo`)         |
| Audit log             | `data/payment_events.json` (auto-created)           |

State machine: `CREATED → INITIATED → PAID → SETTLED` with `EXPIRED`,
`FAILED`, `REFUNDED` as alternative terminals.

Confirmation strategy:

1. **Webhook** (primary, server-to-server, source of truth) — Setu calls
   `/api/payments/setu/webhook` with the payment outcome. Signature verified
   via HMAC-SHA256 of the raw body, deduped by event id.
2. **Status polling** (Layer 2) — while the user is on the payment screen the
   client polls `/api/payments/status` every 3s. If we still haven't seen the
   webhook, that endpoint hits Setu's status API as a fallback.
3. **Reconciliation cron** (Layer 3) — `/api/payments/reconcile` scans every
   `INITIATED` order older than 5 minutes and asks Setu for its true status.
   Runs against missed webhooks. Wire to a cron that hits this every 15 min.

---

## One-time setup

### 1. Setu account

1. Sign up at https://bridge.setu.co.
2. Complete merchant KYC.
3. Create a **UPI Deeplinks** product instance (the "scheme").
4. Add your platform's settlement bank account (account number + IFSC).

### 2. Webhook configuration

In Bridge → Webhooks:

- **URL**: `https://<your-domain>/api/payments/setu/webhook`
- **Signing secret**: generate one and copy it. Set the same value as
  `SETU_WEBHOOK_SECRET` in your env. The webhook handler refuses any request
  whose `x-setu-signature` header doesn't match an HMAC-SHA256 of the raw
  body using this secret.
- **Events**: subscribe to `PAYMENT_SUCCESS`, `PAYMENT_FAILED`,
  `PAYMENT_EXPIRED`, `REFUND_INITIATED`, `REFUND_SUCCESS`.

For local dev, expose your dev server with `ngrok http 3000` and use that URL
as the webhook target in Bridge's sandbox dashboard.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in:

```
SETU_BASE_URL=https://uat.setu.co        # sandbox; switch to prod later
SETU_CLIENT_ID=...
SETU_CLIENT_SECRET=...
SETU_SCHEME_ID=...
SETU_PLATFORM_ACCOUNT_ID=...
SETU_PLATFORM_IFSC=...
SETU_WEBHOOK_SECRET=...
RECONCILE_CRON_KEY=                      # optional but recommended
```

### 4. Vendor onboarding

Each vendor needs **bank account + IFSC** stored on their shop record (not
just a UPI ID). Update `data/shop.json`:

```json
{
  "bankAccountId": "50100123456789",
  "bankIfsc":      "HDFC0001234",
  "bankAccountName": "Tealogy"
}
```

Do a penny-drop verification (Setu has an API for this) before saving — a
wrong IFSC means money sits in the platform nodal account, not the vendor's.

If `bankAccountId` or `bankIfsc` is missing, `/api/payments/upi/initiate`
returns a 400 and refuses to create a payment link. That's deliberate.

### 5. Reconciliation cron

Schedule a request every 15 minutes:

```
POST https://<your-domain>/api/payments/reconcile
Header: x-cron-key: <RECONCILE_CRON_KEY>
```

Vercel Cron, GitHub Actions, k8s CronJob, etc. — anything that can hit an
HTTPS endpoint on a schedule.

---

## End-to-end happy path

1. User taps "Pay via UPI" on `/shop` checkout.
2. Browser → `POST /api/orders` (creates the order).
3. Browser → `POST /api/payments/upi/initiate { orderId }`.
4. Server → Setu `POST /api/payment-links` with billerBillID = our orderId,
   settlement split to the vendor's bank account.
5. Setu returns `platformBillID` and `upi://pay?...` link.
6. Server stores both on the order, transitions to `INITIATED`, returns the
   link to the browser.
7. Browser opens the link in the user's UPI app (or shows a QR for scanning
   from another device). The mPIN flow happens entirely in the UPI app.
8. Setu observes the payment, fires the webhook → `/api/payments/setu/webhook`.
9. Webhook handler verifies signature, dedupes by event id, applies
   `PAYMENT_SUCCESS` → state goes to `PAID`, UTR + payer VPA recorded.
10. Browser's status poll hits `/api/payments/status` and sees `PAID`,
    transitions UI to the success screen.
11. Setu eventually settles to the vendor's bank (T+0 or T+1 depending on
    your scheme). When you wire that webhook event, state goes to `SETTLED`.

If the webhook is delayed, step 10's polling endpoint hits Setu's status API
as a fallback so the user isn't stuck on a spinner. If everything fails, the
reconcile cron picks it up within 15 minutes.

---

## Edge cases we handle

- **Duplicate webhooks**: idempotent via `webhookEventIds` on the order.
- **Replay attacks**: rejected at signature verification.
- **Wrong amount paid**: prevented at link creation by `amountExactness: EXACT`;
  Setu auto-refunds and we receive a `REFUND_*` webhook.
- **iOS app return**: the user might never come back to our tab. The
  webhook + polling combo means we still know they paid.
- **Network blip during polling**: poll continues; reconcile cron is the
  long-tail backstop.

---

## Edge cases NOT yet wired (next sprint)

- Refund initiation UI (the `setu.refund()` call exists; no admin button yet).
- Penny-drop bank validation during vendor onboarding.
- Email/Slack alert on stuck-order count from the reconcile run.
- Automatic link re-creation when an order's link expires before payment.
