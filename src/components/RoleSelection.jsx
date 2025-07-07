import React, { useState, useEffect } from 'react';
import './RoleSelection.css';
import creatorImage from './creator_v2.png';
import responderImage from './responder_v2.png';

function RoleSelection({ onRoleSelect }) {
  const [webApp, setWebApp] = useState(null);

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
    if (onRoleSelect) {
      onRoleSelect(role);
    }
  };

  return (
    <div className="role-selection-page">
      <div className="role-selection-header">
        <h1 className="app-title">tPolls</h1>
        <h2 className="page-title">Choose your role</h2>
      </div>

      <div className="role-options">
        <div className="role-option" onClick={() => handleRoleSelect('creator')}>
          <div className="role-icon">
            <img src={creatorImage} alt="Creator" className="role-character-image" />
          </div>
          <h3 className="role-title">Creator</h3>
        </div>

        <div className="role-option" onClick={() => handleRoleSelect('responder')}>
          <div className="role-icon">
            <img src={responderImage} alt="Responder" className="role-character-image" />
          </div>
          <h3 className="role-title">Responder</h3>
        </div>
      </div>
    </div>
  );
}

export default RoleSelection;