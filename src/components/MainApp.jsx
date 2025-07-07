import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import { clearUserHistory } from '../utils/userHistory';

function MainApp({ onLogout, onRerunGettingStarted }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleCreatePoll = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleBrowsePolls = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
  };

  const handleDisconnect = () => {
    tonConnectUI.disconnect();
    if (onLogout) {
      onLogout();
    }
  };

  const handleClearHistory = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (window.confirm('Are you sure you want to clear your user history? This will reset your onboarding status.')) {
      clearUserHistory();
      alert('User history cleared successfully!');
      
      // Optionally disconnect and restart onboarding
      handleDisconnect();
    }
  };

  const handleRerunGettingStarted = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (onRerunGettingStarted) {
      onRerunGettingStarted();
    }
  };

  return (
    <div className="main-app">
      <header className="app-header">
        <div className="header-content">
          <h1>TPolls</h1>
          <div className="header-actions">
            <TonConnectButton />
            <button 
              className="logout-btn"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>
      
      <main className="app-main">
        <div className="welcome-section">
          <h2>Welcome Back!</h2>
          <p>Create and participate in polls on the TON blockchain</p>
        </div>
        
        <div className="actions">
          <button 
            className="action-btn primary"
            onClick={handleCreatePoll}
          >
            <span className="btn-icon">➕</span>
            Create New Poll
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={handleBrowsePolls}
          >
            <span className="btn-icon">📋</span>
            Browse Polls
          </button>
          
          <button 
            className="action-btn secondary"
            onClick={() => {}}
          >
            <span className="btn-icon">📊</span>
            My Polls
          </button>
        </div>
        
        <div className="debug-section">
          <button 
            className="action-btn secondary small"
            onClick={handleRerunGettingStarted}
          >
            <span className="btn-icon">🔄</span>
            Re-run Getting Started
          </button>
          
          <button 
            className="action-btn danger small"
            onClick={handleClearHistory}
          >
            <span className="btn-icon">🗑️</span>
            Clear History (Debug)
          </button>
        </div>
      </main>
    </div>
  );
}

export default MainApp;