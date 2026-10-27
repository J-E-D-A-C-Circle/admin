import { NextResponse } from "next/server";

export async function GET() {
  const checkService = async (urls: string[]) => {
    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeout);
        if (res.ok || res.status < 500) {
          return true;
        }
      } catch {
        // try next fallback url
      }
    }
    return false;
  };

  const amsOnline = await checkService([
    'http://dams-web:3001',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ]);

  const emsOnline = await checkService([
    'http://ems-web:3002',
    'http://localhost:3002',
    'http://127.0.0.1:3002'
  ]);

  const fleetOnline = await checkService([
    'http://fleet-web:3003',
    'http://localhost:3003',
    'http://127.0.0.1:3003'
  ]);

  return NextResponse.json({
    ams: amsOnline,
    ems: emsOnline,
    fleet: fleetOnline,
    timestamp: new Date().toISOString()
  });
}
