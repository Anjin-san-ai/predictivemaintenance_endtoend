import React from 'react';
import { Table, TableColumn } from '@/components/Table';
import { StatusIndicator } from '@/components/PartsEquipments';
import styles from '../Table/styles.module.css';

interface Part {
  id: string;
  name: string;
  stockAvailable: number;
  scheduledForUse: number;
  onOrder: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'ON_ORDER' | 'DISCONTINUED';
  category: 'PART' | 'EQUIPMENT';
}

interface PartsTableProps {
  data: Part[];
  onRowClick?: (part: Part) => void;
  className?: string;
  itemsPerPage?: number;
}

const PartsTable: React.FC<PartsTableProps> = ({ 
  data, 
  onRowClick,
  className = '',
  itemsPerPage = 12 // Default to 12 if not provided
}) => {
  const columns: TableColumn<Part>[] = [
    {
      header: 'Parts name',
      accessor: 'name',
      width: '25%',
    },
    {
      header: 'Parts available',
      accessor: 'stockAvailable',
      width: '15%',
    },
    {
      header: 'Currently planned',
      accessor: 'scheduledForUse',
      width: '15%',
    },
    {
      header: 'Currently on order',
      accessor: 'onOrder',
      width: '15%',
    },
    {
      header: 'Status',
      accessor: (part) => {
        const statusMap = {
          'IN_STOCK': { text: 'In Stock', color: 'text-green-400', bgColor: 'bg-green-400/10' },
          'LOW_STOCK': { text: 'Inventory Low!', color: 'text-yellow-400', bgColor: 'bg-yellow-400/10' },
          'OUT_OF_STOCK': { text: 'Out of Stock', color: 'text-red-400', bgColor: 'bg-red-400/10' },
          'ON_ORDER': { text: 'Parts in Order/In Progress', color: 'text-blue-400', bgColor: 'bg-blue-400/10' },
          'DISCONTINUED': { text: 'Discontinued', color: 'text-gray-400', bgColor: 'bg-gray-400/10' },
        };
        
        const status = statusMap[part.status] || { text: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-400/10' };
        
        return (
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
            {status.text}
          </span>
        );
      },
      width: '25%',
    },
  ];

  // Update the status accessor to use the StatusIndicator component
  const updatedColumns: TableColumn<Part>[] = [
    ...columns.slice(0, columns.length - 1),
    {
      header: 'Status',
      accessor: (part) => {
        return (
          <StatusIndicator 
            status={part.status}
            type="part"
          />
        );
      },
      width: '25%',
    },
  ];

  return (
    <div className={className}>
      <div className="table-wrapper">
        <Table
          columns={updatedColumns}
          data={data}
          onRowClick={onRowClick}
          highlightOnHover={true}
          emptyMessage="No parts found"
          showPagination={true}
          itemsPerPage={itemsPerPage}
        />
      </div>
    </div>
  );
};

export default PartsTable;
