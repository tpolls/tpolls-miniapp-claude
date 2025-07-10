import React, { useState, useEffect } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { getAnimationMode, setAnimationMode } from '../utils/animationMode';
import { clearUserHistory } from '../utils/userHistory';
import WalletMenu from './WalletMenu';
import './UserSettings.css';

function UserSettings({ onBack, onRerunGettingStarted }) {
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
      onBack();
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

  return (
    <div className="user-settings">
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Customize your TPolls experience</p>
      </div>

      <div className="settings-content">
        {settingsGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="settings-group">
            <h2 className="group-title">{group.title}</h2>
            <div className="settings-items">
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex} className="settings-item">
                  <div className="item-info">
                    <h3 className="item-label">{item.label}</h3>
                    <p className="item-description">{item.description}</p>
                  </div>
                  
                  {item.type === 'radio' && (
                    <div className="radio-group">
                      {item.options.map((option) => (
                        <label key={option.value} className="radio-option">
                          <input
                            type="radio"
                            name={`radio-${groupIndex}-${itemIndex}`}
                            value={option.value}
                            checked={item.value === option.value}
                            onChange={(e) => item.onChange(e.target.value)}
                          />
                          <div className="radio-content">
                            <span className="radio-label">{option.label}</span>
                            <span className="radio-description">{option.description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}
                  
                  {item.type === 'button' && (
                    <button
                      className={`settings-button ${item.buttonClass || ''}`}
                      onClick={item.onClick}
                    >
                      {item.buttonText}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
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