import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
  response.cookies.delete('ems_token');
  response.cookies.delete('dams_token');
  return response;
}
