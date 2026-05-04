import fs from 'fs';
import path from 'path';
import { Order, Customer, Notification, Product } from './types';

const dataDir = path.join(process.cwd(), 'data');

function read<T>(file: string): T[] {
  const raw = fs.readFileSync(path.join(dataDir, file), 'utf-8');
  return JSON.parse(raw) as T[];
}

function write<T>(file: string, data: T[]): void {
  fs.writeFileSync(path.join(dataDir, file), JSON.stringify(data, null, 2));
}

export const db = {
  orders: {
    getAll: () => read<Order>('orders.json'),
    save: (orders: Order[]) => write('orders.json', orders),
    add: (order: Order) => {
      const all = read<Order>('orders.json');
      all.push(order);
      write('orders.json', all);
    },
    update: (id: string, patch: Partial<Order>) => {
      const all = read<Order>('orders.json');
      const idx = all.findIndex(o => o.id === id);
      if (idx !== -1) all[idx] = { ...all[idx], ...patch };
      write('orders.json', all);
    },
    findById: (id: string): Order | undefined => {
      return read<Order>('orders.json').find(o => o.id === id);
    },
    findByPlatformBillID: (platformBillID: string): Order | undefined => {
      return read<Order>('orders.json').find(o => o.payment?.platformBillID === platformBillID);
    },
    /** Atomic-ish patch: read → mutate → write. Caller's mutator returns the new order. */
    mutate: (id: string, mutator: (o: Order) => Order): Order | null => {
      const all = read<Order>('orders.json');
      const idx = all.findIndex(o => o.id === id);
      if (idx === -1) return null;
      const updated = mutator(all[idx]);
      all[idx] = updated;
      write('orders.json', all);
      return updated;
    },
  },
  customers: {
    getAll: () => read<Customer>('customers.json'),
    save: (customers: Customer[]) => write('customers.json', customers),
    upsert: (phone: string, name: string, spent: number) => {
      const all = read<Customer>('customers.json');
      const idx = all.findIndex(c => c.phone === phone);
      if (idx !== -1) {
        all[idx].visitCount += 1;
        all[idx].totalSpent += spent;
        all[idx].lastVisit = new Date().toISOString();
        all[idx].isRepeat = all[idx].visitCount >= 3;
      } else {
        all.push({
          id: `c${Date.now()}`,
          name,
          phone,
          visitCount: 1,
          totalSpent: spent,
          lastVisit: new Date().toISOString(),
          isRepeat: false,
          notified: false,
        });
      }
      write('customers.json', all);
    },
    markNotified: (id: string) => {
      const all = read<Customer>('customers.json');
      const idx = all.findIndex(c => c.id === id);
      if (idx !== -1) all[idx].notified = true;
      write('customers.json', all);
    },
  },
  notifications: {
    getAll: () => read<Notification>('notifications.json'),
    add: (n: Notification) => {
      const all = read<Notification>('notifications.json');
      all.unshift(n);
      write('notifications.json', all);
    },
  },
  products: {
    getAll: () => read<Product>('products.json'),
  },
};
