import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { RECEIPT_DIR, RECEIPT_FILE_RE } from '@/lib/ems-dispatch-input';

type Ctx = { params: Promise<{ file: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { file } = await params;
    if (!RECEIPT_FILE_RE.test(file)) {
      return NextResponse.json({ message: 'Invalid file name' }, { status: 400 });
    }

    const filePath = path.join(RECEIPT_DIR, file);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ message: 'Receipt not found' }, { status: 404 });
    }

    const ext = path.extname(file).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const buffer = fs.readFileSync(filePath);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ message: 'Error retrieving receipt', error: err.message }, { status: 500 });
  }
}
