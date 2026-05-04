import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Order } from '@/lib/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const phone = searchParams.get('phone');
  let orders = db.orders.getAll();
  if (phone) orders = orders.filter(o => o.customerPhone === phone);
  orders = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const order: Order = {
    id: `o${Date.now()}`,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    items: body.items,
    total: body.items.reduce((s: number, i: { qty: number; price: number }) => s + i.qty * i.price, 0),
    status: 'pending',
    createdAt: new Date().toISOString(),
    source: body.source === 'customer' ? 'customer' : 'pos',
    note: body.note || undefined,
    paymentStatus: 'pending',
    paymentMethod: body.paymentMethod === 'cash' ? 'cash' : 'upi',
  };
  db.orders.add(order);
  db.customers.upsert(order.customerPhone, order.customerName, order.total);
  return NextResponse.json(order, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...patch } = body;
  // Whitelist editable fields
  const allowed: Partial<Order> = {};
  if (patch.status)        allowed.status        = patch.status;
  if (patch.paymentStatus) allowed.paymentStatus = patch.paymentStatus;
  if (patch.paymentMethod) allowed.paymentMethod = patch.paymentMethod;
  if (patch.paymentRef)    allowed.paymentRef    = patch.paymentRef;
  db.orders.update(id, allowed);
  return NextResponse.json({ ok: true });
}
