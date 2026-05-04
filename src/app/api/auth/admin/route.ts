import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG = path.join(process.cwd(), 'data', 'admin-config.json');

interface Config { adminPhone: string; adminName: string; adminToken: string; demoOtp: string; }

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  const cfg: Config = JSON.parse(fs.readFileSync(CONFIG, 'utf-8'));
  if (token !== cfg.adminToken) {
    return NextResponse.json({ error: 'Invalid admin token' }, { status: 401 });
  }
  return NextResponse.json({ ok: true, name: cfg.adminName, phone: cfg.adminPhone });
}
