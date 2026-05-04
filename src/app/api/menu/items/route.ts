import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FILE = path.join(process.cwd(), 'data', 'menu.json');

interface MenuItem {
  id: string; name: string; price: number; category: string;
  description: string; available: boolean; popular: boolean;
}

export async function GET() {
  const items: MenuItem[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items: MenuItem[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));

  if (Array.isArray(body)) {
    // Bulk replace (from upload)
    fs.writeFileSync(FILE, JSON.stringify(body, null, 2));
    return NextResponse.json({ ok: true, count: body.length });
  }

  const item: MenuItem = { ...body, id: `m${Date.now()}`, available: true, popular: false };
  items.push(item);
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const items: MenuItem[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  const idx = items.findIndex(i => i.id === body.id);
  if (idx !== -1) items[idx] = { ...items[idx], ...body };
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  let items: MenuItem[] = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
  items = items.filter(i => i.id !== id);
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
  return NextResponse.json({ ok: true });
}
