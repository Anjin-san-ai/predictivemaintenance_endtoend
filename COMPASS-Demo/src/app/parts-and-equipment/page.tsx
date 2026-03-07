'use client';

import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';
import { Tabs, SummaryCardsContainer, PartsTable, EquipmentTable, PartsCards, EquipmentCards, Header } from '@/components';
import { Search, AlertTriangle, AlertCircle, X, ExternalLink } from 'lucide-react';

interface PredictedDemandItem {
    partKeywords: string[];
    reason: string;
    severity: 'critical' | 'warning';
    aircraftId: string;
    aircraftName: string;
    componentName: string;
    maintenanceDue: string;
}

interface MaintenancePartsData {
    predictedDemand: PredictedDemandItem[];
    criticalCount: number;
    warningCount: number;
    affectedAircraftCount: number;
    fetchedAt: string;
    error?: string;
}

interface Part {
    id: string
    name: string
    stockAvailable: number
    scheduledForUse: number
    onOrder: number
    status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'DISCONTINUED'
    category: 'PART' | 'EQUIPMENT'
}

interface Equipment {
    id: string
    name: string
    calibrationStatus: 'CALIBRATED' | 'DUE_SOON' | 'OVERDUE' | 'OUT_FOR_CALIBRATION' | 'NON_CALIBRATED'
    lastCalibrated: Date
    nextCalibration: Date
    serviceability: 'SERVICEABLE' | 'UNSERVICEABLE' | 'OUT_OF_REPAIR' | 'DISCONTINUED'
    status: 'IN_STORE' | 'OUT_FOR_REPAIR' | 'OUT_FOR_CALIBRATION' | 'DISCONTINUED'
    alert: 'INSTORE' | 'OUT_FOR_CALIB' | 'OUT_TO_REPAIR'
    category: 'PART' | 'EQUIPMENT'
}

export default function PartsAndEquipment() {
    const [activeTab, setActiveTab] = useState<'parts' | 'equipment'>('parts');
    const [parts, setParts] = useState<Part[]>([])
    const [equipments, setEquipments] = useState<Equipment[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState<string>('status')
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
    const [filterStatus, setFilterStatus] = useState<string>('all')
    const [timeline, setTimeline] = useState('1 month');
    const [showTimelineDropdown, setShowTimelineDropdown] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [showSortDropdown, setShowSortDropdown] = useState(false);
    const [maintenanceParts, setMaintenanceParts] = useState<MaintenancePartsData | null>(null);
    const [showDemandPanel, setShowDemandPanel] = useState(true);
    const [selectedDemandItem, setSelectedDemandItem] = useState<PredictedDemandItem | null>(null);

    const handleTabChange = (tab: 'parts' | 'equipment') => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSortBy('status');
    };

    const fetchData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const [partsRes, equipmentsRes] = await Promise.all([
                fetch('/api/parts'),
                fetch('/api/equipments')
            ])

            if (!partsRes.ok || !equipmentsRes.ok) {
                throw new Error('Failed to fetch data from one or more APIs')
            }

            const partsData = await partsRes.json()
            const equipmentsData = await equipmentsRes.json()

            const equipmentsWithDates = equipmentsData.map((equipment: any) => ({
                ...equipment,
                lastCalibrated: new Date(equipment.lastCalibrated),
                nextCalibration: new Date(equipment.nextCalibration)
            }))

            setParts(partsData)
            setEquipments(equipmentsWithDates)
            
            setIsLoading(false)
        } catch (err: any) {
            setError(err.message || 'An error occurred')
            setIsLoading(false)
        }
    };
    
    useEffect(() => {
      fetchData();
      // Fetch predictive demand from Fleet Monitor
      fetch('/api/maintenance-parts')
        .then(r => r.json())
        .then(data => setMaintenanceParts(data))
        .catch(() => {/* fleet monitor offline — degrade gracefully */});
    }, [])

    useEffect(() => {
        setFilterStatus('all');
        fetchData();
    }, [activeTab]);
    
    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
          const timelineContainer = document.querySelector(`.${styles.timelineContainer}`);
          const filterContainer = document.querySelector(`.${styles.filterContainer}`);
          const sortContainer = document.querySelector(`.${styles.sortContainer}`);
          
          if (timelineContainer && !timelineContainer.contains(event.target as Node) && showTimelineDropdown) {
              setShowTimelineDropdown(false);
          }
          
          if (filterContainer && !filterContainer.contains(event.target as Node) && showFilterDropdown) {
              setShowFilterDropdown(false);
          }
          
          if (sortContainer && !sortContainer.contains(event.target as Node) && showSortDropdown) {
              setShowSortDropdown(false);
          }
        };
        
        document.addEventListener('mousedown', handleOutsideClick);
        
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [showTimelineDropdown, showFilterDropdown, showSortDropdown]);

  const getPartDemandInfo = (partName: string): { severity: 'critical' | 'warning'; reasons: string[] } | null => {
    if (!maintenanceParts || maintenanceParts.predictedDemand.length === 0) return null;
    const nameLower = partName.toLowerCase();
    const matches = maintenanceParts.predictedDemand.filter(d =>
      d.partKeywords.some(kw => nameLower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(nameLower))
    );
    if (matches.length === 0) return null;
    const hasCritical = matches.some(m => m.severity === 'critical');
    return { severity: hasCritical ? 'critical' : 'warning', reasons: matches.map(m => m.reason) };
  };

  const getSummaryStats = () => {
    if (activeTab === 'parts') {
      return {
        totalAvailable: parts.filter((item: Part) => item.status === 'IN_STOCK').length,
        totalOutOfStock: parts.filter((item: Part) => item.status === 'OUT_OF_STOCK').length,
        totalLowStock: parts.filter((item: Part) => item.status === 'LOW_STOCK').length,
        totalOnOrder: parts.filter((item: Part) => item.status === 'ON_ORDER').length,
        totalDiscontinued: parts.filter((item: Part) => item.status === 'DISCONTINUED').length
      }
    } else {
      return {
        totalAvailable: equipments.filter((item: Equipment) => item.status === 'IN_STORE').length,
        totalServiceable: equipments.filter((item: Equipment) => item.serviceability === 'SERVICEABLE').length,
        totalUnserviceable: equipments.filter((item: Equipment) => item.serviceability === 'UNSERVICEABLE').length,
        totalOutOfRepair: equipments.filter((item: Equipment) => item.status === 'OUT_FOR_REPAIR').length,
        totalCalibration: equipments.filter((item: Equipment) => item.status === 'OUT_FOR_CALIBRATION').length
      }
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-blue-600 text-xl mb-4">Loading...</div>
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-2xl mb-4">⚠️</div>
          <div className="text-red-600 text-xl mb-4">Error loading data</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const summaryStats = getSummaryStats()
  
  const formatFilterStatus = (status: string): string => {
    return status
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getFilteredAndSortedData = () => {
    const data: (Part | Equipment)[] = activeTab === 'parts' ? parts : equipments;
    
    let filteredData = data;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredData = data.filter((item: Part | Equipment) => {
        if (activeTab === 'parts') {
          const part = item as Part;
          return (
            part.name.toLowerCase().includes(searchLower) ||
            part.status.toLowerCase().includes(searchLower) ||
            String(part.stockAvailable).includes(searchLower) ||
            String(part.scheduledForUse).includes(searchLower)
          );
        } else {
          const equipment = item as Equipment;
          return (
            equipment.name.toLowerCase().includes(searchLower) ||
            equipment.status.toLowerCase().includes(searchLower) ||
            equipment.serviceability.toLowerCase().includes(searchLower) ||
            equipment.calibrationStatus.toLowerCase().includes(searchLower) ||
            (equipment.alert && equipment.alert.toLowerCase().includes(searchLower))
          );
        }
      });
    }
    
    if (filterStatus !== 'all') {
      if (activeTab === 'parts') {
        if (filterStatus === 'scheduled-maintenance') {
          filteredData = filteredData.filter((item) => {
            if ('scheduledForUse' in item) {
              return (item as Part).scheduledForUse > 0;
            }
            return false;
          });
        } else if (filterStatus === 'emergency-repair') {
          filteredData = filteredData.filter((item) => {
            if ('scheduledForUse' in item) {
              return (item as Part).stockAvailable < 5 && (item as Part).scheduledForUse > 0;
            }
            return false;
          });
        } else if (filterStatus === 'discontinued') {
          filteredData = filteredData.filter((item) => {
            if ('scheduledForUse' in item) {
              return (item as Part).status === 'DISCONTINUED';
            }
            return false;
          });
        }
      } else {
        if (filterStatus === 'serviceable') {
          filteredData = filteredData.filter((item) => {
            if ('serviceability' in item) {
              return (item as Equipment).serviceability === 'SERVICEABLE';
            }
            return false;
          });
        } else if (filterStatus === 'un-serviceable') {
          filteredData = filteredData.filter((item) => {
            if ('serviceability' in item) {
              return (item as Equipment).serviceability === 'UNSERVICEABLE';
            }
            return false;
          });
        } else if (filterStatus === 'out-of-repair') {
          filteredData = filteredData.filter((item) => {
            if ('serviceability' in item) {
              return (item as Equipment).status === 'OUT_FOR_REPAIR';
            }
            return false;
          });
        } else if (filterStatus === 'out-for-calibration') {
          filteredData = filteredData.filter((item) => {
            if ('serviceability' in item) {
              return (item as Equipment).status === 'OUT_FOR_CALIBRATION';
            }
            return false;
          });
        } else if (filterStatus === 'discontinued') {
          filteredData = filteredData.filter((item) => {
            if ('serviceability' in item) {
              return (item as Equipment).status === 'DISCONTINUED';
            }
            return false;
          });
        }
      }
    }
    
    const sortedData = [...filteredData].sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      if (activeTab === 'parts') {
        if (sortBy === 'inventory-low') {
          valueA = (a as Part).stockAvailable;
          valueB = (b as Part).stockAvailable;
        } else if (sortBy === 'parts-in-order') {
          valueA = (a as Part).onOrder;
          valueB = (b as Part).onOrder;
        } else if (sortBy === 'in-stock') {
          valueA = (a as Part).stockAvailable;
          valueB = (b as Part).stockAvailable;
          return sortDirection === 'asc' 
            ? (valueB as number) - (valueA as number)
            : (valueA as number) - (valueB as number);
        } else if (sortBy === 'status') {
          valueA = (a as Part).status;
          valueB = (b as Part).status;
        } else {
          // Default to name
          valueA = a.name;
          valueB = b.name;
        }
      } else {
        if (sortBy === 'equipment-status') {
          valueA = (a as Equipment).status;
          valueB = (b as Equipment).status;
        } else if (sortBy === 'equipment-out-of-stock') {
          valueA = (a as Equipment).serviceability === 'UNSERVICEABLE' ? 0 : 1;
          valueB = (b as Equipment).serviceability === 'UNSERVICEABLE' ? 0 : 1;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else if (sortBy === 'equipment-in-progress') {
          valueA = (a as Equipment).status === 'OUT_FOR_REPAIR' ? 0 : 1;
          valueB = (b as Equipment).status === 'OUT_FOR_REPAIR' ? 0 : 1;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else if (sortBy === 'equipment-shipped') {
          // Sort by calibration status
          valueA = (a as Equipment).status === 'OUT_FOR_CALIBRATION' ? 0 : 1;
          valueB = (b as Equipment).status === 'OUT_FOR_CALIBRATION' ? 0 : 1;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else if (sortBy === 'equipment-not-available') {
          valueA = (a as Equipment).status !== 'IN_STORE' ? 0 : 1;
          valueB = (b as Equipment).status !== 'IN_STORE' ? 0 : 1;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else if (sortBy === 'equipment-discontinued') {
          valueA = (a as Equipment).status === 'DISCONTINUED' ? 0 : 1;
          valueB = (b as Equipment).status === 'DISCONTINUED' ? 0 : 1;
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA;
        } else {
          valueA = a.name;
          valueB = b.name;
          valueA = a.name;
          valueB = b.name;
        }
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return sortDirection === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      } else {
        return sortDirection === 'asc' 
          ? (valueA as number) - (valueB as number) 
          : (valueB as number) - (valueA as number);
      }
    });
    
    return sortedData;
  };
  
  const filteredAndSortedData = getFilteredAndSortedData();
  const itemsPerPage = 12;
  
  const renderTableContent = () => {
    return activeTab === 'parts' ? (
      <PartsTable 
        data={filteredAndSortedData as Part[]}
        className={styles.dataTable}
        itemsPerPage={itemsPerPage}
      />
    ) : (
      <EquipmentTable 
        data={filteredAndSortedData as Equipment[]}
        className={styles.dataTable}
        itemsPerPage={itemsPerPage}
      />
    );
  };
  

  return (
    <React.Fragment>
      <Header />

      {/* Predictive Demand Banner — driven by Fleet Monitor health data */}
      {maintenanceParts && !maintenanceParts.error && (maintenanceParts.criticalCount > 0 || maintenanceParts.warningCount > 0) && showDemandPanel && (
        <div style={{
          margin: 0,
          padding: '10px 20px',
          background: maintenanceParts.criticalCount > 0
            ? 'linear-gradient(90deg, rgba(255,71,87,0.08), rgba(253,253,253,0.0))'
            : 'linear-gradient(90deg, rgba(255,165,2,0.08), rgba(253,253,253,0.0))',
          borderLeft: `4px solid ${maintenanceParts.criticalCount > 0 ? '#ff4757' : '#ffa502'}`,
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}>
          <div style={{ flexShrink: 0, paddingTop: '2px' }}>
            {maintenanceParts.criticalCount > 0
              ? <AlertCircle size={18} color="#ff4757" />
              : <AlertTriangle size={18} color="#ffa502" />
            }
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: maintenanceParts.criticalCount > 0 ? '#cc2233' : '#b87400', marginBottom: '3px' }}>
              Fleet Monitor — Predictive Demand Alert
            </div>
            <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.5 }}>
              {maintenanceParts.criticalCount > 0 && (
                <span><strong style={{ color: '#ff4757' }}>{maintenanceParts.criticalCount} Critical</strong> component{maintenanceParts.criticalCount !== 1 ? 's' : ''}{' '}</span>
              )}
              {maintenanceParts.warningCount > 0 && (
                <span><strong style={{ color: '#ffa502' }}>{maintenanceParts.warningCount} Warning</strong> component{maintenanceParts.warningCount !== 1 ? 's' : ''}{' '}</span>
              )}
              across <strong>{maintenanceParts.affectedAircraftCount} aircraft</strong> — parts highlighted below may be required.
            </div>
            <div style={{ marginTop: '6px', display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
              {maintenanceParts.predictedDemand.slice(0, 6).map((d, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDemandItem(selectedDemandItem?.aircraftId === d.aircraftId && selectedDemandItem?.componentName === d.componentName ? null : d)}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    border: `1px solid ${d.severity === 'critical' ? 'rgba(255,71,87,0.4)' : 'rgba(255,165,2,0.4)'}`,
                    background: d.severity === 'critical' ? 'rgba(255,71,87,0.1)' : 'rgba(255,165,2,0.1)',
                    color: d.severity === 'critical' ? '#ff4757' : '#ffa502',
                    cursor: 'pointer',
                  }}
                  title={d.reason}
                >
                  {d.aircraftId}: {d.componentName}
                </button>
              ))}
              {maintenanceParts.predictedDemand.length > 6 && (
                <span style={{ fontSize: '11px', color: '#888', padding: '2px 8px' }}>+{maintenanceParts.predictedDemand.length - 6} more</span>
              )}
            </div>
            {selectedDemandItem && (
              <div style={{ marginTop: '6px', padding: '6px 10px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px', color: '#444', border: '1px solid #e0e0e0' }}>
                <strong>{selectedDemandItem.aircraftName} — {selectedDemandItem.componentName}</strong><br />
                {selectedDemandItem.reason}<br />
                <span style={{ opacity: 0.75 }}>Look for parts matching: {selectedDemandItem.partKeywords.slice(0, 5).join(', ')}</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowDemandPanel(false)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#999', padding: '2px', flexShrink: 0 }}
            title="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <div className={styles.gradientSection}>
        <div className={styles.content}>
          <div className={styles.tabsContainer}>
            <Tabs 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              tabs={[
                { id: 'parts', label: 'Parts' },
                { id: 'equipment', label: 'Equipment' }
              ]} 
            />
          </div>
        
          <div className={styles.summaryCardsSection}>
            <SummaryCardsContainer>
              {activeTab === 'parts' ? (
                <PartsCards
                  totalAvailable={summaryStats.totalAvailable || 0}
                  totalOutOfStock={summaryStats.totalOutOfStock || 0}
                  totalOnOrder={summaryStats.totalOnOrder || 0}
                  totalLowStock={summaryStats.totalLowStock || 0}
                  totalDiscontinued={summaryStats.totalDiscontinued || 0}
                />
              ) : (
                <EquipmentCards
                  totalAvailable={summaryStats.totalAvailable || 0}
                  totalServiceable={summaryStats.totalServiceable || 0}
                  totalUnserviceable={summaryStats.totalUnserviceable || 0}
                  totalOutOfRepair={summaryStats.totalOutOfRepair || 0}
                  totalCalibration={summaryStats.totalCalibration || 0}
                />
              )}
            </SummaryCardsContainer>
          </div>
        </div>
      </div>

      <div className={styles.contentSection}>
        <div className={styles.overviewRequiredMessage}>
          Overview of {activeTab} required
        </div>
        
        {/* Search and Filter Controls */}
        <div className={styles.controlsSection}>
          <div className={styles.searchContainer}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search..." 
              className={styles.searchInput}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.timelineContainer}>
            <div onClick={() => setShowTimelineDropdown(!showTimelineDropdown)} className={styles.dropdownHeader}>
              <span className={styles.timelineText}>Timeline: <b>{timeline}</b></span>
              <img src="/images/parts-and-equipment/arrow-drop-down-13@2x.png" alt="Timeline Dropdown" className={styles.arrow} />
            </div>
            {showTimelineDropdown && (
              <div className={styles.customDropdown}>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => {
                    setTimeline('1 month');
                    setShowTimelineDropdown(false);
                  }}
                >
                  1 month
                </div>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => {
                    setTimeline('3 months');
                    setShowTimelineDropdown(false);
                  }}
                >
                  3 months
                </div>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => {
                    setTimeline('6 months');
                    setShowTimelineDropdown(false);
                  }}
                >
                  6 months
                </div>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => {
                    setTimeline('1 year');
                    setShowTimelineDropdown(false);
                  }}
                >
                  1 year
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.filterContainer}>
            <div onClick={() => setShowFilterDropdown(!showFilterDropdown)} className={styles.dropdownHeader}>
              <img className={styles.filterIcon} src="/images/parts-and-equipment/filter-list-1@2x.png" alt="filter_list" />
              <span className={styles.filterText}>Filter by: <b>{filterStatus === 'all' ? (activeTab === 'parts' ? 'Activity' : 'Status') : formatFilterStatus(filterStatus)}</b></span>
              <img src="/images/parts-and-equipment/arrow-drop-down-13@2x.png" alt="Filter Dropdown" className={styles.arrow} />
            </div>
            {showFilterDropdown && (
              <div className={styles.customDropdown}>
                <div 
                  className={styles.dropdownOption}
                  onClick={() => {
                    setFilterStatus('all');
                    setShowFilterDropdown(false);
                  }}
                >
                  {activeTab === 'parts' ? 'Filter by activities' : 'Filter by status'}
                </div>
                {activeTab === 'parts' ? (
                  <React.Fragment>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('scheduled-maintenance');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Scheduled Maintenance
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('emergency-repair');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Emergency Repair
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('discontinued');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Discontinued
                    </div>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('serviceable');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Serviceable
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('un-serviceable');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Un-serviceable
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('out-of-repair');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Out of Repair
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setFilterStatus('out-for-calibration');
                        setShowFilterDropdown(false);
                      }}
                    >
                      Out for Calibration
                    </div>
                  </React.Fragment>
                )}                
              </div>
            )}
          </div>
          
          <div className={styles.sortContainer}>
            <div onClick={() => setShowSortDropdown(!showSortDropdown)} className={styles.dropdownHeader}>
              <img src="/images/parts-and-equipment/format-line-spacing-1@2x.png" alt="Sort" className={styles.sortIcon} />
              <span className={styles.sortText}>
                {activeTab === 'parts' ? 
                  (sortBy === 'inventory-low' ? <>Sort by: <b>Inventory low</b></> :
                  sortBy === 'parts-in-order' ? <>Sort by: <b>Parts in order</b></> :
                  sortBy === 'in-stock' ? <>Sort by: <b>In stock</b></> :
                  sortBy === 'status' ? <>Sort by: <b>Status</b></> : <>Sort by</>):
                  (sortBy === 'equipment-status' ? <>Sort by: <b>Status</b></> :
                  sortBy === 'equipment-out-of-stock' ? <>Sort by: <b>Out of Stock</b></> :
                  sortBy === 'equipment-in-progress' ? <>Sort by: <b>In Progress</b></> :
                  sortBy === 'equipment-shipped' ? <>Sort by: <b>Shipped</b></> :
                  sortBy === 'equipment-not-available' ? <>Sort by: <b>Not Available</b></> :
                  sortBy === 'equipment-discontinued' ? <>Sort by: <b>Discontinued</b></> : <>Sort by: <b>Status</b></>)
                }
              </span>
              <img src="/images/parts-and-equipment/arrow-drop-down-13@2x.png" alt="Sort Dropdown" className={styles.arrow} />
              <button 
                className={styles.sortDirectionButton}
                onClick={(e) => {
                  e.stopPropagation(); // Prevent the container click event
                  setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                }}
              >
                <span 
                  className={styles.sortDirectionArrow}
                  aria-label={sortDirection === 'asc' ? "Ascending" : "Descending"}
                >
                  {sortDirection === 'asc' ? '↑' : '↓'}
                </span>
              </button>
            </div>
            {showSortDropdown && (
              <div className={styles.customDropdown}>
                {activeTab === 'parts' ? (
                  <React.Fragment>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('inventory-low');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Inventory low
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('parts-in-order');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Parts in order
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('in-stock');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: In stock
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('status');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Status
                    </div>
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-status');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Status
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-out-of-stock');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Out of Stock
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-in-progress');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: In Progress
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-shipped');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Shipped
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-not-available');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Not Available
                    </div>
                    <div 
                      className={styles.dropdownOption}
                      onClick={() => {
                        setSortBy('equipment-discontinued');
                        setShowSortDropdown(false);
                      }}
                    >
                      Sort by: Discontinued
                    </div>
                  </React.Fragment>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table content */}
        <div className={styles.tableContainer}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <div className={styles.spinner}></div>
              <span>Loading data...</span>
            </div>
          ) : error ? (
            <div className={styles.messageContainer}>
              <p className={styles.errorMessage}>{error}</p>
              <button 
                onClick={() => {
                  setIsLoading(true);
                  setError(null);
                    // Retry fetching data
                    fetchData();
                  }}
                  className={styles.retryButton}
                >
                Retry
              </button>
            </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className={styles.messageContainer}>
                <p className={styles.noResultsMessage}>No {activeTab} found matching your search criteria</p>
              </div>
            ) : (
              renderTableContent()
            )}
        </div>
      </div>
    </React.Fragment>
  );
}
