import { NextResponse } from "next/server";

export async function GET() {
  const checkService = async (urls: string[]) => {
    for (const url of urls) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        clearTimeout(timeout);
        const latency = Date.now() - start;
        if (res.ok || res.status < 500) {
          return { online: true, latency: Math.max(1, latency) };
        }
      } catch {
        // try next fallback url
      }
    }
    return { online: false, latency: 0 };
  };

  const [ams, ems, fleet] = await Promise.all([
    checkService(['http://dams-web:3001', 'http://localhost:3001', 'http://127.0.0.1:3001']),
    checkService(['http://ems-web:3002', 'http://localhost:3002', 'http://127.0.0.1:3002']),
    checkService(['http://fleet-web:3003', 'http://localhost:3003', 'http://127.0.0.1:3003']),
  ]);

  return NextResponse.json({
    ams: ams.online,
    ems: ems.online,
    fleet: fleet.online,
    details: {
      ams,
      ems,
      fleet,
    },
    timestamp: new Date().toISOString()
  });
}
