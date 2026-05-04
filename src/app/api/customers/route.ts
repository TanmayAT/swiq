import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  const customers = db.customers.getAll();
  return NextResponse.json(customers);
}

export async function PATCH(req: NextRequest) {
  const { id } = await req.json();
  db.customers.markNotified(id);
  return NextResponse.json({ ok: true });
}
