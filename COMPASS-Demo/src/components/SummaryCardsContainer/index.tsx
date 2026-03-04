import React from 'react';
import styles from './styles.module.css';

interface SummaryCardsContainerProps {
  children: React.ReactNode;
}

const SummaryCardsContainer: React.FC<SummaryCardsContainerProps> = ({ children }) => {
  return (
    <div className={styles.container}>
      {children}
    </div>
  );
};

export default SummaryCardsContainer;
