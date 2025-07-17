import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { getAnimationMode, setAnimationMode } from '../utils/animationMode';
import { clearUserHistory } from '../utils/userHistory';
import WalletMenu from './WalletMenu';
import './UserSettings.css';

function UserSettings({ onBack, onRerunGettingStarted, onManagePolls }) {
  const [tonConnectUI] = useTonConnectUI();
  const [webApp, setWebApp] = useState(null);
  const [currentAnimationMode, setCurrentAnimationMode] = useState('static');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [dialogType, setDialogType] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
    
    // Load current animation mode
    setCurrentAnimationMode(getAnimationMode());
  }, []);

  const handleAnimationModeChange = (mode) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    setCurrentAnimationMode(mode);
    setAnimationMode(mode);
    
    // Show feedback
    if (webApp) {
      webApp.showAlert(`Animation mode changed to ${mode === 'animated' ? 'Beta' : 'Classic'} mode!`);
    }
  };

  const handleDisconnect = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    tonConnectUI.disconnect();
    if (onBack) {
      onBack('main');
    }
  };

  const handleClearHistory = () => {
    setDialogType('clearHistory');
    setShowConfirmDialog(true);
  };

  const handleRerunGettingStarted = () => {
    setDialogType('rerunGettingStarted');
    setShowConfirmDialog(true);
  };

  const handleManagePolls = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    if (onManagePolls) {
      onManagePolls();
    }
  };

  const handleConfirmAction = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    
    if (dialogType === 'clearHistory') {
      clearUserHistory();
      if (webApp) {
        webApp.showAlert('User history cleared successfully!');
      }
      handleDisconnect();
    } else if (dialogType === 'rerunGettingStarted') {
      if (onRerunGettingStarted) {
        onRerunGettingStarted();
      }
    }
    
    setShowConfirmDialog(false);
    setDialogType('');
  };

  const handleCancelAction = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    
    setShowConfirmDialog(false);
    setDialogType('');
  };

  const settingsGroups = [
    {
      title: 'Experience',
      items: [
        {
          type: 'radio',
          label: 'Animation Mode',
          description: 'Choose between static and animated interface',
          options: [
            { value: 'static', label: 'Classic Mode', description: 'Clean, minimal interface' },
            { value: 'animated', label: 'Beta Mode', description: 'Enhanced with animations' }
          ],
          value: currentAnimationMode,
          onChange: handleAnimationModeChange
        }
      ]
    },
    {
      title: 'Account',
      items: [
        {
          type: 'button',
          label: 'Disconnect Wallet',
          description: 'Disconnect from TON Connect',
          buttonText: 'Disconnect',
          buttonClass: 'danger',
          onClick: handleDisconnect
        }
      ]
    },
    {
      title: 'Advanced',
      items: [
        {
          type: 'button',
          label: 'Re-run Getting Started',
          description: 'Go through the onboarding flow again',
          buttonText: 'Re-run',
          buttonClass: 'secondary',
          onClick: handleRerunGettingStarted
        },
        {
          type: 'button',
          label: 'Clear User History',
          description: 'Reset all user data and preferences (Debug)',
          buttonText: 'Clear History',
          buttonClass: 'danger',
          onClick: handleClearHistory
        }
      ]
    }
  ];

  // Get wallet address for display
  const walletAddress = tonConnectUI?.account?.address;
  const displayAddress = walletAddress ? 
    `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : 
    'johndoe@email.com';

  return (
    <div className="user-settings">
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="16" r="8" fill="white"/>
              <path d="M8 32c0-6.627 5.373-12 12-12s12 5.373 12 12" fill="white"/>
            </svg>
          </div>
        </div>
        <h1 className="profile-name">John Doe</h1>
        <p className="profile-email">{displayAddress}</p>
      </div>

      <div className="profile-cards">
        <div className="profile-card" onClick={handleManagePolls}>
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="6" width="24" height="4" rx="2" fill="currentColor"/>
              <rect x="4" y="14" width="18" height="4" rx="2" fill="currentColor"/>
              <rect x="4" y="22" width="20" height="4" rx="2" fill="currentColor"/>
              <circle cx="26" cy="8" r="2" fill="currentColor"/>
              <circle cx="20" cy="16" r="2" fill="currentColor"/>
              <circle cx="22" cy="24" r="2" fill="currentColor"/>
            </svg>
          </div>
          <span className="card-label">Manage Polls</span>
        </div>

        <div className="profile-card" onClick={() => console.log('Leaderboard clicked')}>
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 3L18.5 10.5L26 8L22 15.5L30 16L22 16.5L26 24L18.5 21.5L16 29L13.5 21.5L6 24L10 16.5L2 16L10 15.5L6 8L13.5 10.5L16 3Z" fill="currentColor"/>
              <rect x="12" y="18" width="8" height="10" fill="currentColor"/>
              <rect x="8" y="22" width="4" height="6" fill="currentColor"/>
              <rect x="20" y="20" width="4" height="8" fill="currentColor"/>
            </svg>
          </div>
          <span className="card-label">Leaderboard</span>
        </div>

        <div className="profile-card" onClick={() => console.log('Rewards clicked')}>
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M8 6C8 4.89543 8.89543 4 10 4H22C23.1046 4 24 4.89543 24 6V8H26C27.1046 8 28 8.89543 28 10V12C28 13.1046 27.1046 14 26 14H24V26C24 27.1046 23.1046 28 22 28H10C8.89543 28 8 27.1046 8 26V14H6C4.89543 14 4 13.1046 4 12V10C4 8.89543 4.89543 8 6 8H8V6Z" fill="currentColor"/>
              <circle cx="16" cy="10" r="3" fill="white"/>
            </svg>
          </div>
          <span className="card-label">Rewards</span>
        </div>

        <div className="profile-card" onClick={handleRerunGettingStarted}>
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M16 4C12.5 4 9.5 5.5 7.5 8L6 6.5V12H11.5L9.5 10C11 8.5 13.5 7.5 16 7.5C21.5 7.5 26 12 26 17.5C26 23 21.5 27.5 16 27.5C12.5 27.5 9.5 25.5 7.5 22.5L5 24.5C7.5 28 11.5 30.5 16 30.5C23 30.5 28.5 25 28.5 17.5C28.5 10 23 4.5 16 4.5Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="card-label">Tutorial</span>
        </div>

        <div className="profile-card disconnect-card" onClick={handleDisconnect}>
          <div className="card-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M12 8V6C12 4.89543 12.8954 4 14 4H26C27.1046 4 28 4.89543 28 6V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V24M8 22L4 16M4 16L8 10M4 16H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="card-label">Disconnect</span>
        </div>
      </div>

      {showConfirmDialog && (
        <div className="confirm-dialog-overlay">
          <div className="confirm-dialog">
            <h3 className="dialog-title">
              {dialogType === 'clearHistory' ? 'Clear User History' : 'Re-run Getting Started'}
            </h3>
            <p className="dialog-message">
              {dialogType === 'clearHistory' 
                ? 'Are you sure you want to clear your user history? This will reset your onboarding status and disconnect your wallet.'
                : 'Are you sure you want to go through the onboarding flow again?'
              }
            </p>
            <div className="dialog-actions">
              <button className="dialog-button cancel" onClick={handleCancelAction}>
                Cancel
              </button>
              <button 
                className={`dialog-button confirm ${dialogType === 'clearHistory' ? 'danger' : 'primary'}`}
                onClick={handleConfirmAction}
              >
                {dialogType === 'clearHistory' ? 'Clear History' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserSettings;