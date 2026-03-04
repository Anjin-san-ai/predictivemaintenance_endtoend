'use client';

import React, { useState, useEffect } from 'react';
import styles from './styles.module.css';
import { Pagination } from './pagination';

export interface TableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  highlightOnHover?: boolean;
  itemsPerPage?: number;
  showPagination?: boolean;
}

export function Table<T extends object>({
  columns,
  data,
  className = '',
  emptyMessage = 'No data available',
  onRowClick,
  highlightOnHover = true,
  itemsPerPage = 12,
  showPagination = true,
}: TableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<T[]>([]);

  useEffect(() => {
    // Reset to page 1 when data changes
    setCurrentPage(1);
  }, [data]);

  useEffect(() => {
    // Calculate paginated data based on current page and items per page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedData(data.slice(startIndex, endIndex));
  }, [currentPage, data, itemsPerPage]);

  const totalPages = Math.max(1, Math.ceil(data.length / itemsPerPage));

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Console log to debug pagination
  console.log('Data length:', data.length, 'Items per page:', itemsPerPage, 'Total pages:', totalPages);

  return (
    <div className={`${className} ${styles.tableComponentWrapper}`}>
      {/* Table Container - Completely separate from pagination */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              {columns.map((column, index) => (
                <th 
                  key={index} 
                  className={styles.tableHeaderCell}
                  style={{ 
                    width: column.width || 'auto',
                    textAlign: column.align || 'left'
                  }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {paginatedData.length > 0 ? (
              paginatedData.map((item, rowIndex) => (
                <tr 
                  key={rowIndex} 
                  className={`${styles.tableRow} ${onRowClick ? styles.clickable : ''} ${highlightOnHover ? styles.highlightOnHover : ''}`}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((column, colIndex) => {
                    const cellContent = typeof column.accessor === 'function' 
                      ? column.accessor(item) 
                      : item[column.accessor as keyof T];
                    
                    return (
                      <td 
                        key={colIndex} 
                        className={styles.tableCell}
                        style={{ 
                          textAlign: column.align || 'left'
                        }}
                      >
                        {cellContent as React.ReactNode}
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className={styles.emptyMessage}>
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Completely separate pagination container */}
      {showPagination && (
        <div className={styles.paginationContainer}>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
}
