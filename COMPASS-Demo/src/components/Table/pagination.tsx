import React, { useEffect, useState } from 'react';
import styles from './styles.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className={styles.pagination}>
      {isMobile ? (
        <div className={styles.mobilePagination}>
          <div 
            className={`${styles.mobileArrow} ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={goToPreviousPage}
          >
            <img className={styles.arrow} src="/images/parts-and-equipment/arrow-left-1@2x.png" alt="Previous" />
          </div>

          <div className={styles.mobilePageIndicator}>
            <span className={styles.currentPage}>{currentPage}</span>
            <span className={styles.outOfText}>out of</span>
            <span className={styles.totalPagesText}>{totalPages}</span>
          </div>

          <div 
            className={`${styles.mobileArrow} ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={goToNextPage}
          >
            <img className={styles.arrow} src="/images/parts-and-equipment/icon-1@2x.png" alt="Next" />
          </div>
        </div>
      ) : (
        <>
          <div 
            className={`${styles.paginationPrevious} ${currentPage === 1 ? styles.disabled : ''}`}
            onClick={goToPreviousPage}
          >
            <div className={styles.arrowIcon}>
              <img className={styles.arrow} src="/images/parts-and-equipment/arrow-left-1@2x.png" alt="Arrow left" />
            </div>
            <div className={styles.previousText}>Previous</div>
          </div>

          <div className={styles.paginationList}>
            <div className={styles.paginationPageCurrent}>
              <div className={styles.pageNumber}>{currentPage}</div>
            </div>
            <div className={styles.paginationPage}>
              <div className={styles.outOf}>out of</div>
            </div>
            <div className={styles.paginationPage}>
              <div className={styles.totalPages}>{totalPages}</div>
            </div>
          </div>

          <div 
            className={`${styles.paginationNext} ${currentPage === totalPages ? styles.disabled : ''}`}
            onClick={goToNextPage}
          >
            <div className={styles.nextText}>Next</div>
            <div className={styles.arrowIcon}>
              <img className={styles.arrow} src="/images/parts-and-equipment/icon-1@2x.png" alt="Arrow right" />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
