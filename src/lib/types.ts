export interface OrderItem {
  name: string;
  qty: number;
  price: number;
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
  paymentStatus?: 'pending' | 'paid';
  paymentMethod?: 'upi' | 'cash';
  paymentRef?: string;
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
