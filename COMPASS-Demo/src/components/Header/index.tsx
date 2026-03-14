'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './styles.module.css';

const Header = () => {
  const pathname = usePathname();
  // For notification count demo
  const [notificationCount, setNotificationCount] = useState(12);
  // For mobile responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  // Determine active menu item based on current path
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname?.startsWith(path);
  };
  
  // Add responsive behavior detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Set initial value
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className={styles.header}>
      {/* Logo Section */}
      <div className={styles.logo}>
        <Image 
          src="/images/header/Airplane.png" 
          alt="COMPASS - COgnitive Maintenance, Parts, And Scheduling System Logo" 
          width={54}
          height={55}
          priority
        />
        <div className={styles.platformName}><span className="font-extrabold">COMPASS</span> - <span className="font-extrabold">CO</span>gnitive <span className="font-extrabold">M</span>aintenance, <span className="font-extrabold">P</span>arts, <span className="font-extrabold">A</span>nd <span className="font-extrabold">S</span>cheduling <span className="font-extrabold">S</span>ystem</div>
      </div>

      {/* Navigation Menu */}
      <nav className={styles.nav}>
        <Link href="/" className={`${styles.navItem} ${isActive('/') ? styles.active : ''}`}>
          <span>Smart Scheduling</span>
        </Link>
        <Link href="/parts-and-equipment" className={`${styles.navItem} ${isActive('/parts-and-equipment') ? styles.active : ''}`}>
          <span>Repository</span>
        </Link>
        <Link href="/fleet-monitor" className={`${styles.navItem} ${isActive('/fleet-monitor') ? styles.active : ''}`}>
          <span>Fleet Monitor</span>
        </Link>
        <Link href="/chatbot" className={`${styles.navItem} ${isActive('/chatbot') ? styles.active : ''}`}>
          <span>AI Assistant</span>
        </Link>
        <Link href="/agent-network" className={`${styles.navItem} ${pathname === '/agent-network' ? styles.active : ''}`}>
          <span>Agent Network</span>
        </Link>
      </nav>

      {/* Utilities Section */}
      <div className={styles.utilities}>
        <div className={`${styles.icon} relative`}>
          {/* Notification Icon with Badge */}
          <Image 
            src="/images/header/Layer_1.svg" 
            alt="Notifications" 
            width={28} 
            height={32} 
          />
          {notificationCount > 0 && (
            <div className={styles.notificationBadge}>
              {notificationCount}
            </div>
          )}
        </div>
        <div>
          {/* Settings Icon */}
          <Image 
            src="/images/header/color.png" 
            alt="Settings" 
            width={25} 
            height={26} 
          />
        </div>
        <div className={styles.avatar}>
          {/* User Profile */}
          <Image
            src="/images/header/avatar.png"
            alt="User Avatar"
            width={43}
            height={43}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
