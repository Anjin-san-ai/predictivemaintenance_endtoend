import React from 'react';
import { SummaryCard } from '@/components';

interface PartsCardsProps {
  totalAvailable: number;
  totalOutOfStock: number;
  totalOnOrder: number;
  totalLowStock: number;
  totalDiscontinued: number;
}

const PartsCards: React.FC<PartsCardsProps> = ({
  totalAvailable,
  totalOutOfStock,
  totalOnOrder,
  totalLowStock,
  totalDiscontinued
}) => {
  return (
    <>
      <SummaryCard 
        title="Parts available:" 
        value={totalAvailable || 0} 
        color="green" 
      />
      <SummaryCard 
        title="Parts out of stock:" 
        value={totalOutOfStock || 0} 
        color="red" 
      />
      <SummaryCard 
        title="Parts stocking in progress:" 
        value={totalOnOrder || 0} 
        color="orange" 
      />
      <SummaryCard 
        title="Parts getting shipped:" 
        value={totalLowStock || 0} 
        color="blue" 
      />
      <SummaryCard 
        title="Parts discontinued" 
        value={totalDiscontinued || 0} 
        color="gray" 
      />
    </>
  );
};

export default PartsCards;
