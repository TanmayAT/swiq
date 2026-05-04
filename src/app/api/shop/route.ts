import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.shop.get());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updated = db.shop.set(body);
  return NextResponse.json(updated);
}
