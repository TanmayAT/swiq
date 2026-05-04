import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { generateVendorToken } from '../route';

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

/**
 * POST /api/vendors/regenerate-token
 * body: { id: string }
 *
 * Generates a new login token for the vendor, server-side, and returns the
 * full token (this is the only response that exposes it — the admin shares
 * it with the vendor out-of-band, e.g. WhatsApp).
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const vendors: Vendor[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const idx = vendors.findIndex(v => v.id === body.id);
  if (idx === -1) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  const newToken = generateVendorToken();
  vendors[idx].loginToken = newToken;
  fs.writeFileSync(FILE, JSON.stringify(vendors, null, 2));

  return NextResponse.json({ id: vendors[idx].id, loginToken: newToken });
}
