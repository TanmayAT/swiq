import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'vendors.json');

interface Vendor {
  id: string; phone: string; ownerName: string; shopName: string;
  shopId: string; isActive: boolean; createdAt: string; lastLogin: string;
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
    isActive: true,
    createdAt: new Date().toISOString(),
    lastLogin: new Date().toISOString(),
  };
  vendors.push(v);
  fs.writeFileSync(FILE, JSON.stringify(vendors, null, 2));
  return NextResponse.json(v, { status: 201 });
}
