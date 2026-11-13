import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    { message: 'Transfer approval is no longer required; transfers execute immediately upon submission.' },
    { status: 410 }
  );
}
