import { NextResponse } from 'next/server';
import { fetchFleetHealth } from '@/utils/a400Bridge';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchFleetHealth();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    // Return a degraded response so the UI can still render with a warning
    return NextResponse.json(
      {
        error: 'a400-webapp unreachable',
        message: err?.message || 'Could not connect to Fleet Monitor backend',
        summary: {
          totalFlights: 0,
          flightsAllGood: 0,
          flightsWithWarnings: 0,
          flightsWithCritical: 0,
          deployableCount: 0,
          deployablePct: 0,
          inServiceCount: 0,
          perFlight: [],
        },
        aircraft: [],
        criticalComponents: [],
        warningComponents: [],
        fetchedAt: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
