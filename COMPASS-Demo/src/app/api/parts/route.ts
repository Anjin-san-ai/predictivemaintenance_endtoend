import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // TODO: When real API is ready, uncomment this and replace the URL
    // const response = await fetch('https://your-backend-api.com/api/parts', {
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
    // const parts = await response.json()
    // return NextResponse.json(parts)

    // ========================================
    // REMOVE THIS ENTIRE MOCK DATA SECTION AFTER UNCOMMENTING REAL API ABOVE
    // ========================================
    // For now, return mock data that matches your existing structure
    // Later you can replace this with actual database queries
    const parts = [
      { id: '1', name: 'Engine Oil Filter', stockAvailable: 45, scheduledForUse: 12, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '2', name: 'Hydraulic Pump', stockAvailable: 3, scheduledForUse: 8, onOrder: 15, status: 'LOW_STOCK', category: 'PART' },
      { id: '3', name: 'Landing Gear Strut', stockAvailable: 0, scheduledForUse: 5, onOrder: 20, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '4', name: 'Avionics Module', stockAvailable: 12, scheduledForUse: 3, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '5', name: 'Fuel Nozzle', stockAvailable: 0, scheduledForUse: 0, onOrder: 0, status: 'DISCONTINUED', category: 'PART' },
      { id: '6', name: 'Brake Pad Set', stockAvailable: 28, scheduledForUse: 15, onOrder: 10, status: 'IN_STOCK', category: 'PART' },
      { id: '7', name: 'Oxygen Mask', stockAvailable: 1, scheduledForUse: 4, onOrder: 25, status: 'LOW_STOCK', category: 'PART' },
      { id: '8', name: 'Navigation Light', stockAvailable: 0, scheduledForUse: 2, onOrder: 8, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '9', name: 'Cabin Pressure Sensor', stockAvailable: 18, scheduledForUse: 6, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '10', name: 'Engine Mount Bracket', stockAvailable: 0, scheduledForUse: 1, onOrder: 12, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '11', name: 'Turbine Blade', stockAvailable: 15, scheduledForUse: 8, onOrder: 5, status: 'IN_STOCK', category: 'PART' },
      { id: '12', name: 'Fuel Pump Assembly', stockAvailable: 2, scheduledForUse: 3, onOrder: 18, status: 'LOW_STOCK', category: 'PART' },
      { id: '13', name: 'Landing Gear Actuator', stockAvailable: 0, scheduledForUse: 2, onOrder: 15, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '14', name: 'Cockpit Display Unit', stockAvailable: 8, scheduledForUse: 4, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '15', name: 'Hydraulic Valve Block', stockAvailable: 22, scheduledForUse: 12, onOrder: 8, status: 'IN_STOCK', category: 'PART' },
      { id: '16', name: 'Engine Starter Motor', stockAvailable: 5, scheduledForUse: 2, onOrder: 10, status: 'LOW_STOCK', category: 'PART' },
      { id: '17', name: 'Fuel Tank Sensor', stockAvailable: 0, scheduledForUse: 1, onOrder: 12, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '18', name: 'Cabin Air Filter', stockAvailable: 35, scheduledForUse: 8, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '19', name: 'Landing Gear Tire', stockAvailable: 12, scheduledForUse: 6, onOrder: 15, status: 'IN_STOCK', category: 'PART' },
      { id: '20', name: 'Engine Mount Isolator', stockAvailable: 0, scheduledForUse: 3, onOrder: 20, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '21', name: 'Hydraulic Fluid Reservoir', stockAvailable: 8, scheduledForUse: 4, onOrder: 0, status: 'IN_STOCK', category: 'PART' },
      { id: '22', name: 'Cockpit Seat Cushion', stockAvailable: 15, scheduledForUse: 2, onOrder: 8, status: 'IN_STOCK', category: 'PART' },
      { id: '23', name: 'Engine Exhaust Nozzle', stockAvailable: 0, scheduledForUse: 1, onOrder: 15, status: 'OUT_OF_STOCK', category: 'PART' },
      { id: '24', name: 'Landing Gear Brake', stockAvailable: 18, scheduledForUse: 5, onOrder: 12, status: 'IN_STOCK', category: 'PART' }
    ]
    
    return NextResponse.json(parts)
  } catch (error) {
    console.error('Error fetching parts:', error)
    
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
        error: 'Failed to fetch parts data',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
        // TODO: Add request ID for tracking when real API is integrated
        // requestId: generateRequestId()
      },
      { status: 500 }
    )
  }
}

