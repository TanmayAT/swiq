import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db, Vendor } from '@/lib/db';

/** Generate a vendor login token: SWQ-XXXX-XXXX-XXXX (12 alphanum chars). */
export function generateVendorToken(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit I, O, 0, 1 for readability
  const block = (n: number) => {
    const bytes = crypto.randomBytes(n);
    return Array.from(bytes, b => alphabet[b % alphabet.length]).join('');
  };
  return `SWQ-${block(4)}-${block(4)}-${block(4)}`;
}

export async function GET() {
  return NextResponse.json(db.vendors.getAll());
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const updated = db.vendors.update(body.id, body);
  if (!updated) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const all = db.vendors.getAll();
  const v: Vendor = {
    id: `v${Date.now()}`,
    phone: body.phone,
    ownerName: body.ownerName,
    shopName: body.shopName,
    shopId: `swiq-${String(all.length + 1).padStart(3, '0')}`,
    loginToken: generateVendorToken(),
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  db.vendors.add(v);
  return NextResponse.json(v, { status: 201 });
}
