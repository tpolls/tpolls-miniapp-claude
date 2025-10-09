import React, { useState, useEffect } from 'react';
import { isAnimationEnabled } from '../utils/animationMode';
import './DualModeNavigation.css';
import './DualModeNavigation.animations.css';

function DualModeNavigation({
  currentPage,
  onNavigate,
  initialMode = 'participant',
  animationStyle = 'drawer', // Animation options: 'drawer', 'smooth', 'scale', 'flip', 'bounce', 'compress', 'elastic'
  showAnimationSwitcher = false // Set to true to show animation switcher for testing
}) {
  const [webApp, setWebApp] = useState(null);
  const [isAnimated, setIsAnimated] = useState(false);
  const [mode, setMode] = useState(initialMode); // 'creator' or 'participant'
  const [currentAnimation, setCurrentAnimation] = useState(animationStyle);
  const [showAnimationMenu, setShowAnimationMenu] = useState(false);

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

    if (onNavigate) {
      onNavigate(page);
    }
  };

  const toggleMode = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }

    const newMode = mode === 'creator' ? 'participant' : 'creator';
    setMode(newMode);

    // Navigate to default page for the new mode
    if (onNavigate) {
      if (newMode === 'creator') {
        // Creator mode: default to My Polls
        onNavigate('manage-polls');
      } else {
        // Participant mode: default to Browse
        onNavigate('main');
      }
    }
  };

  // Creator mode navigation items
  const creatorNavItems = [
    {
      id: 'my-polls',
      label: 'My Polls',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 3v18h18"/>
          <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/>
        </svg>
      ),
      page: 'manage-polls'
    },
    {
      id: 'create',
      label: 'Create',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      ),
      page: 'poll-creation',
      isCenter: true
    },
    {
      id: 'earnings',
      label: 'Earnings',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12l-4-4v3H3v2h15v3z"/>
          <path d="M13 7l-4 5 4 5"/>
        </svg>
      ),
      page: 'user-settings'
    }
  ];

  // Participant mode navigation items
  const participantNavItems = [
    {
      id: 'browse',
      label: 'Browse',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      page: 'main'
    },
    {
      id: 'vote',
      label: 'Vote',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
        </svg>
      ),
      page: 'poll-selection'
    },
    {
      id: 'rewards',
      label: 'Rewards',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 12v10H4V12"/>
          <path d="M22 7H2v5h20V7z"/>
          <path d="M12 22V7"/>
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
        </svg>
      ),
      page: 'user-settings'
    }
  ];

  const navigationItems = mode === 'creator' ? creatorNavItems : participantNavItems;

  // Animation options for switcher
  const animationOptions = [
    { value: 'drawer', label: 'Drawer', icon: '🗄️' },
    { value: 'smooth', label: 'Smooth', icon: '✨' },
    { value: 'scale', label: 'Scale', icon: '🔍' },
    { value: 'flip', label: 'Flip', icon: '🔄' },
    { value: 'bounce', label: 'Bounce', icon: '⚡' },
    { value: 'compress', label: 'Compress', icon: '↔️' },
    { value: 'elastic', label: 'Elastic', icon: '🎯' }
  ];

  const handleAnimationChange = (animation) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setCurrentAnimation(animation);
    setShowAnimationMenu(false);
  };

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
    <>
      {/* Animation Switcher - Floating above navigation */}
      {showAnimationSwitcher && (
        <div className="animation-switcher-float">
          <button
            className="animation-trigger-btn"
            onClick={() => setShowAnimationMenu(!showAnimationMenu)}
          >
            {animationOptions.find(a => a.value === currentAnimation)?.icon || '🎨'} {currentAnimation}
          </button>

          {showAnimationMenu && (
            <div className="animation-menu">
              {animationOptions.map((option) => (
                <button
                  key={option.value}
                  className={`animation-menu-item ${currentAnimation === option.value ? 'active' : ''}`}
                  onClick={() => handleAnimationChange(option.value)}
                >
                  <span className="animation-icon">{option.icon}</span>
                  <span className="animation-name">{option.label}</span>
                  {currentAnimation === option.value && <span className="check-mark">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <nav
        className={`dual-mode-navigation ${isAnimated ? 'animated' : ''} ${mode}-mode`}
        data-animation={currentAnimation}
        key={mode}
      >
        <div className="dual-nav-container">
          <div className="nav-items-wrapper" key={`nav-${mode}`}>
          {navigationItems.map((item) => {
            const isActive = currentPage === item.page;

            return (
              <button
                key={item.id}
                className={`dual-nav-item ${isActive ? 'active' : ''} ${item.isCenter ? 'center-item' : ''}`}
                data-page={item.page}
                onClick={() => handleNavigation(item.page)}
              >
                <div className="dual-nav-icon">
                  {item.icon}
                </div>
                <span className="dual-nav-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Mode Toggle Button */}
        <button
          className="mode-toggle-btn"
          onClick={toggleMode}
          title={`Switch to ${mode === 'creator' ? 'Participant' : 'Creator'} Mode`}
        >
          <div className="mode-toggle-icon" key={`icon-${mode}`}>
            {mode === 'creator' ? (
              // Participant icon (people/user group)
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            ) : (
              // Creator icon (chart/analytics)
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18"/>
                <path d="M18 17V9"/>
                <path d="M13 17V5"/>
                <path d="M8 17v-3"/>
              </svg>
            )}
          </div>
        </button>
      </div>
    </nav>
    </>
  );
}

export default DualModeNavigation;
