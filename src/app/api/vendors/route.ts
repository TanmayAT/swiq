import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const FILE = path.join(process.cwd(), 'data', 'vendors.json');

interface Vendor {
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
  const vendors: Vendor[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  return NextResponse.json(vendors);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const vendors: Vendor[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const idx = vendors.findIndex(v => v.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });
  vendors[idx] = { ...vendors[idx], ...body };
  fs.writeFileSync(FILE, JSON.stringify(vendors, null, 2));
  return NextResponse.json(vendors[idx]);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const vendors: Vendor[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const v: Vendor = {
    id: `v${Date.now()}`,
    phone: body.phone,
    ownerName: body.ownerName,
    shopName: body.shopName,
    shopId: `swiq-${String(vendors.length + 1).padStart(3, '0')}`,
    loginToken: generateVendorToken(),
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  vendors.push(v);
  fs.writeFileSync(FILE, JSON.stringify(vendors, null, 2));
  return NextResponse.json(v, { status: 201 });
}
