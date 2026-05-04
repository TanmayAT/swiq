export interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

export type PaymentState =
  | 'CREATED'      // order placed, no payment yet
  | 'INITIATED'    // Setu link generated, user redirected to UPI app
  | 'PAID'         // gateway confirmed SUCCESS (webhook or status API)
  | 'SETTLED'      // gateway confirmed payout to vendor
  | 'EXPIRED'      // link timed out before payment
  | 'FAILED'       // gateway reported FAILURE
  | 'REFUNDED';    // post-PAID refund completed

export interface PaymentEvent {
  type:
    | 'LINK_CREATED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'PAYMENT_EXPIRED'
    | 'REFUND_INITIATED'
    | 'REFUND_SUCCESS'
    | 'STATUS_POLL';
  at: string;
  source: 'webhook' | 'status-api' | 'reconcile' | 'manual' | 'system';
  meta?: Record<string, unknown>;
}

export interface PaymentInfo {
  platformBillID?: string;   // Setu's tracking ID
  upiLink?: string;          // upi://pay?... — what we hand to the UPI app
  expiresAt?: string;
  utr?: string;              // UPI ref number, set on success
  payerVpa?: string;
  paidAmount?: number;
  paidAt?: string;
  failureReason?: string;
  refundId?: string;
  refundedAt?: string;
  events: PaymentEvent[];
  webhookEventIds: string[]; // for idempotency / dedupe
  initiatedAt?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: string;
  source?: 'customer' | 'pos';
  note?: string;
  paymentStatus?: 'pending' | 'paid';   // legacy mirror of PAID/SETTLED
  paymentMethod?: 'upi' | 'cash';
  paymentRef?: string;
  paymentState?: PaymentState;
  payment?: PaymentInfo;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  visitCount: number;
  totalSpent: number;
  lastVisit: string;
  isRepeat: boolean;
  notified: boolean;
}

export interface Notification {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  message: string;
  sentAt: string;
  type: 'repeat_customer' | 'loyalty' | 'vip';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
}
