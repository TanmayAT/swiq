import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'shop.json');

export async function GET() {
  const shop = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  return NextResponse.json(shop);
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const shop = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const updated = { ...shop, ...body };
  fs.writeFileSync(FILE, JSON.stringify(updated, null, 2));
  return NextResponse.json(updated);
}
