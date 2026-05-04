import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { DailySales } from '@/lib/types';

export async function GET() {
  const orders = db.orders.getAll().filter(o => o.status === 'completed');
  const customers = db.customers.getAll();

  // Today's revenue
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter(o => o.createdAt.startsWith(today));
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);

  // Total revenue
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);

  // Repeat customers
  const repeatCustomers = customers.filter(c => c.isRepeat).length;

  // Avg order value
  const avgOrder = orders.length ? Math.round(totalRevenue / orders.length) : 0;

  // Sales by hour today
  const byHour: Record<number, { revenue: number; orders: number }> = {};
  for (let h = 7; h <= 14; h++) byHour[h] = { revenue: 0, orders: 0 };
  todayOrders.forEach(o => {
    const h = new Date(o.createdAt).getHours();
    if (byHour[h]) {
      byHour[h].revenue += o.total;
      byHour[h].orders += 1;
    }
  });
  const hourly = Object.entries(byHour).map(([h, v]) => ({
    hour: `${h}:00`,
    revenue: v.revenue,
    orders: v.orders,
  }));

  // Weekly data (simulated for last 7 days)
  const weekly: DailySales[] = [];
  const revenueBase = [2800, 3200, 2600, 3800, 4100, 3500, todayRevenue];
  const ordersBase = [18, 22, 16, 25, 28, 23, todayOrders.length];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    weekly.push({
      date: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }),
      revenue: i === 0 ? todayRevenue : revenueBase[6 - i],
      orders: i === 0 ? todayOrders.length : ordersBase[6 - i],
    });
  }

  // Top items
  const itemCount: Record<string, { qty: number; revenue: number }> = {};
  orders.forEach(o =>
    o.items.forEach(it => {
      if (!itemCount[it.name]) itemCount[it.name] = { qty: 0, revenue: 0 };
      itemCount[it.name].qty += it.qty;
      itemCount[it.name].revenue += it.qty * it.price;
    })
  );
  const topItems = Object.entries(itemCount)
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    todayRevenue,
    todayOrders: todayOrders.length,
    totalRevenue,
    totalOrders: orders.length,
    repeatCustomers,
    totalCustomers: customers.length,
    avgOrder,
    hourly,
    weekly,
    topItems,
  });
}
