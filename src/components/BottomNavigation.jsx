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

    // Add hash routing for poll creation (center plus icon)
    if (page === 'poll-creation') {
      window.location.hash = '#/create-poll';
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
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10 19v-5h4v5c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7h1.7c.46 0 .68-.57.33-.87L12.67 3.6c-.38-.34-.96-.34-1.34 0l-8.36 7.53c-.34.3-.13.87.33.87H5v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1z"/>
        </svg>
      ),
      page: 'main'
    },
    {
      id: 'polls',
      label: 'Polls',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
        </svg>
      ),
      page: 'poll-selection'
    },
    {
      id: 'create',
      label: 'Create',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      ),
      page: 'poll-creation'
    },
    {
      id: 'funding',
      label: 'Fund',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      ),
      page: 'poll-funding'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      ),
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
              data-page={item.page}
              onClick={() => handleNavigation(item.page)}
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