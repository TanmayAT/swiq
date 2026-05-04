/**
 * Setu UPI Deeplinks client (real / production).
 *
 * Required env (set in .env.local):
 *   SETU_BASE_URL              e.g. https://uat.setu.co (sandbox) or https://prod.setu.co
 *   SETU_CLIENT_ID
 *   SETU_CLIENT_SECRET
 *   SETU_SCHEME_ID             the product instance you create on Bridge
 *   SETU_PLATFORM_ACCOUNT_ID   your platform settlement account id
 *   SETU_PLATFORM_IFSC         IFSC of the platform account
 *   SETU_WEBHOOK_SECRET        HMAC-SHA256 secret used to verify x-setu-signature
 *
 * Surface: createPaymentLink, getStatus, refund, verifyWebhookSignature.
 */

import crypto from 'crypto';

export interface CreatePaymentLinkArgs {
  orderId: string;                       // becomes Setu's billerBillID
  amountInPaise: number;                 // 100 paise = ₹1
  payeeName: string;
  note?: string;
  expiresInMinutes?: number;             // default 15
  vendor: {
    bankAccountId: string;
    bankIfsc: string;
  };
  additionalInfo?: Record<string, string>;
}

export interface CreatePaymentLinkResult {
  platformBillID: string;
  upiLink: string;                       // "upi://pay?pa=...&am=...&tr=..."
  expiresAt: string;
}

export interface SetuStatus {
  status: 'INITIATED' | 'SUCCESS' | 'FAILURE' | 'EXPIRED';
  utr?: string;
  payerVpa?: string;
  paidAmountInPaise?: number;
  paidAt?: string;
  failureReason?: string;
}

export interface RefundResult {
  refundId: string;
  status: 'INITIATED';
}

export interface SetuWebhookEvent {
  eventId: string;
  type:
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_EXPIRED'
    | 'REFUND_INITIATED'
    | 'REFUND_SUCCESS';
  platformBillID: string;
  billerBillID: string;
  amountInPaise: number;
  utr?: string;
  payerVpa?: string;
  paidAt?: string;
  failureReason?: string;
  additionalInfo?: Record<string, string>;
}

export interface SetuClient {
  createPaymentLink(args: CreatePaymentLinkArgs): Promise<CreatePaymentLinkResult>;
  getStatus(platformBillID: string): Promise<SetuStatus>;
  refund(platformBillID: string, amountInPaise: number, reason?: string): Promise<RefundResult>;
  verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean;
}

/* ─────────── helpers ─────────── */

function constantTimeEq(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Setu integration not configured: ${name} is missing. See .env.example.`);
  return v;
}

/* ─────────── OAuth token cache ─────────── */

interface SetuTokenCache {
  token: string;
  expiresAt: number;
}
let tokenCache: SetuTokenCache | null = null;

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;

  const base = requireEnv('SETU_BASE_URL');
  const id = requireEnv('SETU_CLIENT_ID');
  const secret = requireEnv('SETU_CLIENT_SECRET');

  const res = await fetch(`${base}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientID: id, secret, grant_type: 'client_credentials' }),
  });
  if (!res.ok) throw new Error(`Setu OAuth failed: ${res.status} ${await res.text().catch(() => '')}`);
  const data = await res.json() as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 30) * 1000,
  };
  return tokenCache.token;
}

/* ─────────── client ─────────── */

const setuClient: SetuClient = {
  async createPaymentLink(args) {
    const base = requireEnv('SETU_BASE_URL');
    const schemeId = requireEnv('SETU_SCHEME_ID');
    const platformAccountId = requireEnv('SETU_PLATFORM_ACCOUNT_ID');
    const platformIfsc = requireEnv('SETU_PLATFORM_IFSC');

    const token = await accessToken();

    const body = {
      amount: { currencyCode: 'INR', value: args.amountInPaise },
      billerBillID: args.orderId,
      amountExactness: 'EXACT',
      transactionNote: args.note ?? `Order ${args.orderId}`,
      payeeName: args.payeeName,
      expiryDuration: (args.expiresInMinutes ?? 15) * 60,
      additionalInfo: args.additionalInfo ?? {},
      settlement: {
        primaryAccount: { id: platformAccountId, ifsc: platformIfsc },
        parts: [
          {
            account: { id: args.vendor.bankAccountId, ifsc: args.vendor.bankIfsc },
            split: { unit: 'INR', value: args.amountInPaise },
            remarks: `Vendor payout for ${args.orderId}`,
          },
        ],
      },
    };

    const res = await fetch(`${base}/api/payment-links`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        'X-Setu-Product-Instance-ID': schemeId,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Setu createPaymentLink failed: ${res.status} ${text}`);
    }
    const data = await res.json() as {
      platformBillID: string;
      paymentLink: { upiID: string };
      expiresAt: string;
    };
    return {
      platformBillID: data.platformBillID,
      upiLink: data.paymentLink.upiID,
      expiresAt: data.expiresAt,
    };
  },

  async getStatus(platformBillID) {
    const base = requireEnv('SETU_BASE_URL');
    const token = await accessToken();
    const res = await fetch(`${base}/api/payment-links/${platformBillID}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`Setu getStatus failed: ${res.status}`);
    type SetuStatusResp = {
      status: string;
      utr?: string;
      payerVpa?: string;
      paidAmount?: { value: number };
      paidAt?: string;
      failureReason?: string;
    };
    const data = await res.json() as SetuStatusResp;
    const map: Record<string, SetuStatus['status']> = {
      INITIATED: 'INITIATED',
      SUCCESS: 'SUCCESS',
      PAYMENT_SUCCESSFUL: 'SUCCESS',
      FAILURE: 'FAILURE',
      PAYMENT_FAILED: 'FAILURE',
      EXPIRED: 'EXPIRED',
    };
    return {
      status: map[data.status] ?? 'INITIATED',
      utr: data.utr,
      payerVpa: data.payerVpa,
      paidAmountInPaise: data.paidAmount?.value,
      paidAt: data.paidAt,
      failureReason: data.failureReason,
    };
  },

  async refund(platformBillID, amountInPaise, reason) {
    const base = requireEnv('SETU_BASE_URL');
    const token = await accessToken();
    const res = await fetch(`${base}/api/payment-links/${platformBillID}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount: { currencyCode: 'INR', value: amountInPaise }, reason: reason ?? 'customer_request' }),
    });
    if (!res.ok) throw new Error(`Setu refund failed: ${res.status}`);
    const data = await res.json() as { refundId: string };
    return { refundId: data.refundId, status: 'INITIATED' };
  },

  verifyWebhookSignature(rawBody, signatureHeader) {
    if (!signatureHeader) return false;
    const secret = requireEnv('SETU_WEBHOOK_SECRET');
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return constantTimeEq(expected, signatureHeader);
  },
};

export function getSetuClient(): SetuClient {
  return setuClient;
}
