import React, { useState, useEffect } from 'react';
import WalletMenu from './WalletMenu';
import './RoleSelection.css';
import creatorImage from './creator_v2.png';
import responderImage from './responder_v2.png';

function RoleSelection({ onRoleSelect, onBack }) {
  const [webApp, setWebApp] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      setWebApp(tg);
      tg.ready();
      tg.expand();
    }
  }, []);

  const handleRoleSelect = (role) => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    setSelectedRole(role);
  };

  const handleNext = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onRoleSelect && selectedRole) {
      onRoleSelect(selectedRole);
    }
  };

  const handleBack = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('light');
    }
    if (onBack) {
      onBack();
    }
  };

  return (
    <div className="role-selection-page">
      <div className="wallet-info-top">
        <WalletMenu />
      </div>
      
      <div className="role-selection-header">
        <h1 className="app-title">tPolls</h1>
        <h2 className="page-title">Choose your role</h2>
      </div>

      <div className="role-options">
        <div className={`role-option ${selectedRole === 'creator' ? 'selected' : ''}`} onClick={() => handleRoleSelect('creator')}>
          <div className="role-icon">
            <img src={creatorImage} alt="Creator" className="role-character-image" />
          </div>
          <h3 className="role-title">Creator</h3>
        </div>

        <div className={`role-option ${selectedRole === 'responder' ? 'selected' : ''}`} onClick={() => handleRoleSelect('responder')}>
          <div className="role-icon">
            <img src={responderImage} alt="Responder" className="role-character-image" />
          </div>
          <h3 className="role-title">Responder</h3>
        </div>
      </div>

      <div className="role-selection-actions">
        <button className="back-btn" onClick={handleBack}>
          Back
        </button>
        <button 
          className={`next-btn ${!selectedRole ? 'disabled' : ''}`}
          onClick={handleNext}
          disabled={!selectedRole}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default RoleSelection;