import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

interface ParsedItem {
  name: string;
  price: number;
  category: string;
  description: string;
}

function parseExcel(buffer: Buffer): ParsedItem[] {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

  return rows
    .map(row => {
      const keys = Object.keys(row).map(k => k.toLowerCase().trim());
      const get = (candidates: string[]) => {
        for (const k of Object.keys(row)) {
          if (candidates.includes(k.toLowerCase().trim())) return String(row[k]).trim();
        }
        return '';
      };
      const name  = get(['name', 'item', 'item name', 'dish', 'dish name']);
      const price = parseFloat(get(['price', 'rate', 'cost', 'amount', 'mrp'])) || 0;
      const cat   = get(['category', 'cat', 'type', 'section']);
      const desc  = get(['description', 'desc', 'details', 'about']);
      return { name, price, category: cat || 'General', description: desc };
    })
    .filter(i => i.name && i.price > 0);
}

function parsePlainText(text: string): ParsedItem[] {
  const items: ParsedItem[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  let currentCategory = 'General';

  const priceRegex = /[₹$rs\.]*\s*(\d+(?:\.\d{1,2})?)/i;
  const separators = /[-–—:|]/;

  for (const line of lines) {
    // Detect category header lines (ALL CAPS or ends with : and no price)
    if (!priceRegex.test(line) && (line === line.toUpperCase() || line.endsWith(':'))) {
      currentCategory = line.replace(/:$/, '').trim();
      if (currentCategory.length > 40) currentCategory = 'General';
      continue;
    }

    const priceMatch = line.match(priceRegex);
    if (!priceMatch) continue;

    const price = parseFloat(priceMatch[1]);
    if (!price || price < 1) continue;

    // Remove price from line to get name part
    const withoutPrice = line.replace(priceMatch[0], '').replace(/₹/g, '').trim();
    const parts = withoutPrice.split(separators).map(p => p.trim()).filter(Boolean);

    const name = parts[0] || withoutPrice;
    const description = parts.slice(1).join(' ').trim();

    if (name && name.length > 1 && name.length < 80) {
      items.push({ name, price, category: currentCategory, description });
    }
  }
  return items;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const name   = file.name.toLowerCase();
    let items: ParsedItem[] = [];

    if (name.endsWith('.xlsx') || name.endsWith('.xls') || name.endsWith('.csv')) {
      items = parseExcel(buffer);
    } else if (name.endsWith('.pdf')) {
      // Dynamic import to avoid edge runtime issues
      const pdfMod = await import('pdf-parse');
      const pdfParse = (pdfMod as unknown as { default?: (b: Buffer) => Promise<{ text: string }> }).default ?? (pdfMod as unknown as (b: Buffer) => Promise<{ text: string }>);
      const data = await pdfParse(buffer);
      items = parsePlainText(data.text);
    } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
      const mammoth = await import('mammoth');
      const result  = await mammoth.extractRawText({ buffer });
      items = parsePlainText(result.value);
    } else if (name.endsWith('.txt')) {
      items = parsePlainText(buffer.toString('utf-8'));
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Use xlsx, xls, csv, pdf, docx, or txt.' }, { status: 400 });
    }

    return NextResponse.json({ items, count: items.length });
  } catch (err) {
    console.error('Upload parse error:', err);
    return NextResponse.json({ error: 'Failed to parse file' }, { status: 500 });
  }
}
