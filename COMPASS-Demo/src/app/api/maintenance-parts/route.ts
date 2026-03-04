import { NextResponse } from 'next/server';
import { fetchFleetHealth, componentToPartsKeywords } from '@/utils/a400Bridge';

export const dynamic = 'force-dynamic';

export interface PredictedDemandItem {
  partKeywords: string[];
  reason: string;
  severity: 'critical' | 'warning';
  aircraftId: string;
  aircraftName: string;
  componentName: string;
  maintenanceDue: string;
}

export interface MaintenancePartsResponse {
  predictedDemand: PredictedDemandItem[];
  criticalCount: number;
  warningCount: number;
  affectedAircraftCount: number;
  fetchedAt: string;
}

export async function GET() {
  try {
    const health = await fetchFleetHealth();

    const demandMap = new Map<string, PredictedDemandItem>();

    // Build predicted demand from critical components first
    for (const comp of health.criticalComponents) {
      const keywords = componentToPartsKeywords(comp.componentName);
      const key = `${comp.aircraftId}:${comp.componentName}`;
      demandMap.set(key, {
        partKeywords: keywords,
        reason: `${comp.displayName} on ${comp.aircraftName} is CRITICAL — maintenance due: ${comp.maintenanceDue}`,
        severity: 'critical',
        aircraftId: comp.aircraftId,
        aircraftName: comp.aircraftName,
        componentName: comp.componentName,
        maintenanceDue: comp.maintenanceDue,
      });
    }

    // Then warning components
    for (const comp of health.warningComponents) {
      const keywords = componentToPartsKeywords(comp.componentName);
      const key = `${comp.aircraftId}:${comp.componentName}`;
      if (!demandMap.has(key)) {
        demandMap.set(key, {
          partKeywords: keywords,
          reason: `${comp.displayName} on ${comp.aircraftName} needs attention — maintenance due: ${comp.maintenanceDue}`,
          severity: 'warning',
          aircraftId: comp.aircraftId,
          aircraftName: comp.aircraftName,
          componentName: comp.componentName,
          maintenanceDue: comp.maintenanceDue,
        });
      }
    }

    const predictedDemand = Array.from(demandMap.values());
    const affectedAircraftIds = new Set(predictedDemand.map(d => d.aircraftId));

    const response: MaintenancePartsResponse = {
      predictedDemand,
      criticalCount: health.criticalComponents.length,
      warningCount: health.warningComponents.length,
      affectedAircraftCount: affectedAircraftIds.size,
      fetchedAt: health.fetchedAt,
    };

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        predictedDemand: [],
        criticalCount: 0,
        warningCount: 0,
        affectedAircraftCount: 0,
        fetchedAt: new Date().toISOString(),
        error: err?.message || 'Failed to fetch fleet health',
      },
      { status: 200 }
    );
  }
}
