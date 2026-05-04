import { NextRequest, NextResponse } from 'next/server';
import { db, MenuItem } from '@/lib/db';

export async function GET() {
  return NextResponse.json(db.menu.getAll());
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (Array.isArray(body)) {
    // Bulk replace (from upload)
    db.menu.save(body as MenuItem[]);
    return NextResponse.json({ ok: true, count: body.length });
  }

  const item: MenuItem = { ...body, id: `m${Date.now()}`, available: true, popular: false };
  db.menu.add(item);
  return NextResponse.json(item, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  db.menu.update(body.id, body);
  return NextResponse.json(db.menu.findById(body.id));
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  db.menu.remove(id);
  return NextResponse.json({ ok: true });
}
