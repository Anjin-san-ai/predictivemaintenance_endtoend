import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: When real API is ready, uncomment this and replace the URL
    // const response = await fetch('https://your-backend-api.com/api/equipments', {
    //   method: 'GET',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': 'Bearer YOUR_API_TOKEN'
    //   }
    // })
    // 
    // if (!response.ok) {
    //   throw new Error(`API responded with status: ${response.status}`)
    // }
    // 
    // const equipments = await response.json()
    // return NextResponse.json(equipments)

    // ========================================
    // REMOVE THIS ENTIRE MOCK DATA SECTION AFTER UNCOMMENTING REAL API ABOVE
    // ========================================
    // For now, return mock data that matches your existing structure
    // Later you can replace this with actual database queries
    const equipments = [
      { 
        id: '1', 
        name: 'Oxygen mask, regulator', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '2', 
        name: 'Skin patch kit', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '3', 
        name: 'Light bub, access panel', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_REPAIR',
        alert: 'OUT_TO_REPAIR',
        category: 'EQUIPMENT' 
      },
      { 
        id: '4', 
        name: 'Fuel fiter, starter motor', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'UNSERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '5', 
        name: 'Oxygen mask, regulator', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '6', 
        name: 'Skin patch kit', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '7', 
        name: 'Light bub, access panel', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_REPAIR',
        alert: 'OUT_TO_REPAIR',
        category: 'EQUIPMENT' 
      },
      { 
        id: '8', 
        name: 'Fuel fiter, starter motor', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'UNSERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '9', 
        name: 'Oxygen mask, regulator', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '10', 
        name: 'Skin patch kit', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 15),
        nextCalibration: new Date(2026, 0, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '11', 
        name: 'Hydraulic Test Bench', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 10, 15),
        nextCalibration: new Date(2026, 3, 15),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '12', 
        name: 'Engine Hoist', 
        calibrationStatus: 'OVERDUE',
        lastCalibrated: new Date(2025, 8, 20),
        nextCalibration: new Date(2025, 11, 20),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_REPAIR',
        alert: 'OUT_TO_REPAIR',
        category: 'EQUIPMENT' 
      },
      { 
        id: '13', 
        name: 'Avionics Test Station', 
        calibrationStatus: 'DUE_SOON',
        lastCalibrated: new Date(2025, 9, 10),
        nextCalibration: new Date(2026, 1, 10),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '14', 
        name: 'Composite Repair Kit', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 5),
        nextCalibration: new Date(2026, 5, 5),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '15', 
        name: 'NDT Inspection Equipment', 
        calibrationStatus: 'OUT_FOR_CALIBRATION',
        lastCalibrated: new Date(2025, 7, 15),
        nextCalibration: new Date(2026, 1, 15),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_CALIBRATION',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '16', 
        name: 'Fuel System Tester', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 10, 25),
        nextCalibration: new Date(2026, 4, 25),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '17', 
        name: 'Landing Gear Jack', 
        calibrationStatus: 'OVERDUE',
        lastCalibrated: new Date(2025, 6, 12),
        nextCalibration: new Date(2025, 9, 12),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_REPAIR',
        alert: 'OUT_TO_REPAIR',
        category: 'EQUIPMENT' 
      },
      { 
        id: '18', 
        name: 'Cabin Pressure Tester', 
        calibrationStatus: 'DUE_SOON',
        lastCalibrated: new Date(2025, 8, 30),
        nextCalibration: new Date(2025, 12, 30),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '19', 
        name: 'Engine Alignment Tool', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 8),
        nextCalibration: new Date(2026, 5, 8),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '20', 
        name: 'Wiring Harness Tester', 
        calibrationStatus: 'OUT_FOR_CALIBRATION',
        lastCalibrated: new Date(2025, 9, 18),
        nextCalibration: new Date(2026, 1, 18),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_CALIBRATION',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '21', 
        name: 'Engine Compression Tester', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 10, 12),
        nextCalibration: new Date(2026, 4, 12),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      },
      { 
        id: '22', 
        name: 'Landing Gear Shim Kit', 
        calibrationStatus: 'DUE_SOON',
        lastCalibrated: new Date(2025, 9, 5),
        nextCalibration: new Date(2025, 12, 5),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'OUT_FOR_CALIB',
        category: 'EQUIPMENT' 
      },
      { 
        id: '23', 
        name: 'Cockpit Ventilation Tester', 
        calibrationStatus: 'OVERDUE',
        lastCalibrated: new Date(2025, 7, 8),
        nextCalibration: new Date(2025, 10, 8),
        serviceability: 'UNSERVICEABLE',
        status: 'OUT_FOR_REPAIR',
        alert: 'OUT_TO_REPAIR',
        category: 'EQUIPMENT' 
      },
      { 
        id: '24', 
        name: 'Engine Oil Analysis Kit', 
        calibrationStatus: 'CALIBRATED',
        lastCalibrated: new Date(2025, 11, 20),
        nextCalibration: new Date(2026, 5, 20),
        serviceability: 'SERVICEABLE',
        status: 'IN_STORE',
        alert: 'INSTORE',
        category: 'EQUIPMENT' 
      }
    ]
    
    return NextResponse.json(equipments)
  } catch (error) {
    console.error('Error fetching equipments:', error)
    
    // TODO: When real API is ready, enhance error handling:
    // - Log to external monitoring service (e.g., Sentry, LogRocket)
    // - Send error notifications to team
    // - Implement retry logic for transient failures
    // - Return cached data if available
    // - Provide user-friendly error messages
    
    // Example enhanced error handling:
    // if (error instanceof TypeError && error.message.includes('fetch')) {
    //   console.error('Network error - API endpoint unreachable')
    //   // Could return cached data here
    // } else if (error.response?.status === 401) {
    //   console.error('Authentication failed - check API token')
    // } else if (error.response?.status === 429) {
    //   console.error('Rate limit exceeded - implement backoff strategy')
    // }
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch equipment data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        // TODO: Add request ID for tracking when real API is integrated
        // requestId: generateRequestId()
      },
      { status: 500 }
    )
  }
}

