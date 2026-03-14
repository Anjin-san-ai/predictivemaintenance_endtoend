export interface FleetData {
  serviceable: number;
  inMaintenance: number;
  unServiceable: number;
  inFlight: number;
  depthMaintenance: number;
}

export const getDynamicStatusForAircraft = (aircraft: any): string => {
  const now = new Date();
  const todayString = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const currentTime = now.toTimeString().slice(0, 5);
  let inFlight = false;
  let plannedMaintenance = false;
  let depthMaintenance = false;
  let onlyPlannedMaintenance = false;
  let onlyDepthMaintenance = false;
  let hasLongPlannedMaintenance = false;

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  if (Array.isArray(aircraft.routes)) {
    aircraft.routes.forEach((segmentArr: any[]) => {
      if (segmentArr.length > 0) {
        const firstSegment = segmentArr[0];
        const lastSegment = segmentArr[segmentArr.length - 1];
        const journeyStartDate = firstSegment.departureDate;
        const journeyEndDate = lastSegment.arrivalDate;
        const journeyStartTime = firstSegment.departureTime;
        const journeyEndTime = lastSegment.arrivalTime;
        
        if (journeyStartDate < todayString && journeyEndDate > todayString) {
          inFlight = true;
        } else if (journeyStartDate === todayString || journeyEndDate === todayString) {
          const currentMinutes = timeToMinutes(currentTime);

          // Only apply the journey-level departure check for multi-day journeys
          // (journeyEndDate is a future date). Same-day journeys where both start
          // and end are TODAY are handled precisely by the per-segment loop below,
          // which checks the full departure-to-arrival window.
          if (journeyStartDate === todayString && journeyEndDate !== todayString) {
            const departureMinutes = timeToMinutes(journeyStartTime);
            if (currentMinutes >= departureMinutes) {
              inFlight = true;
            }
          }

          // Only apply the journey-level arrival check for multi-day journeys
          // (journeyStartDate was a past date).
          if (journeyEndDate === todayString && journeyStartDate !== todayString && !inFlight) {
            const arrivalMinutes = timeToMinutes(journeyEndTime);
            if (currentMinutes <= arrivalMinutes) {
              inFlight = true;
            }
          }
        }
        
        segmentArr.forEach((segment: any) => {
          if (segment.departureDate === todayString && segment.arrivalDate === todayString) {
            const currentMinutes = timeToMinutes(currentTime);
            const departureMinutes = timeToMinutes(segment.departureTime);
            const arrivalMinutes = timeToMinutes(segment.arrivalTime);
            
            if (currentMinutes >= departureMinutes && currentMinutes <= arrivalMinutes) {
              inFlight = true;
            }
          } else if (segment.departureDate === todayString && segment.arrivalDate > todayString) {
            const currentMinutes = timeToMinutes(currentTime);
            const departureMinutes = timeToMinutes(segment.departureTime);
            
            if (currentMinutes >= departureMinutes) {
              inFlight = true;
            }
          } else if (segment.departureDate < todayString && segment.arrivalDate === todayString) {
            const currentMinutes = timeToMinutes(currentTime);
            const arrivalMinutes = timeToMinutes(segment.arrivalTime);
            
            if (currentMinutes <= arrivalMinutes) {
              inFlight = true;
            }
          }
        });
      }
    });
  }

  if (Array.isArray(aircraft.maintenance)) {
    let plannedCount = 0;
    let depthCount = 0;
    aircraft.maintenance.forEach((maintenance: any) => {
      let isActive = false;
      const currentMinutes = timeToMinutes(currentTime);
      const startMinutes = timeToMinutes(maintenance.scheduleStartTime);
      const endMinutes = timeToMinutes(maintenance.scheduleEndTime);
      if (maintenance.scheduleStartDate < todayString && maintenance.scheduleEndDate > todayString) {
        isActive = true;
      } else if (maintenance.scheduleStartDate === todayString && maintenance.scheduleEndDate === todayString) {
        if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
          isActive = true;
        }
      } else if (maintenance.scheduleStartDate === todayString) {
        if (currentMinutes >= startMinutes) {
          isActive = true;
        }
      } else if (maintenance.scheduleEndDate === todayString) {
        if (currentMinutes <= endMinutes) {
          isActive = true;
        }
      } else if (maintenance.scheduleStartDate < todayString && maintenance.scheduleEndDate > todayString) {
        isActive = true;
      } else if (maintenance.scheduleStartDate < todayString && maintenance.scheduleEndDate === todayString) {
        if (currentMinutes <= endMinutes) {
          isActive = true;
        }
      } else if (maintenance.scheduleStartDate === todayString && maintenance.scheduleEndDate > todayString) {
        if (currentMinutes >= startMinutes) {
          isActive = true;
        }
      }

      if (isActive) {
        if (maintenance.type === 'Planned') {
          plannedMaintenance = true;
          plannedCount++;
          const start = new Date(maintenance.scheduleStartDate);
          const end = new Date(maintenance.scheduleEndDate);
          const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays >= 30) {
            hasLongPlannedMaintenance = true;
          }
        }
        if (maintenance.type === 'In-Depth' || maintenance.type === 'Depth') {
          depthMaintenance = true;
          depthCount++;
        }
      }
    });
    onlyPlannedMaintenance = plannedMaintenance && !depthMaintenance;
    onlyDepthMaintenance = depthMaintenance && !plannedMaintenance;
  }

  if (!inFlight && !plannedMaintenance && !depthMaintenance) {
    return 'Serviceable';
  }
  if (inFlight && !plannedMaintenance && !depthMaintenance) {
    return 'In flight';
  }
  if (onlyPlannedMaintenance && !hasLongPlannedMaintenance) {
    return 'In-maintenance';
  }
  if (onlyDepthMaintenance) {
    return 'Depth maintenance';
  }
  if (onlyPlannedMaintenance && hasLongPlannedMaintenance) {
    return 'Un-serviceable';
  }

  if (plannedMaintenance && depthMaintenance) {
    return 'Depth maintenance';
  }
  return 'Serviceable';
};

export const calculateFleetData = (data: any[]): FleetData => {
  const statusCounts: FleetData = {
    serviceable: 0,
    inMaintenance: 0,
    unServiceable: 0,
    inFlight: 0,
    depthMaintenance: 0,
  };

  data.forEach(aircraft => {
    const dynamicStatus = getDynamicStatusForAircraft(aircraft);
    switch (dynamicStatus) {
      case 'Serviceable':
        statusCounts.serviceable++;
        break;
      case 'In-maintenance':
        statusCounts.inMaintenance++;
        break;
      case 'Un-serviceable':
        statusCounts.unServiceable++;
        break;
      case 'In flight':
        statusCounts.inFlight++;
        break;
      case 'Depth maintenance':
        statusCounts.depthMaintenance++;
        break;
      default:
        statusCounts.serviceable++;
        break;
    }
  });
  return statusCounts;
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Serviceable': return '#49a02c';
    case 'In-maintenance': return '#fe9f4d';
    case 'Depth maintenance': return '#8a94ab';
    case 'Un-serviceable': return '#fe4d4d';
    case 'In flight': return '#769dff';
    default: return '#49a02c';
  }
};
