import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateVendorToken } from '../route';

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

  const newToken = generateVendorToken();
  const updated = db.vendors.update(body.id, { loginToken: newToken });
  if (!updated) return NextResponse.json({ error: 'Vendor not found' }, { status: 404 });

  return NextResponse.json({ id: updated.id, loginToken: newToken });
}
