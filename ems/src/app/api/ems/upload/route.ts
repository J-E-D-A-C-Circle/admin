import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { emsAuth, serverError } from '@/lib/ems-server';
import { MAX_RECEIPT_BYTES } from '@/lib/ems-constants';
import { RECEIPT_DIR } from '@/lib/ems-dispatch-input';

/** Detects the real file type from its first bytes (never trust the client-supplied MIME type alone). */
function sniff(buf: Buffer): { ext: 'jpg' | 'png' | 'pdf'; mime: string } | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' };
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: 'png', mime: 'image/png' };
  }
  if (buf.length >= 5 && buf.subarray(0, 5).toString('latin1') === '%PDF-') return { ext: 'pdf', mime: 'application/pdf' };
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const a = emsAuth(req, (p) => p.canCreateDispatch || p.canEditDispatch, 'Only Admin Officers can upload receipts');
    if (a instanceof NextResponse) return a;

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ message: 'No file uploaded' }, { status: 400 });

    if (file.size > MAX_RECEIPT_BYTES) {
      return NextResponse.json({ message: 'Receipt is too large. Maximum size is 5MB.' }, { status: 413 });
    }
    if (file.size === 0) return NextResponse.json({ message: 'The selected file is empty' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const detected = sniff(buffer);
    if (!detected) {
      return NextResponse.json({ message: 'Invalid file type. Only JPG, PNG or PDF receipts are allowed.' }, { status: 400 });
    }

    fs.mkdirSync(RECEIPT_DIR, { recursive: true });
    const stored = `${crypto.randomUUID().replace(/-/g, '')}.${detected.ext}`;
    fs.writeFileSync(path.join(RECEIPT_DIR, stored), buffer);

    return NextResponse.json(
      { file: stored, originalName: (file.name || `receipt.${detected.ext}`).slice(0, 255), mime: detected.mime, size: file.size },
      { status: 201 }
    );
  } catch (err) {
    return serverError(err, 'receipt upload');
  }
}
