import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';

function Welcome({ onLogin }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  useEffect(() => {
    const unsubscribe = tonConnectUI.onStatusChange((walletInfo) => {
      if (walletInfo) {
        setIsConnected(true);
        if (onLogin) {
          onLogin(walletInfo);
        }
      } else {
        setIsConnected(false);
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI, onLogin]);

  const handleGetStarted = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
  };

  return (
    <div className="welcome-page">
      <div className="welcome-hero">
        <div className="welcome-logo">
          <div className="logo-circle">
            <span className="logo-text">TP</span>
          </div>
        </div>
        
        <h1 className="welcome-title">Welcome to TPolls</h1>
        <p className="welcome-subtitle">
          Create and participate in polls on the TON blockchain
        </p>
      </div>

      <div className="welcome-features">
        <div className="feature-item">
          <div className="feature-icon">🗳️</div>
          <div className="feature-text">
            <h3>Create Polls</h3>
            <p>Launch polls with custom options and settings</p>
          </div>
        </div>
        
        <div className="feature-item">
          <div className="feature-icon">⚡</div>
          <div className="feature-text">
            <h3>Fast & Secure</h3>
            <p>Built on TON blockchain for transparency</p>
          </div>
        </div>
        
        <div className="feature-item">
          <div className="feature-icon">🎯</div>
          <div className="feature-text">
            <h3>Easy Voting</h3>
            <p>Simple interface for quick participation</p>
          </div>
        </div>
      </div>

      <div className="welcome-actions">
        {!isConnected ? (
          <>
            <p className="connect-prompt">Connect your TON wallet to get started</p>
            <TonConnectButton />
          </>
        ) : (
          <div className="connected-state">
            <div className="success-message">
              <span className="success-icon">✅</span>
              <p>Wallet connected successfully!</p>
            </div>
            <button 
              className="get-started-btn"
              onClick={handleGetStarted}
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Welcome;