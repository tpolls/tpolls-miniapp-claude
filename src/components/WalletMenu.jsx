import React, { useState, useEffect, useRef } from 'react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import './WalletMenu.css';

function WalletMenu() {
  const [tonConnectUI] = useTonConnectUI();
  const [isOpen, setIsOpen] = useState(false);
  const [walletInfo, setWalletInfo] = useState(null);
  const [webApp, setWebApp] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
    }
  }, []);

  useEffect(() => {
    // Set initial wallet state
    setWalletInfo(tonConnectUI.wallet);
    
    const unsubscribe = tonConnectUI.onStatusChange((wallet) => {
      setWalletInfo(wallet);
    });

    return () => unsubscribe();
  }, [tonConnectUI]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMenuToggle = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setIsOpen(!isOpen);
  };

  const handleDisconnect = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
    }
    tonConnectUI.disconnect();
    setIsOpen(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  console.log('WalletMenu - walletInfo:', walletInfo);
  
  // Temporarily always show for debugging
  // if (!walletInfo) {
  //   console.log('WalletMenu - No wallet info, returning null');
  //   return null;
  // }

  return (
    <div className="wallet-menu" ref={menuRef}>
      <button 
        className="wallet-menu-button"
        onClick={handleMenuToggle}
        aria-label="Wallet menu"
      >
        <span className="wallet-icon">👤</span>
      </button>

      {isOpen && (
        <div className="wallet-dropdown">
          <div className="wallet-dropdown-header">
            <span className="wallet-address">
              {walletInfo ? formatAddress(walletInfo.account.address) : 'No wallet'}
            </span>
          </div>
          
          <div className="wallet-dropdown-actions">
            <button 
              className="wallet-action-btn copy-btn"
              onClick={() => {
                if (walletInfo) {
                  navigator.clipboard.writeText(walletInfo.account.address);
                  if (webApp) {
                    webApp.HapticFeedback.impactOccurred('light');
                  }
                }
                setIsOpen(false);
              }}
            >
              <span className="action-icon">📋</span>
              Copy Address
            </button>
            
            <button 
              className="wallet-action-btn disconnect-btn"
              onClick={handleDisconnect}
            >
              <span className="action-icon">🔌</span>
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletMenu;