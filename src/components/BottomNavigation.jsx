import React, { useState, useEffect } from 'react';
import { isAnimationEnabled } from '../utils/animationMode';
import './BottomNavigation.css';

function BottomNavigation({ currentPage, onNavigate }) {
  const [webApp, setWebApp] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
    }
    
    // Check if animations are enabled
    setIsAnimated(isAnimationEnabled());
  }, []);

  const handleNavigation = (page) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    // Handle special navigation cases
    if (page === 'poll-creation' && currentPage === 'role-selection') {
      // If we're on role selection, go to poll creation
      if (onNavigate) {
        onNavigate('poll-creation');
      }
    } else if (page === 'poll-selection' && currentPage === 'role-selection') {
      // If we're on role selection, go to poll selection
      if (onNavigate) {
        onNavigate('poll-selection');
      }
    } else if (onNavigate) {
      onNavigate(page);
    }
  };

  const navigationItems = [
    {
      id: 'main',
      label: 'Home',
      icon: '🏠',
      page: 'main'
    },
    {
      id: 'create',
      label: 'Create',
      icon: '➕',
      page: 'poll-creation'
    },
    {
      id: 'polls',
      label: 'Polls',
      icon: '📊',
      page: 'poll-selection'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: '⚙️',
      page: 'user-settings'
    }
  ];

  // Only hide navigation on initial onboarding pages
  const hiddenPages = [
    'getting-started',
    'animation-mode-selection',
    'welcome'
  ];

  if (hiddenPages.includes(currentPage)) {
    return null;
  }

  return (
    <nav className={`bottom-navigation ${isAnimated ? 'animated' : ''}`}>
      <div className="nav-container">
        {navigationItems.map((item) => {
          // Determine if this item should be active
          const isActive = currentPage === item.page || 
                          (item.page === 'poll-creation' && currentPage === 'role-selection') ||
                          (item.page === 'poll-selection' && (currentPage === 'role-selection' || currentPage === 'poll-response'));
          
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigation(item.page)}
              aria-label={item.label}
            >
              <div className="nav-icon">
                {item.icon}
              </div>
              <span className="nav-label">{item.label}</span>
              {isActive && (
                <div className="active-indicator"></div>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNavigation;