import React from 'react';
import { SummaryCard } from '@/components';

interface EquipmentCardsProps {
  totalAvailable: number;
  totalServiceable: number;
  totalUnserviceable: number;
  totalOutOfRepair: number;
  totalCalibration: number;
}

const EquipmentCards: React.FC<EquipmentCardsProps> = ({
  totalAvailable,
  totalServiceable,
  totalUnserviceable,
  totalOutOfRepair,
  totalCalibration
}) => {
  return (
    <>
      <SummaryCard 
        title="Equipment available:" 
        value={totalAvailable || 0} 
        color="blue" 
      />
      <SummaryCard 
        title="Tool serviceable:" 
        value={totalServiceable || 0} 
        color="green" 
      />
      <SummaryCard 
        title="Tool un-serviceable:" 
        value={totalUnserviceable || 0} 
        color="red" 
      />
      <SummaryCard 
        title="Tool out of repair:" 
        value={totalOutOfRepair || 0} 
        color="orange" 
      />
      <SummaryCard 
        title="Tool gone for calibration:" 
        value={totalCalibration || 0} 
        color="gray" 
      />
    </>
  );
};

export default EquipmentCards;
