/**
 * Single data hub for the app.
 *
 * JSON seed data is imported (so it gets bundled into the production output —
 * including Cloudflare Workers, where `fs.readFileSync(...)` of arbitrary
 * paths does NOT work because those files aren't in the worker bundle).
 *
 * In-memory state is the source of truth at runtime. Writes also try to
 * persist back to disk; on read-only / serverless filesystems the persist
 * silently no-ops. For multi-instance production, swap the persist layer
 * for KV / D1 / Postgres.
 */

import fs from 'fs';
import path from 'path';
import { Order, Customer, Notification, Product } from './types';

import ordersSeed        from '../../data/orders.json';
import customersSeed     from '../../data/customers.json';
import notificationsSeed from '../../data/notifications.json';
import productsSeed      from '../../data/products.json';
import menuSeed          from '../../data/menu.json';
import vendorsSeed       from '../../data/vendors.json';
import shopSeed          from '../../data/shop.json';
import adminConfigSeed   from '../../data/admin-config.json';

/* ─── shared types defined inline; the bigger ones live in lib/types.ts ─── */

export interface Vendor {
  id: string;
  phone: string;
  ownerName: string;
  shopName: string;
  shopId: string;
  loginToken?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string;
}

export interface Shop {
  id: string;
  name: string;
  tagline: string;
  phone: string;
  address: string;
  hours: string;
  isOpen: boolean;
  upiId: string;
  bankAccountId?: string;
  bankIfsc?: string;
  bankAccountName?: string;
  minOrder: number;
  deliveryTime: string;
  category: string;
  rating: string;
  totalRatings: number;
  banner?: string | null;
  logo?: string | null;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  available: boolean;
  popular: boolean;
}

export interface AdminConfig {
  adminPhone: string;
  adminName: string;
  adminToken: string;
  demoOtp: string;
}

/* ─── in-memory state, seeded from bundled JSON ─── */

let orders        = (ordersSeed        as Order[]).slice();
let customers     = (customersSeed     as Customer[]).slice();
let notifications = (notificationsSeed as Notification[]).slice();
let menu          = (menuSeed          as MenuItem[]).slice();
let vendors       = (vendorsSeed       as Vendor[]).slice();
let shop: Shop    = { ...(shopSeed     as Shop) };
const products    = (productsSeed      as Product[]).slice();
const adminConfig = adminConfigSeed    as AdminConfig;

/* ─── persistence — best-effort ─── */

function persist(file: string, data: unknown) {
  try {
    fs.writeFileSync(path.join(process.cwd(), 'data', file), JSON.stringify(data, null, 2));
  } catch (err) {
    // Read-only FS (Cloudflare Workers, edge runtimes) — in-memory state still wins.
    // Log once-ish so problems are visible in dev tail logs.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[db] persist ${file} skipped:`, err instanceof Error ? err.message : err);
    }
  }
}

/* ─── public API ─── */

export const db = {
  orders: {
    getAll: () => orders.slice(),
    save: (next: Order[]) => { orders = next.slice(); persist('orders.json', orders); },
    add: (o: Order) => { orders.push(o); persist('orders.json', orders); },
    update: (id: string, patch: Partial<Order>) => {
      const idx = orders.findIndex(o => o.id === id);
      if (idx !== -1) { orders[idx] = { ...orders[idx], ...patch }; persist('orders.json', orders); }
    },
    findById: (id: string) => orders.find(o => o.id === id),
    findByPlatformBillID: (platformBillID: string) =>
      orders.find(o => o.payment?.platformBillID === platformBillID),
    /** Mutator-style update; pass-through to persist. */
    mutate: (id: string, mutator: (o: Order) => Order): Order | null => {
      const idx = orders.findIndex(o => o.id === id);
      if (idx === -1) return null;
      orders[idx] = mutator(orders[idx]);
      persist('orders.json', orders);
      return orders[idx];
    },
  },

  customers: {
    getAll: () => customers.slice(),
    save: (next: Customer[]) => { customers = next.slice(); persist('customers.json', customers); },
    upsert: (phone: string, name: string, spent: number) => {
      const idx = customers.findIndex(c => c.phone === phone);
      if (idx !== -1) {
        customers[idx].visitCount += 1;
        customers[idx].totalSpent += spent;
        customers[idx].lastVisit = new Date().toISOString();
        customers[idx].isRepeat = customers[idx].visitCount >= 3;
      } else {
        customers.push({
          id: `c${Date.now()}`,
          name, phone,
          visitCount: 1,
          totalSpent: spent,
          lastVisit: new Date().toISOString(),
          isRepeat: false,
          notified: false,
        });
      }
      persist('customers.json', customers);
    },
    markNotified: (id: string) => {
      const idx = customers.findIndex(c => c.id === id);
      if (idx !== -1) { customers[idx].notified = true; persist('customers.json', customers); }
    },
  },

  notifications: {
    getAll: () => notifications.slice(),
    add: (n: Notification) => {
      notifications.unshift(n);
      persist('notifications.json', notifications);
    },
  },

  products: {
    getAll: () => products.slice(),
  },

  menu: {
    getAll: () => menu.slice(),
    findById: (id: string) => menu.find(m => m.id === id),
    save: (next: MenuItem[]) => { menu = next.slice(); persist('menu.json', menu); },
    add: (item: MenuItem) => { menu.push(item); persist('menu.json', menu); },
    update: (id: string, patch: Partial<MenuItem>) => {
      const idx = menu.findIndex(m => m.id === id);
      if (idx !== -1) { menu[idx] = { ...menu[idx], ...patch }; persist('menu.json', menu); }
    },
    remove: (id: string) => { menu = menu.filter(m => m.id !== id); persist('menu.json', menu); },
  },

  vendors: {
    getAll: () => vendors.slice(),
    findById: (id: string) => vendors.find(v => v.id === id),
    findByPhone: (phone: string) => vendors.find(v => v.phone === phone),
    add: (v: Vendor) => { vendors.push(v); persist('vendors.json', vendors); },
    update: (id: string, patch: Partial<Vendor>) => {
      const idx = vendors.findIndex(v => v.id === id);
      if (idx === -1) return null;
      vendors[idx] = { ...vendors[idx], ...patch };
      persist('vendors.json', vendors);
      return vendors[idx];
    },
  },

  shop: {
    get: (): Shop => ({ ...shop }),
    set: (patch: Partial<Shop>) => { shop = { ...shop, ...patch }; persist('shop.json', shop); return shop; },
  },

  config: {
    admin: (): AdminConfig => adminConfig,
  },

  /** Append a payment audit entry. Best-effort — capped at 500 entries. */
  appendAudit: (entry: Record<string, unknown>) => {
    let arr: unknown[] = [];
    try {
      const file = path.join(process.cwd(), 'data', 'payment_events.json');
      if (fs.existsSync(file)) {
        arr = JSON.parse(fs.readFileSync(file, 'utf-8'));
        if (!Array.isArray(arr)) arr = [];
      }
    } catch { arr = []; }
    arr.unshift({ at: new Date().toISOString(), ...entry });
    if (arr.length > 500) arr = arr.slice(0, 500);
    persist('payment_events.json', arr);
  },
};
