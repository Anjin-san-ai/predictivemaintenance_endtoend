import React from 'react';
import styles from '../Table/styles.module.css';

interface StatusIndicatorProps {
  status: string;
  type: 'part' | 'equipment';
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ 
  status, 
  type,
  className = ''
}) => {
  const getStatusInfo = () => {
    if (type === 'part') {
      switch (status) {
        case 'IN_STOCK':
          return { text: 'In Stock', colorClass: styles.inStock };
        case 'LOW_STOCK':
          return { text: 'Inventory Low!', colorClass: styles.lowStock };
        case 'OUT_OF_STOCK':
          return { text: 'Out of Stock', colorClass: styles.outOfStock };
        case 'ON_ORDER':
          return { text: 'Parts in Order', colorClass: styles.onOrder };
        case 'DISCONTINUED':
          return { text: 'Discontinued', colorClass: styles.discontinued };
        default:
          return { text: status, colorClass: styles.discontinued };
      }
    } else { // equipment
      // Handle specific equipment statuses
      switch (status) {
        case 'IN_STORE':
          return { text: 'In Store', colorClass: styles.inStore };
        case 'OUT_FOR_REPAIR':
          return { text: 'Out for Repair', colorClass: styles.outForRepair };
        case 'OUT_FOR_CALIBRATION':
          return { text: 'Out for Calibration', colorClass: styles.outForCalibration };
        case 'DISCONTINUED':
          return { text: 'Discontinued', colorClass: styles.discontinued };
        
        // Handle calibration status
        case 'CALIBRATED':
          return { text: 'Calibrated', colorClass: styles.inStock };
        case 'DUE_SOON':
          return { text: 'Due Soon', colorClass: styles.lowStock };
        case 'OVERDUE':
          return { text: 'Overdue', colorClass: styles.outOfStock };
        case 'OUT_FOR_CALIBRATION':
          return { text: 'Out for Calibration', colorClass: styles.outForCalibration };
        case 'NON_CALIBRATED':
          return { text: 'Non-calibrated', colorClass: styles.lowStock };
          
        // Handle serviceability state
        case 'SERVICEABLE':
          return { text: 'Serviceable', colorClass: styles.inStock };
        case 'UNSERVICEABLE':
          return { text: 'Unserviceable', colorClass: styles.outOfStock };
        case 'OUT_OF_REPAIR':
          return { text: 'Out for Repair', colorClass: styles.outForRepair };
        
        default:
          return { text: status, colorClass: styles.discontinued };
      }
    }
  };

  const { text, colorClass } = getStatusInfo();

  return (
    <div className={`${styles.statusIndicator} ${colorClass} ${className}`}>
      {text}
    </div>
  );
};

export default StatusIndicator;
