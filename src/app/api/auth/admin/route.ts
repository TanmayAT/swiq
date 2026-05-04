import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  const cfg = db.config.admin();
  if (token !== cfg.adminToken) {
    return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, name: cfg.adminName, phone: cfg.adminPhone });
}
