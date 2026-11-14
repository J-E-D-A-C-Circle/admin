import { NextResponse } from 'next/server';
import { poolConnection } from '@/db';

export async function GET() {
  try {
    await poolConnection.query('SELECT 1');
    return NextResponse.json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Database unreachable';
    return NextResponse.json({ status: 'error', db: 'disconnected', message }, { status: 503 });
  }
}

