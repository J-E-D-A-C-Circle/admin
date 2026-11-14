import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-helper';
import fs from 'fs';
import path from 'path';

const MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const caller = verifyAuth(req);
  if (!caller) return unauthorizedResponse();

  const { path: segments } = await context.params;
  if (!segments || segments.length === 0) {
    return NextResponse.json({ message: 'File path is required' }, { status: 400 });
  }

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const requestedPath = path.resolve(uploadsRoot, ...segments);

  // Prevent directory traversal outside public/uploads
  if (!requestedPath.startsWith(uploadsRoot + path.sep)) {
    return NextResponse.json({ message: 'Invalid file path' }, { status: 400 });
  }

  if (!fs.existsSync(requestedPath) || !fs.statSync(requestedPath).isFile()) {
    return NextResponse.json({ message: 'File not found' }, { status: 404 });
  }

  const ext = path.extname(requestedPath).toLowerCase();
  const contentType = MIME_MAP[ext] || 'application/octet-stream';
  const fileBuffer = fs.readFileSync(requestedPath);

  return new NextResponse(fileBuffer, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}

