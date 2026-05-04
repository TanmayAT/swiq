import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Notification } from '@/lib/types';

export async function GET() {
  return NextResponse.json(db.notifications.getAll());
}

export async function POST(req: NextRequest) {
  const { customerId, customerName, customerPhone, type } = await req.json();

  const messages: Record<string, string> = {
    repeat_customer: `${customerName.split(' ')[0]} ji, aap hamare regular customer ho! Aaj special discount aapke liye. Jaldi aao 🍛 - Swiq Restaurant`,
    loyalty: `${customerName.split(' ')[0]} bhai/didi, aapke 5+ visits complete ho gaye! 10% loyalty discount aaj valid hai. - Swiq Restaurant 🎉`,
    vip: `VIP customer ${customerName.split(' ')[0]} ji! Aaj khaana order karo aur free dessert pao. Sirf aapke liye! 🌟 - Swiq Restaurant`,
  };

  const n: Notification = {
    id: `n${Date.now()}`,
    customerId,
    customerName,
    customerPhone,
    message: messages[type] || messages.repeat_customer,
    sentAt: new Date().toISOString(),
    type,
  };

  db.notifications.add(n);
  db.customers.markNotified(customerId);

  return NextResponse.json(n, { status: 201 });
}
