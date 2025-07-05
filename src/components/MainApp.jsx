import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

function MainApp({ onLogout }) {
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
      </main>
    </div>
  );
}

export default MainApp;