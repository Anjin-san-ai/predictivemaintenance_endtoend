import React from 'react';
import { Table, TableColumn } from '@/components/Table';
import { StatusIndicator } from '@/components/PartsEquipments';
import styles from '../Table/styles.module.css';

interface Equipment {
  id: string;
  name: string;
  calibrationStatus: 'CALIBRATED' | 'DUE_SOON' | 'OVERDUE' | 'OUT_FOR_CALIBRATION' | 'NON_CALIBRATED';
  lastCalibrated: Date;
  nextCalibration: Date;
  serviceability: 'SERVICEABLE' | 'UNSERVICEABLE' | 'OUT_OF_REPAIR' | 'DISCONTINUED';
  status: 'IN_STORE' | 'OUT_FOR_REPAIR' | 'OUT_FOR_CALIBRATION' | 'DISCONTINUED';
  alert: 'INSTORE' | 'OUT_FOR_CALIB' | 'OUT_TO_REPAIR';
  category: 'PART' | 'EQUIPMENT';
}

interface EquipmentTableProps {
  data: Equipment[];
  onRowClick?: (equipment: Equipment) => void;
  className?: string;
  itemsPerPage?: number;
}

const EquipmentTable: React.FC<EquipmentTableProps> = ({ 
  data, 
  onRowClick,
  className = '',
  itemsPerPage = 12 // Default to 12 if not provided
}) => {
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Define columns with proper accessors that will work with the Table component
  const columns: TableColumn<Equipment>[] = [
    {
      header: 'Tool name',
      accessor: 'name',
      width: '15%',
    },
    {
      header: 'Calibration Status',
      accessor: (equipment) => {
        return (
          <StatusIndicator 
            status={equipment.calibrationStatus}
            type="equipment"
          />
        );
      },
      width: '15%',
    },
    {
      header: 'Date last calibrated',
      accessor: (equipment) => formatDate(equipment.lastCalibrated),
      width: '15%',
    },
    {
      header: 'Required next calibration',
      accessor: (equipment) => formatDate(equipment.nextCalibration),
      width: '15%',
    },
    {
      header: 'Serviceability state',
      accessor: (equipment) => {
        return (
          <StatusIndicator 
            status={equipment.serviceability}
            type="equipment"
          />
        );
      },
      width: '15%',
    },
    {
      header: 'Alert',
      accessor: (equipment) => {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <img 
              src="/images/parts-and-equipment/sms-12@2x.png" 
              alt="dropdown" 
              style={{ width: '30px', height: '30px' }}
            />
            <span>
              {equipment.alert === 'INSTORE' ? 'Instore' : 
               equipment.alert === 'OUT_FOR_CALIB' ? 'Out for calib' : 
               'Out to repair'}
            </span>
          </div>
        );
      },
      width: '15%',
    },
  ];

  return (
    <div className={className}>
      <div className="table-wrapper">
        <Table
          columns={columns}
          data={data}
          onRowClick={onRowClick}
          highlightOnHover={true}
          emptyMessage="No equipment found"
          showPagination={true}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};

export default EquipmentTable;
