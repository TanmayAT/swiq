import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VENDORS = path.join(process.cwd(), 'data', 'vendors.json');
const CONFIG  = path.join(process.cwd(), 'data', 'admin-config.json');

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

interface Config { adminPhone: string; adminName: string; adminToken: string; demoOtp: string; }

export async function POST(req: NextRequest) {
  const { phone, otp, token, role } = await req.json();
  const cfg: Config = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));

  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: 'Enter a valid 10-digit phone' }, { status: 400 });
  }

  // Customer login — phone + universal demo OTP.
  if (role === 'customer') {
    if (otp !== cfg.demoOtp) {
      return NextResponse.json({ error: `Invalid OTP. Demo OTP is ${cfg.demoOtp}` }, { status: 401 });
    }
    return NextResponse.json({ role: 'customer', phone });
  }

  // Vendor login — phone + per-vendor token assigned by admin.
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Vendor token required' }, { status: 400 });
  }

  const vendors: Vendor[] = JSON.parse(fs.readFileSync(VENDORS, 'utf-8'));
  const vendor = vendors.find(v => v.phone === phone);
  if (!vendor) return NextResponse.json({ error: 'No vendor account found for this number' }, { status: 404 });
  if (!vendor.isActive) return NextResponse.json({ error: 'Your account has been deactivated. Contact admin.' }, { status: 403 });
  if (!vendor.loginToken) return NextResponse.json({ error: 'No login token assigned. Contact admin to receive your token.' }, { status: 403 });
  if (vendor.loginToken.trim() !== token.trim()) {
    return NextResponse.json({ error: 'Invalid vendor token' }, { status: 401 });
  }

  vendor.lastLogin = new Date().toISOString();
  fs.writeFileSync(VENDORS, JSON.stringify(vendors, null, 2));

  // Strip the token before returning so it doesn't sit in localStorage.
  const { loginToken, ...safe } = vendor;
  void loginToken;
  return NextResponse.json({ role: 'vendor', vendor: safe });
}
