import React, { useState, useEffect } from 'react';
import { TonConnectButton, useTonConnectUI } from '@tonconnect/ui-react';
import './OnboardingWelcome.css';

function OnboardingWelcome({ onContinue, onConnectAndContinue }) {
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

  const handleContinueWithoutWallet = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onContinue) {
      onContinue();
    }
  };

  const handleContinueWithWallet = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onConnectAndContinue) {
      onConnectAndContinue();
    }
  };

  return (
    <div className="onboarding-welcome">
      <div className="welcome-container">
        <div className="welcome-header">
          <h1>Welcome to tPolls!</h1>
          <p>Choose how you'd like to get started</p>
        </div>

        <div className="welcome-options">
          <div className="option-card recommended">
            <div className="option-header">
              <h3>Connect Wallet (Recommended)</h3>
              <span className="badge">Best Experience</span>
            </div>
            <p>Connect your TON wallet to create polls, vote, and earn rewards</p>
            <div className="option-benefits">
              <div className="benefit">✓ Create and fund polls</div>
              <div className="benefit">✓ Earn rewards for voting</div>
              <div className="benefit">✓ Save your voting history</div>
              <div className="benefit">✓ Access all features</div>
            </div>
            {!isConnected ? (
              <TonConnectButton />
            ) : (
              <button 
                className="continue-btn primary"
                onClick={handleContinueWithWallet}
              >
                Continue with Wallet
              </button>
            )}
          </div>

          <div className="option-card">
            <div className="option-header">
              <h3>Explore Without Wallet</h3>
            </div>
            <p>Browse polls and explore features (connect wallet anytime later)</p>
            <div className="option-benefits">
              <div className="benefit">✓ Browse available polls</div>
              <div className="benefit">✓ Learn how tPolls works</div>
              <div className="benefit">○ Connect wallet later to participate</div>
            </div>
            <button 
              className="continue-btn secondary"
              onClick={handleContinueWithoutWallet}
            >
              Continue Without Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OnboardingWelcome;