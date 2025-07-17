import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import WalletMenu from './WalletMenu';
import './GettingStarted.css';
import illustrationImage from './getting-started-illustration.png';

function GettingStarted({ onContinue }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [isConnected, setIsConnected] = useState(tonConnectUI.connected);

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
      } else {
        setIsConnected(false);
      }
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  const handleContinue = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onContinue) {
      onContinue();
    }
  };

  return (
    <div className={`getting-started-page ${isConnected ? 'wallet-connected' : ''}`}>
      <div className="getting-started-header">
        <h2 className="page-title">Let's Try tPolls out</h2>
      </div>

      <div className="getting-started-illustration">
        <img src={illustrationImage} alt="Getting Started Illustration" />
      </div>

      <div className="getting-started-actions">
        {!isConnected ? (
          <>
            <TonConnectButton />
          </>
        ) : (
          <div className="connected-state">
            <button 
              className="continue-btn"
              onClick={handleContinue}
            >
              Start
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default GettingStarted;