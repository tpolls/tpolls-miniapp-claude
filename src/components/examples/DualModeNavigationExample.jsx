import React, { useState } from 'react';
import DualModeNavigation from '../DualModeNavigation';

/**
 * Example component demonstrating how to use DualModeNavigation
 *
 * This shows the dual-mode navigation bar with Creator and Participant modes.
 * Simply copy the DualModeNavigation component usage into your main app.
 */
function DualModeNavigationExample() {
  const [currentPage, setCurrentPage] = useState('poll-selection');

  const handleNavigation = (page) => {
    console.log('Navigating to:', page);
    setCurrentPage(page);

    // Add your navigation logic here
    // For example, update router, show different views, etc.
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--tg-theme-bg-color, #000)',
      padding: '20px',
      paddingBottom: '100px' // Space for bottom nav
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        color: 'var(--tg-theme-text-color, #fff)'
      }}>
        <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Dual Mode Navigation Demo</h1>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '12px' }}>Current Page: {currentPage}</h2>
          <p style={{ fontSize: '14px', opacity: 0.7, marginBottom: '16px' }}>
            Click the navigation items below to see the page change.
            Use the circular button on the right to toggle between Creator and Participant modes.
          </p>

          <div style={{
            background: 'rgba(0, 122, 255, 0.1)',
            padding: '12px',
            borderRadius: '8px',
            marginTop: '12px'
          }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>Features:</strong>
            <ul style={{ paddingLeft: '20px', fontSize: '14px', lineHeight: '1.6' }}>
              <li>Toggle between Creator and Participant modes</li>
              <li>Haptic feedback on navigation (Telegram WebApp)</li>
              <li>Active state highlighting</li>
              <li>Smooth animations and transitions</li>
              <li>Fully responsive design</li>
              <li>Dark and light mode support</li>
            </ul>
          </div>
        </div>

        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          padding: '20px'
        }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Navigation Modes:</h3>

          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ fontSize: '14px', color: '#007AFF', marginBottom: '8px' }}>🎨 Creator Mode</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', opacity: 0.8 }}>
              <li>My Polls - View and manage your created polls</li>
              <li>Create - Create new polls (center button)</li>
              <li>Earnings - Track your poll earnings</li>
            </ul>
          </div>

          <div>
            <h4 style={{ fontSize: '14px', color: '#AF52DE', marginBottom: '8px' }}>👥 Participant Mode</h4>
            <ul style={{ paddingLeft: '20px', fontSize: '13px', lineHeight: '1.6', opacity: 0.8 }}>
              <li>Browse - Discover available polls</li>
              <li>Vote - Participate in polls</li>
              <li>Rewards - View your earned rewards</li>
            </ul>
          </div>
        </div>
      </div>

      {/* The Dual Mode Navigation Component */}
      <DualModeNavigation
        currentPage={currentPage}
        onNavigate={handleNavigation}
        initialMode="participant"
      />
    </div>
  );
}

export default DualModeNavigationExample;
