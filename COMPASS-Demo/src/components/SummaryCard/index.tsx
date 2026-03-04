import React from 'react';
import styles from './styles.module.css';

interface SummaryCardProps {
  title: string;
  value: number | string;
  color: 'blue' | 'red' | 'orange' | 'yellow' | 'gray' | 'green';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, color }) => {
  return (
    <div className={styles.card}>
      <div className={`${styles.colorIndicator} ${styles[color]}`}></div>
      <div className={styles.group}>
        <div className={styles.title}>{title}</div>
      </div>
      <div className={styles.valueContainer}>
        <div className={styles.value}>{value}</div>
      </div>
    </div>
  );
};

export default SummaryCard;
