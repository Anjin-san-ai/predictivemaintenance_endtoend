'use client';

import React, { useRef, useEffect, useState } from 'react';
import styles from './styles.module.css';

interface Tab {
  id: any;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: any) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);
  const tabRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeTabStyle, setActiveTabStyle] = useState<{ left: string, width: string }>({ left: '0px', width: '0px' });
  
  useEffect(() => {
    const activeTabElement = tabRefs.current[activeTabIndex];
    if (activeTabElement) {
      const tabWidth = activeTabElement.offsetWidth;
      const tabLeft = activeTabElement.offsetLeft;
      setActiveTabStyle({
        width: `${tabWidth + 10}px`,
        left: `${tabLeft - 5}px`
      });
    }
  }, [activeTab, activeTabIndex, tabs]);
  
  return (
    <div 
      className={styles.tabsContainer}
      style={{
        '--active-tab-width': activeTabStyle.width,
        '--active-tab-left': activeTabStyle.left
      } as React.CSSProperties}
    >
      <div className={styles.tabsWrapper}>
        {tabs.map((tab, index) => (
          <div
            key={tab.id}
            ref={(el) => { tabRefs.current[index] = el }}
            className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </div>
        ))}
      </div>
      <div className={styles.tabsLine}>
        <img src="/images/parts-and-equipment/line-17-1.png" alt="Bottom Line" className={styles.tabsBottomLine} />
        <div className={styles.tabsActiveLine}></div>
      </div>
    </div>
  );
};

export default Tabs;
